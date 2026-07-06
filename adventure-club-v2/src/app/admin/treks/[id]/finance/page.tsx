import TrekFinance from "@/components/admin/TrekFinance";

export default async function FinancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <TrekFinance trekId={id} />;
}
