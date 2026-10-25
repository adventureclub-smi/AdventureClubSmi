import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// Every recruitment cycle ever run, newest first — powers the admin page's
// "Viewing: 2026-27 (current)" cycle picker, so past years stay browsable
// instead of disappearing the moment a new cycle starts.
export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const cycles = await prisma.recruitmentSettings.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });

  return NextResponse.json(
    cycles.map((cycle) => ({
      id: cycle.id,
      season: cycle.season,
      isCurrent: cycle.isCurrent,
      applicationCount: cycle._count.applications,
    }))
  );
}

// Starts a new recruitment cycle: the existing current row (if any) is
// archived (isCurrent: false, left exactly as it was otherwise — its own
// dates/interview days stay intact as a record of how that year ran) and a
// fresh row becomes the new current cycle, ready for the admin to configure
// from scratch. Doesn't touch any application data — those stay tied to
// whichever cycle's settingsId they were submitted under.
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { season } = await req.json();

  if (typeof season !== "string" || !season.trim()) {
    return NextResponse.json({ message: "A season label is required (e.g. \"2027-28\")." }, { status: 400 });
  }

  await prisma.recruitmentSettings.updateMany({
    where: { isCurrent: true },
    data: { isCurrent: false },
  });

  const cycle = await prisma.recruitmentSettings.create({
    data: {
      season: season.trim(),
      isCurrent: true,
    },
  });

  return NextResponse.json(cycle);
}
