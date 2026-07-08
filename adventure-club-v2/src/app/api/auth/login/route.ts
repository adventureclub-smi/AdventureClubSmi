import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json();

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
      maxAge: 60 * 60 * 24 * 7,
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