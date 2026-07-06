import PaymentsTable from "@/components/admin/payments/PaymentsTable";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PaymentsTable trekId={id} />
  );
}