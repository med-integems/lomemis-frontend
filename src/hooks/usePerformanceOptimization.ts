import { useCallback, useMemo, useRef, useEffect, useState } from "react";
import { debounce, throttle } from "lodash";

/**
 * Hook for debounced search functionality
 */
export const useDebouncedSearch = (
  searchFn: (query: string) => void,
  delay: number = 300
) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        setIsSearching(true);
        searchFn(query);
        setIsSearching(false);
      }, delay),
    [searchFn, delay]
  );

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      debouncedSearch(query);
    },
    [debouncedSearch]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return {
    searchQuery,
    handleSearch,
    isSearching,
    clearSearch: () => {
      setSearchQuery("");
      debouncedSearch.cancel();
    },
  };
};

/**
 * Hook for throttled scroll handling
 */
export const useThrottledScroll = (
  callback: (scrollY: number) => void,
  delay: number = 100
) => {
  const throttledCallback = useMemo(
    () => throttle(callback, delay),
    [callback, delay]
  );

  useEffect(() => {
    const handleScroll = () => {
      throttledCallback(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      throttledCallback.cancel();
    };
  }, [throttledCallback]);
};

/**
 * Hook for intersection observer (lazy loading)
 */
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
        ...options,
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [hasIntersected, options]);

  return {
    targetRef,
    isIntersecting,
    hasIntersected,
  };
};

/**
 * Hook for virtual scrolling implementation
 */
export const useVirtualScrolling = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan
    );
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    visibleRange,
  };
};

/**
 * Hook for performance monitoring
 */
export const usePerformanceMonitor = (componentName: string) => {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
  });

  // Track renders without causing infinite loops
  const currentRenderCount = ++renderCountRef.current;
  const currentTime = Date.now();
  const renderTime = currentTime - lastRenderTimeRef.current;
  lastRenderTimeRef.current = currentTime;

  // Update metrics only when render count changes significantly
  useEffect(() => {
    if (currentRenderCount % 10 === 0 || currentRenderCount <= 5) {
      setPerformanceMetrics({
        renderCount: currentRenderCount,
        averageRenderTime: renderTime,
        lastRenderTime: renderTime,
      });
    }

    // Log performance warnings in development
    if (process.env.NODE_ENV === "development") {
      if (renderTime > 16) {
        // More than one frame (60fps)
        console.warn(
          `[Performance] ${componentName} render took ${renderTime}ms (>16ms)`
        );
      }

      if (currentRenderCount === 100) {
        console.warn(
          `[Performance] ${componentName} has rendered ${currentRenderCount} times`
        );
      }
    }
  }, [componentName, currentRenderCount, renderTime]);

  return {
    renderCount: currentRenderCount,
    averageRenderTime: renderTime,
    lastRenderTime: renderTime,
  };
};

/**
 * Hook for memoized calculations
 */
export const useMemoizedCalculation = <T, R>(
  calculation: (data: T) => R,
  data: T,
  dependencies: any[] = []
) => {
  return useMemo(() => {
    const startTime = performance.now();
    const result = calculation(data);
    const endTime = performance.now();

    if (process.env.NODE_ENV === "development" && endTime - startTime > 5) {
      console.warn(
        `[Performance] Expensive calculation took ${(
          endTime - startTime
        ).toFixed(2)}ms`
      );
    }

    return result;
  }, [data, ...dependencies]);
};

/**
 * Hook for optimized event handlers
 */
export const useOptimizedEventHandlers = () => {
  const handlersRef = useRef<Map<string, (...args: any[]) => void>>(new Map());

  const createHandler = useCallback(
    <T extends any[]>(key: string, handler: (...args: T) => void) => {
      if (!handlersRef.current.has(key)) {
        handlersRef.current.set(key, handler);
      }
      return handlersRef.current.get(key) as (...args: T) => void;
    },
    []
  );

  const createThrottledHandler = useCallback(
    <T extends any[]>(
      key: string,
      handler: (...args: T) => void,
      delay: number = 100
    ) => {
      const throttledKey = `${key}_throttled_${delay}`;
      if (!handlersRef.current.has(throttledKey)) {
        handlersRef.current.set(throttledKey, throttle(handler, delay));
      }
      return handlersRef.current.get(throttledKey) as (...args: T) => void;
    },
    []
  );

  const createDebouncedHandler = useCallback(
    <T extends any[]>(
      key: string,
      handler: (...args: T) => void,
      delay: number = 300
    ) => {
      const debouncedKey = `${key}_debounced_${delay}`;
      if (!handlersRef.current.has(debouncedKey)) {
        handlersRef.current.set(debouncedKey, debounce(handler, delay));
      }
      return handlersRef.current.get(debouncedKey) as (...args: T) => void;
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handlersRef.current.forEach((handler: any) => {
        if (handler.cancel) {
          handler.cancel();
        }
      });
      handlersRef.current.clear();
    };
  }, []);

  return {
    createHandler,
    createThrottledHandler,
    createDebouncedHandler,
  };
};

/**
 * Hook for image lazy loading
 */
export const useLazyImage = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholder || "");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const { targetRef, hasIntersected } = useIntersectionObserver();

  useEffect(() => {
    if (!hasIntersected || !src) return;

    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };
    img.onerror = () => {
      setIsError(true);
    };
    img.src = src;
  }, [hasIntersected, src]);

  return {
    imageSrc,
    isLoaded,
    isError,
    targetRef,
  };
};

/**
 * Hook for component size tracking
 */
export const useComponentSize = () => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    resizeObserver.observe(target);

    return () => {
      resizeObserver.unobserve(target);
    };
  }, []);

  return {
    size,
    targetRef,
  };
};

/**
 * Hook for batch operations
 */
export const useBatchOperations = <T>(
  batchSize: number = 10,
  delay: number = 100
) => {
  const [queue, setQueue] = useState<T[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);

  const addToQueue = useCallback((items: T | T[]) => {
    const itemsArray = Array.isArray(items) ? items : [items];
    setQueue((prev) => [...prev, ...itemsArray]);
  }, []);

  const processBatch = useCallback(
    async (processor: (batch: T[]) => Promise<void>) => {
      if (processingRef.current || queue.length === 0) return;

      processingRef.current = true;
      setIsProcessing(true);

      try {
        while (queue.length > 0) {
          const batch = queue.splice(0, batchSize);
          await processor(batch);

          // Small delay between batches to prevent blocking
          if (queue.length > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      } finally {
        processingRef.current = false;
        setIsProcessing(false);
        setQueue([]);
      }
    },
    [queue, batchSize, delay]
  );

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  return {
    queue,
    queueSize: queue.length,
    isProcessing,
    addToQueue,
    processBatch,
    clearQueue,
  };
};

/**
 * Hook for memory usage monitoring
 */
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const getMemoryUsagePercentage = useCallback(() => {
    if (!memoryInfo) return 0;
    return (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
  }, [memoryInfo]);

  return {
    memoryInfo,
    getMemoryUsagePercentage,
    isMemoryInfoAvailable: memoryInfo !== null,
  };
};
