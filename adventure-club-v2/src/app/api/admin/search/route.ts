import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

type SearchResult = {
  id: string;
  label: string;
  sublabel: string;
  href: string;
};

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const q = req.nextUrl.searchParams.get("q")?.trim() || "";

    if (!q) {
      return NextResponse.json({
        students: [],
        treks: [],
        registrations: [],
        announcements: [],
      });
    }

    const [users, treks, registrations, announcements] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { clubId: { contains: q, mode: "insensitive" } },
            { phoneNumber: { contains: q } },
          ],
        },
        take: 6,
      }),

      prisma.trek.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { destination: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 6,
      }),

      prisma.registration.findMany({
        where: {
          OR: [
            { registrationNumber: { contains: q, mode: "insensitive" } },
            { guestName: { contains: q, mode: "insensitive" } },
          ],
        },
        include: { user: true, trek: true },
        take: 6,
      }),

      prisma.tripAnnouncement.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { message: { contains: q, mode: "insensitive" } },
          ],
        },
        include: { trek: true },
        take: 6,
      }),
    ]);

    const results: {
      students: SearchResult[];
      treks: SearchResult[];
      registrations: SearchResult[];
      announcements: SearchResult[];
    } = {
      students: users.map((u) => ({
        id: u.id,
        label: u.fullName,
        sublabel: u.clubId,
        href: `/admin/members/${u.id}`,
      })),

      treks: treks.map((t) => ({
        id: t.id,
        label: t.title,
        sublabel: t.destination,
        href: `/admin/treks/${t.id}`,
      })),

      registrations: registrations.map((r) => ({
        id: r.id,
        label: r.user?.fullName || r.guestName || r.registrationNumber,
        sublabel: r.trek.title,
        href: `/admin/treks/${r.trekId}/registrations`,
      })),

      announcements: announcements.map((a) => ({
        id: a.id,
        label: a.title,
        sublabel: a.trek.title,
        href: `/admin/treks/${a.trekId}/trip-centre`,
      })),
    };

    return NextResponse.json(results);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Search failed." },
      { status: 500 }
    );
  }
}
