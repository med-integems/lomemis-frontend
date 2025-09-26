"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useResponsive } from "@/hooks/useResponsive";

const AlertDialog = AlertDialogPrimitive.Root;

const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

const AlertDialogPortal = AlertDialogPrimitive.Portal;

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

interface AlertDialogContentProps extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> {
  size?: "sm" | "md" | "lg";
}

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  AlertDialogContentProps
>(({ className, size = "md", ...props }, ref) => {
  const { deviceType, isTouchDevice } = useResponsive();

  const getSizeClasses = () => {
    // Mobile: use more screen space
    if (deviceType === "mobile") {
      return "fixed left-4 right-4 top-[50%] translate-x-0 translate-y-[-50%] w-auto max-w-none";
    }

    // Desktop sizing
    const sizeMap = {
      sm: "max-w-sm",
      md: "max-w-lg", 
      lg: "max-w-xl"
    };

    return `fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full ${sizeMap[size]}`;
  };

  const getPaddingClasses = () => {
    return deviceType === "mobile" ? "p-5" : isTouchDevice ? "p-5" : "p-6";
  };

  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        ref={ref}
        className={cn(
          "z-50 grid gap-4 border bg-background shadow-lg duration-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          "sm:rounded-lg",
          // Responsive sizing and positioning
          getSizeClasses(),
          // Responsive padding
          getPaddingClasses(),
          // Touch optimization
          isTouchDevice && "touch-manipulation",
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  );
});
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { deviceType } = useResponsive();
  
  return (
    <div
      className={cn(
        "flex flex-col space-y-2",
        // Mobile: center text, Desktop: left align for alert dialogs
        deviceType === "mobile" ? "text-center" : "text-center sm:text-left",
        className
      )}
      {...props}
    />
  );
};
AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { deviceType, isTouchDevice } = useResponsive();
  
  return (
    <div
      className={cn(
        "flex",
        // Mobile: stack buttons for better touch targets
        deviceType === "mobile" 
          ? "flex-col space-y-3" 
          : "flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        // Touch optimization
        isTouchDevice && "touch-manipulation",
        className
      )}
      {...props}
    />
  );
};
AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => {
  const { deviceType } = useResponsive();
  
  return (
    <AlertDialogPrimitive.Title
      ref={ref}
      className={cn(
        "font-semibold",
        // Responsive text sizing
        deviceType === "mobile" ? "text-xl" : "text-lg",
        className
      )}
      {...props}
    />
  );
});
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => {
  const { deviceType } = useResponsive();
  
  return (
    <AlertDialogPrimitive.Description
      ref={ref}
      className={cn(
        "text-muted-foreground",
        // Responsive text sizing
        deviceType === "mobile" ? "text-base" : "text-sm",
        className
      )}
      {...props}
    />
  );
});
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName;

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => {
  const { deviceType } = useResponsive();
  
  return (
    <AlertDialogPrimitive.Cancel
      ref={ref}
      className={cn(
        buttonVariants({ variant: "outline" }),
        // Responsive spacing
        deviceType === "mobile" ? "" : "mt-2 sm:mt-0",
        className
      )}
      {...props}
    />
  );
});
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};