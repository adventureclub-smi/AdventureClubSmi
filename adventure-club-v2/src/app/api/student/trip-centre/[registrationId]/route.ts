import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ registrationId: string }>;
  }
) {
  try {
    const { registrationId } = await params;

    const cookieStore = await cookies();

    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { message: "Invalid Session" },
        { status: 401 }
      );
    }

    const registration =
      await prisma.registration.findUnique({
        where: {
          id: registrationId,
        },

        include: {
          trek: true,
          user: true,
        },
      });

    if (!registration) {
      return NextResponse.json(
        {
          message: "Registration not found",
        },
        {
          status: 404,
        }
      );
    }

    // Security check
    if (
      registration.userId !== payload.id
    ) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        {
          status: 403,
        }
      );
    }

    // Trip Centre not published
    if (
      !registration.trek.tripCentrePublished
    ) {
      return NextResponse.json(
        {
          message:
            "Trip Centre not launched yet.",
        },
        {
          status: 403,
        }
      );
    }

    return NextResponse.json(
      registration
    );
  } catch (err) {
    console.error(err);

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