import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";

export type AdminAccessLevel = "FULL" | "FINANCE" | "VISUAL" | "BOOKING" | "NONE";

const HOME_BY_ACCESS: Record<AdminAccessLevel, string> = {
  FULL: "/admin",
  FINANCE: "/admin/payments",
  VISUAL: "/admin/gallery",
  BOOKING: "/admin/booking",
  NONE: "/login",
};

// Existing admin accounts predate this field entirely, so Mongo returns
// undefined for them rather than the Prisma-schema default — treating that
// (or any unrecognized value) as FULL keeps every current admin working
// exactly as before instead of accidentally locking them out.
export function getAdminAccessLevel(user: {
  role: string;
  adminAccessLevel?: string | null;
}): AdminAccessLevel {
  if (user.role !== "admin") return "NONE";

  if (
    user.adminAccessLevel === "FINANCE" ||
    user.adminAccessLevel === "VISUAL" ||
    user.adminAccessLevel === "BOOKING"
  ) {
    return user.adminAccessLevel;
  }

  return "FULL";
}

export async function requireAdminAccess(allowed: AdminAccessLevel[]) {
  const admin = await requireAdmin();

  if (!admin) {
    redirect("/login");
  }

  const level = getAdminAccessLevel(admin);

  if (level !== "FULL" && !allowed.includes(level)) {
    redirect(HOME_BY_ACCESS[level]);
  }

  return { admin, level };
}
