import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      registrationId: string;
    }>;
  }
) {
  try {
    const { registrationId } =
      await params;

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
          message:
            "Registration not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      registration
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          "Failed to load payment details.",
      },
      {
        status: 500,
      }
    );
  }
}