import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

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

    // Count existing users
    const totalUsers = await prisma.user.count();

    // Current year (25, 26, ...)
    const yearCode = new Date().getFullYear().toString().slice(2);

    // AC25-0001
    const clubId = `AC${yearCode}-${String(
      totalUsers + 1
    ).padStart(4, "0")}`;

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
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
      },
    });

    return NextResponse.json(
      {
        message: "Account created successfully.",
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