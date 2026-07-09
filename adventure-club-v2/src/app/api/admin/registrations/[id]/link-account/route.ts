import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ message: "Please select a member." }, { status: 400 });
    }

    const registration = await prisma.registration.findUnique({ where: { id } });

    if (!registration) {
      return NextResponse.json({ message: "Registration not found." }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ message: "Member not found." }, { status: 404 });
    }

    const existing = await prisma.registration.findFirst({
      where: { trekId: registration.trekId, userId },
    });

    if (existing) {
      return NextResponse.json(
        { message: `${user.fullName} is already linked to a registration for this trek.` },
        { status: 400 }
      );
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: {
        userId,
        isGuest: false,
      },
    });

    return NextResponse.json({ message: "Linked to account.", registration: updated });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
