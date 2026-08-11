import { Suspense } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import VerifyEmailForm from "@/components/auth/VerifyEmailForm";

export default function VerifyEmailPage() {
  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle="Enter the code we just sent to your email to activate your account."
    >
      <Suspense fallback={null}>
        <VerifyEmailForm />
      </Suspense>
    </AuthLayout>
  );
}
