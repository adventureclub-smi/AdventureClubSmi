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
    select: { clubRole: true, clubId: true },
  });

  if (!existing) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  // Club IDs are "AC{yearCode}-{number}" — the prefix marks the student's
  // signup year and must never move, so only the number after the last dash
  // is ever accepted from the client, regardless of what full string it
  // sends.
  let nextClubId: string | undefined;

  if (typeof body.clubId === "string") {
    const dashIndex = existing.clubId.lastIndexOf("-");
    const prefix = dashIndex === -1 ? "" : existing.clubId.slice(0, dashIndex + 1);

    if (!body.clubId.startsWith(prefix)) {
      return NextResponse.json(
        { message: `Club ID must keep the "${prefix}" prefix.` },
        { status: 400 }
      );
    }

    const suffix = body.clubId.slice(prefix.length).trim();

    if (!/^\d+$/.test(suffix)) {
      return NextResponse.json(
        { message: "The part after the dash must be numbers only." },
        { status: 400 }
      );
    }

    nextClubId = `${prefix}${suffix.padStart(4, "0")}`;

    if (nextClubId !== existing.clubId) {
      const conflict = await prisma.user.findFirst({
        where: { clubId: nextClubId, NOT: { id } },
        select: { id: true },
      });

      if (conflict) {
        return NextResponse.json(
          { message: `Club ID ${nextClubId} is already in use.` },
          { status: 400 }
        );
      }
    }
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
    clubId?: string;
  } = {
    membershipStatus: body.membershipStatus,
    clubRole: body.clubRole,
  };

  if (nextAccessLevel !== undefined) {
    data.adminAccessLevel = nextAccessLevel;
    data.role = nextAccessLevel === "NONE" ? "member" : "admin";
  }

  if (nextClubId !== undefined) {
    data.clubId = nextClubId;
  }

  const user = await prisma.user.update({
    where: {
      id,
    },
    data,
  });

  return NextResponse.json(user);
}

export async function DELETE(
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

  if (id === admin.id) {
    return NextResponse.json(
      { message: "You cannot delete your own account." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json({ message: "Student not found." }, { status: 404 });
  }

  try {
    const registrations = await prisma.registration.findMany({
      where: { userId: id },
      select: { id: true },
    });
    const registrationIds = registrations.map((r) => r.id);

    await prisma.$transaction([
      prisma.payment.deleteMany({ where: { registrationId: { in: registrationIds } } }),
      prisma.refund.deleteMany({ where: { registrationId: { in: registrationIds } } }),
      prisma.attendance.deleteMany({ where: { registrationId: { in: registrationIds } } }),
      prisma.emergencyContact.deleteMany({ where: { registrationId: { in: registrationIds } } }),
      prisma.certificate.deleteMany({ where: { registrationId: { in: registrationIds } } }),
      prisma.registration.deleteMany({ where: { userId: id } }),
      prisma.tripPollVote.deleteMany({ where: { userId: id } }),
      prisma.passwordResetToken.deleteMany({ where: { userId: id } }),
      prisma.trekNotifyRequest.deleteMany({ where: { userId: id } }),
      // Contact submissions are support history, not the student's own
      // records — keep the message/reply, just detach it from the account
      // being removed (userId is nullable specifically for this / guest
      // submissions).
      prisma.contactSubmission.updateMany({
        where: { userId: id },
        data: { userId: null },
      }),
      prisma.user.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: "Student removed." });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to delete student." },
      { status: 500 }
    );
  }
}
