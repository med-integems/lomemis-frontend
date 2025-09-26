"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { useResponsive } from "@/hooks/useResponsive";

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  size?: "sm" | "md" | "lg";
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, size, ...props }, ref) => {
  const { isTouchDevice } = useResponsive();

  const getSizeClasses = () => {
    if (size === "sm") {
      return isTouchDevice ? "h-5 w-5" : "h-3 w-3";
    }
    if (size === "lg") {
      return isTouchDevice ? "h-7 w-7" : "h-5 w-5";
    }
    // Default (md)
    return isTouchDevice ? "h-6 w-6" : "h-4 w-4";
  };

  const getCheckIconSize = () => {
    if (size === "sm") {
      return isTouchDevice ? "h-3 w-3" : "h-2 w-2";
    }
    if (size === "lg") {
      return isTouchDevice ? "h-5 w-5" : "h-4 w-4";
    }
    // Default (md)
    return isTouchDevice ? "h-4 w-4" : "h-3 w-3";
  };

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        // Responsive sizing
        getSizeClasses(),
        // Touch optimization
        isTouchDevice && "touch-manipulation",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        <Check className={getCheckIconSize()} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
