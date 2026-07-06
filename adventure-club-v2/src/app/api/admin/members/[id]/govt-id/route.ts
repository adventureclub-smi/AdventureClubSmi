import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { govtIdStatus, govtIdLocked } = await req.json();

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(govtIdStatus !== undefined && {
          govtIdStatus,
          govtIdVerifiedAt: govtIdStatus === "VERIFIED" ? new Date() : null,
        }),

        ...(govtIdLocked !== undefined && { govtIdLocked }),
      },
    });

    return NextResponse.json({
      message: "Government ID updated.",
      govtIdStatus: user.govtIdStatus,
      govtIdLocked: user.govtIdLocked,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to update government ID." },
      { status: 500 }
    );
  }
}
