"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Menu,
  Home,
  Package,
  Truck,
  Building2,
  BarChart3,
  Settings,
  Users,
  School,
  MapPin,
  Warehouse,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { NavigationItem, UserRole } from "@/types";
import { cn } from "@/lib/utils";

// Same navigation items as the main sidebar
const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/dashboard",
    roles: ["all"],
  },
  {
    title: "TLM Management",
    icon: Package,
    roles: ["national_manager", "lc_officer", "super_admin"],
    items: [
      {
        title: "National Warehouses",
        href: "/inventory/national",
        roles: ["national_manager", "super_admin"],
      },
      {
        title: "Local Councils",
        href: "/inventory/councils",
        roles: ["lc_officer", "super_admin"],
      },
    ],
  },
  {
    title: "Shipments",
    icon: Truck,
    href: "/warehouse/shipments",
    roles: ["national_manager", "lc_officer", "super_admin"],
  },
  {
    title: "Distributions",
    icon: Building2,
    href: "/distributions",
    roles: ["lc_officer", "school_rep", "super_admin"],
  },
  // {
  //   title: "Reports",
  //   icon: BarChart3,
  //   href: "/reports",
  //   roles: ["all"],
  // },
  {
    title: "System Administration",
    icon: Settings,
    roles: ["super_admin"],
    items: [
      {
        title: "User Management",
        href: "/admin/users",
        icon: Users,
        roles: ["super_admin"],
      },
      {
        title: "Item Master",
        href: "/admin/items",
        icon: Package,
        roles: ["super_admin"],
      },
      {
        title: "School Management",
        href: "/admin/schools",
        icon: School,
        roles: ["super_admin"],
      },
      {
        title: "Council Management",
        href: "/admin/councils",
        icon: MapPin,
        roles: ["super_admin"],
      },
    ],
  },
];

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);
  const pathname = usePathname();
  const { user } = useAuth();

  const userRole = user?.role || "view_only";

  const isItemVisible = (roles: (UserRole | "all")[]) => {
    return roles.includes("all") || roles.includes(userRole);
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
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("md:hidden", className)}
        >
          <Menu className="w-5 h-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center space-x-2 p-4 border-b">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <Warehouse className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold">LoMEMIS</h2>
              <p className="text-xs text-muted-foreground">
                Government of Sierra Leone
              </p>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 p-4">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                if (!isItemVisible(item.roles)) return null;

                if (item.items) {
                  const hasActiveSubItem = item.items.some(
                    (subItem) =>
                      isItemVisible(subItem.roles) && isActive(subItem.href!)
                  );
                  const isExpanded = expandedItems.includes(item.title);

                  return (
                    <div key={item.title} className="space-y-1">
                      <Button
                        variant="ghost"
                        onClick={() => toggleExpanded(item.title)}
                        className={cn(
                          "w-full justify-between h-12 px-3",
                          hasActiveSubItem && "bg-accent text-accent-foreground"
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </div>
                        <ChevronRight
                          className={cn(
                            "w-4 h-4 transition-transform",
                            isExpanded && "rotate-90"
                          )}
                        />
                      </Button>
                      {isExpanded && (
                        <div className="ml-6 space-y-1">
                          {item.items
                            .filter((subItem) => isItemVisible(subItem.roles))
                            .map((subItem) => (
                              <Button
                                key={subItem.href}
                                variant="ghost"
                                asChild
                                className={cn(
                                  "w-full justify-start h-10 px-3",
                                  isActive(subItem.href!) &&
                                    "bg-accent text-accent-foreground"
                                )}
                              >
                                <Link
                                  href={subItem.href!}
                                  onClick={handleLinkClick}
                                >
                                  {subItem.icon && (
                                    <subItem.icon className="w-4 h-4 mr-3" />
                                  )}
                                  <span>{subItem.title}</span>
                                </Link>
                              </Button>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Button
                    key={item.title}
                    variant="ghost"
                    asChild
                    className={cn(
                      "w-full justify-start h-12 px-3",
                      isActive(item.href!) && "bg-accent text-accent-foreground"
                    )}
                  >
                    <Link href={item.href!} onClick={handleLinkClick}>
                      <item.icon className="w-5 h-5 mr-3" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </Button>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>Version 1.0.0</p>
              <p>© 2025 Government of Sierra Leone</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
