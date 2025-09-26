export const BREAKPOINTS = {
  xs: 0,      // Extra small devices
  sm: 640,    // Small devices (large phones)
  md: 768,    // Medium devices (tablets)
  lg: 1024,   // Large devices (small laptops)
  xl: 1280,   // Extra large devices (large laptops)
  "2xl": 1536 // 2X Extra large devices (desktop monitors)
} as const;

export const BREAKPOINT_QUERIES = {
  xs: `(max-width: ${BREAKPOINTS.sm - 1}px)`,
  sm: `(min-width: ${BREAKPOINTS.sm}px) and (max-width: ${BREAKPOINTS.md - 1}px)`,
  md: `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`,
  lg: `(min-width: ${BREAKPOINTS.lg}px) and (max-width: ${BREAKPOINTS.xl - 1}px)`,
  xl: `(min-width: ${BREAKPOINTS.xl}px) and (max-width: ${BREAKPOINTS["2xl"] - 1}px)`,
  "2xl": `(min-width: ${BREAKPOINTS["2xl"]}px)`
} as const;

export const DEVICE_QUERIES = {
  mobile: `(max-width: ${BREAKPOINTS.md - 1}px)`,
  tablet: `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`,
  desktop: `(min-width: ${BREAKPOINTS.lg}px)`,
  tabletLandscape: `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px) and (orientation: landscape)`,
  tabletPortrait: `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px) and (orientation: portrait)`
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;
export type DeviceType = "mobile" | "tablet" | "desktop";
export type Orientation = "portrait" | "landscape";