import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// Hides (or restores) a registration from the admin Payments section only —
// the registration itself, and its Registrations-page entry, are untouched.
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { registrationId, hidden } = await req.json();

  if (!registrationId || typeof hidden !== "boolean") {
    return NextResponse.json(
      { message: "registrationId and a boolean hidden are required." },
      { status: 400 }
    );
  }

  const registration = await prisma.registration.update({
    where: { id: registrationId },
    data: { hiddenFromPayments: hidden },
  });

  return NextResponse.json({ registration });
}
