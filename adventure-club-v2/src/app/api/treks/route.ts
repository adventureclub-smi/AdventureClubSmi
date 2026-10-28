import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { getCurrentUser } from "@/lib/current-user";
import { isCoreTeamRole } from "@/lib/core-team-roles";
import { parseIstDateTimeLocal } from "@/lib/ist-time";
import { optimizeImage } from "@/lib/media-optimize";

export async function POST(req: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();

    const {
      title,
      destination,
      trailType,
      difficulty,
      altitude,
      duration,
      distance,
      trekDay,
      date,
      price,
      installments,
      initialPayment,
      secondPayment,
      finalPayment,
      seats,
      description,
      coverImage,

      // NEW
      registrationOpensAt,
      registrationClosesAt,

      // Portfolio Automation
      distanceKm,
      altitudeMeters,
      campNights,
      countsAsPeak,

      // Map Location
      latitude,
      longitude,

      // Test Mode
      isTest,
      testVisibleToUserIds,

      // Registration Eligibility
      restrictedYears,

      // College Reimbursement
      reimbursementOffered,

      // Transport
      transportIncluded,
    } = body;

    const installmentCount = Number(installments) === 1 ? 1 : Number(installments) === 3 ? 3 : 2;

    if (
      !title ||
      !destination ||
      !trailType ||
      !difficulty ||
      !altitude ||
      !duration ||
      !distance ||
      !trekDay ||
      !date ||
      !price ||
      !initialPayment ||
      (installmentCount >= 2 && !finalPayment) ||
      (installmentCount === 3 && !secondPayment) ||
      !seats ||
      !description
    ) {
      return NextResponse.json(
        {
          message: "Please fill all fields.",
        },
        {
          status: 400,
        }
      );
    }

    const trek = await prisma.trek.create({
      data: {
        title,
        destination,
        trailType,
        difficulty,
        altitude,
        duration,
        distance,
        trekDay,

        date: new Date(date),

        price: Number(price),

        installments: installmentCount,

        initialPayment: Number(initialPayment),

        secondPayment: installmentCount === 3 ? Number(secondPayment) : 0,

        finalPayment: installmentCount === 1 ? 0 : Number(finalPayment),

        seats: Number(seats),

        description,

        coverImage: coverImage || null,

        // -------------------------
        // Registration Control
        // -------------------------

        registrationOpensAt: parseIstDateTimeLocal(registrationOpensAt),

        registrationClosesAt: parseIstDateTimeLocal(registrationClosesAt),

        registrationOpenedManually: false,

        registrationClosedManually: false,

        // Written explicitly (not left implicit/absent) so the "registration
        // just opened" piggyback check's Mongo equality filter can match this
        // trek later — an omitted optional field isn't the same as one
        // explicitly set to null for Prisma's Mongo query translation.
        registrationOpenNotifiedAt: null,

        // -------------------------
        // Portfolio Automation
        // -------------------------

        distanceKm: distanceKm !== undefined ? Number(distanceKm) : 0,

        altitudeMeters: altitudeMeters !== undefined ? Number(altitudeMeters) : 0,

        campNights: campNights !== undefined ? Number(campNights) : 0,

        countsAsPeak: countsAsPeak !== undefined ? Boolean(countsAsPeak) : true,

        // -------------------------
        // Map Location
        // -------------------------

        latitude: latitude !== undefined && latitude !== "" ? Number(latitude) : null,

        longitude: longitude !== undefined && longitude !== "" ? Number(longitude) : null,

        // -------------------------
        // Test Mode
        // -------------------------

        isTest: Boolean(isTest),

        testVisibleToUserIds: isTest && Array.isArray(testVisibleToUserIds) ? testVisibleToUserIds : [],

        // -------------------------
        // Draft Mode
        // -------------------------

        // Always true on creation — never a client-chosen option. Only
        // "Go Live" (src/app/api/admin/treks/go-live) flips this, which is
        // also what sends the "New Trek Announced" email — see the comment
        // on Trek.isDraft in schema.prisma for why creation itself no longer
        // sends it.
        isDraft: true,

        // -------------------------
        // Registration Eligibility
        // -------------------------

        restrictedYears: Array.isArray(restrictedYears) ? restrictedYears : [],

        // -------------------------
        // College Reimbursement
        // -------------------------

        reimbursementOffered: Boolean(reimbursementOffered),

        // -------------------------
        // Transport
        // -------------------------

        transportIncluded: Boolean(transportIncluded),
      },
    });

    return NextResponse.json(
      {
        message: "Trek created successfully!",
        trek,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const season = searchParams.get("season");

    // This same route backs both the admin trek list and the public
    // homepage/treks listing. Only admins get test treks mixed in here
    // (tagged TEST in the UI) — everyone else, including logged-in students
    // whitelisted on a specific test trek, must never see it in a general
    // listing. Whitelisted students only ever see their test trek via their
    // own dashboard/detail page, never here.
    const user = await getCurrentUser();
    const isAdmin = user?.role === "admin";

    // Draft treks/workshops are visible here to admins and core team alike
    // (see the comment on Trek.isDraft in schema.prisma) — unlike isTest,
    // which only ever bypasses for admins/whitelisted users, this is a
    // deliberately wider "heads and core team" audience so they can preview
    // a trek and grab its link/QR before Go Live.
    const isCoreTeamMember = !!user && isCoreTeamRole(user.clubRole);

    // Historical/archived treks are opt-in only (?season=2025-26) — every
    // existing consumer of this route (public trek browsing, admin trek
    // list, announcement/portfolio pickers) should keep seeing only current
    // treks by default, the same as before this field existed.
    const treks = await prisma.trek.findMany({
      where: {
        ...(season ? { isHistorical: true, season } : { isHistorical: false }),
        // See the comment on the same filter in src/data/treks.ts — every
        // form of this filter requires the field to actually be stored on
        // the document, so anything writing a Trek outside the app's own
        // create/edit routes must set isTest itself.
        ...(isAdmin ? {} : { isTest: false }),
        ...(isAdmin || isCoreTeamMember ? {} : { isDraft: false }),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      treks.map((trek) => ({ ...trek, coverImage: optimizeImage(trek.coverImage) }))
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to fetch treks.",
      },
      {
        status: 500,
      }
    );
  }
}