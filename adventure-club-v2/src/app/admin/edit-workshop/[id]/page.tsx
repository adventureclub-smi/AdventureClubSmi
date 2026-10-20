import CreateWorkshopForm from "@/components/admin/CreateWorkshopForm";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function EditWorkshopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAccess(["FULL"]);

  const { id } = await params;

  return <CreateWorkshopForm workshopId={id} />;
}
