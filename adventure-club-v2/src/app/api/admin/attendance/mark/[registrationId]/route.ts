import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      registrationId: string;
    }>;
  }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { registrationId } =
    await params;

  const body = await req.json();

  const registration =
    await prisma.registration.update({
      where: {
        id: registrationId,
      },

      data: {
        attendanceMarked:
          body.attendanceMarked,

        attendanceMarkedAt:
          body.attendanceMarked
            ? new Date()
            : null,
      },
    });

  return NextResponse.json(
    registration
  );
}