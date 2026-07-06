import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ trekId: string }>;
  }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { trekId } = await params;

  const registrations =
    await prisma.registration.findMany({
      where: {
        trekId,

        initialPaymentPaid: true,
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