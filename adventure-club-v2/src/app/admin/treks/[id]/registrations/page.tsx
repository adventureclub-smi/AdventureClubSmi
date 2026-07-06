import RegistrationsTable from "@/components/admin/RegistrationsTable";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <RegistrationsTable trekId={id} />;
}