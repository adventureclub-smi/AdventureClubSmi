import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/hero/Hero";
import AdventureStats from "@/components/sections/AdventureStats";
import ThingsWeDo from "@/components/sections/ThingsWeDo";
import ClubVibeCheck from "@/components/sections/ClubVibeCheck";
import UpcomingTreks from "@/components/sections/UpcomingTreks";
import Gallery from "@/components/sections/Gallery";
import Stories from "@/components/sections/Stories";
import FinalCTA from "@/components/sections/FinalCTA";
import InstagramFeed from "@/components/sections/InstagramFeed";
import Footer from "@/components/layout/Footer";
import SmoothScroll from "@/components/layout/SmoothScroll";
import { getHomepageContent } from "@/data/homepage-content";
import { getUpcomingTreks, getMyRegistrationsForHomepage } from "@/data/treks";
import { getSongs } from "@/data/songs";
import { getInstagramPosts } from "@/data/instagram";

// Trek listings and the music playlist can change any time from the admin
// panel (a trek being marked completed, a song added/removed) — this page
// has no dynamic API calls of its own, so Next.js would otherwise treat it
// as static and cache it client-side for minutes at a time.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [content, treks, songs, instagramPosts, myRegistrations] = await Promise.all([
    getHomepageContent(),
    getUpcomingTreks(),
    getSongs(),
    getInstagramPosts(),
    getMyRegistrationsForHomepage(),
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
        myRegistrations={myRegistrations}
      />
      <Gallery items={content.gallery} />
      <Stories stories={content.stories} />
      <FinalCTA content={content.finalSection} />
      <InstagramFeed posts={instagramPosts} />
      <Footer socials={content.socials} />
    </SmoothScroll>
  );
}
