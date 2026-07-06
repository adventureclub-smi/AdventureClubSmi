import { Undo2 } from "lucide-react";

export default function Page() {
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
      <Undo2 size={28} style={{ marginBottom: 12, color: "var(--color-accent)" }} />
      <h2 style={{ color: "var(--color-text)", marginBottom: 6 }}>Refunds & Reimbursement</h2>
      <p>Coming soon.</p>
    </div>
  );
}
