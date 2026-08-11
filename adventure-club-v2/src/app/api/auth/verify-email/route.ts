import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/auth";
import { verifyEmailCode } from "@/lib/email-verification";
import { notifyAccountCreated } from "@/lib/notification-emails";

const MESSAGES: Record<string, string> = {
  NO_PENDING_CODE: "No verification code is pending for this account. Please request a new one.",
  EXPIRED: "That code has expired. Please request a new one.",
  TOO_MANY_ATTEMPTS: "Too many incorrect attempts. Please request a new code.",
  INCORRECT: "Incorrect code. Please try again.",
};

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { message: "Email and code are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { message: "Account not found." },
        { status: 404 }
      );
    }

    const result = await verifyEmailCode(user.id, String(code).trim());

    // Already verified (e.g. the tab was left open and they clicked Verify
    // twice) is treated the same as a fresh success — either way the
    // account ends up logged in, which is what the student is waiting for.
    if (result !== "SUCCESS" && result !== "ALREADY_VERIFIED") {
      return NextResponse.json(
        { message: MESSAGES[result] || "Verification failed." },
        { status: result === "TOO_MANY_ATTEMPTS" ? 429 : 400 }
      );
    }

    if (result === "SUCCESS") {
      try {
        await notifyAccountCreated({
          email: user.email,
          fullName: user.fullName,
          clubId: user.clubId,
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }
    }

    const token = createToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      message: "Email verified!",
      user: {
        id: user.id,
        clubId: user.clubId,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        institution: user.institution,
        department: user.department,
        year: user.year,
        role: user.role,
        clubRole: user.clubRole,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Something went wrong." },
      { status: 500 }
    );
  }
}
