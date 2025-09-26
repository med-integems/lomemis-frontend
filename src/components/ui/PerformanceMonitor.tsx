"use client";

import React, { useState, useEffect } from "react";

interface PerformanceMonitorProps {
  enabled?: boolean;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
  showBadge?: boolean; // controls visual badge visibility
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = false, // Disabled by default to prevent issues
  position = "bottom-right",
  className = "",
  showBadge = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [fps, setFps] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);

  // Prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // FPS monitoring
  useEffect(() => {
    if (!enabled || !isMounted) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        const newFps = Math.round(
          (frameCount * 1000) / (currentTime - lastTime)
        );
        setFps(newFps);
        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [enabled, isMounted]);

  // Memory monitoring
  useEffect(() => {
    if (!enabled || !isMounted) return;

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
    const interval = setInterval(updateMemoryInfo, 5000);

    return () => clearInterval(interval);
  }, [enabled, isMounted]);

  if (!enabled || !isMounted) return null;

  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getPerformanceColor = (
    value: number,
    thresholds: { good: number; warning: number }
  ) => {
    if (value <= thresholds.good) return "text-green-600";
    if (value <= thresholds.warning) return "text-yellow-600";
    return "text-red-600";
  };

  const getMemoryUsagePercentage = () => {
    if (!memoryInfo) return 0;
    return (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
  };

  // If showBadge is false, render nothing visible but keep hooks active to collect metrics
  if (!showBadge) {
    return null;
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
      <div className="bg-black bg-opacity-80 text-white text-xs rounded-lg p-3 font-mono">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">Performance Monitor</span>
          <button
            type="button"
            onClick={() => setIsVisible(!isVisible)}
            className="text-gray-300 hover:text-white"
          >
            {isVisible ? "−" : "+"}
          </button>
        </div>

        {isVisible && (
          <div className="space-y-1 min-w-48">
            {/* FPS */}
            <div className="flex justify-between">
              <span>FPS:</span>
              <span
                className={getPerformanceColor(fps, { good: 55, warning: 30 })}
              >
                {fps}
              </span>
            </div>

            {/* Memory Information */}
            {memoryInfo && (
              <>
                <div className="border-t border-gray-600 pt-1 mt-2">
                  <div className="flex justify-between">
                    <span>Memory:</span>
                    <span
                      className={getPerformanceColor(
                        getMemoryUsagePercentage(),
                        { good: 50, warning: 80 }
                      )}
                    >
                      {getMemoryUsagePercentage().toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Used:</span>
                    <span>{formatBytes(memoryInfo.usedJSHeapSize)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span>{formatBytes(memoryInfo.totalJSHeapSize)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Limit:</span>
                    <span>{formatBytes(memoryInfo.jsHeapSizeLimit)}</span>
                  </div>
                </div>
              </>
            )}

            {/* Performance Warnings */}
            <div className="border-t border-gray-600 pt-1 mt-2">
              {fps < 30 && fps > 0 && (
                <div className="text-red-400 text-xs">⚠ Low FPS detected</div>
              )}
              {memoryInfo && getMemoryUsagePercentage() > 80 && (
                <div className="text-red-400 text-xs">⚠ High memory usage</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(PerformanceMonitor);
