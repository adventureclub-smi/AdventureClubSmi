import SongsManager from "@/components/admin/settings/SongsManager";
import { getSongs } from "@/data/songs";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function MusicSettingsPage() {
  await requireAdminAccess(["FULL", "VISUAL"]);

  const songs = await getSongs();

  return <SongsManager initialSongs={songs} />;
}
