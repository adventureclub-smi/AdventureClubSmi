import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { notifyCertificateReady } from "@/lib/notification-emails";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { registrationId, certificateUrl } = await req.json();

    if (!registrationId || !certificateUrl) {
      return NextResponse.json(
        { message: "registrationId and certificateUrl are required." },
        { status: 400 }
      );
    }

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { user: true, trek: true },
    });

    if (!registration) {
      return NextResponse.json(
        { message: "Registration not found." },
        { status: 404 }
      );
    }

    await prisma.certificate.upsert({
      where: { registrationId },
      create: { registrationId, certificateUrl },
      update: { certificateUrl },
    });

    const updated = await prisma.registration.update({
      where: { id: registrationId },
      data: { certificateIssued: true, certificateIssuedAt: new Date() },
    });

    if (!registration.certificateIssued) {
      try {
        await notifyCertificateReady(registration, certificateUrl);
      } catch (emailError) {
        console.error("Failed to send certificate-ready email:", emailError);
      }
    }

    return NextResponse.json({ message: "Certificate issued.", registration: updated });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to issue certificate." },
      { status: 500 }
    );
  }
}
