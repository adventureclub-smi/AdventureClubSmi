import BondFormsTable from "@/components/admin/bondforms/BondFormsTable";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAccess(["FULL"]);

  const { id } = await params;

  return (
    <BondFormsTable trekId={id} />
  );
}
