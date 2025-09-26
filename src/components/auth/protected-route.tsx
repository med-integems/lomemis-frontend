"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/usePermissions";
import { Loader2, AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
  validateSession?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireAuth = true,
  validateSession = true,
}: ProtectedRouteProps) {
  const { user, isLoading, validateSession: validateUserSession } = useAuth();
  const { hasAccess, getRestrictedMessage } = usePermissions();
  const router = useRouter();
  const [sessionValidated, setSessionValidated] = useState(!validateSession);

  useEffect(() => {
    if (isLoading) return;

    // If authentication is required but user is not logged in
    if (requireAuth && !user) {
      router.push("/login");
      return;
    }

    // If user is logged in but doesn't have required role
    if (user && allowedRoles && !hasAccess(allowedRoles)) {
      // Redirect to appropriate dashboard based on role
      router.push("/dashboard");
      return;
    }
  }, [user, isLoading, requireAuth, allowedRoles, router]);

  // Validate session if required
  useEffect(() => {
    if (!validateSession || !user || sessionValidated) return;

    const checkSession = async () => {
      try {
        const isValid = await validateUserSession();
        if (!isValid) {
          router.push("/login");
          return;
        }
        setSessionValidated(true);
      } catch (error) {
        console.error("Session validation failed:", error);
        router.push("/login");
      }
    };

    checkSession();
  }, [user, validateSession, sessionValidated, validateUserSession, router]);

  // Show loading spinner while checking authentication or validating session
  if (isLoading || (validateSession && !sessionValidated)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isLoading ? "Loading..." : "Validating session..."}
          </p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not logged in, don't render children
  if (requireAuth && !user) {
    return null;
  }

  // If user doesn't have required role, show enhanced access denied page
  if (user && allowedRoles && !hasAccess(allowedRoles)) {
    const getRoleDisplayName = (role: UserRole) => {
      const roleMap = {
        super_admin: "Super Administrator",
        system_admin: "System Administrator",
        national_manager: "National Warehouse Manager",
        lc_officer: "Local Council Officer",
        district_officer: "District Education Officer",
        school_rep: "School Representative",
        view_only: "View-Only User",
      };
      return roleMap[role] || role;
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">Access Restricted</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {getRestrictedMessage()}
            </p>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Your Role</p>
              <p className="font-medium">{getRoleDisplayName(user.role)}</p>
              {user.district && (
                <p className="text-xs text-muted-foreground mt-1">
                  District: {user.district}
                </p>
              )}
              {user.localCouncilId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Council: {user.localCouncilId}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => router.push("/dashboard")} className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="w-full"
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

// Higher-order component for easier usage
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: UserRole[]
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute allowedRoles={allowedRoles}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
