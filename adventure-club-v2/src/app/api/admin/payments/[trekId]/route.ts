import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ trekId: string }>;
  }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { trekId } = await params;

    const trek = await prisma.trek.findUnique({
      where: { id: trekId },
      select: { isHistorical: true, status: true },
    });

    // Historical registrations are bulk-imported straight to a terminal
    // status and never pass through the live payment portal, so gating on
    // paymentPortal would hide every one of them here. Every current-trek
    // registration reaches this tab through the portal, so that filter
    // stays for everything else.
    const registrations = await prisma.registration.findMany({
      where: trek?.isHistorical ? { trekId } : { trekId, paymentPortal: true },
      include: {
  user: {
  select: {
    id: true,
    fullName: true,
    clubId: true,
    email: true,
    phoneNumber: true,
    upiId: true,
    upiPhone: true,
  },
},
  trek: true,

  payments: {
    orderBy: {
      createdAt: "desc",
    },
  },
},
      orderBy: {
        createdAt: "asc",
      },
    });

    // registrations.some(status COMPLETED/MISSED) is how the client
    // otherwise infers "is this trek marked completed" — which is always
    // false on a trek with zero registrations, no matter what was actually
    // clicked. Sending the trek's own status directly means that still
    // works even when there's nobody to derive it from.
    return NextResponse.json({ registrations, trekStatus: trek?.status ?? null });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to load payment portal.",
      },
      {
        status: 500,
      }
    );
  }
}