import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

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
      initialPayment,
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
    } = body;

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
      !finalPayment ||
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

        initialPayment: Number(initialPayment),

        finalPayment: Number(finalPayment),

        seats: Number(seats),

        description,

        coverImage: coverImage || null,

        // -------------------------
        // Registration Control
        // -------------------------

        registrationOpensAt: registrationOpensAt
          ? new Date(registrationOpensAt)
          : null,

        registrationClosesAt: registrationClosesAt
          ? new Date(registrationClosesAt)
          : null,

        registrationOpenedManually: false,

        registrationClosedManually: false,

        // -------------------------
        // Portfolio Automation
        // -------------------------

        distanceKm: distanceKm !== undefined ? Number(distanceKm) : 0,

        altitudeMeters: altitudeMeters !== undefined ? Number(altitudeMeters) : 0,

        campNights: campNights !== undefined ? Number(campNights) : 0,

        countsAsPeak: countsAsPeak !== undefined ? Boolean(countsAsPeak) : true,
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

    // Historical/archived treks are opt-in only (?season=2025-26) — every
    // existing consumer of this route (public trek browsing, admin trek
    // list, announcement/portfolio pickers) should keep seeing only current
    // treks by default, the same as before this field existed.
    const treks = await prisma.trek.findMany({
      where: season ? { isHistorical: true, season } : { isHistorical: false },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(treks);
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