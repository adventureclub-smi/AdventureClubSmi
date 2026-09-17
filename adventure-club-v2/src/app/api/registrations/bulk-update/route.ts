import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { updateRegistrationStatus } from "@/lib/registration-status";

// Approving 20-30 registrations one at a time (open drawer, pick deadline,
// save, close, repeat) was the actual bottleneck this replaces — same
// updateRegistrationStatus() the single-registration route uses, just run
// across every selected id so the deadline/free-trek/email behavior can
// never drift between the two.
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { ids, status, paymentDays } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0 || !status) {
      return NextResponse.json(
        { message: "ids and status are required." },
        { status: 400 }
      );
    }

    const results = await Promise.allSettled(
      ids.map((id: string) => updateRegistrationStatus(id, { status, paymentDays }))
    );

    const updated = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      message: `Updated ${updated} of ${ids.length} registration${ids.length === 1 ? "" : "s"}${
        failed > 0 ? ` (${failed} failed).` : "."
      }`,
      updated,
      failed,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to update registrations." },
      { status: 500 }
    );
  }
}
