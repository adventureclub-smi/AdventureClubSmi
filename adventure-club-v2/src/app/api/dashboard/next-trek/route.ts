import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import type { Trek } from "@prisma/client";
import { optimizeImage } from "@/lib/media-optimize";

function registrationStateFor(trek: Trek, now: Date) {
  let registrationState: "NOT_OPEN" | "OPEN" | "CLOSED" = "OPEN";

  if (trek.registrationClosedManually) {
    registrationState = "CLOSED";
  } else if (trek.registrationOpenedManually) {
    registrationState = "OPEN";
  } else if (trek.registrationOpensAt && now < trek.registrationOpensAt) {
    registrationState = "NOT_OPEN";
  } else if (trek.registrationClosesAt && now > trek.registrationClosesAt) {
    registrationState = "CLOSED";
  }

  return registrationState;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ message: "Invalid Session" }, { status: 401 });
    }

    const now = new Date();

    // 1) An active (non-terminal) registration always wins — if the student
    // is mid-journey for a trek (waiting, approved, paying, etc.), keep
    // showing that rather than distracting them with a different trek.
    const activeRegistration = await prisma.registration.findFirst({
      where: {
        userId: payload.id,
        status: { notIn: ["COMPLETED", "MISSED", "REJECTED"] },
      },
      orderBy: { createdAt: "desc" },
      include: { trek: true },
    });

    if (activeRegistration) {
      const { trek } = activeRegistration;
      trek.coverImage = optimizeImage(trek.coverImage);

      return NextResponse.json({
        trek,
        registration: activeRegistration,
        registrationState: registrationStateFor(trek, now),
        serverTime: now,
        registrationOpensAt: trek.registrationOpensAt,
        registrationClosesAt: trek.registrationClosesAt,
      });
    }

    // 2) No active registration — a newly published trek the student hasn't
    // registered for yet takes priority over an old completed/missed/
    // rejected registration, so it surfaces here (with countdown + Register
    // Now) the moment it's created, instead of staying hidden behind a
    // finished trek indefinitely.
    const myTrekIds = (
      await prisma.registration.findMany({
        where: { userId: payload.id },
        select: { trekId: true },
      })
    ).map((r) => r.trekId);

    const openTrek = await prisma.trek.findFirst({
      where: {
        status: "Registration Open",
        date: { gte: now },
        id: { notIn: myTrekIds },
      },
      orderBy: { date: "asc" },
    });

    if (openTrek) {
      openTrek.coverImage = optimizeImage(openTrek.coverImage);

      return NextResponse.json({
        trek: openTrek,
        registration: null,
        registrationState: registrationStateFor(openTrek, now),
        serverTime: now,
        registrationOpensAt: openTrek.registrationOpensAt,
        registrationClosesAt: openTrek.registrationClosesAt,
      });
    }

    // 3) No new trek available either — fall back to the student's most
    // recent registration regardless of status, so a finished trip (e.g.
    // certificate access) still shows up instead of an empty dashboard.
    const latestRegistration = await prisma.registration.findFirst({
      where: { userId: payload.id },
      orderBy: { createdAt: "desc" },
      include: { trek: true },
    });

    if (latestRegistration) {
      const { trek } = latestRegistration;
      trek.coverImage = optimizeImage(trek.coverImage);

      return NextResponse.json({
        trek,
        registration: latestRegistration,
        registrationState: registrationStateFor(trek, now),
        serverTime: now,
        registrationOpensAt: trek.registrationOpensAt,
        registrationClosesAt: trek.registrationClosesAt,
      });
    }

    // 4) Brand-new account with no registration history at all and nothing
    // currently open — fall back to the soonest upcoming trek of any status.
    const trek = await prisma.trek.findFirst({
      where: {
        date: {
          gte: now,
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    if (!trek) {
      return NextResponse.json(null);
    }

    trek.coverImage = optimizeImage(trek.coverImage);

    return NextResponse.json({
      trek,
      registration: null,
      registrationState: registrationStateFor(trek, now),
      serverTime: now,
      registrationOpensAt: trek.registrationOpensAt,
      registrationClosesAt: trek.registrationClosesAt,
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
