import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { uploadBuffer } from "@/lib/storage";

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

    const caption = ((form.get("caption") as string) || "").trim();
    const category = ((form.get("category") as string) || "").trim();
    const imageFile = form.get("imageFile");

    let imageUrl: string | undefined;
    let width: number | undefined;
    let height: number | undefined;

    if (imageFile instanceof File) {
      const imageBytes = Buffer.from(await imageFile.arrayBuffer());
      const uploaded = await uploadBuffer(imageBytes, imageFile.type, {
        folder: "AdventureClub/HomepageGallery",
      });
      imageUrl = uploaded.secure_url;
      width = uploaded.width;
      height = uploaded.height;
    }

    const photo = await prisma.homepageGalleryPhoto.update({
      where: { id },
      data: {
        caption: caption || null,
        category: category || null,
        ...(imageUrl ? { imageUrl, width, height } : {}),
      },
    });

    return NextResponse.json(photo);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to update gallery photo." },
      { status: 500 }
    );
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

    await prisma.homepageGalleryPhoto.delete({ where: { id } });

    return NextResponse.json({ message: "Gallery photo removed." });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to remove gallery photo." },
      { status: 500 }
    );
  }
}
