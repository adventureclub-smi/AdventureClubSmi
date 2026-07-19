import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const submissions = await prisma.contactSubmission.findMany({
    include: { user: { select: { clubId: true, fullName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(submissions);
}
