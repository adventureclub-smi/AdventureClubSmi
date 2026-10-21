import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

// Members-only directory — any logged-in account can search, but this is
// deliberately NOT the admin member-search route: no phone/institution/
// department/email here, just enough to recognize someone (name, photo,
// club role). Unauthenticated requests get the same 401 as any other
// logged-out dashboard page.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const query = req.nextUrl.searchParams.get("query")?.trim() || "";

    const members = await prisma.user.findMany({
      where: {
        membershipStatus: "ACTIVE",
        ...(query ? { fullName: { contains: query, mode: "insensitive" } } : {}),
      },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        clubRole: true,
        registrations: {
          where: { attendanceMarked: true },
          select: { id: true },
        },
      },
      orderBy: { fullName: "asc" },
      take: query ? 20 : 200,
    });

    // With no search yet, lead with the members who've actually shown up to
    // treks (most-attended first) rather than an arbitrary alphabetical list
    // — a typed query is a direct name lookup, so it stays alphabetical.
    const withTrekCount = members.map(({ registrations, ...member }) => ({
      ...member,
      trekCount: registrations.length,
    }));

    if (!query) {
      withTrekCount.sort((a, b) => b.trekCount - a.trekCount || a.fullName.localeCompare(b.fullName));
    }

    return NextResponse.json(query ? withTrekCount : withTrekCount.slice(0, 8));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Search failed." },
      { status: 500 }
    );
  }
}
