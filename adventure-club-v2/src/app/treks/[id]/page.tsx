import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TrekDetails from "@/components/treks/TrekDetails";
import { getCurrentUser } from "@/lib/current-user";
import { getHomepageContent } from "@/data/homepage-content";

export default async function TrekPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [user, content] = await Promise.all([
    getCurrentUser(),
    getHomepageContent(),
  ]);

  const trek = await prisma.trek.findUnique({
    where: {
      id,
    },
  });

  if (!trek) {
    notFound();
  }

  let registration = null;

  if (user) {
    registration = await prisma.registration.findFirst({
      where: {
        trekId: trek.id,
        userId: user.id,
      },
      include: {
        payments: true,
      },
    });
  }

  return (
    <>
      <Navbar />

      <TrekDetails
        trek={trek}
        user={user}
        registration={registration}
      />

      <Footer socials={content.socials} />
    </>
  );
}
