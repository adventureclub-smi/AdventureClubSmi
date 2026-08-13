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

    if (!trekId || !["open", "close", "auto", "core"].includes(action)) {
      return NextResponse.json(
        {
          message:
            "trekId and a valid action ('open', 'close', 'auto', or 'core') are required.",
        },
        { status: 400 }
      );
    }

    // These flags take precedence over registrationOpensAt/registrationClosesAt
    // in registrationStateFor() — forcing one true and the others false makes
    // the override unconditional, regardless of the countdown dates. "auto"
    // clears all three, handing control back to the countdown dates (the
    // default for any newly created trek). The four actions behave as one
    // mutually-exclusive mode, matching the four buttons in the admin UI —
    // "core" specifically leaves registrationOpenedManually/
    // registrationClosedManually false so the general state still follows
    // the countdown for everyone else; only a core-team viewer sees it as
    // open (see registrationStateForViewer).
    const data =
      action === "open"
        ? {
            registrationOpenedManually: true,
            registrationClosedManually: false,
            registrationOpenForCoreOnly: false,
          }
        : action === "close"
        ? {
            registrationClosedManually: true,
            registrationOpenedManually: false,
            registrationOpenForCoreOnly: false,
          }
        : action === "core"
        ? {
            registrationOpenForCoreOnly: true,
            registrationOpenedManually: false,
            registrationClosedManually: false,
          }
        : {
            registrationOpenedManually: false,
            registrationClosedManually: false,
            registrationOpenForCoreOnly: false,
          };

    const trek = await prisma.trek.update({ where: { id: trekId }, data });

    const message =
      action === "open"
        ? "Registrations opened."
        : action === "close"
        ? "Registrations closed."
        : action === "core"
        ? "Registrations opened for core team members only."
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
