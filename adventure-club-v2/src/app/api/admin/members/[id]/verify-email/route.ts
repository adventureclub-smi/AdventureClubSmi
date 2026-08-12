import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// Separate from the main PUT /api/admin/members/[id] route on purpose — that
// route always resends membershipStatus/clubRole in its update payload, so
// reusing it here would risk an admin's "rescue this student's account"
// click accidentally touching unrelated fields. Same reasoning as the
// govt-id sub-route right next to this one.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const { emailVerified } = await req.json();

  if (typeof emailVerified !== "boolean") {
    return NextResponse.json(
      { message: "emailVerified must be a boolean." },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      emailVerified,
      // Manually verifying always clears any pending code too — otherwise a
      // stale code from before the rescue could still sit there unused,
      // which is harmless but pointless to leave around.
      ...(emailVerified
        ? {
            emailVerificationCodeHash: null,
            emailVerificationExpiresAt: null,
            emailVerificationAttempts: 0,
          }
        : {}),
    },
  });

  return NextResponse.json({ emailVerified: user.emailVerified });
}
