import RegistrationsTable from "@/components/admin/RegistrationsTable";
import HistoricalRegistrationsTable from "@/components/admin/HistoricalRegistrationsTable";
import { requireAdminAccess } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAccess(["FULL"]);

  const { id } = await params;

  const trek = await prisma.trek.findUnique({
    where: { id },
    select: { isHistorical: true },
  });

  if (trek?.isHistorical) {
    return <HistoricalRegistrationsTable trekId={id} />;
  }

  return <RegistrationsTable trekId={id} />;
}
