import { prisma } from "@/lib/prisma";
import type { SocialLinks } from "@/types/homepage";

export async function getSocialSettings(): Promise<SocialLinks> {
  const settings = await prisma.socialSettings.findFirst();

  return {
    instagram: settings?.instagram || undefined,
    linkedin: settings?.linkedin || undefined,
    email: settings?.email || undefined,
    phone: settings?.phone || undefined,
  };
}
