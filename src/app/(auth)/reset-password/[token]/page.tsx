"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { PasswordResetForm } from "@/components/auth/password-reset-form";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";

export default function ResetPasswordTokenPage() {
  const params = useParams();
  const token = params.token as string;
  const { validateResetToken } = useAuth();
  const [userInfo, setUserInfo] = useState<{ email: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setIsLoading(true);
        const info = await validateResetToken(token);
        setUserInfo(info);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid or expired token");
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchUserInfo();
    }
  }, [token, validateResetToken]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Validating reset token...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Invalid Token</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <a
              href="/login"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <PasswordResetForm
        mode="reset"
        token={token}
        email={userInfo?.email}
      />
    </div>
  );
}
