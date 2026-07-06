import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TribeGrid from "@/components/tribe/TribeGrid";
import { getTribeMembers } from "@/data/tribe";
import { getHomepageContent } from "@/data/homepage-content";

// The roster can change any time from the admin panel and this page has no
// other dynamic API calls of its own — force-dynamic keeps it from being
// cached client-side for minutes at a time (same reasoning as the homepage).
export const dynamic = "force-dynamic";

export default async function TribePage() {
  const [members, content] = await Promise.all([
    getTribeMembers(),
    getHomepageContent(),
  ]);

  return (
    <>
      <Navbar />
      <TribeGrid members={members} />
      <Footer socials={content.socials} />
    </>
  );
}
