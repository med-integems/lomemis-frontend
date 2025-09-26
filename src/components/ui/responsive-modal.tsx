"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useResponsive } from "@/hooks/useResponsive";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogFooter, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ResponsiveModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  fullScreen?: boolean;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

export function ResponsiveModal({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  size = "md",
  fullScreen,
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
}: ResponsiveModalProps) {
  const { deviceType, isTouchDevice } = useResponsive();

  // Force full screen on mobile for better UX
  const shouldUseFullScreen = deviceType === "mobile" || fullScreen;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      
      <DialogContent
        size={size}
        fullScreen={shouldUseFullScreen}
        className={cn(
          // Custom styles
          className,
          // Mobile-specific styles
          shouldUseFullScreen && [
            "flex flex-col",
            "overflow-hidden"
          ]
        )}
        onPointerDownOutside={closeOnOverlayClick ? undefined : (e) => e.preventDefault()}
        onEscapeKeyDown={closeOnOverlayClick ? undefined : (e) => e.preventDefault()}
      >
        {/* Header */}
        {(title || description) && (
          <DialogHeader className={cn(
            shouldUseFullScreen && "flex-shrink-0"
          )}>
            {title && (
              <DialogTitle className={cn(
                shouldUseFullScreen && "text-center"
              )}>
                {title}
              </DialogTitle>
            )}
            {description && (
              <DialogDescription className={cn(
                shouldUseFullScreen && "text-center"
              )}>
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        )}

        {/* Content */}
        <div className={cn(
          "flex-1",
          shouldUseFullScreen && [
            "overflow-y-auto",
            "overscroll-contain",
            // Safe area handling
            "pb-safe"
          ]
        )}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <DialogFooter className={cn(
            shouldUseFullScreen && [
              "flex-shrink-0",
              "pt-4",
              "border-t",
              "border-border",
              // Safe area handling
              "pb-safe"
            ]
          )}>
            {footer}
          </DialogFooter>
        )}

        {/* Custom close button for full screen modals */}
        {!showCloseButton && shouldUseFullScreen && (
          <DialogClose className={cn(
            "absolute top-4 right-4 z-10",
            "rounded-full bg-background/80 backdrop-blur-sm",
            "border border-border",
            "w-10 h-10 flex items-center justify-center",
            "hover:bg-accent hover:text-accent-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring",
            "touch-manipulation"
          )}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Specialized modal variations
interface ConfirmationModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  children?: React.ReactNode;
}

export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel", 
  confirmVariant = "default",
  onConfirm,
  onCancel,
  loading = false,
  children,
}: ConfirmationModalProps) {
  const { deviceType } = useResponsive();

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange?.(false);
    } catch (error) {
      // Handle error if needed
      console.error("Confirmation action failed:", error);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      closeOnOverlayClick={!loading}
      footer={
        <div className={cn(
          "flex w-full",
          deviceType === "mobile" 
            ? "flex-col space-y-2" 
            : "flex-row-reverse space-x-2 space-x-reverse"
        )}>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? "Loading..." : confirmText}
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
        </div>
      }
    >
      {children}
    </ResponsiveModal>
  );
}

// Form modal wrapper
interface FormModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  submitText?: string;
  cancelText?: string;
  onSubmit: (event: React.FormEvent) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  disabled?: boolean;
}

export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitText = "Save",
  cancelText = "Cancel",
  onSubmit,
  onCancel,
  loading = false,
  size = "md",
  disabled = false,
}: FormModalProps) {
  const { deviceType } = useResponsive();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await onSubmit(event);
      onOpenChange?.(false);
    } catch (error) {
      // Keep modal open on error
      console.error("Form submission failed:", error);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size={size}
      closeOnOverlayClick={!loading}
      footer={
        <div className={cn(
          "flex w-full",
          deviceType === "mobile" 
            ? "flex-col space-y-2" 
            : "flex-row-reverse space-x-2 space-x-reverse"
        )}>
          <Button
            type="submit"
            form="modal-form"
            disabled={loading || disabled}
            className="w-full sm:w-auto"
          >
            {loading ? "Saving..." : submitText}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
        </div>
      }
    >
      <form id="modal-form" onSubmit={handleSubmit} className="space-y-4">
        {children}
      </form>
    </ResponsiveModal>
  );
}