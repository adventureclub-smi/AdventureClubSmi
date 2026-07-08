import CreateTrekForm from "@/components/admin/CreateTrekForm";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function EditTrekPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAccess(["FULL"]);

  const { id } = await params;

  return <CreateTrekForm trekId={id} />;
}
