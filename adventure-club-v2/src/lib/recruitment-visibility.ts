// Same dry-run convention as Trek.isTest/testVisibleToUserIds (see
// prisma/schema.prisma) — while a cycle is in test mode, only admins and the
// whitelist see it as "open" anywhere: the homepage/dashboard banners, the
// application page itself, and submission. Used both server-side (deciding
// what to show a given visitor) and reused as the one source of truth so the
// banner and the actual submit gate can never drift out of sync.

export type RecruitmentSettingsLike = {
  opensAt: Date | string | null;
  closesAt: Date | string | null;
  isTest: boolean;
  testVisibleToUserIds: string[];
} | null;

export type RecruitmentUserLike = { id: string; role: string } | null;

export function isRecruitmentOpenFor(
  settings: RecruitmentSettingsLike,
  user: RecruitmentUserLike
): boolean {
  if (!settings) return false;

  const now = new Date();

  if (settings.opensAt && now < new Date(settings.opensAt)) return false;
  if (settings.closesAt && now > new Date(settings.closesAt)) return false;

  if (settings.isTest) {
    if (!user) return false;
    return user.role === "admin" || settings.testVisibleToUserIds.includes(user.id);
  }

  return true;
}
