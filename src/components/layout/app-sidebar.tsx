"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  BarChart3,
  Building2,
  CheckCircle,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Home,
  MapPin,
  Package,
  Receipt,
  School,
  Settings,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/usePermissions";
import { NavigationItem, UserRole } from "@/types";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useResponsive } from "@/hooks/useResponsive";

// Navigation items based on user roles
const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    icon: Home,
    roles: ["all"],
    items: [
      {
        title: "Overview",
        href: "/dashboard",
        icon: Home,
        roles: ["all"],
      },
    ],
  },
  {
    title: "TLM Management",
    icon: Package,
    roles: [
      "national_manager",
      "lc_officer",
      "district_officer",
      "school_rep",
      "view_only",
      "super_admin",
      "system_admin",
    ],
    items: [
      {
        title: "National Warehouses",
        icon: Warehouse,
        roles: ["national_manager", "view_only", "super_admin", "system_admin"],
        items: [
          {
            title: "Receive Stock",
            href: "/warehouse/receipts",
            icon: Receipt,
            roles: ["national_manager", "super_admin", "system_admin"],
          },
          {
            title: "View Inventory",
            href: "/inventory/national",
            icon: Package,
            roles: ["national_manager", "view_only", "super_admin", "system_admin"],
          },
          {
            title: "Manage Shipments",
            href: "/warehouse/shipments",
            icon: Truck,
            roles: ["national_manager", "super_admin", "system_admin"],
          },
          {
            title: "Direct to Schools",
            href: "/warehouses/schools",
            icon: School,
            roles: ["national_manager", "view_only", "super_admin", "system_admin"],
          },
          {
            title: "Warehouse Reports",
            href: "/warehouse/reports",
            icon: BarChart3,
            roles: ["national_manager", "view_only", "super_admin", "system_admin"],
          },
        ],
      },
      {
        title: "Local Councils",
        icon: Building2,
        roles: ["lc_officer", "district_officer", "view_only", "super_admin", "system_admin"],
        items: [
          {
            title: "Council Receipts",
            href: "/councils/receipts",
            icon: CheckCircle,
            roles: ["lc_officer", "district_officer", "view_only", "super_admin", "system_admin"],
          },
          {
            title: "Council Inventory",
            href: "/councils/inventory",
            icon: Package,
            roles: ["lc_officer", "district_officer", "view_only", "super_admin", "system_admin"],
          },
          {
            title: "Distributions to Schools",
            href: "/councils/distributions",
            icon: Truck,
            roles: ["lc_officer", "district_officer", "view_only", "super_admin", "system_admin"],
          },
          {
            title: "Council Reports",
            href: "/councils/reports",
            icon: FileText,
            roles: ["lc_officer", "district_officer", "view_only", "super_admin", "system_admin"],
          },
        ],
      },
      {
        title: "Schools",
        icon: School,
        roles: ["school_rep", "lc_officer", "district_officer", "view_only", "super_admin", "system_admin"],
        items: [
          {
            title: "School Receipts",
            href: "/schools/receipts",
            icon: CheckCircle,
            roles: ["school_rep", "view_only", "super_admin", "system_admin"],
          },
          {
            title: "School Inventory",
            href: "/schools/inventory",
            icon: Package,
            roles: ["school_rep", "lc_officer", "district_officer", "view_only", "super_admin", "system_admin"],
          },
          {
            title: "School Management",
            href: "/schools/manage",
            icon: Settings,
            roles: ["lc_officer", "district_officer", "view_only", "super_admin", "system_admin"],
          },
          {
            title: "School Reports",
            href: "/schools/reports",
            icon: BarChart3,
            roles: ["school_rep", "lc_officer", "district_officer", "view_only", "super_admin", "system_admin"],
          },
        ],
      },
    ],
  },
  // {
  //   title: "Reports",
  //   icon: BarChart3,
  //   roles: ["all"],
  //   items: [
  //     {
  //       title: "Dashboard Reports",
  //       href: "/reports",
  //       icon: BarChart3,
  //       roles: ["all"],
  //     },
  //     {
  //       title: "My Reports", 
  //       href: "/reports/my-reports",
  //       icon: FileText,
  //       roles: ["all"],
  //     },
  //     {
  //       title: "Report Builder",
  //       href: "/reports/builder",
  //       icon: Settings,
  //       roles: ["all"],
  //     },
  //     {
  //       title: "Downloads",
  //       href: "/reports/downloads",
  //       icon: Download,
  //       roles: ["all"],
  //     },
  //   ],
  // },
  {
    title: "System Administration",
    icon: Settings,
    roles: ["super_admin", "system_admin"],
    items: [
      {
        title: "User Management",
        href: "/admin/users",
        icon: Users,
        roles: ["super_admin", "system_admin"],
      },
      {
        title: "Item Master",
        href: "/admin/items",
        icon: Package,
        roles: ["super_admin", "system_admin"],
      },
      {
        title: "School Management",
        href: "/admin/schools",
        icon: School,
        roles: ["super_admin", "system_admin"],
      },
      {
        title: "Council Management",
        href: "/admin/councils",
        icon: MapPin,
        roles: ["super_admin", "system_admin"],
      },
      {
        title: "Warehouse Management",
        href: "/admin/warehouses",
        icon: Warehouse,
        roles: ["super_admin", "system_admin"],
      },
      {
        title: "System Audit Trail",
        href: "/admin/audit-trail",
        icon: Eye,
        roles: ["super_admin", "system_admin"],
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { canViewSection } = usePermissions();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { isTouchDevice } = useResponsive();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  const userRole = user?.role || "view_only";

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const isItemVisible = (roles: (UserRole | "all")[]) => {
    if (roles.includes("all")) return true;

    // Use permission system for better role augmentation
    return canViewSection(roles.filter((role): role is UserRole => role !== "all"));
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const handleLinkClick = () => {
    if (mounted && isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar className="border-r border-sidebar-border" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <Warehouse className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="text-lg font-bold text-sidebar-foreground">
              LoMEMIS
            </h2>
            <p className="text-xs text-sidebar-foreground/70">
              Government of Sierra Leone
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu>
          {navigationItems.map((item) => {
            if (!isItemVisible(item.roles)) return null;

            if (item.items) {
              const hasActiveSubItem = item.items.some(
                (subItem) =>
                  isItemVisible(subItem.roles) &&
                  (subItem.href
                    ? isActive(subItem.href)
                    : subItem.items?.some(
                        (nestedItem) =>
                          isItemVisible(nestedItem.roles) &&
                          isActive(nestedItem.href!)
                      ))
              );
              const isExpanded = expandedItems.includes(item.title);

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => toggleExpanded(item.title)}
                    className={cn(
                      "w-full justify-between",
                      hasActiveSubItem && "nav-active",
                      // Enhanced touch targets
                      isTouchDevice && "min-h-11 sm:min-h-8"
                    )}
                    tooltip={state === "collapsed" ? item.title : undefined}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="w-4 h-4" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </div>
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 transition-transform group-data-[collapsible=icon]:hidden",
                        isExpanded && "rotate-90"
                      )}
                    />
                  </SidebarMenuButton>
                  {(isExpanded || state === "collapsed") && (
                    <SidebarMenuSub>
                      {item.items
                        .filter((subItem) => isItemVisible(subItem.roles))
                        .map((subItem) => {
                          // Handle nested sub-items
                          if (subItem.items) {
                            const hasActiveNestedItem = subItem.items.some(
                              (nestedItem) =>
                                isItemVisible(nestedItem.roles) &&
                                isActive(nestedItem.href!)
                            );
                            const isSubExpanded = expandedItems.includes(
                              `${item.title}-${subItem.title}`
                            );

                            return (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  onClick={() =>
                                    toggleExpanded(
                                      `${item.title}-${subItem.title}`
                                    )
                                  }
                                  className={cn(
                                    "w-full justify-between",
                                    hasActiveNestedItem && "nav-active",
                                    // Enhanced touch targets
                                    isTouchDevice && "min-h-11 sm:min-h-7"
                                  )}
                                  wrapLabels
                                >
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    {subItem.icon && (
                                      <subItem.icon className="w-4 h-4" />
                                    )}
                                    <span className="whitespace-normal break-words leading-5" title={subItem.title}>
                                      {subItem.title}
                                    </span>
                                  </div>
                                  <ChevronRight
                                    className={cn(
                                      "w-3 h-3 transition-transform",
                                      isSubExpanded && "rotate-90"
                                    )}
                                  />
                                </SidebarMenuSubButton>
                                {isSubExpanded && (
                                  <div className="ml-6 mt-1 space-y-1">
                                    {subItem.items
                                      .filter((nestedItem) =>
                                        isItemVisible(nestedItem.roles)
                                      )
                                      .map((nestedItem) => (
                                        <SidebarMenuSubButton
                                          key={nestedItem.href}
                                          asChild
                                          isActive={isActive(nestedItem.href!)}
                                          className={cn(
                                            "text-sm",
                                            isActive(nestedItem.href!) && "nav-active",
                                            // Enhanced touch targets
                                            isTouchDevice && "min-h-10 sm:min-h-7"
                                          )}
                                        wrapLabels
                                        >
                                          <Link
                                            href={nestedItem.href!}
                                            onClick={handleLinkClick}
                                          >
                                            {nestedItem.icon && (
                                              <nestedItem.icon className="w-3 h-3" />
                                            )}
                                            <span className="whitespace-normal break-words leading-5" title={nestedItem.title}>
                                              {nestedItem.title}
                                            </span>
                                          </Link>
                                        </SidebarMenuSubButton>
                                      ))}
                                  </div>
                                )}
                              </SidebarMenuSubItem>
                            );
                          }

                          // Handle regular sub-items
                          return (
                            <SidebarMenuSubItem key={subItem.href}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActive(subItem.href!)}
                                className={cn(
                                  isActive(subItem.href!) && "nav-active",
                                  // Enhanced touch targets
                                  isTouchDevice && "min-h-11 sm:min-h-8"
                                )}
                                wrapLabels
                              >
                                <Link
                                  href={subItem.href!}
                                  onClick={handleLinkClick}
                                >
                                  {subItem.icon && (
                                    <subItem.icon className="w-4 h-4" />
                                  )}
                                  <span className="whitespace-normal break-words leading-5" title={subItem.title}>
                                    {subItem.title}
                                  </span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              );
            }

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.href!)}
                  tooltip={state === "collapsed" ? item.title : undefined}
                  className={cn(
                    isActive(item.href!) && "nav-active",
                    // Enhanced touch targets
                    isTouchDevice && "min-h-11 sm:min-h-8"
                  )}
                >
                  <Link href={item.href!} onClick={handleLinkClick}>
                    <item.icon className="w-4 h-4" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="text-xs text-sidebar-foreground/70 text-center group-data-[collapsible=icon]:hidden">
          <p>Version 1.0.0</p>
          <p>© 2025 Government of Sierra Leone</p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
