import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { deleteFromStorage } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { registrationId } = await req.json();

    if (!registrationId) {
      return NextResponse.json(
        { message: "registrationId is required." },
        { status: 400 }
      );
    }

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      return NextResponse.json(
        { message: "Registration not found." },
        { status: 404 }
      );
    }

    // Best-effort cleanup of the generated asset — the auto-generate route
    // always uploads under this exact key, so this only actually deletes
    // something for certificates that were auto-generated (a manually-pasted
    // URL won't match anything and this is just a no-op miss for it).
    try {
      await deleteFromStorage(`AdventureClub/Certificates/${registrationId}-certificate.webp`);
    } catch (err) {
      console.error("Failed to delete certificate asset from storage:", err);
    }

    await prisma.certificate.deleteMany({ where: { registrationId } });

    const updated = await prisma.registration.update({
      where: { id: registrationId },
      data: { certificateIssued: false, certificateIssuedAt: null },
    });

    return NextResponse.json({
      message: "Certificate undone — ready to generate again.",
      registration: updated,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to undo certificate." },
      { status: 500 }
    );
  }
}
