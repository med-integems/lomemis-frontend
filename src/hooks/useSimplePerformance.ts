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
