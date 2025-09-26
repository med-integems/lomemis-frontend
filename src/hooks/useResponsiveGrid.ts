import { useMemo } from "react";
import { useResponsive } from "./useResponsive";
import { DeviceType } from "@/utils/breakpoints";
import { getResponsiveGridCols, createResponsiveGridClasses } from "@/utils/responsive";

export interface ResponsiveGridConfig {
  mobile: number;
  tablet: number;
  desktop: number;
}

export interface UseResponsiveGridProps<T> {
  items: T[];
  columns: ResponsiveGridConfig;
  gap?: string;
}

export interface UseResponsiveGridReturn<T> {
  chunkedItems: T[][];
  currentColumns: number;
  gridClasses: string;
  itemsPerRow: number;
  totalRows: number;
}

export function useResponsiveGrid<T>({
  items,
  columns,
  gap = "gap-4",
}: UseResponsiveGridProps<T>): UseResponsiveGridReturn<T> {
  const { deviceType } = useResponsive();

  const currentColumns = useMemo(() => {
    if (items.length === 0) {
      return columns[deviceType];
    }
    return getResponsiveGridCols(items.length, deviceType, columns);
  }, [items.length, deviceType, columns]);

  const chunkedItems = useMemo(() => {
    if (items.length === 0) return [];
    
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += currentColumns) {
      chunks.push(items.slice(i, i + currentColumns));
    }
    return chunks;
  }, [items, currentColumns]);

  const gridClasses = useMemo(() => {
    const baseClasses = `grid ${gap}`;
    const responsiveClasses = createResponsiveGridClasses({
      mobile: columns.mobile,
      tablet: columns.tablet,
      desktop: columns.desktop,
    });
    return `${baseClasses} ${responsiveClasses}`;
  }, [columns, gap]);

  const totalRows = Math.ceil(items.length / currentColumns);

  return {
    chunkedItems,
    currentColumns,
    gridClasses,
    itemsPerRow: currentColumns,
    totalRows,
  };
}

// Specialized hook for KPI cards
export function useResponsiveKPIGrid<T>(
  items: T[],
  userRole?: string
): UseResponsiveGridReturn<T> {
  const getKPIColumns = (itemCount: number): ResponsiveGridConfig => {
    if (itemCount <= 2) return { mobile: 1, tablet: 2, desktop: 2 };
    if (itemCount <= 4) return { mobile: 1, tablet: 2, desktop: 4 };
    if (itemCount <= 6) return { mobile: 1, tablet: 2, desktop: 3 };
    return { mobile: 1, tablet: 2, desktop: 4 };
  };

  return useResponsiveGrid({
    items,
    columns: getKPIColumns(items.length),
    gap: "gap-4",
  });
}

// Specialized hook for inventory cards
export function useResponsiveInventoryGrid<T>(
  items: T[]
): UseResponsiveGridReturn<T> {
  return useResponsiveGrid({
    items,
    columns: { mobile: 1, tablet: 2, desktop: 3 },
    gap: "gap-6",
  });
}

// Specialized hook for admin cards
export function useResponsiveAdminGrid<T>(
  items: T[]
): UseResponsiveGridReturn<T> {
  return useResponsiveGrid({
    items,
    columns: { mobile: 1, tablet: 2, desktop: 3 },
    gap: "gap-4",
  });
}