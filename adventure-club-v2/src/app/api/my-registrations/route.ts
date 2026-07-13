import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { optimizeImage } from "@/lib/media-optimize";

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

    const registrations =
      await prisma.registration.findMany({
        where: {
          userId: payload.id,
        },

        include: {
          trek: true,
          payments: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json(
      registrations.map((r) => ({
        ...r,
        trek: { ...r.trek, coverImage: optimizeImage(r.trek.coverImage) },
      }))
    );
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