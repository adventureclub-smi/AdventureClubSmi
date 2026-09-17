import { prisma } from "@/lib/prisma";

// Shared by the Finance tab (editable ledger view) and the Reports tab
// (read-only summary) so the two can never disagree on what "Net" or
// "College Fund Remaining" actually means.
export async function computeTrekFinance(trekId: string) {
  const [trek, registrations, expenses, incomes, refundRegistrations] = await Promise.all([
    prisma.trek.findUnique({ where: { id: trekId }, select: { installments: true } }),

    prisma.registration.findMany({
      where: { trekId, status: { notIn: ["WAITING", "REJECTED", "WAITLIST", "TIMED_OUT"] } },
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

  const hasSecondInstallment = trek?.installments === 3;

  const participants = registrations.map((r) => {
    const initialPayment = r.payments.find((p) => p.type === "INITIAL");
    const secondPayment = r.payments.find((p) => p.type === "SECOND");
    const finalPayment = r.payments.find((p) => p.type === "FINAL");

    return {
      id: r.id,
      fullName: r.user?.fullName || r.guestName || "Unknown",
      year: r.user?.year || "-",
      department: r.user?.department || "-",
      initialPaymentPaid: r.initialPaymentPaid,
      initialAmount: r.initialPaymentPaid ? initialPayment?.amount ?? r.paymentAmount ?? 0 : 0,
      secondPaymentPaid: r.secondPaymentPaid,
      secondAmount: r.secondPaymentPaid ? secondPayment?.amount ?? 0 : 0,
      finalPaymentPaid: r.finalPaymentPaid,
      finalAmount: r.finalPaymentPaid ? finalPayment?.amount ?? 0 : 0,
    };
  });

  const initialCollected = participants.reduce(
    (sum, p) => sum + (p.initialPaymentPaid ? p.initialAmount : 0),
    0
  );

  const secondCollected = participants.reduce(
    (sum, p) => sum + (p.secondPaymentPaid ? p.secondAmount : 0),
    0
  );

  const finalCollected = participants.reduce(
    (sum, p) => sum + (p.finalPaymentPaid ? p.finalAmount : 0),
    0
  );

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRefund = refundRegistrations.reduce((sum, r) => sum + (r.reimbursementAmount ?? 0), 0);
  const revenueCollected = initialCollected + secondCollected + finalCollected;
  const net = revenueCollected + totalIncome - totalExpenses - totalRefund;

  // Student-money-only profit/loss: what's left of what students paid after
  // just the trek's own expenses (bus, food, etc.) — deliberately excludes
  // other income, college reimbursement, and refunds to students, unlike
  // Net above.
  const studentProfitLoss = revenueCollected - totalExpenses;

  // College Fund Remaining: lump-sum college reimbursement (tracked as
  // Income) minus Total Refund above — same reimbursementAmount figure, so
  // this always stays in sync with the Total Refund card.
  const collegeFundRemaining = totalIncome - totalRefund;

  return {
    hasSecondInstallment,
    participants,
    expenses,
    incomes,
    totals: {
      revenueCollected,
      initialCollected,
      secondCollected,
      finalCollected,
      totalIncome,
      totalExpenses,
      totalRefund,
      net,
      studentProfitLoss,
      refundsGiven: totalRefund,
      collegeFundRemaining,
      participantCount: participants.length,
    },
  };
}
