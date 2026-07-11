import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TrailTalesExperience from "@/components/trail-tales/TrailTalesExperience";
import { getHomepageContent } from "@/data/homepage-content";

export const revalidate = 30;

export default async function StoriesPage() {
  const content = await getHomepageContent();

  return (
    <>
      <Navbar />
      <TrailTalesExperience />
      <Footer socials={content.socials} />
    </>
  );
}
