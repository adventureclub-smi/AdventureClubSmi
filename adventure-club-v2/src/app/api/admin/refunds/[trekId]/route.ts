import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { notifyReimbursementDone } from "@/lib/notification-emails";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trekId: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { trekId } = await params;

    const trek = await prisma.trek.findUnique({
      where: { id: trekId },
      select: {
        expectedReimbursementMin: true,
        expectedReimbursementMax: true,
      },
    });

    if (!trek) {
      return NextResponse.json({ message: "Trek not found." }, { status: 404 });
    }

    const registrations = await prisma.registration.findMany({
      where: {
        trekId,
        OR: [{ finalPaymentPaid: true }, { initialPaymentPaid: true }],
      },
      select: {
        id: true,
        guestName: true,
        initialPaymentPaid: true,
        finalPaymentPaid: true,
        reimbursementAmount: true,
        reimbursementDone: true,
        reimbursementReceived: true,
        user: {
          select: {
            fullName: true,
            clubId: true,
            upiId: true,
            upiPhone: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ trek, registrations });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to load reimbursement data." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ trekId: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { trekId } = await params;
    const { updates } = await req.json();

    if (!Array.isArray(updates)) {
      return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
    }

    // Fetched before applying updates so a `done: true` in the payload can be
    // told apart from a genuine false -> true transition (re-saving an
    // already-done row, e.g. just to tweak the amount, must not re-email).
    const before = await prisma.registration.findMany({
      where: { id: { in: updates.map((u) => u.registrationId) }, trekId },
      select: { id: true, reimbursementDone: true },
    });

    const wasDone = new Map(before.map((r) => [r.id, r.reimbursementDone]));

    await Promise.all(
      updates.map(
        (update: {
          registrationId: string;
          amount: number | null;
          done?: boolean;
          received?: boolean;
        }) =>
          prisma.registration.updateMany({
            where: { id: update.registrationId, trekId },
            data: {
              reimbursementAmount: update.amount,
              ...(update.done !== undefined
                ? {
                    reimbursementDone: update.done,
                    reimbursementDoneAt: update.done ? new Date() : null,
                  }
                : {}),
              ...(update.received !== undefined
                ? {
                    reimbursementReceived: update.received,
                    reimbursementReceivedAt: update.received ? new Date() : null,
                  }
                : {}),
            },
          })
      )
    );

    const newlyDoneIds = updates
      .filter((u) => u.done === true && !wasDone.get(u.registrationId))
      .map((u) => u.registrationId);

    if (newlyDoneIds.length > 0) {
      const toNotify = await prisma.registration.findMany({
        where: { id: { in: newlyDoneIds } },
        include: { user: true, trek: true },
      });

      for (const registration of toNotify) {
        try {
          await notifyReimbursementDone(registration, registration.reimbursementAmount);
        } catch (emailError) {
          console.error("Failed to send reimbursement email:", emailError);
        }
      }
    }

    return NextResponse.json({ message: "Reimbursement amounts saved." });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to save reimbursement data." },
      { status: 500 }
    );
  }
}
