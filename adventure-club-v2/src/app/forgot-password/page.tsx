import AuthLayout from "@/components/auth/AuthLayout";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="No worries, we'll help you get back in."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
