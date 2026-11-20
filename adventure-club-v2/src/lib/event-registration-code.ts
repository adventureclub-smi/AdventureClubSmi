import { prisma } from "@/lib/prisma";
import type { Prisma, EventRegistration } from "@prisma/client";

// Shared by both paths that create an EventRegistration (the student
// self-signup route and the admin's manual add) so numbering can't drift
// between them. Scoped per event (not global like Registration's own
// registrationNumber) — every event starts back at "01". Computed from the
// actual rows rather than a stored counter, so a small per-event dataset is
// read and maxed in JS instead of relying on a DB-level sort that would
// sort "10" before "9" as plain strings. Retries a few times in the rare
// case of a concurrent collision on the unique [trekId, shortCode] index.
export async function createEventRegistrationWithCode(
  data: Omit<Prisma.EventRegistrationUncheckedCreateInput, "shortCode">
): Promise<EventRegistration> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const existing = await prisma.eventRegistration.findMany({
      where: { trekId: data.trekId as string },
      select: { shortCode: true },
    });

    const maxCode = existing.reduce(
      (max, r) => Math.max(max, parseInt(r.shortCode, 10) || 0),
      0
    );
    const shortCode = String(maxCode + 1).padStart(2, "0");

    try {
      return await prisma.eventRegistration.create({
        data: { ...data, shortCode },
      });
    } catch (err) {
      const isDuplicateCode =
        err instanceof Error &&
        "code" in err &&
        (err as { code?: string }).code === "P2002";

      if (!isDuplicateCode || attempt === 2) throw err;
    }
  }

  throw new Error("Failed to generate a unique registration code.");
}
