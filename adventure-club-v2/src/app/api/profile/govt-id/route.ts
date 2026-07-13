import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { uploadBuffer } from "@/lib/storage";

const VALID_TYPES = ["PAN", "VOTER_ID", "PASSPORT", "DRIVING_LICENSE"];

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ message: "Invalid session." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    if (user.govtIdLocked) {
      return NextResponse.json(
        {
          message:
            "Your government ID is locked and verified. Contact the admin to make changes.",
        },
        { status: 403 }
      );
    }

    const form = await req.formData();

    const idType = form.get("idType") as string;
    const idNumber = form.get("idNumber") as string;
    const file = form.get("file");

    if (!idType || !VALID_TYPES.includes(idType)) {
      return NextResponse.json({ message: "Select a valid ID type." }, { status: 400 });
    }

    if (!idNumber?.trim()) {
      return NextResponse.json({ message: "ID number is required." }, { status: 400 });
    }

    let imageUrl = user.govtIdImageUrl;

    if (file instanceof File) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploaded = await uploadBuffer(buffer, file.type, {
        folder: "AdventureClub/GovtIds",
      });

      imageUrl = uploaded.secure_url;
    }

    if (!imageUrl) {
      return NextResponse.json(
        { message: "Please upload a photo of your ID." },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        govtIdType: idType,
        govtIdNumber: idNumber.trim(),
        govtIdImageUrl: imageUrl,
        govtIdStatus: "PENDING",
        govtIdSubmittedAt: new Date(),
        govtIdVerifiedAt: null,
      },
    });

    return NextResponse.json({
      message: "Government ID submitted for verification.",
      govtIdType: updated.govtIdType,
      govtIdNumber: updated.govtIdNumber,
      govtIdImageUrl: updated.govtIdImageUrl,
      govtIdStatus: updated.govtIdStatus,
      govtIdLocked: updated.govtIdLocked,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to submit government ID." },
      { status: 500 }
    );
  }
}
