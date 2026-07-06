import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const query =
      req.nextUrl.searchParams.get("query")?.trim() || "";

    if (!query) {
      return NextResponse.json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            fullName: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            clubId: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            phoneNumber: {
              contains: query,
            },
          },
        ],
      },
      orderBy: {
        fullName: "asc",
      },
      select: {
        id: true,
        clubId: true,
        fullName: true,
        phoneNumber: true,
        institution: true,
        department: true,
        year: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to search members.",
      },
      {
        status: 500,
      }
    );
  }
}