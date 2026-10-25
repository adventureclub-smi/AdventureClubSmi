import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// ?settingsId=<id> scopes the list to one recruitment cycle — defaults to
// whichever cycle is current so the admin page's default view still shows
// this year's applicants without the client needing to resolve that first.
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const requestedId = req.nextUrl.searchParams.get("settingsId");

  const settingsId =
    requestedId ??
    (await prisma.recruitmentSettings.findFirst({ where: { isCurrent: true }, select: { id: true } }))?.id;

  if (!settingsId) {
    return NextResponse.json([]);
  }

  const applications = await prisma.recruitmentApplication.findMany({
    where: { settingsId },
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
