import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { uploadBuffer } from "@/lib/storage";

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

    const uploadedPhoto = await uploadBuffer(photoBytes, photoFile.type, {
      folder: "AdventureClub/Tribe",
      maxSizeKB: 800,
    });

    let songUrl: string | null = null;

    if (songFile instanceof File) {
      const songBytes = Buffer.from(await songFile.arrayBuffer());

      const uploadedSong = await uploadBuffer(songBytes, songFile.type, {
        folder: "AdventureClub/Tribe",
        resourceType: "video", // not actually video — just means "skip image processing"
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
