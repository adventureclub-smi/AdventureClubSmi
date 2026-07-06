import { prisma } from "@/lib/prisma";

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
    thumbnailUrl: post.thumbnailUrl || "/images/default-trek.jpg",
    caption: post.caption,
  }));
}
