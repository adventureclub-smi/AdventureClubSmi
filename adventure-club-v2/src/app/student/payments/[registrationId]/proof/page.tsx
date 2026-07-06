import PaymentProofPage from "@/components/student/payments/PaymentProofPage";

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
    <PaymentProofPage
      registrationId={registrationId}
      paymentType={type === "FINAL" ? "FINAL" : "INITIAL"}
    />
  );
}
