import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ trekId: string; expenseId: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { expenseId } = await params;

    await prisma.expense.delete({ where: { id: expenseId } });

    return NextResponse.json({ message: "Expense removed." });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to remove expense." },
      { status: 500 }
    );
  }
}
