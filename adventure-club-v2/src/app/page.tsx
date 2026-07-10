import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/hero/Hero";
import AdventureStats from "@/components/sections/AdventureStats";
import ThingsWeDo from "@/components/sections/ThingsWeDo";
import ClubVibeCheck from "@/components/sections/ClubVibeCheck";
import UpcomingTreks from "@/components/sections/UpcomingTreks";
import TrekRoute3D from "@/components/sections/TrekRoute3D";
import TrekMap from "@/components/sections/TrekMap";
import GoogleEarthExplorer from "@/components/sections/GoogleEarthExplorer";
import Gallery from "@/components/sections/Gallery";
import Stories from "@/components/sections/Stories";
import FinalCTA from "@/components/sections/FinalCTA";
import InstagramFeed from "@/components/sections/InstagramFeed";
import Footer from "@/components/layout/Footer";
import SmoothScroll from "@/components/layout/SmoothScroll";
import { getHomepageContent } from "@/data/homepage-content";
import { getUpcomingTreks, getTrekMapPins, getUpcomingTrekRoutes } from "@/data/treks";
import { getSongs } from "@/data/songs";
import { getInstagramPosts } from "@/data/instagram";

// Trek listings and the music playlist can change any time from the admin
// panel (a trek being marked completed, a song added/removed), so this can't
// be fully static — but force-dynamic meant every single visitor triggered a
// fresh server render and live database round-trip with no caching at all,
// which is exactly the request shape most exposed to a slow cold start.
// ISR serves the cached page instantly and only re-renders in the
// background at most once every 30s, so admin changes still show up
// quickly without every visitor paying for a live query. This only works
// because nothing left in this page's own render path is per-visitor
// anymore — "my registration status" (genuinely personal, cookie-derived)
// is fetched client-side by UpcomingTreks instead of baked in here, where
// it would otherwise get cached and shown to every visitor alike.
export const revalidate = 30;

export default async function Home() {
  const [content, treks, songs, instagramPosts, mapPins, trekRoutes] = await Promise.all([
    getHomepageContent(),
    getUpcomingTreks(),
    getSongs(),
    getInstagramPosts(),
    getTrekMapPins(),
    getUpcomingTrekRoutes(),
  ]);

  return (
    <SmoothScroll>
      <Navbar />
      <Hero
        content={content.hero}
        nextTrekDate={treks[0]?.date ?? null}
        nextTrekId={treks[0]?.id ?? null}
        nextTrekRegistrationOpensAt={treks[0]?.registrationOpensAt ?? null}
      />
      <AdventureStats stats={content.stats} />
      <ThingsWeDo activities={content.activities} />
      <ClubVibeCheck songs={songs} />
      <UpcomingTreks
        treks={treks}
        config={content.upcomingTreks}
      />
      {trekRoutes.length > 0 && <TrekRoute3D routes={trekRoutes} />}
      <TrekMap pins={mapPins} />
      <GoogleEarthExplorer
        earthUrl={content.googleEarth.earthUrl}
        trailStats={content.googleEarth.trailStats}
      />
      <Gallery items={content.gallery} />
      <Stories stories={content.stories} />
      <FinalCTA content={content.finalSection} />
      <InstagramFeed posts={instagramPosts} />
      <Footer socials={content.socials} />
    </SmoothScroll>
  );
}
