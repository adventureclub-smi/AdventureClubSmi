import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { parseIstDateTimeLocal } from "@/lib/ist-time";

// Separate from /api/treks/[id]'s PUT — that one's field set (trailType,
// difficulty, altitude, installments, etc.) is trek-specific and doesn't
// apply to a workshop, matching the same split already used for creation
// (/api/treks vs /api/workshops). GET/DELETE stay on the generic trek
// routes since reading and deleting are already type-agnostic there.
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
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
      registrationOpensAt,
      registrationClosesAt,
      isFree,
      price,
      isTest,
      testVisibleToUserIds,
      reimbursementOffered,
      activityType,
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

    const workshop = await prisma.trek.update({
      where: { id },
      data: {
        activityType: activityType === "SESSION" ? "SESSION" : "WORKSHOP",

        title,
        destination: place,
        time: time || null,
        duration,

        date: new Date(date),

        price: amount,
        initialPayment: amount,

        seats: Number(seats),
        description,

        ...(coverImage ? { coverImage } : {}),

        registrationOpensAt: parseIstDateTimeLocal(registrationOpensAt),
        registrationClosesAt: parseIstDateTimeLocal(registrationClosesAt),

        isTest: Boolean(isTest),
        testVisibleToUserIds: isTest && Array.isArray(testVisibleToUserIds) ? testVisibleToUserIds : [],

        reimbursementOffered: Boolean(reimbursementOffered),
      },
    });

    return NextResponse.json({
      message: "Workshop updated successfully!",
      trek: workshop,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to update workshop." },
      { status: 500 }
    );
  }
}
