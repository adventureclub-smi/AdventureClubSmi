import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ registrationId: string }> }
) {
  try {
    const { registrationId } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ message: "Invalid Session" }, { status: 401 });
    }

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      return NextResponse.json({ message: "Registration not found" }, { status: 404 });
    }

    if (registration.userId !== payload.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    if (!registration.reimbursementDone) {
      return NextResponse.json(
        { message: "Reimbursement hasn't been marked done for you yet." },
        { status: 400 }
      );
    }

    const updated = await prisma.registration.update({
      where: { id: registrationId },
      data: {
        reimbursementReceived: true,
        reimbursementReceivedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);

    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
