import CheckinScanPage from "@/components/admin/events/CheckinScanPage";
import { requireAdminAccess } from "@/lib/admin-access";

export default async function EventCheckinPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  await requireAdminAccess(["FULL"]);

  const { id } = await params;
  const { code } = await searchParams;

  if (!code) {
    return (
      <div style={{ maxWidth: 420, margin: "60px auto", textAlign: "center" }}>
        <p>No code given.</p>
      </div>
    );
  }

  return <CheckinScanPage eventId={id} code={code} />;
}
