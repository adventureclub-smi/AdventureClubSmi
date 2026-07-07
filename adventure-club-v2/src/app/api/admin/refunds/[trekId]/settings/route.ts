import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ trekId: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { trekId } = await params;
    const body = await req.json();

    const data: {
      expectedReimbursementMin?: number | null;
      expectedReimbursementMax?: number | null;
      reimbursementDone?: boolean;
      reimbursementDoneAt?: Date | null;
    } = {};

    if ("expectedReimbursementMin" in body) {
      data.expectedReimbursementMin = body.expectedReimbursementMin;
    }

    if ("expectedReimbursementMax" in body) {
      data.expectedReimbursementMax = body.expectedReimbursementMax;
    }

    if ("reimbursementDone" in body) {
      data.reimbursementDone = body.reimbursementDone;
      data.reimbursementDoneAt = body.reimbursementDone ? new Date() : null;
    }

    const trek = await prisma.trek.update({
      where: { id: trekId },
      data,
      select: {
        expectedReimbursementMin: true,
        expectedReimbursementMax: true,
        reimbursementDone: true,
        reimbursementDoneAt: true,
      },
    });

    return NextResponse.json(trek);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to update reimbursement settings." },
      { status: 500 }
    );
  }
}
