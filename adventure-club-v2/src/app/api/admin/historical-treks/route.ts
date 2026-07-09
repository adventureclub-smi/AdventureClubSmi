import { NextResponse } from "next/server";
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
      difficulty,
      duration,
      date,
      season,
      price,
      initialPayment,
      finalPayment,
      seats,
      description,
    } = body;

    if (
      !title ||
      !destination ||
      !difficulty ||
      !duration ||
      !date ||
      !season ||
      !price ||
      !initialPayment ||
      !finalPayment
    ) {
      return NextResponse.json(
        { message: "Please fill all required fields." },
        { status: 400 }
      );
    }

    const trekDate = new Date(date);

    const trek = await prisma.trek.create({
      data: {
        title,
        destination,
        difficulty,
        duration,

        // These fields aren't meaningful for an already-completed trek
        // being backfilled from old records, but the shared Trek model
        // requires them.
        trailType: "N/A",
        altitude: "N/A",
        distance: "N/A",
        trekDay: trekDate.toLocaleDateString("en-US", { weekday: "long" }),

        date: trekDate,

        price: Number(price),
        initialPayment: Number(initialPayment),
        finalPayment: Number(finalPayment),

        seats: Number(seats) || 0,

        description:
          description || `Historical trek record imported from the ${season} season archive.`,

        isHistorical: true,
        season,
      },
    });

    return NextResponse.json(
      { message: "Historical trek created.", trek },
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
