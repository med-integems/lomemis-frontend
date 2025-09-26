"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useResponsive } from "@/hooks/useResponsive";

interface ResponsiveDashboardGridProps {
  children: React.ReactNode;
  className?: string;
  spacing?: "sm" | "md" | "lg";
  minItemWidth?: number;
  maxColumns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

export function ResponsiveDashboardGrid({
  children,
  className,
  spacing = "md",
  minItemWidth = 280,
  maxColumns = { mobile: 1, tablet: 2, desktop: 4 },
}: ResponsiveDashboardGridProps) {
  const { deviceType, width } = useResponsive();

  const getSpacingClasses = () => {
    switch (spacing) {
      case "sm":
        return "gap-3";
      case "lg":
        return deviceType === "mobile" ? "gap-5" : "gap-8";
      default:
        return deviceType === "mobile" ? "gap-4" : "gap-6";
    }
  };

  const getOptimalColumns = () => {
    const availableWidth = width - (deviceType === "mobile" ? 32 : 48); // Account for padding
    const calculatedColumns = Math.floor(availableWidth / minItemWidth);
    
    return Math.min(calculatedColumns, maxColumns[deviceType] || maxColumns.desktop);
  };

  const columns = getOptimalColumns();

  return (
    <div className={cn(
      "grid w-full",
      // Dynamic grid columns based on content width and device
      `grid-cols-${Math.max(1, Math.min(columns, maxColumns.mobile))}`,
      `md:grid-cols-${Math.max(1, Math.min(columns, maxColumns.tablet))}`,
      `lg:grid-cols-${Math.max(1, Math.min(columns, maxColumns.desktop))}`,
      // Responsive spacing
      getSpacingClasses(),
      // Auto-fit for equal height items when possible
      "auto-rows-fr",
      className
    )}>
      {children}
    </div>
  );
}

// Dashboard section wrapper with responsive title and description
interface DashboardSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function DashboardSection({
  title,
  description,
  children,
  className,
  actions,
  collapsible = false,
  defaultCollapsed = false,
}: DashboardSectionProps) {
  const { deviceType } = useResponsive();
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className={cn(
            "font-semibold tracking-tight",
            deviceType === "mobile" ? "text-xl" : "text-2xl"
          )}>
            {collapsible && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="mr-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={isCollapsed ? "Expand section" : "Collapse section"}
              >
                <span className={cn(
                  "inline-block transition-transform",
                  isCollapsed ? "rotate-0" : "rotate-90"
                )}>
                  ▶
                </span>
              </button>
            )}
            {title}
          </h2>
          {description && (
            <p className={cn(
              "text-muted-foreground",
              deviceType === "mobile" ? "text-sm" : "text-base"
            )}>
              {description}
            </p>
          )}
        </div>
        {actions && !isCollapsed && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
      
      {!isCollapsed && (
        <div className={cn(
          "transition-all duration-200 ease-in-out",
          isCollapsed ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
        )}>
          {children}
        </div>
      )}
    </div>
  );
}

// Responsive dashboard layout wrapper
interface ResponsiveDashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

export function ResponsiveDashboardLayout({
  children,
  className,
  sidebar,
  header,
  maxWidth = "full",
}: ResponsiveDashboardLayoutProps) {
  const { deviceType } = useResponsive();

  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case "sm":
        return "max-w-screen-sm";
      case "md":
        return "max-w-screen-md";
      case "lg":
        return "max-w-screen-lg";
      case "xl":
        return "max-w-screen-xl";
      default:
        return "max-w-none";
    }
  };

  return (
    <div className={cn(
      "min-h-screen bg-background",
      className
    )}>
      {header && (
        <div className={cn(
          "sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b",
          deviceType === "mobile" ? "px-4 py-3" : "px-6 py-4"
        )}>
          {header}
        </div>
      )}
      
      <div className={cn(
        "flex flex-1",
        deviceType === "mobile" && sidebar ? "flex-col" : "flex-row"
      )}>
        {sidebar && (
          <div className={cn(
            "bg-muted/30 border-r",
            deviceType === "mobile" 
              ? "order-2 border-r-0 border-t" 
              : "w-64 flex-shrink-0"
          )}>
            {sidebar}
          </div>
        )}
        
        <main className={cn(
          "flex-1 overflow-hidden",
          deviceType === "mobile" ? "order-1" : ""
        )}>
          <div className={cn(
            "mx-auto h-full",
            getMaxWidthClass(),
            deviceType === "mobile" ? "px-4 py-6" : "px-6 py-8"
          )}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// Responsive widget container for dashboard components
interface DashboardWidgetProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  loading?: boolean;
  error?: string;
  actions?: React.ReactNode;
  span?: {
    mobile?: number;
    tablet?: number;  
    desktop?: number;
  };
}

export function DashboardWidget({
  children,
  title,
  description,
  className,
  loading = false,
  error,
  actions,
  span,
}: DashboardWidgetProps) {
  const { deviceType } = useResponsive();

  const getSpanClasses = () => {
    if (!span) return "";
    
    const classes = [];
    if (span.mobile) classes.push(`col-span-${span.mobile}`);
    if (span.tablet) classes.push(`md:col-span-${span.tablet}`);
    if (span.desktop) classes.push(`lg:col-span-${span.desktop}`);
    
    return classes.join(" ");
  };

  if (error) {
    return (
      <div className={cn(
        "rounded-lg border border-destructive/50 bg-destructive/10 p-4",
        getSpanClasses(),
        className
      )}>
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 rounded-full bg-destructive" />
          <p className={cn(
            "font-medium text-destructive",
            deviceType === "mobile" ? "text-sm" : "text-sm"
          )}>
            Error loading widget
          </p>
        </div>
        <p className={cn(
          "text-destructive/80 mt-1",
          deviceType === "mobile" ? "text-xs" : "text-sm"
        )}>
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "space-y-3",
      getSpanClasses(),
      className
    )}>
      {(title || description || actions) && (
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {title && (
              <h3 className={cn(
                "font-medium tracking-tight",
                deviceType === "mobile" ? "text-lg" : "text-xl"
              )}>
                {title}
              </h3>
            )}
            {description && (
              <p className={cn(
                "text-muted-foreground",
                deviceType === "mobile" ? "text-xs" : "text-sm"
              )}>
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      )}
      
      <div className={cn(
        loading && "opacity-60 pointer-events-none"
      )}>
        {children}
      </div>
    </div>
  );
}