import { BREAKPOINTS, DeviceType, Orientation } from "./breakpoints";

export function getDeviceType(width: number): DeviceType {
  if (width < BREAKPOINTS.md) return "mobile";
  if (width < BREAKPOINTS.lg) return "tablet";
  return "desktop";
}

export function getOrientation(width: number, height: number): Orientation {
  return width > height ? "landscape" : "portrait";
}

export function isBreakpoint(width: number, breakpoint: keyof typeof BREAKPOINTS): boolean {
  return width >= BREAKPOINTS[breakpoint];
}

export function isMobile(width: number): boolean {
  return width < BREAKPOINTS.md;
}

export function isTablet(width: number): boolean {
  return width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
}

export function isDesktop(width: number): boolean {
  return width >= BREAKPOINTS.lg;
}

export function getResponsiveGridCols(
  itemCount: number,
  deviceType: DeviceType,
  maxCols: { mobile: number; tablet: number; desktop: number } = { mobile: 1, tablet: 2, desktop: 4 }
): number {
  const maxForDevice = maxCols[deviceType];
  return Math.min(itemCount, maxForDevice);
}

export function getResponsiveValue<T>(
  values: Partial<Record<DeviceType, T>>,
  deviceType: DeviceType,
  fallback: T
): T {
  return values[deviceType] ?? fallback;
}

export function createResponsiveGridClasses(
  columns: Partial<Record<DeviceType | keyof typeof BREAKPOINTS, number>>
): string {
  const classes: string[] = [];
  
  if (columns.mobile !== undefined) {
    classes.push(`grid-cols-${columns.mobile}`);
  }
  
  if (columns.sm !== undefined) {
    classes.push(`sm:grid-cols-${columns.sm}`);
  }
  
  if (columns.tablet !== undefined || columns.md !== undefined) {
    const cols = columns.tablet ?? columns.md;
    classes.push(`md:grid-cols-${cols}`);
  }
  
  if (columns.lg !== undefined) {
    classes.push(`lg:grid-cols-${columns.lg}`);
  }
  
  if (columns.desktop !== undefined || columns.xl !== undefined) {
    const cols = columns.desktop ?? columns.xl;
    classes.push(`xl:grid-cols-${cols}`);
  }
  
  if (columns["2xl"] !== undefined) {
    classes.push(`2xl:grid-cols-${columns["2xl"]}`);
  }
  
  return classes.join(" ");
}

export function getTouchTargetSize(isTouchDevice: boolean): string {
  return isTouchDevice ? "h-11" : "h-10";
}

export function getResponsiveFontSize(deviceType: DeviceType): string {
  switch (deviceType) {
    case "mobile":
      return "text-base";
    case "tablet":
      return "text-sm";
    case "desktop":
      return "text-sm";
    default:
      return "text-sm";
  }
}

export function getResponsivePadding(deviceType: DeviceType): string {
  switch (deviceType) {
    case "mobile":
      return "p-4";
    case "tablet":
      return "p-6";
    case "desktop":
      return "p-6";
    default:
      return "p-4";
  }
}

export function getResponsiveSpacing(deviceType: DeviceType): string {
  switch (deviceType) {
    case "mobile":
      return "space-y-4";
    case "tablet":
      return "space-y-6";
    case "desktop":
      return "space-y-6";
    default:
      return "space-y-4";
  }
}