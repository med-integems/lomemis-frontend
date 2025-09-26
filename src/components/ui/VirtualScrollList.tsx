"use client";

import React, {
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useState,
} from "react";
import { useVirtualScrolling } from "@/hooks/useSimplePerformance";

interface VirtualScrollListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  estimatedItemSize?: number;
}

const VirtualScrollList = <T,>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = "",
  overscan = 5,
  onScroll,
  loading = false,
  loadingComponent,
  emptyComponent,
}: VirtualScrollListProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const { visibleItems, totalHeight, offsetY, visibleRange } =
    useVirtualScrolling(items, itemHeight, containerHeight, overscan);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    },
    [onScroll]
  );

  // Loading state
  if (loading) {
    return (
      <div
        className={`relative overflow-hidden ${className}`}
        style={{ height: containerHeight }}
      >
        {loadingComponent || (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div
        className={`relative overflow-hidden ${className}`}
        style={{ height: containerHeight }}
      >
        {emptyComponent || (
          <div className="flex items-center justify-center h-full text-gray-500">
            No items to display
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Total height container to maintain scrollbar */}
      <div style={{ height: totalHeight, position: "relative" }}>
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.startIndex + index;
            return (
              <div
                key={actualIndex}
                style={{
                  height: itemHeight,
                  overflow: "hidden",
                }}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default React.memo(VirtualScrollList) as <T>(
  props: VirtualScrollListProps<T>
) => JSX.Element;
