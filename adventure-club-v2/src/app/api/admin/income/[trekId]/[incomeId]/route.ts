import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ trekId: string; incomeId: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { incomeId } = await params;

    await prisma.income.delete({ where: { id: incomeId } });

    return NextResponse.json({ message: "Income removed." });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to remove income." },
      { status: 500 }
    );
  }
}
