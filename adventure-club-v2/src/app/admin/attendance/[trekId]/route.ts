import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ trekId: string }>;
  }
) {
  const { trekId } = await params;

  const registrations =
    await prisma.registration.findMany({
      where: {
        trekId,
        status: "APPROVED",
      },

      include: {
        user: true,
      },

      orderBy: {
        createdAt: "asc",
      },
    });

  return NextResponse.json(registrations);
}