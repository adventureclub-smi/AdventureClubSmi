import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { notifyWorkshopCreated } from "@/lib/notification-emails";
import { parseIstDateTimeLocal } from "@/lib/ist-time";

export async function POST(req: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();

    const {
      title,
      place,
      time,
      duration,
      date,
      seats,
      description,
      coverImage,
      isFree,
      price,
      registrationOpensAt,
      registrationClosesAt,
    } = body;

    if (
      !title ||
      !place ||
      !duration ||
      !date ||
      !seats ||
      !description ||
      (!isFree && !price)
    ) {
      return NextResponse.json(
        { message: "Please fill all fields." },
        { status: 400 }
      );
    }

    const amount = isFree ? 0 : Number(price);

    const workshop = await prisma.trek.create({
      data: {
        type: "WORKSHOP",

        title,
        destination: place,
        time: time || null,
        duration,

        // Placeholder values — these fields only matter for treks and are
        // never shown for a workshop (see the `type === "WORKSHOP"` checks
        // in TrekDetails/TrekTile/FeaturedTrekCard), but the schema still
        // requires *some* string since they're shared with the Trek model.
        trailType: "Workshop",
        difficulty: "N/A",
        altitude: "N/A",
        distance: "N/A",
        trekDay: "N/A",

        date: new Date(date),

        price: amount,
        installments: 1,
        initialPayment: amount,
        finalPayment: 0,

        seats: Number(seats),
        description,
        coverImage: coverImage || null,

        registrationOpensAt: parseIstDateTimeLocal(registrationOpensAt),
        registrationClosesAt: parseIstDateTimeLocal(registrationClosesAt),
        registrationOpenedManually: false,
        registrationClosedManually: false,
        registrationOpenNotifiedAt: null,

        distanceKm: 0,
        altitudeMeters: 0,
        campNights: 0,
        countsAsPeak: false,
      },
    });

    after(async () => {
      try {
        await notifyWorkshopCreated(workshop);
      } catch (emailError) {
        console.error("Failed to send workshop-created emails:", emailError);
      }
    });

    return NextResponse.json(
      { message: "Workshop created successfully!", trek: workshop },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Something went wrong." },
      { status: 500 }
    );
  }
}
