"use client";

import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut, Settings, User, Menu, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { WebSocketDebugPanel } from "@/components/debug/WebSocketDebug";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useResponsive } from "@/hooks/useResponsive";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export function Header() {
  const { user, logout } = useAuth();
  const { isMobile } = useSidebar();
  const { isTouchDevice, deviceType, width } = useResponsive();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      super_admin: "Super Administrator",
      system_admin: "System Administrator",
      national_manager: "National Warehouse Manager",
      lc_officer: "Local Council Officer",
      district_officer: "District Education Officer",
      school_rep: "School Representative",
      view_only: "View Only User",
    };
    return roleMap[role] || role;
  };

  return (
    <header className={cn(
      "flex items-center justify-between bg-card border-b border-border",
      // Responsive padding and spacing
      "px-4 md:px-6 py-3 md:py-4",
      // Enhanced mobile spacing for touch devices
      isTouchDevice && "py-4 sm:py-3",
      // Safe area handling for mobile notches
      "safe-area-inset-top"
    )}>
      <div className="flex items-center space-x-2 md:space-x-4">
        <SidebarTrigger />
        <div className="hidden sm:block">
          <h1 className={cn(
            "font-semibold text-foreground",
            // Responsive title sizing
            deviceType === "mobile" ? "text-base" :
            deviceType === "tablet" ? "text-lg" : "text-xl"
          )}>
            Teaching and Learning Materials Management
          </h1>
          <p className={cn(
            "text-muted-foreground",
            deviceType === "mobile" ? "text-xs" : "text-sm"
          )}>
            Government of Sierra Leone
          </p>
        </div>
        <div className="sm:hidden">
          <h1 className="text-base font-semibold text-foreground">LoMEMIS</h1>
          <p className="text-xs text-muted-foreground hidden xs:block">
            Sierra Leone TLM System
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-1 md:space-x-2">
        {/* Notifications */}
        <NotificationBell className={cn(
          // Enhanced touch targets for mobile
          isTouchDevice && "touch-manipulation"
        )} />

        {/* Settings - Show on tablet/desktop only */}
        <div className="hidden md:block">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  asChild
                  className={cn(
                    isTouchDevice && "w-11 h-11 lg:w-10 lg:h-10"
                  )}
                >
                  <Link href="/profile">
                    <Settings className={cn(
                      isTouchDevice ? "w-5 h-5 lg:w-4 lg:h-4" : "w-4 h-4"
                    )} />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "flex items-center space-x-2 rounded-md hover:bg-muted/50",
                // Enhanced touch targets
                isTouchDevice ? 
                  "px-3 py-3 sm:px-2 sm:py-2 md:px-3" : 
                  "px-2 md:px-3 py-2",
                // Touch manipulation for better mobile performance
                "touch-manipulation"
              )}
            >
              <div className={cn(
                "bg-primary rounded-full flex items-center justify-center",
                // Responsive avatar sizing
                isTouchDevice ? 
                  "w-8 h-8 sm:w-6 sm:h-6 md:w-8 md:h-8" :
                  "w-6 h-6 md:w-8 md:h-8"
              )}>
                <User className={cn(
                  "text-primary-foreground",
                  isTouchDevice ?
                    "w-4 h-4 sm:w-3 sm:h-3 md:w-4 md:h-4" :
                    "w-3 h-3 md:w-4 md:h-4"
                )} />
              </div>
              {/* Show user info on larger screens */}
              <div className="hidden lg:block text-sm text-left">
                <p className="font-medium text-foreground">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.role ? getRoleDisplayName(user.role) : ""}
                </p>
              </div>
              <ChevronDown className={cn(
                "text-muted-foreground",
                isTouchDevice ?
                  "w-4 h-4 sm:w-3 sm:h-3 md:w-4 md:h-4" :
                  "w-3 h-3 md:w-4 md:h-4"
              )} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className={cn(
              "w-56",
              // Enhanced mobile dropdown sizing
              isTouchDevice && "w-64 sm:w-56"
            )}
            sideOffset={8}
          >
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className={cn(
                  "font-medium",
                  isTouchDevice ? "text-base sm:text-sm" : "text-sm"
                )}>
                  {user?.name || "User"}
                </p>
                <p className={cn(
                  "text-muted-foreground",
                  isTouchDevice ? "text-sm sm:text-xs" : "text-xs"
                )}>
                  {user?.email}
                </p>
                <p className={cn(
                  "text-muted-foreground",
                  isTouchDevice ? "text-sm sm:text-xs" : "text-xs"
                )}>
                  {user?.role ? getRoleDisplayName(user.role) : ""}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link 
                href="/profile" 
                className={cn(
                  "flex items-center",
                  // Enhanced touch targets
                  isTouchDevice && "py-3 sm:py-2"
                )}
              >
                <User className={cn(
                  "mr-2",
                  isTouchDevice ? "w-5 h-5 sm:w-4 sm:h-4" : "w-4 h-4"
                )} />
                <span className={cn(
                  isTouchDevice ? "text-base sm:text-sm" : "text-sm"
                )}>
                  Profile
                </span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link 
                href="/profile" 
                className={cn(
                  "flex items-center",
                  // Enhanced touch targets
                  isTouchDevice && "py-3 sm:py-2"
                )}
              >
                <Settings className={cn(
                  "mr-2",
                  isTouchDevice ? "w-5 h-5 sm:w-4 sm:h-4" : "w-4 h-4"
                )} />
                <span className={cn(
                  isTouchDevice ? "text-base sm:text-sm" : "text-sm"
                )}>
                  Settings
                </span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className={cn(
                "text-destructive focus:text-destructive",
                // Enhanced touch targets
                isTouchDevice && "py-3 sm:py-2"
              )}
            >
              <LogOut className={cn(
                "mr-2",
                isTouchDevice ? "w-5 h-5 sm:w-4 sm:h-4" : "w-4 h-4"
              )} />
              <span className={cn(
                isTouchDevice ? "text-base sm:text-sm" : "text-sm"
              )}>
                Sign Out
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Development WebSocket Debug Panel - Hidden for production */}
      {/* <WebSocketDebugPanel /> */}
    </header>
  );
}
