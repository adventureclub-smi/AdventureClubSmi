import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

const MONTHS = 6;

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

function lastMonthKeys(count: number) {
  const now = new Date();
  const keys: string[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }

  return keys;
}

function bucketByMonth(dates: Date[], keys: string[]) {
  const counts = new Map(keys.map((k) => [k, 0]));

  for (const date of dates) {
    const key = monthKey(date);
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }

  return keys.map((key) => ({ label: monthLabel(key), value: counts.get(key) || 0 }));
}

function sumByMonth(entries: { date: Date; amount: number }[], keys: string[]) {
  const sums = new Map(keys.map((k) => [k, 0]));

  for (const entry of entries) {
    const key = monthKey(entry.date);
    if (sums.has(key)) {
      sums.set(key, (sums.get(key) || 0) + entry.amount);
    }
  }

  return keys.map((key) => ({ label: monthLabel(key), value: sums.get(key) || 0 }));
}

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const keys = lastMonthKeys(MONTHS);
    const rangeStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth() - (MONTHS - 1),
      1
    );

    const [registrations, payments, users, treksCompleted, certificates] =
      await Promise.all([
        prisma.registration.findMany({
          where: { createdAt: { gte: rangeStart }, trek: { isHistorical: false } },
          select: { createdAt: true },
        }),

        prisma.payment.findMany({
          where: {
            status: "PAID",
            paidAt: { gte: rangeStart },
            registration: { trek: { isHistorical: false } },
          },
          select: { paidAt: true, amount: true },
        }),

        prisma.user.findMany({
          select: { year: true, department: true },
        }),

        prisma.trek.count({
          where: { date: { lt: new Date() }, isHistorical: false },
        }),

        prisma.registration.findMany({
          where: {
            certificateIssued: true,
            certificateIssuedAt: { gte: rangeStart },
            trek: { isHistorical: false },
          },
          select: { certificateIssuedAt: true },
        }),
      ]);

    const registrationsOverTime = bucketByMonth(
      registrations.map((r) => r.createdAt),
      keys
    );

    const paymentsCollectedOverTime = sumByMonth(
      payments
        .filter((p) => p.paidAt)
        .map((p) => ({ date: p.paidAt as Date, amount: p.amount })),
      keys
    );

    const certificatesIssuedOverTime = bucketByMonth(
      certificates
        .filter((c) => c.certificateIssuedAt)
        .map((c) => c.certificateIssuedAt as Date),
      keys
    );

    const studentsByYear = Object.entries(
      users.reduce<Record<string, number>>((acc, u) => {
        const key = u.year || "Unspecified";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
    ).map(([label, value]) => ({ label, value }));

    const studentsByCourse = Object.entries(
      users.reduce<Record<string, number>>((acc, u) => {
        const key = u.department || "Unspecified";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
    ).map(([label, value]) => ({ label, value }));

    return NextResponse.json({
      registrationsOverTime,
      paymentsCollectedOverTime,
      certificatesIssuedOverTime,
      studentsByYear,
      studentsByCourse,
      treksCompleted,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to load analytics." },
      { status: 500 }
    );
  }
}
