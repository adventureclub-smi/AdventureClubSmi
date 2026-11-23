import EventDisplay from "@/components/events/EventDisplay";

// Deliberately has no Navbar/Footer — this is meant to be put up full-screen
// on a TV at the venue, not browsed like the rest of the site.
export default async function EventDisplayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <EventDisplay eventId={id} />;
}
