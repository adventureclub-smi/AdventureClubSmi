import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { parseIstDateTimeLocal } from "@/lib/ist-time";

// ?id=<settingsId> views a past (non-current) cycle read-only — defaults to
// the current one, same as the student-facing route always reading whichever
// row has isCurrent: true.
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");

  const settings = id
    ? await prisma.recruitmentSettings.findUnique({ where: { id } })
    : await prisma.recruitmentSettings.findFirst({ where: { isCurrent: true } });

  return NextResponse.json(
    settings ?? {
      season: null,
      opensAt: null,
      closesAt: null,
      interviewDayOptions: [],
      isTest: false,
      testVisibleToUserIds: [],
      isCurrent: false,
    }
  );
}

// Only ever edits the current cycle — a past cycle is read-only archive
// (the admin UI doesn't surface this form for one), so there's nothing to
// gate on an id here the way GET above does.
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();

  const interviewDayOptions = Array.isArray(body.interviewDayOptions)
    ? body.interviewDayOptions.map((d: string) => d.trim()).filter(Boolean)
    : [];

  const testVisibleToUserIds = Array.isArray(body.testVisibleToUserIds)
    ? body.testVisibleToUserIds
    : [];

  const data = {
    opensAt: parseIstDateTimeLocal(body.opensAt),
    closesAt: parseIstDateTimeLocal(body.closesAt),
    interviewDayOptions,
    isTest: Boolean(body.isTest),
    testVisibleToUserIds: body.isTest ? testVisibleToUserIds : [],
  };

  const existing = await prisma.recruitmentSettings.findFirst({ where: { isCurrent: true } });

  const settings = existing
    ? await prisma.recruitmentSettings.update({ where: { id: existing.id }, data })
    : await prisma.recruitmentSettings.create({
        data: {
          ...data,
          season: typeof body.season === "string" && body.season.trim() ? body.season.trim() : "2026-27",
          isCurrent: true,
        },
      });

  return NextResponse.json(settings);
}
