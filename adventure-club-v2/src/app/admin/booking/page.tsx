import Link from "next/link";
import { Ticket, ArrowRight } from "lucide-react";
import PageHeader from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";
import { requireAdminAccess } from "@/lib/admin-access";
import styles from "./page.module.scss";

export default async function Page() {
  await requireAdminAccess(["FULL", "BOOKING"]);

  const treks = await prisma.trek.findMany({
    orderBy: { date: "desc" },
    select: { id: true, title: true, destination: true },
  });

  return (
    <div>
      <PageHeader
        title="Booking"
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Booking" }]}
      />

      {treks.length === 0 ? (
        <div className={styles.empty}>
          <Ticket size={28} />
          <h2>No treks yet</h2>
          <p>Create a trek first, then manage its bookings from here.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {treks.map((trek) => (
            <Link
              key={trek.id}
              href={`/admin/treks/${trek.id}/booking`}
              className={styles.trekCard}
            >
              <div>
                <h3>{trek.title}</h3>
                <p>{trek.destination}</p>
              </div>

              <ArrowRight size={16} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
