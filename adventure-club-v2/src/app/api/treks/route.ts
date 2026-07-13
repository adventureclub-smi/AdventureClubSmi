import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { notifyTrekCreated } from "@/lib/notification-emails";
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

      // Map Location
      latitude,
      longitude,
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
      },
    });

    try {
      await notifyTrekCreated(trek);
    } catch (emailError) {
      console.error("Failed to send trek-created emails:", emailError);
    }

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