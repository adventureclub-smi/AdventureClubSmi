import MemberProfile from "@/components/admin/MemberProfile";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { admin } = await requireAdminAccess(["FULL"]);

  const { id } = await params;

  const canEditAccess =
    admin?.clubRole === "Admin" ||
    admin?.clubRole === "President" ||
    admin?.clubRole === "Treasurer";

  return <MemberProfile userId={id} canEditAccess={canEditAccess} />;
}
