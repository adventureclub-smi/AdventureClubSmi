import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

const VALID_CATEGORIES = ["ISSUE", "INFORMATION", "SIGNUP_PROBLEM", "PAYMENT_ISSUE"];

export async function POST(req: Request) {
  try {
    const { category, message, name, email, phoneNumber } = await req.json();

    if (!VALID_CATEGORIES.includes(category) || !message?.trim()) {
      return NextResponse.json(
        { message: "Please select a category and describe your concern." },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();

    const submission = await prisma.contactSubmission.create({
      data: {
        category,
        message: message.trim(),
        name: user?.fullName ?? name?.trim() ?? null,
        email: user?.email ?? email?.trim() ?? null,
        phoneNumber: user?.phoneNumber ?? phoneNumber?.trim() ?? null,
        userId: user?.id ?? null,
      },
    });

    return NextResponse.json({ message: "Your message has been sent.", submission });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
