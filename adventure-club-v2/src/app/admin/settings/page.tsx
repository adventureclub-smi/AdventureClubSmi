"use client";

import { Wallet, Music, Users, Camera, Link2, Images, Award } from "lucide-react";
import PageHeader from "@/components/admin/shared/PageHeader";
import QuickActionCard from "@/components/dashboard/shared/QuickActionCard";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Settings" }]}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
        <QuickActionCard
          icon={Wallet}
          label="Payment Settings"
          href="/admin/settings/payment"
        />

        <QuickActionCard
          icon={Music}
          label="Music"
          href="/admin/settings/music"
        />

        <QuickActionCard
          icon={Users}
          label="Tribe"
          href="/admin/settings/tribe"
        />

        <QuickActionCard
          icon={Camera}
          label="Instagram"
          href="/admin/settings/instagram"
        />

        <QuickActionCard
          icon={Link2}
          label="Social Links"
          href="/admin/settings/social"
        />

        <QuickActionCard
          icon={Images}
          label="Homepage Gallery"
          href="/admin/settings/gallery"
        />

        <QuickActionCard
          icon={Award}
          label="Certificate Signatories"
          href="/admin/settings/certificate"
        />
      </div>
    </div>
  );
}
