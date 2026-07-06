import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("token")?.value;

    if (!token)
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );

    const payload = verifyToken(token);

    if (!payload)
      return NextResponse.json(
        { message: "Invalid Session" },
        { status: 401 }
      );

    const user = await prisma.user.findUnique({
      where: {
        id: payload.id,
      },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("token")?.value;

    if (!token)
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );

    const payload = verifyToken(token);

    if (!payload)
      return NextResponse.json(
        { message: "Invalid Session" },
        { status: 401 }
      );

    const body = await req.json();
    console.log("PROFILE BODY:", body);

    const user = await prisma.user.update({
      where: {
        id: payload.id,
      },

      data: {
  fullName: body.fullName,

  phoneNumber: body.phoneNumber,

  institution: body.institution,

  department: body.department,

  year: body.year,

  bloodGroup: body.bloodGroup,

  dateOfBirth: body.dateOfBirth
    ? new Date(body.dateOfBirth)
    : null,

  collegeRollNumber:
    body.collegeRollNumber,

  emergencyContactName:
    body.emergencyContactName,

  emergencyContactRelation:
    body.emergencyContactRelation,

  emergencyContactPhone:
    body.emergencyContactPhone,

  // --------------------
  // NEW
  // --------------------

  upiId: body.upiId,

  upiPhone: body.upiPhone,
},
    });
    console.log("UPDATED USER:", user);

    return NextResponse.json(user);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
  
}