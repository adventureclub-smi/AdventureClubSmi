import MemberProfile from "@/components/admin/MemberProfile";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <MemberProfile userId={id} />;
}