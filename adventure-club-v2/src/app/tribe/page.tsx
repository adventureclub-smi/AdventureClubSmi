import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TribeGrid from "@/components/tribe/TribeGrid";
import { getTribeMembers } from "@/data/tribe";
import { getHomepageContent } from "@/data/homepage-content";
import { getTribeBackground } from "@/data/tribe-background";

// The roster can change any time from the admin panel — same reasoning and
// same fix as the homepage: ISR instead of force-dynamic, so most visitors
// get an instant cached response instead of every single one triggering a
// live database round-trip.
export const revalidate = 30;

export default async function TribePage() {
  const [members, content, background] = await Promise.all([
    getTribeMembers(),
    getHomepageContent(),
    getTribeBackground(),
  ]);

  return (
    <>
      <Navbar />
      <TribeGrid members={members} background={background} />
      <Footer socials={content.socials} />
    </>
  );
}
