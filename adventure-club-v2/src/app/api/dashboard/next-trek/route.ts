import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { optimizeImage } from "@/lib/media-optimize";
import { registrationStateFor } from "@/lib/registration-journey";

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

    // 1) Every trek the admin hasn't marked "Completed" yet shows here —
    // registered or not. Two treks can be live at once (one the student
    // registered for, one they haven't gotten to yet), and neither should
    // stay hidden just because the other exists — the student picks which
    // one's journey to view via tabs on the dashboard. A trek keeps showing
    // right through registration/payment/trip and only drops off once the
    // admin's "Mark Trek Completed" action flips its status, matching
    // getUpcomingTreks()'s own status check. `isHistorical` keeps a past
    // season's abandoned drafts from resurfacing here too.
    const liveTreks = await prisma.trek.findMany({
      where: {
        isHistorical: false,
        status: { not: "Completed" },
      },
      orderBy: { date: "asc" },
    });

    if (liveTreks.length > 0) {
      const trekIds = liveTreks.map((trek) => trek.id);

      const [registrations, notifyRequests] = await Promise.all([
        // include: { trek: true } is required here — getJourneyAction() (used
        // by NextTrekCard to decide its own CTA) reads registration.trek
        // .tripCentrePublished and .installments directly, and without the
        // join those are silently undefined, so the CTA can never show "Open
        // Trip Centre" regardless of whether the admin actually published it.
        prisma.registration.findMany({
          where: { userId: payload.id, trekId: { in: trekIds } },
          include: { trek: true },
        }),
        prisma.trekNotifyRequest.findMany({
          where: { userId: payload.id, trekId: { in: trekIds } },
        }),
      ]);

      const registrationByTrekId = new Map(
        registrations.map((registration) => [registration.trekId, registration])
      );
      const notifiedTrekIds = new Set(notifyRequests.map((n) => n.trekId));

      const entries = liveTreks.map((trek) => {
        trek.coverImage = optimizeImage(trek.coverImage);

        return {
          trek,
          registration: registrationByTrekId.get(trek.id) || null,
          registrationState: registrationStateFor(trek, now),
          serverTime: now,
          registrationOpensAt: trek.registrationOpensAt,
          registrationClosesAt: trek.registrationClosesAt,
          notifyRequested: notifiedTrekIds.has(trek.id),
        };
      });

      return NextResponse.json({ entries });
    }

    // 2) No current-season trek exists at all (off-season, or a brand new
    // account before this season's first trek is published) — fall back to
    // the student's most recent registration regardless of status, so a
    // finished trip (e.g. certificate access) still shows up instead of an
    // empty dashboard.
    const latestRegistration = await prisma.registration.findFirst({
      where: { userId: payload.id },
      orderBy: { createdAt: "desc" },
      include: { trek: true },
    });

    if (latestRegistration) {
      const { trek } = latestRegistration;
      trek.coverImage = optimizeImage(trek.coverImage);

      return NextResponse.json({
        entries: [
          {
            trek,
            registration: latestRegistration,
            registrationState: registrationStateFor(trek, now),
            serverTime: now,
            registrationOpensAt: trek.registrationOpensAt,
            registrationClosesAt: trek.registrationClosesAt,
          },
        ],
      });
    }

    // 3) Brand-new account with no registration history at all and nothing
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
      return NextResponse.json({ entries: [] });
    }

    trek.coverImage = optimizeImage(trek.coverImage);

    const notifyRequested = await prisma.trekNotifyRequest
      .findUnique({
        where: { trekId_userId: { trekId: trek.id, userId: payload.id } },
      })
      .then(Boolean);

    return NextResponse.json({
      entries: [
        {
          trek,
          registration: null,
          registrationState: registrationStateFor(trek, now),
          serverTime: now,
          registrationOpensAt: trek.registrationOpensAt,
          registrationClosesAt: trek.registrationClosesAt,
          notifyRequested,
        },
      ],
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
