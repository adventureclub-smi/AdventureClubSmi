import AnnouncementsManager from "@/components/admin/AnnouncementsManager";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function Page() {
  await requireAdminAccess(["FULL"]);

  return <AnnouncementsManager />;
}
