import { prisma } from "@/lib/prisma";

// Returns null whenever there's nothing to show — turned off, never set, or
// left blank — so callers can just do `{announcement && <Banner/>}` instead
// of re-checking isActive/emptiness themselves everywhere.
export async function getHomepageAnnouncement(): Promise<string | null> {
  const announcement = await prisma.homepageAnnouncement.findFirst();

  if (!announcement || !announcement.isActive || !announcement.message.trim()) {
    return null;
  }

  return announcement.message;
}
