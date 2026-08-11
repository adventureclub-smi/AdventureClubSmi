import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { createEmailVerificationCode, sendEmailVerificationCode } from "@/lib/email-verification";

function isClubIdConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    String((error.meta as { target?: unknown } | undefined)?.target ?? "").includes("clubId")
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      fullName,
      email,
      phoneNumber,
      institution,
      department,
      course,
      year,
      password,
    } = body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phoneNumber },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          message: "User already exists.",
        },
        {
          status: 400,
        }
      );
    }

    // Current year (25, 26, ...)
    const yearCode = new Date().getFullYear().toString().slice(2);

    const hashedPassword = await bcrypt.hash(password, 10);

    // clubId used to be "AC{year}-{count of existing users + 1}" computed
    // once up front — fine for one signup at a time, but two requests
    // arriving close together can both read the same count before either
    // has inserted, both compute the identical clubId, and the second
    // one's create() then crashes on the unique constraint instead of
    // getting a real ID. The count() itself can't be made atomic, but the
    // database's own uniqueness check on insert can: retry with the next
    // number whenever create() collides, so every request self-heals onto
    // a genuinely free ID no matter how many others raced it.
    let user;

    for (let attempt = 0; ; attempt++) {
      const totalUsers = await prisma.user.count();
      const clubId = `AC${yearCode}-${String(totalUsers + 1 + attempt).padStart(4, "0")}`;

      try {
        user = await prisma.user.create({
          data: {
            clubId,
            fullName,
            email,
            phoneNumber,
            institution,
            department,
            course: course || null,
            year,
            password: hashedPassword,
            emailVerified: false,
          },
        });
        break;
      } catch (error) {
        if (isClubIdConflict(error) && attempt < 9) continue;
        throw error;
      }
    }

    try {
      const code = await createEmailVerificationCode(user.id);
      await sendEmailVerificationCode(email, fullName, code);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    return NextResponse.json(
      {
        message: "Account created — check your email for a verification code.",
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}