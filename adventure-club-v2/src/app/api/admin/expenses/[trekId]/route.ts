import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trekId: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { trekId } = await params;

  const [expenses, payments] = await Promise.all([
    prisma.expense.findMany({
      where: { trekId },
      orderBy: { createdAt: "desc" },
    }),

    prisma.payment.findMany({
      where: { status: "PAID", registration: { trekId } },
      select: { amount: true },
    }),
  ]);

  const revenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return NextResponse.json({ expenses, revenue, totalExpenses });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ trekId: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { trekId } = await params;
  const { title, amount, remarks } = await req.json();

  if (!title || !amount) {
    return NextResponse.json(
      { message: "Title and amount are required." },
      { status: 400 }
    );
  }

  const expense = await prisma.expense.create({
    data: {
      trekId,
      title,
      amount: Number(amount),
      remarks: remarks || null,
      createdBy: admin.id,
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
