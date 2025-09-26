"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useResponsive } from "@/hooks/useResponsive"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
  fullScreen?: boolean;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, size = "md", fullScreen, ...props }, ref) => {
  const { deviceType, isTouchDevice } = useResponsive();

  const getSizeClasses = () => {
    // Force full screen on mobile for better UX
    if (deviceType === "mobile" || fullScreen) {
      return "fixed inset-0 max-w-none w-screen h-screen translate-x-0 translate-y-0 rounded-none";
    }

    // Responsive sizing for tablet and desktop
    const sizeMap = {
      sm: "max-w-sm",
      md: "max-w-lg", 
      lg: "max-w-2xl",
      xl: "max-w-4xl",
      full: "max-w-[95vw] max-h-[95vh]"
    };

    return `fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full ${sizeMap[size]} sm:rounded-lg`;
  };

  const getPaddingClasses = () => {
    if (deviceType === "mobile" || fullScreen) {
      return "p-4";
    }
    return isTouchDevice ? "p-5" : "p-6";
  };

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "z-50 grid gap-4 border bg-background shadow-lg duration-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          // Mobile animations
          deviceType === "mobile" || fullScreen
            ? "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
            : "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          // Responsive sizing
          getSizeClasses(),
          // Responsive padding
          getPaddingClasses(),
          // Touch optimization
          isTouchDevice && "touch-manipulation",
          // Safe area handling for mobile
          (deviceType === "mobile" || fullScreen) && "pb-safe",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className={cn(
          "absolute rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
          // Responsive positioning and sizing
          deviceType === "mobile" || fullScreen 
            ? "right-3 top-3" 
            : "right-4 top-4",
          // Touch optimization
          isTouchDevice && "touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
        )}>
          <X className={cn(
            isTouchDevice ? "h-5 w-5" : "h-4 w-4"
          )} />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { deviceType } = useResponsive();
  
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5",
        // Mobile: center text, Desktop: left align
        deviceType === "mobile" ? "text-center" : "text-left",
        className
      )}
      {...props}
    />
  );
};
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { deviceType, isTouchDevice } = useResponsive();
  
  return (
    <div
      className={cn(
        "flex",
        // Mobile: stack buttons, Desktop: horizontal layout
        deviceType === "mobile" 
          ? "flex-col-reverse space-y-reverse space-y-2" 
          : "flex-row justify-end space-x-2",
        // Touch optimization
        isTouchDevice && "touch-manipulation",
        className
      )}
      {...props}
    />
  );
};
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => {
  const { deviceType } = useResponsive();
  
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn(
        "font-semibold leading-none tracking-tight",
        // Responsive text sizing
        deviceType === "mobile" ? "text-xl" : "text-lg",
        className
      )}
      {...props}
    />
  );
})
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => {
  const { deviceType } = useResponsive();
  
  return (
    <DialogPrimitive.Description
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
})
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}