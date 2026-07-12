import { requireAdminAccess } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import styles from "./notify-list.module.scss";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAccess(["FULL"]);

  const { id: trekId } = await params;

  const requests = await prisma.trekNotifyRequest.findMany({
    where: { trekId },
    orderBy: { createdAt: "asc" },
  });

  const users = await prisma.user.findMany({
    where: { id: { in: requests.map((r) => r.userId) } },
    select: { id: true, fullName: true, clubId: true, email: true, phoneNumber: true },
  });

  type NotifyUser = (typeof users)[number];

  const userById = new Map(users.map((u) => [u.id, u]));

  const rows: { request: (typeof requests)[number]; user: NotifyUser }[] = [];

  for (const request of requests) {
    const user = userById.get(request.userId);
    if (user) rows.push({ request, user });
  }

  return (
    <div className={styles.container}>
      <p className={styles.intro}>
        Students who clicked &quot;Notify Me&quot; before registrations opened.
        Everyone below is emailed automatically the moment registrations open.
      </p>

      <div className={styles.count}>{rows.length} student(s) waiting</div>

      {rows.length === 0 ? (
        <div className={styles.empty}>No one has requested a notification yet.</div>
      ) : (
        <div className={styles.rows}>
          {rows.map(({ request, user }) => (
            <div key={request.id} className={styles.row}>
              <div className={styles.rowInfo}>
                <strong>{user.fullName}</strong>
                <span>{user.clubId}</span>
              </div>

              <div className={styles.rowContact}>
                <span>{user.email}</span>
                <span>{user.phoneNumber}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
