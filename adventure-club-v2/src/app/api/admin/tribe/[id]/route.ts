import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { uploadBuffer } from "@/lib/storage";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;

    const existing = await prisma.tribeMember.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ message: "Tribe member not found." }, { status: 404 });
    }

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

    let photoUrl = existing.photoUrl;

    if (photoFile instanceof File) {
      const photoBytes = Buffer.from(await photoFile.arrayBuffer());

      const uploadedPhoto = await uploadBuffer(photoBytes, photoFile.type, {
        folder: "AdventureClub/Tribe",
        maxSizeKB: 800,
      });

      photoUrl = uploadedPhoto.secure_url;
    }

    let songUrl = existing.songUrl;
    let finalSongTitle = existing.songTitle;

    if (songFile instanceof File) {
      const songBytes = Buffer.from(await songFile.arrayBuffer());

      const uploadedSong = await uploadBuffer(songBytes, songFile.type, {
        folder: "AdventureClub/Tribe",
        resourceType: "video",
      });

      songUrl = uploadedSong.secure_url;
      finalSongTitle = songTitle.trim() || null;
    } else if (songTitle.trim()) {
      finalSongTitle = songTitle.trim();
    }

    const member = await prisma.tribeMember.update({
      where: { id },
      data: {
        name: name.trim(),
        role: role.trim(),
        tier,
        year: year.trim(),
        course: course.trim(),
        bio: bio.trim(),
        photoUrl,
        songUrl,
        songTitle: finalSongTitle,
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to update tribe member." },
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

    await prisma.tribeMember.delete({ where: { id } });

    return NextResponse.json({ message: "Tribe member removed." });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to remove tribe member." },
      { status: 500 }
    );
  }
}
