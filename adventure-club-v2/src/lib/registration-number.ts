import { prisma } from "@/lib/prisma";
import type { Prisma, Registration } from "@prisma/client";

// Shared by every path that creates a Registration (the student self-signup
// route, admin's AddParticipantModal add, and the guest-signup route) so
// numbering can't drift between them. Derived from the highest number
// already in use this year (not a raw count, which "rewinds" once any
// registration is deleted and would then collide with an existing,
// unrelated record). Retries a few times in the rare case of a concurrent
// collision on the unique registrationNumber.
export async function createRegistrationWithNumber(
  data: Omit<Prisma.RegistrationUncheckedCreateInput, "registrationNumber">
): Promise<Registration> {
  for (let attempt = 0; attempt < 3; attempt++) {
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
      return await prisma.registration.create({
        data: { ...data, registrationNumber },
      });
    } catch (err) {
      const isDuplicateNumber =
        err instanceof Error &&
        "code" in err &&
        (err as { code?: string }).code === "P2002";

      if (!isDuplicateNumber || attempt === 2) throw err;
    }
  }

  throw new Error("Failed to generate a unique registration number.");
}
