"use client";

import React, { createContext, useContext } from "react";
import { useResponsive } from "@/hooks/useResponsive";
import { DeviceType } from "@/utils/breakpoints";

interface ResponsiveLayoutContextType {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: DeviceType;
  isTouchDevice: boolean;
  getResponsivePadding: () => string;
  getResponsiveSpacing: () => string;
  getResponsiveMaxWidth: () => string;
}

const ResponsiveLayoutContext = createContext<ResponsiveLayoutContextType | null>(null);

export function useResponsiveLayout() {
  const context = useContext(ResponsiveLayoutContext);
  if (!context) {
    throw new Error("useResponsiveLayout must be used within ResponsiveLayoutProvider");
  }
  return context;
}

export function ResponsiveLayoutProvider({ children }: { children: React.ReactNode }) {
  const responsive = useResponsive();

  const getResponsivePadding = () => {
    switch (responsive.deviceType) {
      case "mobile":
        return "px-4 py-4";
      case "tablet":
        return "px-6 py-5";
      case "desktop":
        return "px-6 py-6";
      default:
        return "px-4 py-4";
    }
  };

  const getResponsiveSpacing = () => {
    switch (responsive.deviceType) {
      case "mobile":
        return "space-y-4";
      case "tablet":
        return "space-y-5";
      case "desktop":
        return "space-y-6";
      default:
        return "space-y-4";
    }
  };

  const getResponsiveMaxWidth = () => {
    switch (responsive.deviceType) {
      case "mobile":
        return "max-w-none";
      case "tablet":
        return "max-w-4xl";
      case "desktop":
        return "max-w-7xl";
      default:
        return "max-w-none";
    }
  };

  const contextValue: ResponsiveLayoutContextType = {
    ...responsive,
    getResponsivePadding,
    getResponsiveSpacing,
    getResponsiveMaxWidth,
  };

  return (
    <ResponsiveLayoutContext.Provider value={contextValue}>
      {children}
    </ResponsiveLayoutContext.Provider>
  );
}