import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GalleryPageHero from "@/components/gallery/GalleryPageHero";
import GalleryMasonryGrid from "@/components/gallery/GalleryMasonryGrid";
import TripPoll from "@/components/gallery/TripPoll";
import { getGalleryPhotos } from "@/data/gallery-photos";
import { getGalleryHeroSettings } from "@/data/gallery-hero";
import { getHomepageContent } from "@/data/homepage-content";

// Same reasoning as the homepage/tribe page — photos and the hero banner
// can change any time from the admin panel, so ISR instead of
// force-dynamic gives every visitor an instant cached response instead of
// a live database round-trip, while still picking up admin edits quickly.
export const revalidate = 30;

export default async function GalleryPage() {
  const [photos, heroContent, homepageContent] = await Promise.all([
    getGalleryPhotos(),
    getGalleryHeroSettings(),
    getHomepageContent(),
  ]);

  return (
    <>
      <Navbar />
      <TripPoll />
      <GalleryPageHero content={heroContent} />
      <GalleryMasonryGrid photos={photos} />
      <Footer socials={homepageContent.socials} />
    </>
  );
}
