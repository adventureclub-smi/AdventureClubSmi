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
    select: { status: true, attendanceMarked: true },
  });

  // Present and absent are mutually exclusive — setting one explicitly
  // clears the other, so a registration is always in exactly one of three
  // states: not yet checked, present, or absent.
  const data: {
    attendanceMarked?: boolean;
    attendanceMarkedAt?: Date | null;
    attendanceAbsent?: boolean;
    status?: "COMPLETED" | "MISSED";
  } = {};

  if (typeof body.attendanceMarked === "boolean") {
    data.attendanceMarked = body.attendanceMarked;
    data.attendanceMarkedAt = body.attendanceMarked ? new Date() : null;
    if (body.attendanceMarked) data.attendanceAbsent = false;
  }

  if (typeof body.attendanceAbsent === "boolean") {
    data.attendanceAbsent = body.attendanceAbsent;
    if (body.attendanceAbsent) {
      data.attendanceMarked = false;
      data.attendanceMarkedAt = null;
    }
  }

  // On a live trek, completion status only flips when the "Mark Trek
  // Completed" bulk action runs. But a historical/already-finalized trek
  // has no such action (it would clobber every other participant's
  // status), so here attendance is the only signal — keep status in sync
  // with it directly rather than leaving a stale COMPLETED/MISSED value.
  const alreadyFinalized =
    existing?.status === "COMPLETED" || existing?.status === "MISSED";

  if (alreadyFinalized) {
    const resultingPresent = data.attendanceMarked ?? existing?.attendanceMarked ?? false;
    data.status = resultingPresent ? "COMPLETED" : "MISSED";
  }

  const registration =
    await prisma.registration.update({
      where: {
        id: registrationId,
      },

      data,
    });

  return NextResponse.json(
    registration
  );
}