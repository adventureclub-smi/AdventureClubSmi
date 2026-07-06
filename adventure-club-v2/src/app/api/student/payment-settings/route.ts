import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET() {
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

    let settings = await prisma.paymentSettings.findFirst();

    if (!settings) {
      settings = await prisma.paymentSettings.create({
        data: {
          clubName: "Adventure Club",
          receiverName: "Adventure Club",
          upiId: "example@upi",
        },
      });
    }

    return NextResponse.json({
      clubName: settings.clubName,
      receiverName: settings.receiverName,
      upiId: settings.upiId,
      supportPhone: settings.supportPhone,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to load payment settings." },
      { status: 500 }
    );
  }
}
