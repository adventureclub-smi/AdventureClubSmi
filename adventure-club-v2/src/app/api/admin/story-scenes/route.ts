import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import cloudinary from "@/lib/cloudinary";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const scenes = await prisma.homepageStoryScene.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(scenes);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const form = await req.formData();

    const caption = ((form.get("caption") as string) || "").trim();
    const imageFile = form.get("imageFile");

    if (!(imageFile instanceof File)) {
      return NextResponse.json(
        { message: "A picture is required." },
        { status: 400 }
      );
    }

    const imageBytes = Buffer.from(await imageFile.arrayBuffer());
    const imageBase64 = `data:${imageFile.type};base64,${imageBytes.toString("base64")}`;

    const uploaded = await cloudinary.uploader.upload(imageBase64, {
      folder: "AdventureClub/StoryScenes",
    });

    const count = await prisma.homepageStoryScene.count();

    const scene = await prisma.homepageStoryScene.create({
      data: {
        imageUrl: uploaded.secure_url,
        imageWidth: uploaded.width,
        imageHeight: uploaded.height,
        caption: caption || null,
        order: count,
      },
    });

    return NextResponse.json(scene, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to add scene." },
      { status: 500 }
    );
  }
}
