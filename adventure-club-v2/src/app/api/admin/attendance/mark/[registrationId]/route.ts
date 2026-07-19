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

  const existing = await prisma.registration.findUnique({
    where: { id: registrationId },
    select: { status: true },
  });

  // On a live trek, completion status only flips when the "Mark Trek
  // Completed" bulk action runs. But a historical/already-finalized trek
  // has no such action (it would clobber every other participant's
  // status), so here attendance is the only signal — keep status in sync
  // with it directly rather than leaving a stale COMPLETED/MISSED value.
  const alreadyFinalized =
    existing?.status === "COMPLETED" || existing?.status === "MISSED";

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

        ...(alreadyFinalized
          ? { status: body.attendanceMarked ? "COMPLETED" : "MISSED" }
          : {}),
      },
    });

  return NextResponse.json(
    registration
  );
}