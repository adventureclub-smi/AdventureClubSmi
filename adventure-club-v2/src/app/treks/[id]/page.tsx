import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TrekDetails from "@/components/treks/TrekDetails";
import { getCurrentUser } from "@/lib/current-user";
import { getHomepageContent } from "@/data/homepage-content";
import { notifyRegistrationOpenedIfDue } from "@/lib/notification-emails";
import { optimizeImage } from "@/lib/media-optimize";

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

  trek.coverImage = optimizeImage(trek.coverImage);

  // Piggybacks the "registrations just opened -> email Notify Me subscribers"
  // check on this page's visits (no cron in this project) — cheap no-op once
  // the trek has already been notified.
  try {
    await notifyRegistrationOpenedIfDue();
  } catch (error) {
    console.error("Failed to process registration-open notifications:", error);
  }

  let registration = null;
  let notifyRequested = false;

  if (user) {
    [registration, notifyRequested] = await Promise.all([
      prisma.registration.findFirst({
        where: {
          trekId: trek.id,
          userId: user.id,
        },
        include: {
          payments: true,
        },
      }),
      prisma.trekNotifyRequest
        .findUnique({
          where: { trekId_userId: { trekId: trek.id, userId: user.id } },
        })
        .then(Boolean),
    ]);
  }

  return (
    <>
      <Navbar />

      <TrekDetails
        trek={trek}
        user={user}
        registration={registration}
        notifyRequested={notifyRequested}
      />

      <Footer socials={content.socials} />
    </>
  );
}
