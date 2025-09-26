import * as React from "react";

import { cn } from "@/lib/utils";
import { useResponsive } from "@/hooks/useResponsive";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: "sm" | "md" | "lg";
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, size, ...props }, ref) => {
    const { isTouchDevice, deviceType } = useResponsive();

    const getSizeClasses = () => {
      if (size === "sm") {
        return isTouchDevice ? "min-h-[80px] px-3 py-2 text-sm" : "min-h-[60px] px-2 py-1 text-xs";
      }
      if (size === "lg") {
        return isTouchDevice ? "min-h-[120px] px-4 py-3 text-base" : "min-h-[100px] px-4 py-2 text-base";
      }
      // Default (md)
      return isTouchDevice ? "min-h-[100px] px-3 py-2 text-base" : "min-h-[80px] px-3 py-1 text-base md:text-sm";
    };

    return (
      <textarea
        className={cn(
          // Base styles
          "flex w-full rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y",
          
          // Responsive sizing
          getSizeClasses(),
          
          // Touch optimization
          isTouchDevice && "touch-manipulation",
          
          // Mobile-specific adjustments
          deviceType === "mobile" && "resize-none",
          
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
