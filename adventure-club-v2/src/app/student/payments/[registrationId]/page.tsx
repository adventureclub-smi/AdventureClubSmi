import StudentPaymentPage from "@/components/student/payments/StudentPaymentPage";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ registrationId: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { registrationId } = await params;
  const { type } = await searchParams;

  return (
    <StudentPaymentPage
      registrationId={registrationId}
      paymentType={type === "FINAL" ? "FINAL" : "INITIAL"}
    />
  );
}