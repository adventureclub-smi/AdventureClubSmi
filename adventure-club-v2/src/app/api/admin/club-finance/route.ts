import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { computeClubFinance } from "@/lib/club-finance";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const data = await computeClubFinance();

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { type, title, amount, accountName, notes } = await req.json();

  if (!type || (type !== "INCOME" && type !== "EXPENSE")) {
    return NextResponse.json(
      { message: "Type must be INCOME or EXPENSE." },
      { status: 400 }
    );
  }

  if (!title || !amount || !accountName) {
    return NextResponse.json(
      { message: "Title, amount, and account are required." },
      { status: 400 }
    );
  }

  const entry = await prisma.clubFinanceEntry.create({
    data: {
      type,
      title,
      amount: Number(amount),
      accountName,
      notes: notes || null,
      recordedBy: admin.fullName || admin.email || null,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
