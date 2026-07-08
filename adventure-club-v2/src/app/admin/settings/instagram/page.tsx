import InstagramManager from "@/components/admin/settings/InstagramManager";
import { getInstagramPosts } from "@/data/instagram";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function InstagramSettingsPage() {
  await requireAdminAccess(["FULL", "VISUAL"]);

  const posts = await getInstagramPosts();

  return <InstagramManager initialPosts={posts} />;
}
