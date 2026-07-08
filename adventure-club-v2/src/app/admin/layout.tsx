import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { getAdminAccessLevel } from "@/lib/admin-access";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import styles from "./layout.module.scss";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  if (!admin) {
    redirect("/login");
  }

  const accessLevel = getAdminAccessLevel(admin);

  return (
    <div className={styles.shell}>
      <AdminSidebar accessLevel={accessLevel} />

      <div className={styles.content}>
        <AdminTopbar adminName={admin.fullName} />

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
