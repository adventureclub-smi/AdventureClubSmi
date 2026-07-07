import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import cloudinary from "@/lib/cloudinary";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const settings = await prisma.studentDashboardSettings.findFirst();

  return NextResponse.json(settings || { bannerImageUrl: "" });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const form = await req.formData();
    const bannerFile = form.get("bannerFile");

    if (!(bannerFile instanceof File)) {
      return NextResponse.json(
        { message: "Please choose an image to upload." },
        { status: 400 }
      );
    }

    if (!bannerFile.type.startsWith("image/")) {
      return NextResponse.json(
        { message: "Please upload an image file." },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await bannerFile.arrayBuffer());
    const base64 = `data:${bannerFile.type};base64,${bytes.toString("base64")}`;
    const uploaded = await cloudinary.uploader.upload(base64, {
      folder: "AdventureClub/StudentDashboard",
    });

    const existing = await prisma.studentDashboardSettings.findFirst();

    const settings = existing
      ? await prisma.studentDashboardSettings.update({
          where: { id: existing.id },
          data: { bannerImageUrl: uploaded.secure_url },
        })
      : await prisma.studentDashboardSettings.create({
          data: { bannerImageUrl: uploaded.secure_url },
        });

    return NextResponse.json(settings);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to save student dashboard banner." },
      { status: 500 }
    );
  }
}
