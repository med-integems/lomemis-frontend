"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, User as UserIcon, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/contexts/auth-context";

const createProfileSchema = (originalEmail: string) => z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  currentPassword: z
    .string()
    .optional(),
}).refine((data) => {
  // If email is being changed, password is required
  if (data.email && data.email !== originalEmail) {
    if (!data.currentPassword || data.currentPassword.trim() === "") {
      return false;
    }
  }
  return true;
}, {
  message: "Current password is required when changing email address",
  path: ["currentPassword"],
});

type ProfileFormData = z.infer<ReturnType<typeof createProfileSchema>>;

export function ProfileForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailChanged, setEmailChanged] = useState(false);
  const { user, updateProfile } = useAuth();

  // Create schema with original email
  const originalEmail = user?.email || "";
  const profileSchema = createProfileSchema(originalEmail);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      currentPassword: "",
    },
  });

  // Watch email field to detect changes
  const emailValue = form.watch("email");

  // Update emailChanged state when email field changes
  useEffect(() => {
    const isEmailChanged = emailValue !== originalEmail;
    setEmailChanged(isEmailChanged);
  }, [emailValue, originalEmail]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);

    try {
      // Prepare update data - only include password if email is being changed
      const updateData: { name: string; email: string; currentPassword?: string } = {
        name: data.name,
        email: data.email,
      };

      // Include password if email is being changed
      if (emailChanged && data.currentPassword) {
        updateData.currentPassword = data.currentPassword;
      }

      await updateProfile(updateData);
      toast.success("Profile updated successfully");

      // Clear password field after successful update
      form.setValue("currentPassword", "");
      setEmailChanged(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Profile update failed";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  const getRoleDisplayName = (role: string) => {
    const roleMap = {
      super_admin: "Super Administrator",
      system_admin: "System Administrator",
      national_manager: "National Warehouse Manager",
      lc_officer: "Local Council Officer",
      district_officer: "District Education Officer",
      school_rep: "School Representative",
      view_only: "View Only User",
    } as Record<string, string>;
    return roleMap[role] || role;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          User Profile
        </CardTitle>
        <CardDescription>
          Update your personal information and account details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your full name"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {emailChanged && (
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your current password to confirm email change"
                          disabled={isLoading}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {showPassword ? "Hide password" : "Show password"}
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">
                      Password confirmation is required when changing your email address for security.
                    </p>
                  </FormItem>
                )}
              />
            )}

            <div className="space-y-2">
              <Label>Role</Label>
              <Input
                value={getRoleDisplayName(user.role)}
                disabled
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground">
                Your role cannot be changed. Contact an administrator if you
                need different permissions.
              </p>
            </div>

            {user.localCouncilId && (
              <div className="space-y-2">
                <Label>Local Council ID</Label>
                <Input
                  value={user.localCouncilId.toString()}
                  disabled
                  className="bg-muted"
                />
              </div>
            )}

            {user.warehouseId && (
              <div className="space-y-2">
                <Label>Warehouse ID</Label>
                <Input
                  value={user.warehouseId.toString()}
                  disabled
                  className="bg-muted"
                />
              </div>
            )}

            {user.district && (
              <div className="space-y-2">
                <Label>District Assignment</Label>
                <Input
                  value={user.district}
                  disabled
                  className="bg-muted"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Account Status</Label>
              <Input
                value={user.isActive ? "Active" : "Inactive"}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isLoading || !form.formState.isDirty}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Updating..." : "Update Profile"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
