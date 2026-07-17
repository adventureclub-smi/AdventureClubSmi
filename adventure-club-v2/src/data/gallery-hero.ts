import { prisma } from "@/lib/prisma";
import type { GalleryHeroContent } from "@/types/homepage";
import { optimizeImage } from "@/lib/media-optimize";

const DEFAULT_HERO: GalleryHeroContent = {
  imageUrl: "/images/about/about-4.jpg",
  heading: "Moments From Every Adventure.",
  subtitle:
    "Every trek leaves behind more than memories — it leaves a trail of photos. This is ours.",
  buttonText: "Join Adventure Club",
  buttonLink: "/signup",
};

export async function getGalleryHeroSettings(): Promise<GalleryHeroContent> {
  const settings = await prisma.galleryHeroSettings.findFirst();

  if (!settings) return DEFAULT_HERO;

  return {
    imageUrl: optimizeImage(settings.imageUrl),
    heading: settings.heading,
    subtitle: settings.subtitle,
    buttonText: settings.buttonText || undefined,
    buttonLink: settings.buttonLink || undefined,
  };
}
