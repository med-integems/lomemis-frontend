"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useResponsive } from "@/hooks/useResponsive";

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  spacing?: "sm" | "md" | "lg" | "xl";
  centerContent?: boolean;
  noPadding?: boolean;
}

export function ResponsiveContainer({
  children,
  className,
  size = "full",
  spacing = "md",
  centerContent = false,
  noPadding = false,
}: ResponsiveContainerProps) {
  const { deviceType, isTouchDevice } = useResponsive();

  const getSizeClasses = () => {
    const sizeMap = {
      sm: "max-w-2xl",
      md: "max-w-4xl", 
      lg: "max-w-6xl",
      xl: "max-w-7xl",
      full: "max-w-none w-full",
    };
    return sizeMap[size];
  };

  const getSpacingClasses = () => {
    if (noPadding) return "";

    const spacingMap = {
      sm: deviceType === "mobile" ? "p-2" : "p-3",
      md: deviceType === "mobile" ? "p-4" : deviceType === "tablet" ? "p-5" : "p-6",
      lg: deviceType === "mobile" ? "p-4" : deviceType === "tablet" ? "p-6" : "p-8",
      xl: deviceType === "mobile" ? "p-6" : deviceType === "tablet" ? "p-8" : "p-10",
    };
    return spacingMap[spacing];
  };

  return (
    <div
      className={cn(
        // Base container styles
        "w-full",
        getSizeClasses(),
        getSpacingClasses(),
        // Center content if requested
        centerContent && "mx-auto",
        // Touch optimization
        isTouchDevice && "touch-manipulation",
        className
      )}
    >
      {children}
    </div>
  );
}

// Specialized containers for common use cases
export function ResponsivePageContainer({ 
  children, 
  className,
  ...props 
}: Omit<ResponsiveContainerProps, "size" | "centerContent">) {
  return (
    <ResponsiveContainer
      size="xl"
      centerContent
      className={cn("min-h-full", className)}
      {...props}
    >
      {children}
    </ResponsiveContainer>
  );
}

export function ResponsiveFormContainer({ 
  children, 
  className,
  ...props 
}: Omit<ResponsiveContainerProps, "size" | "centerContent">) {
  return (
    <ResponsiveContainer
      size="md"
      centerContent
      className={cn("bg-card rounded-lg border shadow-sm", className)}
      {...props}
    >
      {children}
    </ResponsiveContainer>
  );
}

export function ResponsiveModalContainer({ 
  children, 
  className,
  ...props 
}: Omit<ResponsiveContainerProps, "size">) {
  const { deviceType } = useResponsive();
  
  return (
    <ResponsiveContainer
      size={deviceType === "mobile" ? "full" : "lg"}
      className={cn(
        deviceType === "mobile" ? "h-full" : "max-h-[90vh] overflow-auto",
        className
      )}
      {...props}
    >
      {children}
    </ResponsiveContainer>
  );
}