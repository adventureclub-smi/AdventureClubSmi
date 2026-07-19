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

  const { trekId } = await params;

  const trek = await prisma.trek.findUnique({
    where: { id: trekId },
    select: { isHistorical: true },
  });

  // Historical registrations are bulk-imported and some never had their
  // initial payment marked paid at all — gating on that here would make
  // those participants impossible to mark present/absent for an archived
  // trek. Live treks keep the original "must have paid" restriction.
  const registrations =
    await prisma.registration.findMany({
      where: trek?.isHistorical
        ? { trekId }
        : {
            trekId,

            initialPaymentPaid: true,
          },

      include: {
        user: true,
      },

      orderBy: {
        createdAt: "asc",
      },
    });

  return NextResponse.json(registrations);
}