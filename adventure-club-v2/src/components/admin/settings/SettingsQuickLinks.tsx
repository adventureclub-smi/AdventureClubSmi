"use client";

import { Wallet, Music, Users, Camera, Link2, Images, Award, LayoutDashboard, BookOpen, Globe2, Mountain, Film, Hash, Compass } from "lucide-react";
import QuickActionCard from "@/components/dashboard/shared/QuickActionCard";

export default function SettingsQuickLinks() {
  return (
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
        label="Gallery Page"
        href="/admin/settings/gallery"
      />

      <QuickActionCard
        icon={Award}
        label="Certificate Signatories"
        href="/admin/settings/certificate"
      />

      <QuickActionCard
        icon={LayoutDashboard}
        label="Student Dashboard"
        href="/admin/settings/student-dashboard"
      />

      <QuickActionCard
        icon={BookOpen}
        label="Stories"
        href="/admin/settings/stories"
      />

      <QuickActionCard
        icon={Film}
        label="Story Scenes"
        href="/admin/settings/story-scenes"
      />

      <QuickActionCard
        icon={Globe2}
        label="3D Explorer"
        href="/admin/settings/google-earth"
      />

      <QuickActionCard
        icon={Mountain}
        label="3D Route Waypoints"
        href="/admin/settings/trek-routes"
      />

      <QuickActionCard
        icon={Hash}
        label="By The Numbers"
        href="/admin/settings/stats"
      />

      <QuickActionCard
        icon={Compass}
        label="Things We Do"
        href="/admin/settings/activities"
      />
    </div>
  );
}
