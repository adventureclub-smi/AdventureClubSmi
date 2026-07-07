import { prisma } from "@/lib/prisma";

export type StudentDashboardSettingsData = {
  bannerImageUrl: string | null;
};

export async function getStudentDashboardSettings(): Promise<StudentDashboardSettingsData> {
  const settings = await prisma.studentDashboardSettings.findFirst();

  return {
    bannerImageUrl: settings?.bannerImageUrl || null,
  };
}
