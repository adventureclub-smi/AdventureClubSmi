import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { identifier, password, rememberMe } = await req.json();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            email: identifier,
          },
          {
            phoneNumber: identifier,
          },
          {
            clubId: identifier,
          },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          message: "Invalid credentials.",
        },
        {
          status: 401,
        }
      );
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return NextResponse.json(
        {
          message: "Invalid credentials.",
        },
        {
          status: 401,
        }
      );
    }

    // Strict `=== false` rather than `!user.emailVerified` — the field
    // defaults to true precisely so every account that existed before email
    // verification shipped keeps logging in normally; only an account this
    // flow itself explicitly set to false (a signup that hasn't confirmed
    // its code yet) gets blocked here.
    if (user.emailVerified === false) {
      return NextResponse.json(
        {
          message: "Please verify your email before logging in.",
          needsVerification: true,
          email: user.email,
        },
        {
          status: 403,
        }
      );
    }

    const token = createToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      message: "Login successful!",
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
      // Unchecking "Remember me" drops maxAge entirely, making this a
      // session cookie that the browser clears on its own once closed —
      // checked (the default) keeps the 7-day persistent cookie so a
      // returning visitor stays logged in instead of being asked again.
      ...(rememberMe === false ? {} : { maxAge: 60 * 60 * 24 * 7 }),
      path: "/",
    });

    return response;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Server error.",
      },
      {
        status: 500,
      }
    );
  }
}