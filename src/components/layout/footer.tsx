"use client";

import { useResponsive } from "@/hooks/useResponsive";
import { cn } from "@/lib/utils";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { deviceType, isTouchDevice } = useResponsive();

  return (
    <footer className={cn(
      "w-full border-t border-border bg-card text-card-foreground mt-auto",
      // Responsive padding
      deviceType === "mobile" ? "py-3" : "py-4",
      // Safe area padding for mobile devices with bottom bars
      isTouchDevice && "safe-area-inset-bottom"
    )}>
      <div className="container mx-auto px-4 md:px-6">
        <div className={cn(
          "text-center leading-relaxed text-muted-foreground",
          // Responsive text size
          deviceType === "mobile" ? "text-xs" : "text-sm"
        )}>
          <span className="block sm:inline">
            Copyright © {currentYear}, LoMEMIS Sierra Leone. All rights reserved.
          </span>
          <span className="block sm:inline sm:ml-1 mt-1 sm:mt-0">
            Designed and Developed by{" "}
            <a
              href="https://integemsgroup.com"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "text-primary hover:text-primary/80 underline transition-colors font-medium",
                // Enhanced touch targets for mobile
                isTouchDevice && "py-1 -my-1 px-1 -mx-1 rounded"
              )}
            >
              INTEGEMS Limited
            </a>
            .
          </span>
        </div>
      </div>
    </footer>
  );
}