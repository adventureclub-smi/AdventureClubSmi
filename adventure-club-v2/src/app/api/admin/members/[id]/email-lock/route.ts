import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// Separate from the main PUT /api/admin/members/[id] route on purpose —
// that route always resends membershipStatus/clubRole in its update
// payload, so reusing it here would risk an admin's "unlock this email"
// click accidentally touching unrelated fields. Same reasoning as the
// govt-id sub-route.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const { emailLocked } = await req.json();

  if (typeof emailLocked !== "boolean") {
    return NextResponse.json(
      { message: "emailLocked must be a boolean." },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      emailLocked,
      // Re-locking is how an admin marks a pending email change as
      // reviewed — clearing this is what makes the "student changed their
      // email" notification resolve itself.
      ...(emailLocked ? { emailChangedAt: null } : {}),
    },
  });

  return NextResponse.json({ emailLocked: user.emailLocked });
}
