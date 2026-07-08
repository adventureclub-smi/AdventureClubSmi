import TrekOverview from "@/components/admin/treks/TrekOverview";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAccess(["FULL"]);

  const { id } = await params;

  return <TrekOverview trekId={id} />;
}
