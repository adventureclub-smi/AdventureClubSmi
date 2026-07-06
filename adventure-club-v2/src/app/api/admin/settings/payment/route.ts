import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    let settings =
      await prisma.paymentSettings.findFirst();

    if (!settings) {
      settings =
        await prisma.paymentSettings.create({
          data: {
  clubName: "Adventure Club",
  receiverName: "Adventure Club",
  upiId: "example@upi",
},
        });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to load payment settings.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const {
      receiverName,
      upiId,
    } = await req.json();

    const existing =
      await prisma.paymentSettings.findFirst();

    if (existing) {
      const updated =
        await prisma.paymentSettings.update({
          where: {
            id: existing.id,
          },
          data: {
            receiverName,
            upiId,
          },
        });

      return NextResponse.json(updated);
    }

    const created =
      await prisma.paymentSettings.create({
        data: {
  clubName: "Adventure Club",
  receiverName,
  upiId,
},
      });

    return NextResponse.json(created);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to save payment settings.",
      },
      {
        status: 500,
      }
    );
  }
}