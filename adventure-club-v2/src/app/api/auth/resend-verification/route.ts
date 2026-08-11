import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createEmailVerificationCode,
  sendEmailVerificationCode,
  RESEND_COOLDOWN_MS,
} from "@/lib/email-verification";

const GENERIC_MESSAGE =
  "If that account is pending verification, we've sent a new code.";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required." }, { status: 400 });
    }

    const user = await prisma.user.findFirst({ where: { email } });

    // Same "don't reveal whether the account exists" shape as
    // forgot-password — the one case that does need to talk back
    // differently is the cooldown, since without it there's no way for a
    // genuine student to know why nothing happened after mashing the
    // button.
    if (user && !user.emailVerified) {
      const lastSent = user.emailVerificationLastSentAt;

      if (lastSent && Date.now() - lastSent.getTime() < RESEND_COOLDOWN_MS) {
        return NextResponse.json(
          { message: "Please wait a moment before requesting another code." },
          { status: 429 }
        );
      }

      try {
        const code = await createEmailVerificationCode(user.id);
        await sendEmailVerificationCode(user.email, user.fullName, code);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
