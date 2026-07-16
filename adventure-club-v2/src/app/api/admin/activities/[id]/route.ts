import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { uploadBuffer } from "@/lib/storage";

function parseHighlights(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const form = await req.formData();

    const icon = ((form.get("icon") as string) || "").trim();
    const title = ((form.get("title") as string) || "").trim();
    const description = ((form.get("description") as string) || "").trim();
    const highlights = parseHighlights((form.get("highlights") as string) || "");
    const difficulty = ((form.get("difficulty") as string) || "").trim();
    const bestSeason = ((form.get("bestSeason") as string) || "").trim();
    const duration = ((form.get("duration") as string) || "").trim();
    const funFact = ((form.get("funFact") as string) || "").trim();
    const buttonText = ((form.get("buttonText") as string) || "").trim();
    const buttonLink = ((form.get("buttonLink") as string) || "").trim();
    const imageFile = form.get("imageFile");

    if (!icon || !title || !description || !buttonText || !buttonLink) {
      return NextResponse.json(
        { message: "Icon, title, description, button text and button link are required." },
        { status: 400 }
      );
    }

    let imageUrl: string | undefined;

    if (imageFile instanceof File) {
      const imageBytes = Buffer.from(await imageFile.arrayBuffer());
      const uploaded = await uploadBuffer(imageBytes, imageFile.type, {
        folder: "AdventureClub/Activities",
      });
      imageUrl = uploaded.secure_url;
    }

    const activity = await prisma.homepageActivity.update({
      where: { id },
      data: {
        icon,
        title,
        description,
        ...(imageUrl ? { imageUrl } : {}),
        highlights,
        difficulty: difficulty || null,
        bestSeason: bestSeason || null,
        duration: duration || null,
        funFact: funFact || null,
        buttonText,
        buttonLink,
      },
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Failed to update activity." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;

    await prisma.homepageActivity.delete({ where: { id } });

    return NextResponse.json({ message: "Activity removed." });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Failed to remove activity." }, { status: 500 });
  }
}
