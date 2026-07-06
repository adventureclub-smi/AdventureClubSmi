import SongsManager from "@/components/admin/settings/SongsManager";
import { getSongs } from "@/data/songs";

export default async function MusicSettingsPage() {
  const songs = await getSongs();

  return <SongsManager initialSongs={songs} />;
}
