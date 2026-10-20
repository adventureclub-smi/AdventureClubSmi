import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { requireAdmin } from "@/lib/require-admin";
import { registrationStateForViewer } from "@/lib/registration-journey";
import { isCoreTeamRole } from "@/lib/core-team-roles";
import { timeOutOverdueRegistrationsIfDue } from "@/lib/notification-emails";
import { isYearEligible } from "@/lib/year-eligibility";
import { createRegistrationWithNumber } from "@/lib/registration-number";

export async function GET(req: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);

    const trekId = searchParams.get("trekId");

    if (!trekId) {
      return NextResponse.json([]);
    }

    // Awaited (not backgrounded) here, unlike the homepage's after()-based
    // check — this route's whole job is returning the current list, so an
    // admin needs to see any just-expired deadlines flip to TIMED_OUT on
    // this exact load rather than one refresh later.
    try {
      await timeOutOverdueRegistrationsIfDue();
    } catch (error) {
      console.error("Failed to process overdue-registration timeouts:", error);
    }

    const registrations = await prisma.registration.findMany({
      where: {
        trekId,
      },
      include: {
        user: true,
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
        message: "Failed to fetch registrations.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          message: "Please login first.",
        },
        {
          status: 401,
        }
      );
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        {
          message: "Invalid session.",
        },
        {
          status: 401,
        }
      );
    }

    const { trekId, userId: targetUserId } = await req.json();

    // AddParticipantModal (admin panel) sends a userId for the student being
    // added on their behalf — a different flow from a student registering
    // themselves, verified separately so a tampered request body can't just
    // claim admin and register as/for someone else.
    const admin = targetUserId ? await requireAdmin() : null;
    const isAdminAdd = !!admin;

    const user = await prisma.user.findUnique({
      where: {
        id: isAdminAdd ? targetUserId : payload.id,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          message: "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    const trek = await prisma.trek.findUnique({
      where: {
        id: trekId,
      },
    });

    if (!trek) {
      return NextResponse.json(
        {
          message: "Trek not found.",
        },
        {
          status: 404,
        }
      );
    }

    // The UI already hides the Register button once this isn't OPEN, but
    // that's cosmetic only — without this check, a direct POST here could
    // still create a registration while an admin has closed it (or before
    // it's opened, or during a core-only window for a non-core visitor).
    // An admin manually adding someone via AddParticipantModal is meant to
    // bypass this — that's the whole point of a manual add.
    if (!isAdminAdd) {
      const registrationState = registrationStateForViewer(trek, isCoreTeamRole(user.clubRole));

      if (registrationState !== "OPEN") {
        return NextResponse.json(
          {
            message:
              registrationState === "NOT_OPEN"
                ? "Registrations haven't opened yet."
                : "Registrations for this trek are closed.",
          },
          { status: 400 }
        );
      }

      // Same admin-bypass reasoning as the open/closed check above — a
      // manual add via AddParticipantModal is meant to override this too.
      if (!isYearEligible(user.year, trek.restrictedYears)) {
        return NextResponse.json(
          {
            message: `This trek is only open to ${trek.restrictedYears.join(", ")} students.`,
          },
          { status: 400 }
        );
      }
    }

    // This is the real "already registered" check — the only unique
    // constraint on Registration is registrationNumber, so a caught
    // P2002 below is never actually about this trek/user pair.
    const existing = await prisma.registration.findFirst({
      where: { trekId, userId: user.id },
    });

    if (existing) {
      return NextResponse.json(
        {
          message: "Already registered.",
        },
        {
          status: 400,
        }
      );
    }

    const registration = await createRegistrationWithNumber({
      trekId,
      userId: user.id,
    });

    return NextResponse.json({
      message: "Registration successful!",
      registration,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Server Error",
      },
      {
        status: 500,
      }
    );
  }
}