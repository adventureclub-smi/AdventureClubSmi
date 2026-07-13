import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { uploadBuffer } from "@/lib/storage";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const posts = await prisma.instagramPost.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const form = await req.formData();

    const postUrl = ((form.get("postUrl") as string) || "").trim();
    const caption = ((form.get("caption") as string) || "").trim();
    const thumbnailFile = form.get("thumbnailFile");

    if (!postUrl) {
      return NextResponse.json(
        { message: "The Instagram post URL is required." },
        { status: 400 }
      );
    }

    const isInstagramUrl =
      /^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[^/]+\/?/.test(postUrl);

    if (!isInstagramUrl) {
      return NextResponse.json(
        {
          message:
            "That doesn't look like an Instagram post link. Copy the link from the post's share menu (e.g. https://www.instagram.com/p/XXXXXXX/).",
        },
        { status: 400 }
      );
    }

    if (!(thumbnailFile instanceof File)) {
      return NextResponse.json(
        {
          message:
            "A thumbnail image is required — screenshot or save the post's photo and upload it here.",
        },
        { status: 400 }
      );
    }

    const thumbBytes = Buffer.from(await thumbnailFile.arrayBuffer());

    const uploadedThumb = await uploadBuffer(thumbBytes, thumbnailFile.type, {
      folder: "AdventureClub/Instagram",
    });

    const post = await prisma.instagramPost.create({
      data: {
        postUrl,
        thumbnailUrl: uploadedThumb.secure_url,
        caption: caption || null,
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to add Instagram post." },
      { status: 500 }
    );
  }
}
