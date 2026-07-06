import AttendanceTable from "@/components/admin/attendance/AttendanceTable";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AttendanceTable
      trekId={id}
    />
  );
}