import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { optimizeImage } from "@/lib/media-optimize";

// Every trek the club has ever run/planned — this season and archived
// seasons alike (StudentTreks groups these by `isHistorical`/`season` into
// its year tabs) — cross-referenced against this student's own
// registrations. Unlike /api/my-registrations, a trek the student never
// signed up for still shows here, so it reads as "Didn't Attend" instead of
// silently not existing for them.
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

    const [treks, registrations] = await Promise.all([
      prisma.trek.findMany({
        orderBy: { date: "asc" },
      }),
      prisma.registration.findMany({
        where: { userId: payload.id },
      }),
    ]);

    const registrationByTrekId = new Map(
      registrations.map((registration) => [registration.trekId, registration])
    );

    const entries = treks.map((trek) => ({
      trek: { ...trek, coverImage: optimizeImage(trek.coverImage) },
      registration: registrationByTrekId.get(trek.id) || null,
    }));

    return NextResponse.json({ entries });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
