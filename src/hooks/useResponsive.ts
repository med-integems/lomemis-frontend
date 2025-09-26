"use client";

import { useState, useEffect, useCallback } from "react";
import { DeviceType, Orientation } from "@/utils/breakpoints";
import { getDeviceType, getOrientation, isMobile, isTablet, isDesktop } from "@/utils/responsive";

export interface UseResponsiveReturn {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: DeviceType;
  orientation: Orientation;
  isLandscape: boolean;
  isPortrait: boolean;
  isTouchDevice: boolean;
}

export function useResponsive(): UseResponsiveReturn {
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>({
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768,
  });

  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const updateDimensions = useCallback(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect touch device
    setIsTouchDevice(
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-expect-error - Legacy property for IE compatibility
      navigator.msMaxTouchPoints > 0
    );

    // Set initial dimensions
    updateDimensions();

    // Add event listeners
    window.addEventListener("resize", updateDimensions);
    window.addEventListener("orientationchange", updateDimensions);

    // Cleanup
    return () => {
      window.removeEventListener("resize", updateDimensions);
      window.removeEventListener("orientationchange", updateDimensions);
    };
  }, [updateDimensions]);

  const deviceType = getDeviceType(dimensions.width);
  const orientation = getOrientation(dimensions.width, dimensions.height);

  return {
    width: dimensions.width,
    height: dimensions.height,
    isMobile: isMobile(dimensions.width),
    isTablet: isTablet(dimensions.width),
    isDesktop: isDesktop(dimensions.width),
    deviceType,
    orientation,
    isLandscape: orientation === "landscape",
    isPortrait: orientation === "portrait",
    isTouchDevice,
  };
}