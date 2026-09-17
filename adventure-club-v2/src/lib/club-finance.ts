import { prisma } from "@/lib/prisma";

export async function computeClubFinance() {
  const entries = await prisma.clubFinanceEntry.findMany({
    orderBy: { date: "desc" },
  });

  let totalIncome = 0;
  let totalExpenses = 0;

  const accountMap = new Map<
    string,
    { accountName: string; income: number; expenses: number; net: number }
  >();

  for (const entry of entries) {
    if (!accountMap.has(entry.accountName)) {
      accountMap.set(entry.accountName, {
        accountName: entry.accountName,
        income: 0,
        expenses: 0,
        net: 0,
      });
    }

    const account = accountMap.get(entry.accountName)!;

    if (entry.type === "INCOME") {
      totalIncome += entry.amount;
      account.income += entry.amount;
      account.net += entry.amount;
    } else {
      totalExpenses += entry.amount;
      account.expenses += entry.amount;
      account.net -= entry.amount;
    }
  }

  const accounts = Array.from(accountMap.values()).sort(
    (a, b) => b.net - a.net
  );

  return {
    entries,
    accounts,
    totals: {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
    },
  };
}
