import InstagramManager from "@/components/admin/settings/InstagramManager";
import { getInstagramPosts } from "@/data/instagram";

export default async function InstagramSettingsPage() {
  const posts = await getInstagramPosts();

  return <InstagramManager initialPosts={posts} />;
}
