import { prisma } from "@/lib/prisma";

export type TribeMemberSummary = {
  id: string;
  name: string;
  role: string;
  tier: number;
  year: string;
  course: string;
  photoUrl: string;
  bio: string;
  songTitle: string | null;
  songUrl: string | null;
};

export async function getTribeMembers(): Promise<TribeMemberSummary[]> {
  const members = await prisma.tribeMember.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return members.map((member) => ({
    id: member.id,
    name: member.name,
    role: member.role,
    tier: member.tier,
    year: member.year,
    course: member.course,
    photoUrl: member.photoUrl,
    bio: member.bio,
    songTitle: member.songTitle,
    songUrl: member.songUrl,
  }));
}
