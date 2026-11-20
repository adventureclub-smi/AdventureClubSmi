import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import EventDetails from "@/components/events/EventDetails";
import { getHomepageContent } from "@/data/homepage-content";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const content = await getHomepageContent();

  return (
    <>
      <Navbar />
      <EventDetails eventId={id} />
      <Footer socials={content.socials} />
    </>
  );
}
