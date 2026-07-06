import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StudentTreks from "@/components/treks/StudentTreks";
import { getHomepageContent } from "@/data/homepage-content";

export default async function TreksPage() {
  const content = await getHomepageContent();

  return (
    <>
      <Navbar />
      <StudentTreks />
      <Footer socials={content.socials} />
    </>
  );
}
