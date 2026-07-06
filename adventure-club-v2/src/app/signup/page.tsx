import AuthLayout from "@/components/auth/AuthLayout";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join Adventure Club SMI and register for exciting treks, events and outdoor experiences."
    >
      <SignupForm />
    </AuthLayout>
  );
}