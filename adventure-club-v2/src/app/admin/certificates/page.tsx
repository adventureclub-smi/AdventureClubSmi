import CertificatesManager from "@/components/admin/CertificatesManager";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function Page() {
  await requireAdminAccess(["FULL"]);

  return <CertificatesManager />;
}
