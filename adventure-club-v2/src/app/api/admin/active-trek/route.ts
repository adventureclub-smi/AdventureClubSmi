import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { optimizeImage } from "@/lib/media-optimize";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const trek = await prisma.trek.findFirst({
      where: {
        date: {
          gte: new Date(),
        },
      },
      orderBy: {
        date: "asc",
      },
      include: {
        registrations: true,
      },
    });

    if (!trek) {
      return NextResponse.json(null);
    }

    const registered = trek.registrations.length;

    const approved = trek.registrations.filter(
      (r) => r.status === "APPROVED"
    ).length;

    const initialPaid = trek.registrations.filter(
      (r) => r.initialPaymentPaid
    ).length;

    const bondForms = trek.registrations.filter(
      (r) => r.bondFormSubmitted
    ).length;

    const attendance = trek.registrations.filter(
      (r) => r.attendanceMarked
    ).length;

    return NextResponse.json({
      id: trek.id,
      title: trek.title,
      destination: trek.destination,
      date: trek.date,
      coverImage: optimizeImage(trek.coverImage),

      registered,
      approved,
      initialPaid,
      bondForms,
      attendance,
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