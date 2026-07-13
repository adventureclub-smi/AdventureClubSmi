import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { uploadBuffer } from "@/lib/storage";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const settings = await prisma.certificateSettings.findFirst();

  return NextResponse.json(
    settings || {
      facultyHeadName: "",
      facultyHeadSignatureUrl: "",
      presidentName: "",
      presidentSignatureUrl: "",
    }
  );
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const form = await req.formData();

    const facultyHeadName = ((form.get("facultyHeadName") as string) || "").trim();
    const presidentName = ((form.get("presidentName") as string) || "").trim();
    const facultyHeadSignatureFile = form.get("facultyHeadSignatureFile");
    const presidentSignatureFile = form.get("presidentSignatureFile");

    for (const file of [facultyHeadSignatureFile, presidentSignatureFile]) {
      if (file instanceof File && file.type !== "image/png") {
        return NextResponse.json(
          { message: "Signatures must be uploaded as PNG files (with a transparent background)." },
          { status: 400 }
        );
      }
    }

    const existing = await prisma.certificateSettings.findFirst();

    let facultyHeadSignatureUrl = existing?.facultyHeadSignatureUrl || null;
    let presidentSignatureUrl = existing?.presidentSignatureUrl || null;

    if (facultyHeadSignatureFile instanceof File) {
      const bytes = Buffer.from(await facultyHeadSignatureFile.arrayBuffer());
      const uploaded = await uploadBuffer(bytes, facultyHeadSignatureFile.type, {
        folder: "AdventureClub/CertificateSignatures",
      });
      facultyHeadSignatureUrl = uploaded.secure_url;
    }

    if (presidentSignatureFile instanceof File) {
      const bytes = Buffer.from(await presidentSignatureFile.arrayBuffer());
      const uploaded = await uploadBuffer(bytes, presidentSignatureFile.type, {
        folder: "AdventureClub/CertificateSignatures",
      });
      presidentSignatureUrl = uploaded.secure_url;
    }

    const data = {
      facultyHeadName: facultyHeadName || null,
      facultyHeadSignatureUrl,
      presidentName: presidentName || null,
      presidentSignatureUrl,
    };

    const settings = existing
      ? await prisma.certificateSettings.update({ where: { id: existing.id }, data })
      : await prisma.certificateSettings.create({ data });

    return NextResponse.json(settings);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to save certificate settings." },
      { status: 500 }
    );
  }
}
