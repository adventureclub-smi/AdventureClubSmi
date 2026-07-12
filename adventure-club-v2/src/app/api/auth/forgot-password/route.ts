import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPasswordResetToken, sendPasswordResetEmail } from "@/lib/password-reset";

const GENERIC_MESSAGE =
  "If an account exists for that email, we've sent a password reset link.";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required." }, { status: 400 });
    }

    const user = await prisma.user.findFirst({ where: { email } });

    // Always respond the same way whether or not the account exists (and
    // even if the email itself fails to send) — this endpoint must not leak,
    // via response content or status code, which emails are registered.
    if (user) {
      try {
        const rawToken = await createPasswordResetToken(user.id);
        await sendPasswordResetEmail(user.email, rawToken);
      } catch (emailError) {
        console.error("Failed to send password reset email:", emailError);
      }
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
