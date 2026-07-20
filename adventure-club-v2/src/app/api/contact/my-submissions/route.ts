import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  const user = await getCurrentUser();

  // Anonymous visitors have no account to match submissions against —
  // this isn't an error state, just nothing to show yet.
  if (!user) {
    return NextResponse.json([]);
  }

  const submissions = await prisma.contactSubmission.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(submissions);
}
