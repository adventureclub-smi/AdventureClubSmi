import RegistrationsTable from "@/components/admin/RegistrationsTable";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAccess(["FULL"]);

  const { id } = await params;

  return <RegistrationsTable trekId={id} />;
}
