import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const registrations = await prisma.registration.findMany({
      where: { trek: { isHistorical: false } },
      take: 8,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
        trek: true,
      },
    });

    return NextResponse.json(registrations);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}