import { prisma } from "@/lib/prisma";

export type TribeBackground = {
  mediaUrl: string | null;
  mediaType: "IMAGE" | "VIDEO" | null;
};

export async function getTribeBackground(): Promise<TribeBackground> {
  const settings = await prisma.tribeBackgroundSettings.findFirst();

  return {
    mediaUrl: settings?.mediaUrl || null,
    mediaType: (settings?.mediaType as "IMAGE" | "VIDEO" | null) || null,
  };
}
