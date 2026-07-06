import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
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

  return (
    <div className={styles.shell}>
      <AdminSidebar />

      <div className={styles.content}>
        <AdminTopbar adminName={admin.fullName} />

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
