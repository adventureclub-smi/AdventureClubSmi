import { prisma } from "@/lib/prisma";
import { requireAdminAccess } from "@/lib/admin-access";
import ChitPrintSheet from "@/components/admin/events/ChitPrintSheet";

export default async function EventChitsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAccess(["FULL"]);

  const { id } = await params;

  const [event, teams] = await Promise.all([
    prisma.trek.findUnique({ where: { id } }),
    prisma.eventTeam.findMany({ where: { trekId: id }, orderBy: { createdAt: "asc" } }),
  ]);

  if (!event || event.type !== "EVENT") {
    return (
      <div style={{ maxWidth: 420, margin: "60px auto", textAlign: "center" }}>
        <p>Event not found.</p>
      </div>
    );
  }

  return (
    <ChitPrintSheet
      eventTitle={event.title}
      teams={teams.map((t) => ({ id: t.id, name: t.name, colour: t.colour, targetSize: t.targetSize }))}
    />
  );
}
