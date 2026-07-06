import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(req: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);

    const trekId = searchParams.get("trekId");

    if (!trekId) {
      return NextResponse.json([]);
    }

    const registrations = await prisma.registration.findMany({
      where: {
        trekId,
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(registrations);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to fetch registrations.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          message: "Please login first.",
        },
        {
          status: 401,
        }
      );
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        {
          message: "Invalid session.",
        },
        {
          status: 401,
        }
      );
    }

    const { trekId } = await req.json();

    const user = await prisma.user.findUnique({
      where: {
        id: payload.id,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          message: "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    const trek = await prisma.trek.findUnique({
      where: {
        id: trekId,
      },
    });

    if (!trek) {
      return NextResponse.json(
        {
          message: "Trek not found.",
        },
        {
          status: 404,
        }
      );
    }

    // This is the real "already registered" check — the only unique
    // constraint on Registration is registrationNumber, so a caught
    // P2002 below is never actually about this trek/user pair.
    const existing = await prisma.registration.findFirst({
      where: { trekId, userId: user.id },
    });

    if (existing) {
      return NextResponse.json(
        {
          message: "Already registered.",
        },
        {
          status: 400,
        }
      );
    }

    let registration = null;

    // registrationNumber is derived from the highest number already in use
    // this year (not a raw count, which "rewinds" once any registration is
    // deleted and would then collide with an existing, unrelated record).
    // Retry a few times in the rare case of a concurrent collision.
    for (let attempt = 0; attempt < 3 && !registration; attempt++) {
      const year = new Date().getFullYear();
      const prefix = `REG${year}-`;

      const last = await prisma.registration.findFirst({
        where: { registrationNumber: { startsWith: prefix } },
        orderBy: { registrationNumber: "desc" },
      });

      const lastSeq = last
        ? parseInt(last.registrationNumber.slice(prefix.length), 10) || 0
        : 0;

      const registrationNumber = `${prefix}${String(lastSeq + 1).padStart(4, "0")}`;

      try {
        registration = await prisma.registration.create({
          data: {
            registrationNumber,
            trekId,
            userId: user.id,
          },
        });
      } catch (err) {
        const isDuplicateNumber =
          err instanceof Error &&
          "code" in err &&
          (err as { code?: string }).code === "P2002";

        if (!isDuplicateNumber || attempt === 2) throw err;
      }
    }

    return NextResponse.json({
      message: "Registration successful!",
      registration,
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