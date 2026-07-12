import { prisma } from "@/lib/prisma";
import { optimizeImage } from "@/lib/media-optimize";

export type InstagramPostSummary = {
  id: string;
  postUrl: string;
  thumbnailUrl: string;
  caption: string | null;
};

export async function getInstagramPosts(): Promise<InstagramPostSummary[]> {
  const posts = await prisma.instagramPost.findMany({
    orderBy: { createdAt: "desc" },
  });

  return posts.map((post) => ({
    id: post.id,
    postUrl: post.postUrl,
    thumbnailUrl: optimizeImage(post.thumbnailUrl) || "/images/default-trek.jpg",
    caption: post.caption,
  }));
}
