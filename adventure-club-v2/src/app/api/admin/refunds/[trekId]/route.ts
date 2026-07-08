import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

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

    await Promise.all(
      updates.map(
        (update: {
          registrationId: string;
          amount: number | null;
          done?: boolean;
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
            },
          })
      )
    );

    return NextResponse.json({ message: "Reimbursement amounts saved." });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to save reimbursement data." },
      { status: 500 }
    );
  }
}
