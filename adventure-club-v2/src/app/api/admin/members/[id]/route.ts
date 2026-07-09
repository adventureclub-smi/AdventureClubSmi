import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { clubRoleBucket } from "@/lib/core-team-roles";

const VALID_ACCESS_LEVELS = new Set(["NONE", "FULL", "FINANCE", "VISUAL", "BOOKING"]);

const ACCESS_LEVEL_BY_BUCKET = {
  ELEVATED: "FULL",
  CORE: "CORE",
  NONE: "NONE",
} as const;

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

  // Club Role drives automatic admin-access changes: crossing between the
  // Elevated (President/Treasurer/Event Head/Logistics Head/Admin), plain
  // Core (Guides, Marketing Head, etc.), and None (Member/Participant)
  // buckets grants/revokes access automatically — this always applies
  // regardless of who's saving, since any admin who can reach this page is
  // allowed to set club roles. Moving between two roles in the same bucket
  // (or no clubRole change at all) leaves access untouched, falling through
  // to the manual Access-dropdown path below instead.
  const oldBucket = clubRoleBucket(existing.clubRole);
  const newBucket = clubRoleBucket(body.clubRole);

  let nextAccessLevel: string | undefined;

  if (oldBucket !== newBucket) {
    nextAccessLevel = ACCESS_LEVEL_BY_BUCKET[newBucket];
  } else {
    // No club-role-driven transition — only Admin/President/Treasurer may
    // set the Access dropdown manually. Anyone else's requested value is
    // dropped silently rather than trusted from the client.
    const canEditAccess =
      admin.clubRole === "Admin" ||
      admin.clubRole === "President" ||
      admin.clubRole === "Treasurer";

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
