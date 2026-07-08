import PaymentsTable from "@/components/admin/payments/PaymentsTable";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAccess(["FULL", "FINANCE"]);

  const { id } = await params;

  return (
    <PaymentsTable trekId={id} />
  );
}
