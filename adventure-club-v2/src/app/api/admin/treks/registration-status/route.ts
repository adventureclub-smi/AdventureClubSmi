import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { trekId, action } = await req.json();

    if (!trekId || !["open", "close", "auto"].includes(action)) {
      return NextResponse.json(
        {
          message:
            "trekId and a valid action ('open', 'close', or 'auto') are required.",
        },
        { status: 400 }
      );
    }

    // These two flags take precedence over registrationOpensAt/registrationClosesAt
    // in registrationStateFor() — forcing one true and the other false makes the
    // override unconditional, regardless of the countdown dates. "auto" clears
    // both, handing control back to the countdown dates (the default for any
    // newly created trek).
    const data =
      action === "open"
        ? { registrationOpenedManually: true, registrationClosedManually: false }
        : action === "close"
        ? { registrationClosedManually: true, registrationOpenedManually: false }
        : { registrationOpenedManually: false, registrationClosedManually: false };

    const trek = await prisma.trek.update({ where: { id: trekId }, data });

    const message =
      action === "open"
        ? "Registrations opened."
        : action === "close"
        ? "Registrations closed."
        : "Now following the registration countdown.";

    return NextResponse.json({ message, trek });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to update registration status." },
      { status: 500 }
    );
  }
}
