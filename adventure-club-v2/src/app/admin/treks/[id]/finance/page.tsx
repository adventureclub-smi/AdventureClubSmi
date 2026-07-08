import TrekFinance from "@/components/admin/TrekFinance";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function FinancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAccess(["FULL", "FINANCE"]);

  const { id } = await params;

  return <TrekFinance trekId={id} />;
}
