import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const applications = await prisma.recruitmentApplication.findMany({
    include: {
      user: {
        select: {
          fullName: true,
          email: true,
          phoneNumber: true,
          collegeRollNumber: true,
          institution: true,
          department: true,
          year: true,
        },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json(applications);
}
