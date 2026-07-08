import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

const ELEVATED_CLUB_ROLES = new Set([
  "President",
  "Treasurer",
  "Event Head",
  "Logistics Head",
]);

const VALID_ACCESS_LEVELS = new Set(["NONE", "FULL", "FINANCE", "VISUAL", "BOOKING"]);

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    include: {
      registrations: {
        include: {
          trek: true,
        },
      },
    },
  });

  return NextResponse.json(user);
}

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const body = await req.json();

  const existing = await prisma.user.findUnique({
    where: { id },
    select: { clubRole: true },
  });

  if (!existing) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  // Club Role drives automatic admin-access changes: stepping into one of
  // the four leadership roles grants Full access, stepping back out revokes
  // it — this always applies regardless of who's saving, since any admin who
  // can reach this page is allowed to set club roles.
  const wasElevated = ELEVATED_CLUB_ROLES.has(existing.clubRole);
  const willBeElevated = ELEVATED_CLUB_ROLES.has(body.clubRole);

  let nextAccessLevel: string | undefined;

  if (!wasElevated && willBeElevated) {
    nextAccessLevel = "FULL";
  } else if (wasElevated && !willBeElevated) {
    nextAccessLevel = "NONE";
  } else {
    // No club-role-driven transition — only President/Treasurer may set the
    // Access dropdown manually. Anyone else's requested value is dropped
    // silently rather than trusted from the client.
    const canEditAccess = admin.clubRole === "President" || admin.clubRole === "Treasurer";

    if (canEditAccess && VALID_ACCESS_LEVELS.has(body.adminAccessLevel)) {
      nextAccessLevel = body.adminAccessLevel;
    }
  }

  const data: {
    membershipStatus: string;
    clubRole: string;
    adminAccessLevel?: string;
    role?: string;
  } = {
    membershipStatus: body.membershipStatus,
    clubRole: body.clubRole,
  };

  if (nextAccessLevel !== undefined) {
    data.adminAccessLevel = nextAccessLevel;
    data.role = nextAccessLevel === "NONE" ? "member" : "admin";
  }

  const user = await prisma.user.update({
    where: {
      id,
    },
    data,
  });

  return NextResponse.json(user);
}
