import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getStudentDashboardSettings } from "@/data/student-dashboard-settings";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { message: "Invalid Session" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: payload.id,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 }
      );
    }

    const { bannerImageUrl } = await getStudentDashboardSettings();

    return NextResponse.json({
      name: user.fullName,
      clubId: user.clubId,

      // These will become admin-controlled later
      membership:
        (user as any).membershipStatus || "Pending Approval",

      role:
        (user as any).clubRole || "Member",

      bannerImageUrl,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Server Error",
      },
      {
        status: 500,
      }
    );
  }
}