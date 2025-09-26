"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home, MoreHorizontal, MapPin, Building2, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils";
import { useResponsive } from "@/hooks/useResponsive";
import { useAuth } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/usePermissions";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Route mapping for automatic breadcrumb generation
const routeMap: Record<string, string> = {
  dashboard: "Dashboard",
  inventory: "TLM Management",
  national: "National Warehouses",
  councils: "Local Councils",
  schools: "Schools",
  receipts: "Receipts",
  manage: "Management",
  shipments: "Shipments",
  distributions: "Distributions",
  reports: "Reports",
  admin: "System Administration",
  users: "User Management",
  items: "Item Master",
  profile: "Profile",
  warehouses: "Warehouses",
};

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const pathname = usePathname();
  const { isMobile, deviceType } = useResponsive();
  const { user } = useAuth();
  const { isDistrictOfficer } = usePermissions();

  // Generate breadcrumb items from pathname if not provided
  const breadcrumbItems = React.useMemo(() => {
    if (items && items.length > 0) return items;

    const pathSegments = pathname.split("/").filter(Boolean);
    const generatedItems: BreadcrumbItem[] = [
      {
        label: "Home",
        href: "/dashboard",
        icon: Home,
      },
    ];

    // Add scope information after Home for scoped users
    if (user?.role === "district_officer" && user.district) {
      generatedItems.push({
        label: `${user.district} District`,
        icon: MapPin,
      });
    } else if (user?.role === "lc_officer" && user.localCouncilId) {
      generatedItems.push({
        label: `Council ${user.localCouncilId}`,
        icon: Building2,
      });
    } else if (user?.role === "national_manager" && user.warehouseId) {
      generatedItems.push({
        label: `Warehouse ${user.warehouseId}`,
        icon: Warehouse,
      });
    }

    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label =
        routeMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

      // Don't add href for the last item (current page)
      const isLast = index === pathSegments.length - 1;

      generatedItems.push({
        label,
        href: isLast ? undefined : currentPath,
      });
    });

    return generatedItems;
  }, [items, pathname]);

  if (breadcrumbItems.length <= 1) {
    return null;
  }

  // On mobile, show condensed breadcrumb if there are more than 3 items
  const shouldCondense = isMobile && breadcrumbItems.length > 3;
  const displayItems = shouldCondense 
    ? [breadcrumbItems[0], { label: "...", href: undefined }, ...breadcrumbItems.slice(-2)]
    : breadcrumbItems;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center overflow-hidden",
        deviceType === "mobile" ? "text-xs" : "text-sm",
        "text-muted-foreground",
        className
      )}
    >
      <ol className="flex items-center space-x-1 min-w-0">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isEllipsis = item.label === "...";
          const Icon = item.icon;

          return (
            <li key={index} className="flex items-center min-w-0">
              {index > 0 && (
                <ChevronRight className={cn(
                  "mx-1 text-muted-foreground/50 flex-shrink-0",
                  deviceType === "mobile" ? "w-3 h-3" : "w-4 h-4"
                )} />
              )}
              {isEllipsis ? (
                <span className="flex items-center px-1">
                  <MoreHorizontal className={cn(
                    "text-muted-foreground/50",
                    deviceType === "mobile" ? "w-3 h-3" : "w-4 h-4"
                  )} />
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-1 hover:text-foreground transition-colors min-w-0",
                    isMobile && "max-w-24 sm:max-w-32"
                  )}
                >
                  {Icon && <Icon className={cn(
                    "flex-shrink-0",
                    deviceType === "mobile" ? "w-3 h-3" : "w-4 h-4"
                  )} />}
                  <span className="truncate">{item.label}</span>
                </Link>
              ) : (
                <span
                  className={cn(
                    "flex items-center space-x-1 min-w-0",
                    isLast && "text-foreground font-medium",
                    isMobile && "max-w-32 sm:max-w-40"
                  )}
                >
                  {Icon && <Icon className={cn(
                    "flex-shrink-0",
                    deviceType === "mobile" ? "w-3 h-3" : "w-4 h-4"
                  )} />}
                  <span className="truncate">{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Hook for custom breadcrumb management
export function useBreadcrumb() {
  const [customItems, setCustomItems] = React.useState<BreadcrumbItem[]>([]);

  const setBreadcrumb = React.useCallback((items: BreadcrumbItem[]) => {
    setCustomItems(items);
  }, []);

  const clearBreadcrumb = React.useCallback(() => {
    setCustomItems([]);
  }, []);

  return {
    items: customItems,
    setBreadcrumb,
    clearBreadcrumb,
  };
}
