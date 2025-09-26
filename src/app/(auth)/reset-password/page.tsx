import { Metadata } from "next";
import { PasswordResetForm } from "@/components/auth/password-reset-form";

export const metadata: Metadata = {
  title: "Reset Password - LoMEMIS",
  description: "Reset your password for the LoMEMIS system",
};

export default function ResetPasswordPage() {
  // Password reset request page
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <PasswordResetForm mode="request" />
    </div>
  );
}
