import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;

    await prisma.trekNotifyRequest.delete({ where: { id } });

    return NextResponse.json({ message: "Removed from notify list." });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to remove from notify list." },
      { status: 500 }
    );
  }
}
