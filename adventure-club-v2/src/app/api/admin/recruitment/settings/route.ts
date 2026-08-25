import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { parseIstDateTimeLocal } from "@/lib/ist-time";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const settings = await prisma.recruitmentSettings.findFirst();

  return NextResponse.json(
    settings ?? {
      opensAt: null,
      closesAt: null,
      interviewDayOptions: [],
      isTest: false,
      testVisibleToUserIds: [],
    }
  );
}

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

  const existing = await prisma.recruitmentSettings.findFirst();

  const settings = existing
    ? await prisma.recruitmentSettings.update({ where: { id: existing.id }, data })
    : await prisma.recruitmentSettings.create({ data });

  return NextResponse.json(settings);
}
