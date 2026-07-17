import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { uploadBuffer } from "@/lib/storage";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const settings = await prisma.galleryHeroSettings.findFirst();

  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const form = await req.formData();

    const heading = ((form.get("heading") as string) || "").trim();
    const subtitle = ((form.get("subtitle") as string) || "").trim();
    const buttonText = ((form.get("buttonText") as string) || "").trim();
    const buttonLink = ((form.get("buttonLink") as string) || "").trim();
    const imageFile = form.get("imageFile");

    if (!heading || !subtitle) {
      return NextResponse.json(
        { message: "A heading and subtitle are required." },
        { status: 400 }
      );
    }

    const existing = await prisma.galleryHeroSettings.findFirst();

    if (!existing && !(imageFile instanceof File)) {
      return NextResponse.json(
        { message: "Please choose a hero image to upload." },
        { status: 400 }
      );
    }

    let imageUrl: string | undefined;

    if (imageFile instanceof File) {
      const bytes = Buffer.from(await imageFile.arrayBuffer());
      const uploaded = await uploadBuffer(bytes, imageFile.type, {
        folder: "AdventureClub/GalleryHero",
      });
      imageUrl = uploaded.secure_url;
    }

    const data = {
      heading,
      subtitle,
      buttonText: buttonText || null,
      buttonLink: buttonLink || null,
      ...(imageUrl ? { imageUrl } : {}),
    };

    const settings = existing
      ? await prisma.galleryHeroSettings.update({ where: { id: existing.id }, data })
      : await prisma.galleryHeroSettings.create({ data: { ...data, imageUrl: imageUrl! } });

    return NextResponse.json(settings);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to save gallery hero settings." },
      { status: 500 }
    );
  }
}
