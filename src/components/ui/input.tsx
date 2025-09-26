import * as React from "react"

import { cn } from "@/lib/utils"
import { useResponsive } from "@/hooks/useResponsive"

function Input({ 
  className, 
  type, 
  size,
  ...props 
}: React.ComponentProps<"input"> & {
  size?: "sm" | "md" | "lg";
}) {
  const { isTouchDevice } = useResponsive();

  const getSizeClasses = () => {
    if (size === "sm") {
      return isTouchDevice ? "h-10 px-3 py-2 text-sm" : "h-8 px-2 py-1 text-xs";
    }
    if (size === "lg") {
      return isTouchDevice ? "h-12 px-4 py-3 text-base" : "h-11 px-4 py-2 text-base";
    }
    // Default (md)
    return isTouchDevice ? "h-11 px-3 py-2 text-base" : "h-9 px-3 py-1 text-base md:text-sm";
  };

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex w-full min-w-0 rounded-md border bg-transparent shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        
        // Focus and validation states
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        
        // Responsive sizing
        getSizeClasses(),
        
        // Touch optimization
        isTouchDevice && "touch-manipulation",
        
        className
      )}
      {...props}
    />
  )
}

export { Input }
