import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StudentEvents from "@/components/events/StudentEvents";
import { getHomepageContent } from "@/data/homepage-content";

export default async function EventsPage() {
  const content = await getHomepageContent();

  return (
    <>
      <Navbar />
      <StudentEvents />
      <Footer socials={content.socials} />
    </>
  );
}
