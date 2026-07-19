import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ContactPage from "@/components/contact/ContactPage";
import { getHomepageContent } from "@/data/homepage-content";

// Same reasoning as the rest of the public site — the WhatsApp number can
// change any time from the admin panel, so ISR gives most visitors an
// instant cached response instead of a live database round-trip.
export const revalidate = 30;

export default async function Contact() {
  const content = await getHomepageContent();

  return (
    <>
      <Navbar />
      <ContactPage whatsappNumber={content.socials.whatsapp} />
      <Footer socials={content.socials} />
    </>
  );
}
