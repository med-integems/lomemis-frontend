import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// User role types - will be enhanced in task 9.2
export type UserRole =
  | "super_admin"
  | "system_admin"
  | "national_manager"
  | "lc_officer"
  | "district_officer"
  | "school_rep"
  | "view_only";

// Navigation item type
export interface NavigationItem {
  title: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  roles: (UserRole | "all")[];
  items?: NavigationItem[];
}

// Check if user has access to a navigation item
export function hasAccess(
  userRole: UserRole,
  allowedRoles: (UserRole | "all")[]
): boolean {
  return allowedRoles.includes("all") || allowedRoles.includes(userRole);
}

// Date formatting utility
export function formatDate(date: string | Date): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  // Handle invalid dates
  if (isNaN(dateObj.getTime())) return "";
  
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Date and time formatting utility
export function formatDateTime(date: string | Date): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  // Handle invalid dates
  if (isNaN(dateObj.getTime())) return "";
  
  return dateObj.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Time-only formatting utility
export function formatTime(date: string | Date): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  // Handle invalid dates
  if (isNaN(dateObj.getTime())) return "";
  
  return dateObj.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Currency formatting utility for Sierra Leone Leone (SLE)
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "SLE 0.00";
  }

  // Format with 2 decimal places and thousands separators
  return `SLE ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Compact currency formatting for large amounts (e.g., SLE 1.2M)
export function formatCurrencyCompact(
  amount: number | null | undefined
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "SLE 0";
  }

  if (amount >= 1000000) {
    return `SLE ${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `SLE ${(amount / 1000).toFixed(1)}K`;
  } else {
    return `SLE ${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}
