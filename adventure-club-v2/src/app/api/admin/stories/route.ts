import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { uploadBuffer } from "@/lib/storage";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const stories = await prisma.homepageStory.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(stories);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const form = await req.formData();

    const title = ((form.get("title") as string) || "").trim();
    const description = ((form.get("description") as string) || "").trim();
    const imageFile = form.get("imageFile");

    if (!title || !description) {
      return NextResponse.json(
        { message: "A tag line and one-line description are required." },
        { status: 400 }
      );
    }

    if (!(imageFile instanceof File)) {
      return NextResponse.json(
        { message: "A picture is required." },
        { status: 400 }
      );
    }

    const imageBytes = Buffer.from(await imageFile.arrayBuffer());

    const uploaded = await uploadBuffer(imageBytes, imageFile.type, {
      folder: "AdventureClub/Stories",
    });

    const count = await prisma.homepageStory.count();

    const story = await prisma.homepageStory.create({
      data: {
        imageUrl: uploaded.secure_url,
        title,
        description,
        order: count,
      },
    });

    return NextResponse.json(story, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to add story." },
      { status: 500 }
    );
  }
}
