import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getRecruitmentProfileGaps } from "@/lib/recruitment-profile-gaps";
import { isRecruitmentOpenFor } from "@/lib/recruitment-visibility";
import {
  RECRUITMENT_TEAMS,
  PORTFOLIO_REQUIRED_TEAMS,
  MAX_TEAM_PREFERENCES,
} from "@/lib/recruitment-options";

async function getAuthedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  const payload = verifyToken(token);

  if (!payload) return null;

  return prisma.user.findUnique({ where: { id: payload.id } });
}

export async function GET() {
  const user = await getAuthedUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const application = await prisma.recruitmentApplication.findUnique({
    where: { userId: user.id },
  });

  return NextResponse.json(application);
}

export async function POST(req: NextRequest) {
  const user = await getAuthedUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const gaps = getRecruitmentProfileGaps(user);

  if (gaps.length > 0) {
    return NextResponse.json(
      { message: `Please complete your profile first — missing: ${gaps.join(", ")}.` },
      { status: 400 }
    );
  }

  const settings = await prisma.recruitmentSettings.findFirst();
  const isOpen = isRecruitmentOpenFor(settings, user);

  const existing = await prisma.recruitmentApplication.findUnique({
    where: { userId: user.id },
  });

  // Editing an already-submitted application is allowed right up until the
  // window closes, but a brand-new one can't be created once it has.
  if (!isOpen && !existing) {
    return NextResponse.json({ message: "Recruitment applications aren't open right now." }, { status: 400 });
  }

  const body = await req.json();

  const {
    portfolioText,
    portfolioLink,
    portfolioFileUrl,
    whyJoin,
    interviewDay,
    teamPreferences,
  } = body;

  if (!whyJoin?.trim()) {
    return NextResponse.json({ message: "Tell us why you want to join the club." }, { status: 400 });
  }

  if (!interviewDay?.trim()) {
    return NextResponse.json({ message: "Select a preferred interview day." }, { status: 400 });
  }

  if (
    !Array.isArray(teamPreferences) ||
    teamPreferences.length === 0 ||
    teamPreferences.length > MAX_TEAM_PREFERENCES
  ) {
    return NextResponse.json(
      { message: `Select between 1 and ${MAX_TEAM_PREFERENCES} team preferences.` },
      { status: 400 }
    );
  }

  const validTeams: readonly string[] = RECRUITMENT_TEAMS;
  const portfolioRequiredTeams: readonly string[] = PORTFOLIO_REQUIRED_TEAMS;

  const uniquePreferences = new Set(teamPreferences);

  if (
    uniquePreferences.size !== teamPreferences.length ||
    !teamPreferences.every((t: string) => validTeams.includes(t))
  ) {
    return NextResponse.json({ message: "Invalid team preferences." }, { status: 400 });
  }

  const needsPortfolio = teamPreferences.some((t: string) => portfolioRequiredTeams.includes(t));

  if (needsPortfolio && !portfolioText?.trim() && !portfolioLink?.trim() && !portfolioFileUrl) {
    return NextResponse.json(
      {
        message:
          "A portfolio (text, link, or file) is required when Visual Media or Marketing is one of your preferences.",
      },
      { status: 400 }
    );
  }

  const application = await prisma.recruitmentApplication.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      portfolioText: portfolioText?.trim() || null,
      portfolioLink: portfolioLink?.trim() || null,
      portfolioFileUrl: portfolioFileUrl || null,
      whyJoin: whyJoin.trim(),
      interviewDay: interviewDay.trim(),
      teamPreferences,
    },
    update: {
      portfolioText: portfolioText?.trim() || null,
      portfolioLink: portfolioLink?.trim() || null,
      portfolioFileUrl: portfolioFileUrl || null,
      whyJoin: whyJoin.trim(),
      interviewDay: interviewDay.trim(),
      teamPreferences,
    },
  });

  return NextResponse.json(application);
}

export async function DELETE() {
  const user = await getAuthedUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.recruitmentApplication.findUnique({
    where: { userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ message: "No application to withdraw." }, { status: 404 });
  }

  await prisma.recruitmentApplication.delete({ where: { userId: user.id } });

  return NextResponse.json({ message: "Application withdrawn." });
}
