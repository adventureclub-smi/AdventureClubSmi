import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ trekId: string }>;
  }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { trekId } = await params;

    const registrations = await prisma.registration.findMany({
      where: {
        trekId,
        paymentPortal: true,
      },
      include: {
  user: {
  select: {
    id: true,
    fullName: true,
    clubId: true,
    email: true,
    phoneNumber: true,
    upiId: true,
    upiPhone: true,
  },
},
  trek: true,

  payments: {
    orderBy: {
      createdAt: "desc",
    },
  },
},
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(registrations);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to load payment portal.",
      },
      {
        status: 500,
      }
    );
  }
}