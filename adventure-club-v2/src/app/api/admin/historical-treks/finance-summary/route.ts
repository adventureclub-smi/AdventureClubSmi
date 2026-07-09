import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const season = req.nextUrl.searchParams.get("season");

    if (!season) {
      return NextResponse.json({ message: "Missing season." }, { status: 400 });
    }

    const treks = await prisma.trek.findMany({
      where: { isHistorical: true, season },
      select: { id: true, title: true },
    });

    const perTrek = await Promise.all(
      treks.map(async (trek) => {
        const [registrations, expenses, incomes, refundRegistrations] = await Promise.all([
          prisma.registration.findMany({
            where: { trekId: trek.id, status: { notIn: ["WAITING", "REJECTED", "WAITLIST"] } },
            include: { payments: true },
          }),

          prisma.expense.findMany({ where: { trekId: trek.id } }),
          prisma.income.findMany({ where: { trekId: trek.id } }),

          // Same reimbursementAmount figure as the trek's own Finance tab
          // "Total Refund" card, so College Fund Remaining always matches it.
          prisma.registration.findMany({
            where: { trekId: trek.id, OR: [{ finalPaymentPaid: true }, { initialPaymentPaid: true }] },
            select: { reimbursementAmount: true },
          }),
        ]);

        const revenueCollected = registrations.reduce((sum, r) => {
          const initial = r.initialPaymentPaid
            ? r.payments.find((p) => p.type === "INITIAL")?.amount ?? 0
            : 0;
          const final = r.finalPaymentPaid
            ? r.payments.find((p) => p.type === "FINAL")?.amount ?? 0
            : 0;
          return sum + initial + final;
        }, 0);

        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
        const totalRefund = refundRegistrations.reduce(
          (sum, r) => sum + (r.reimbursementAmount ?? 0),
          0
        );

        const studentProfitLoss = revenueCollected - totalExpenses;
        const collegeFundRemaining = totalIncome - totalRefund;

        return {
          trekId: trek.id,
          title: trek.title,
          studentProfitLoss,
          collegeFundRemaining,
        };
      })
    );

    const totalStudentProfitLoss = perTrek.reduce((sum, t) => sum + t.studentProfitLoss, 0);
    const totalCollegeFundRemaining = perTrek.reduce((sum, t) => sum + t.collegeFundRemaining, 0);
    const grandTotal = totalStudentProfitLoss + totalCollegeFundRemaining;

    return NextResponse.json({
      season,
      perTrek,
      totals: {
        totalStudentProfitLoss,
        totalCollegeFundRemaining,
        grandTotal,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to load finance summary." },
      { status: 500 }
    );
  }
}
