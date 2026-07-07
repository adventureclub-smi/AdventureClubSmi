import RefundsPanel from "@/components/admin/refunds/RefundsPanel";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <RefundsPanel trekId={id} />;
}
