import { ImageIcon } from "lucide-react";
import PageHeader from "@/components/admin/shared/PageHeader";

export default function Page() {
  return (
    <div>
      <PageHeader
        title="Gallery"
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Gallery" }]}
      />

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
        <ImageIcon size={28} style={{ marginBottom: 12, color: "var(--color-accent)" }} />
        <h2 style={{ color: "var(--color-text)", marginBottom: 6 }}>Club-wide Gallery</h2>
        <p>
          Coming soon — for now, upload and manage photos from each trek&apos;s own Gallery
          tab.
        </p>
      </div>
    </div>
  );
}
