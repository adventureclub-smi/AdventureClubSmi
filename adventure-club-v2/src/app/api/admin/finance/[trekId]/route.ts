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

  try {
    const { trekId } = await params;

    const [registrations, expenses, incomes, refundRegistrations] = await Promise.all([
      prisma.registration.findMany({
        where: { trekId, status: { notIn: ["WAITING", "REJECTED", "WAITLIST"] } },
        include: {
          user: { select: { fullName: true, year: true, department: true } },
          payments: { orderBy: { createdAt: "desc" } },
        },
        orderBy: { createdAt: "asc" },
      }),

      prisma.expense.findMany({ where: { trekId }, orderBy: { createdAt: "desc" } }),
      prisma.income.findMany({ where: { trekId }, orderBy: { createdAt: "desc" } }),

      // Same filter as the Refunds tab's own query, so this trek's "Total
      // Refund" always matches that tab's Grand Total exactly.
      prisma.registration.findMany({
        where: { trekId, OR: [{ finalPaymentPaid: true }, { initialPaymentPaid: true }] },
        select: { reimbursementAmount: true },
      }),
    ]);

    const participants = registrations.map((r) => {
      const initialPayment = r.payments.find((p) => p.type === "INITIAL");
      const finalPayment = r.payments.find((p) => p.type === "FINAL");

      return {
        id: r.id,
        fullName: r.user?.fullName || r.guestName || "Unknown",
        year: r.user?.year || "-",
        department: r.user?.department || "-",
        initialPaymentPaid: r.initialPaymentPaid,
        initialAmount: r.initialPaymentPaid
          ? initialPayment?.amount ?? r.paymentAmount ?? 0
          : 0,
        finalPaymentPaid: r.finalPaymentPaid,
        finalAmount: r.finalPaymentPaid ? finalPayment?.amount ?? 0 : 0,
      };
    });

    const initialCollected = participants.reduce(
      (sum, p) => sum + (p.initialPaymentPaid ? p.initialAmount : 0),
      0
    );

    const finalCollected = participants.reduce(
      (sum, p) => sum + (p.finalPaymentPaid ? p.finalAmount : 0),
      0
    );

    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalRefund = refundRegistrations.reduce(
      (sum, r) => sum + (r.reimbursementAmount ?? 0),
      0
    );
    const revenueCollected = initialCollected + finalCollected;
    const net = revenueCollected + totalIncome - totalExpenses - totalRefund;

    // Student-money-only profit/loss: what's left of what students paid
    // after just the trek's own expenses (bus, food, etc.) — deliberately
    // excludes other income, college reimbursement, and refunds to
    // students, unlike Net above.
    const studentProfitLoss = revenueCollected - totalExpenses;

    return NextResponse.json({
      participants,
      expenses,
      incomes,
      totals: {
        revenueCollected,
        initialCollected,
        finalCollected,
        totalIncome,
        totalExpenses,
        totalRefund,
        net,
        studentProfitLoss,
        participantCount: participants.length,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to load finance data." },
      { status: 500 }
    );
  }
}
