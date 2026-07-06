import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { trekId } = await req.json();

    if (!trekId) {
      return NextResponse.json({ message: "trekId is required." }, { status: 400 });
    }

    const result = await prisma.registration.updateMany({
      where: {
        trekId,
        initialPaymentPaid: true,
        status: { not: "REJECTED" },
        finalPaymentUnlocked: false,
      },
      data: {
        finalPaymentUnlocked: true,
      },
    });

    return NextResponse.json({
      message: `Final payment unlocked for ${result.count} participant(s).`,
      count: result.count,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to unlock final payment for all." },
      { status: 500 }
    );
  }
}
