import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();

  await prisma.registration.update({
    where: {
      id: body.registrationId,
    },

    data: {
      attendanceMarked: body.attended,

      attendanceMarkedAt: body.attended
        ? new Date()
        : null,
    },
  });

  return NextResponse.json({
    success: true,
  });
}