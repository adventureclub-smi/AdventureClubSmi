import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function DELETE(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;

    // Delete payments first
    await prisma.payment.deleteMany({
      where: {
        registrationId: id,
      },
    });

    // Delete refunds
    await prisma.refund.deleteMany({
      where: {
        registrationId: id,
      },
    });

    // Delete attendance
    await prisma.attendance.deleteMany({
      where: {
        registrationId: id,
      },
    });

    // Delete emergency contact
    await prisma.emergencyContact.deleteMany({
      where: {
        registrationId: id,
      },
    });

    // Delete certificate
    await prisma.certificate.deleteMany({
      where: {
        registrationId: id,
      },
    });

    // Finally delete registration
    await prisma.registration.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Registration deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to delete registration.",
      },
      {
        status: 500,
      }
    );
  }
}