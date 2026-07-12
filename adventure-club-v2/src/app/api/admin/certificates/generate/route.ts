import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import cloudinary from "@/lib/cloudinary";
import { generateCertificateImage } from "@/lib/certificate/generate";
import { getCertificateSettings } from "@/data/certificate-settings";
import { notifyCertificateReady } from "@/lib/notification-emails";

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
      include: { user: true, trek: true },
    });

    if (!registration) {
      return NextResponse.json(
        { message: "Registration not found." },
        { status: 404 }
      );
    }

    const settings = await getCertificateSettings();

    const studentName =
      registration.user?.fullName || registration.guestName || "Participant";

    const image = await generateCertificateImage({
      studentName,
      trekName: registration.trek.title,
      date: registration.trek.date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      place: registration.trek.destination,
      facultyHeadName: settings.facultyHeadName,
      facultyHeadSignatureUrl: settings.facultyHeadSignatureUrl,
      presidentName: settings.presidentName,
      presidentSignatureUrl: settings.presidentSignatureUrl,
    });

    // Plain image delivery (unlike "raw" PDF/ZIP) isn't subject to
    // Cloudinary's default account-level delivery restriction.
    const uploaded = await cloudinary.uploader.upload(
      `data:image/png;base64,${image.toString("base64")}`,
      {
        folder: "AdventureClub/Certificates",
        public_id: `${registration.id}-certificate`,
      }
    );

    await prisma.certificate.upsert({
      where: { registrationId },
      create: { registrationId, certificateUrl: uploaded.secure_url },
      update: { certificateUrl: uploaded.secure_url },
    });

    const updated = await prisma.registration.update({
      where: { id: registrationId },
      data: { certificateIssued: true, certificateIssuedAt: new Date() },
    });

    if (!registration.certificateIssued) {
      try {
        await notifyCertificateReady(registration, uploaded.secure_url);
      } catch (emailError) {
        console.error("Failed to send certificate-ready email:", emailError);
      }
    }

    return NextResponse.json({
      message: "Certificate generated and issued.",
      certificateUrl: uploaded.secure_url,
      registration: updated,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to generate certificate." },
      { status: 500 }
    );
  }
}
