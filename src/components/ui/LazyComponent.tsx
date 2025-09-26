"use client";

import React, { Suspense, lazy, ComponentType } from "react";
import { useIntersectionObserver } from "@/hooks/useSimplePerformance";

interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
  className?: string;
}

/**
 * Lazy loading wrapper component that only renders children when they come into view
 */
export const LazyComponent: React.FC<LazyComponentProps> = ({
  children,
  fallback,
  rootMargin = "50px",
  threshold = 0.1,
  triggerOnce = true,
  className = "",
}) => {
  const { targetRef, isIntersecting, hasIntersected } = useIntersectionObserver(
    {
      rootMargin,
      threshold,
    }
  );

  const shouldRender = triggerOnce ? hasIntersected : isIntersecting;

  return (
    <div ref={targetRef} className={className}>
      {shouldRender
        ? children
        : fallback || (
            <div className="flex items-center justify-center p-8">
              <div className="animate-pulse bg-gray-200 rounded h-20 w-full"></div>
            </div>
          )}
    </div>
  );
};

/**
 * Higher-order component for lazy loading React components
 */
export const withLazyLoading = <P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode
) => {
  const LazyWrappedComponent = lazy(() =>
    Promise.resolve({ default: Component })
  );

  const LazyForwardRefComponent = React.forwardRef<any, P>((props, ref) => (
    <Suspense
      fallback={
        fallback || (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )
      }
    >
      <LazyWrappedComponent {...props} ref={ref} />
    </Suspense>
  ));

  LazyForwardRefComponent.displayName = `LazyComponent(${Component.displayName || Component.name || 'Component'})`;
  return LazyForwardRefComponent;
};

/**
 * Lazy image component with intersection observer
 */
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  className = "",
  onLoad,
  onError,
  ...props
}) => {
  const [imageSrc, setImageSrc] = React.useState(placeholder || "");
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const { targetRef, hasIntersected } = useIntersectionObserver();

  React.useEffect(() => {
    if (!hasIntersected || !src) return;

    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      onLoad?.();
    };
    img.onerror = () => {
      setIsError(true);
      onError?.();
    };
    img.src = src;
  }, [hasIntersected, src, onLoad, onError]);

  return (
    <div ref={targetRef} className={`relative ${className}`}>
      {!hasIntersected ? (
        <div className="animate-pulse bg-gray-200 w-full h-full rounded"></div>
      ) : isError ? (
        <div className="flex items-center justify-center bg-gray-100 w-full h-full rounded">
          <span className="text-gray-400 text-sm">Failed to load</span>
        </div>
      ) : (
        <img
          src={imageSrc}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          {...props}
        />
      )}
    </div>
  );
};

/**
 * Lazy loading wrapper for heavy components
 */
interface LazyHeavyComponentProps {
  children: React.ReactNode;
  minHeight?: number;
  placeholder?: React.ReactNode;
  delay?: number;
}

export const LazyHeavyComponent: React.FC<LazyHeavyComponentProps> = ({
  children,
  minHeight = 200,
  placeholder,
  delay = 0,
}) => {
  const [shouldRender, setShouldRender] = React.useState(false);
  const { targetRef, hasIntersected } = useIntersectionObserver();

  React.useEffect(() => {
    if (hasIntersected) {
      if (delay > 0) {
        const timer = setTimeout(() => setShouldRender(true), delay);
        return () => clearTimeout(timer);
      } else {
        setShouldRender(true);
      }
    }
  }, [hasIntersected, delay]);

  return (
    <div ref={targetRef} style={{ minHeight }}>
      {shouldRender
        ? children
        : placeholder || (
            <div
              className="flex items-center justify-center"
              style={{ height: minHeight }}
            >
              <div className="animate-pulse bg-gray-200 rounded w-full h-full"></div>
            </div>
          )}
    </div>
  );
};

export default LazyComponent;
