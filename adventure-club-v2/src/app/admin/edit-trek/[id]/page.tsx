import CreateTrekForm from "@/components/admin/CreateTrekForm";

export default async function EditTrekPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <CreateTrekForm trekId={id} />;
}
