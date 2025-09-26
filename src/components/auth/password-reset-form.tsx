"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/contexts/auth-context";

const requestResetSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RequestResetFormData = z.infer<typeof requestResetSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface PasswordResetFormProps {
  mode?: "request" | "reset";
  token?: string;
  email?: string;
  onBack?: () => void;
}

export function PasswordResetForm({
  mode = "request",
  token,
  email,
  onBack,
}: PasswordResetFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { requestPasswordReset, resetPassword } = useAuth();

  const requestForm = useForm<RequestResetFormData>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: token || "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onRequestSubmit = async (data: RequestResetFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await requestPasswordReset(data.email);
      setSuccess(true);
      toast.success("Password reset instructions sent to your email");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to request password reset";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await resetPassword(data.token, data.newPassword);
      setSuccess(true);
      toast.success("Password reset successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to reset password";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-card p-8 rounded-lg shadow-sm border">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2">
              {mode === "request"
                ? "Check Your Email"
                : "Password Reset Successfully"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {mode === "request"
                ? "We've sent password reset instructions to your email address."
                : "Your password has been reset successfully. You can now log in with your new password."}
            </p>
            <Button
              onClick={() => router.push("/login")}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">LoMEMIS</h1>
        <p className="text-sm text-muted-foreground">
          A Supply Chain Management Information System
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Government of Sierra Leone
        </p>
      </div>

      <div className="bg-card p-8 rounded-lg shadow-sm border">
        <h2 className="text-2xl font-semibold text-center mb-6">
          {mode === "request" ? "Reset Password" : "Set New Password"}
        </h2>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {mode === "request" ? (
          <Form {...requestForm}>
            <form
              onSubmit={requestForm.handleSubmit(onRequestSubmit)}
              className="space-y-6"
            >
              <FormField
                control={requestForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                size="lg"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Sending..." : "Send Reset Instructions"}
              </Button>

              <div className="mt-4 text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/login")}
                  disabled={isLoading}
                  className="text-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Form {...resetForm}>
            <form
              onSubmit={resetForm.handleSubmit(onResetSubmit)}
              className="space-y-6"
            >
              {/* Hidden token field */}
              <FormField
                control={resetForm.control}
                name="token"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input type="hidden" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Email display field */}
              {email && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Resetting password for:
                  </label>
                  <div className="p-3 bg-muted rounded-md border">
                    <p className="text-sm font-medium text-foreground">{email}</p>
                  </div>
                </div>
              )}

              <FormField
                control={resetForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter new password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={resetForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                size="lg"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          </Form>
        )}

        <div className="mt-6 text-center">
          {onBack && (
            <button
              onClick={onBack}
              className="text-sm text-muted-foreground hover:text-primary"
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
