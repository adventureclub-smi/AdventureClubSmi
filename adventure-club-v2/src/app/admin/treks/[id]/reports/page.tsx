import TrekReport from "@/components/admin/TrekReport";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAccess(["FULL", "FINANCE"]);

  const { id } = await params;

  return <TrekReport trekId={id} />;
}
