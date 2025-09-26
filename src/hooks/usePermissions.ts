import { useUser } from "./useUser";
import { UserRole } from "@/types";

interface PermissionConfig {
  allowedRoles: UserRole[];
  readOnlyRoles?: UserRole[];
}

export function usePermissions() {
  const { user } = useUser();

  const augmentRoles = (allowedRoles: UserRole[]): UserRole[] => {
    const roles = allowedRoles.slice();
    // If super_admin is allowed, system_admin is also allowed for non-destructive actions
    if (roles.includes("super_admin") && !roles.includes("system_admin")) {
      roles.push("system_admin");
    }
    // If lc_officer is allowed, district_officer is also allowed for similar scope features
    if (roles.includes("lc_officer") && !roles.includes("district_officer")) {
      roles.push("district_officer");
    }
    return Array.from(new Set(roles));
  };

  const hasAccess = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false;
    return augmentRoles(allowedRoles).includes(user.role);
  };

  const hasWriteAccess = (config: PermissionConfig): boolean => {
    if (!user) return false;

    // view_only users never have write access
    if (user.role === "view_only") return false;

    // Use augmented roles for allowed roles but check actual role for read-only restrictions
    const augmentedAllowedRoles = augmentRoles(config.allowedRoles);
    const hasRole = augmentedAllowedRoles.includes(user.role);
    const isReadOnly = config.readOnlyRoles?.includes(user.role) || false;

    return hasRole && !isReadOnly;
  };

  const hasReadAccess = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false;

    // view_only users can read everything they have access to
    if (user.role === "view_only") {
      // view_only can access all sections for reading
      return true;
    }

    return augmentRoles(allowedRoles).includes(user.role);
  };

  const canCreate = (allowedRoles: UserRole[]): boolean => {
    return hasWriteAccess({ allowedRoles: augmentRoles(allowedRoles) });
  };

  const canUpdate = (allowedRoles: UserRole[]): boolean => {
    return hasWriteAccess({ allowedRoles: augmentRoles(allowedRoles) });
  };

  const canDelete = (allowedRoles: UserRole[]): boolean => {
    // Explicitly bar system_admin from deletes, even if super_admin is allowed
    return hasWriteAccess({ allowedRoles, readOnlyRoles: ["system_admin"] });
  };

  const canExport = (): boolean => {
    // All authenticated users can export data
    return !!user;
  };

  const canViewSection = (sectionRoles: UserRole[]): boolean => {
    if (!user) return false;

    // view_only users can view all sections
    if (user.role === "view_only") return true;

    return augmentRoles(sectionRoles).includes(user.role);
  };

  const getRestrictedMessage = (): string => {
    if (user?.role === "view_only") {
      return "You have read-only access. Contact your administrator to request write permissions.";
    }
    return "You don't have permission to perform this action.";
  };

  // Permission validation utilities for UI elements
  const shouldShowElement = (config: {
    allowedRoles: UserRole[];
    readOnlyRoles?: UserRole[];
    requireWrite?: boolean;
  }): boolean => {
    if (!user) return false;

    if (config.requireWrite) {
      return hasWriteAccess({
        allowedRoles: config.allowedRoles,
        readOnlyRoles: config.readOnlyRoles,
      });
    }

    return hasAccess(config.allowedRoles);
  };

  const isSystemAdmin = (): boolean => {
    return user?.role === "system_admin";
  };

  const isDistrictOfficer = (): boolean => {
    return user?.role === "district_officer";
  };

  const canManageSuperAdmin = (): boolean => {
    return user?.role === "super_admin";
  };

  return {
    user,
    hasAccess,
    hasWriteAccess,
    hasReadAccess,
    canCreate,
    canUpdate,
    canDelete,
    canExport,
    canViewSection,
    getRestrictedMessage,
    shouldShowElement,
    isSystemAdmin,
    isDistrictOfficer,
    canManageSuperAdmin,
    isViewOnly: user?.role === "view_only",
  };
}
