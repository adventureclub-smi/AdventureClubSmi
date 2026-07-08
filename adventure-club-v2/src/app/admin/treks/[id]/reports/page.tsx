import { BarChart3 } from "lucide-react";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function Page() {
  await requireAdminAccess(["FULL", "FINANCE"]);

  return (
    <div
      style={{
        background: "var(--color-charcoal)",
        border: "1px dashed rgba(245,245,245,0.15)",
        borderRadius: 18,
        padding: 60,
        textAlign: "center",
        color: "var(--color-text-muted)",
      }}
    >
      <BarChart3 size={28} style={{ marginBottom: 12, color: "var(--color-accent)" }} />
      <h2 style={{ color: "var(--color-text)", marginBottom: 6 }}>Per-Trek Reports</h2>
      <p>Coming soon — see the global Reports page for club-wide analytics.</p>
    </div>
  );
}
