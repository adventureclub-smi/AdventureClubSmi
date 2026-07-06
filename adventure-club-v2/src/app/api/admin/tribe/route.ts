import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import cloudinary from "@/lib/cloudinary";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const members = await prisma.tribeMember.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const form = await req.formData();

    const name = (form.get("name") as string) || "";
    const role = (form.get("role") as string) || "";
    const tier = Number(form.get("tier")) === 1 ? 1 : 2;
    const year = (form.get("year") as string) || "";
    const course = (form.get("course") as string) || "";
    const bio = (form.get("bio") as string) || "";
    const songTitle = (form.get("songTitle") as string) || "";
    const photoFile = form.get("photoFile");
    const songFile = form.get("songFile");

    if (!name.trim() || !role.trim() || !year.trim() || !course.trim() || !bio.trim()) {
      return NextResponse.json(
        { message: "Name, role, year, course and bio are all required." },
        { status: 400 }
      );
    }

    if (!(photoFile instanceof File)) {
      return NextResponse.json(
        { message: "A photo is required." },
        { status: 400 }
      );
    }

    const photoBytes = Buffer.from(await photoFile.arrayBuffer());
    const photoBase64 = `data:${photoFile.type};base64,${photoBytes.toString("base64")}`;

    const uploadedPhoto = await cloudinary.uploader.upload(photoBase64, {
      folder: "AdventureClub/Tribe",
    });

    let songUrl: string | null = null;

    if (songFile instanceof File) {
      const songBytes = Buffer.from(await songFile.arrayBuffer());
      const songBase64 = `data:${songFile.type};base64,${songBytes.toString("base64")}`;

      const uploadedSong = await cloudinary.uploader.upload(songBase64, {
        folder: "AdventureClub/Tribe",
        resource_type: "video", // Cloudinary buckets audio under "video"
      });

      songUrl = uploadedSong.secure_url;
    }

    const count = await prisma.tribeMember.count();

    const member = await prisma.tribeMember.create({
      data: {
        name: name.trim(),
        role: role.trim(),
        tier,
        year: year.trim(),
        course: course.trim(),
        bio: bio.trim(),
        photoUrl: uploadedPhoto.secure_url,
        songTitle: songUrl ? songTitle.trim() || null : null,
        songUrl,
        order: count,
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to add tribe member." },
      { status: 500 }
    );
  }
}
