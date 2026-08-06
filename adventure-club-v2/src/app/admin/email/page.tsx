import EmailBroadcast from "@/components/admin/EmailBroadcast";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function Page() {
  await requireAdminAccess(["FULL"]);

  return <EmailBroadcast />;
}
