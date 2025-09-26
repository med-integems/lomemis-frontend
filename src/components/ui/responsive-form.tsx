"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useResponsive } from "@/hooks/useResponsive";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ResponsiveFormProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  spacing?: "sm" | "md" | "lg";
  asCard?: boolean;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function ResponsiveForm({
  children,
  className,
  title,
  description,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  spacing = "md",
  asCard = false,
  onSubmit,
}: ResponsiveFormProps) {
  const { deviceType, isTouchDevice } = useResponsive();

  const getGridClasses = () => {
    const { mobile, tablet, desktop } = columns;
    return `grid grid-cols-${mobile} md:grid-cols-${tablet} lg:grid-cols-${desktop}`;
  };

  const getSpacingClasses = () => {
    switch (spacing) {
      case "sm":
        return "gap-3";
      case "lg":
        return deviceType === "mobile" ? "gap-5" : "gap-6";
      default:
        return "gap-4";
    }
  };

  const formContent = (
    <form
      onSubmit={onSubmit}
      className={cn(
        getGridClasses(),
        getSpacingClasses(),
        // Touch optimization
        isTouchDevice && "touch-manipulation",
        className
      )}
    >
      {children}
    </form>
  );

  if (asCard) {
    return (
      <Card className={cn("w-full", deviceType === "mobile" && "mx-4")}>
        {(title || description) && (
          <CardHeader className={cn(deviceType === "mobile" && "pb-4")}>
            {title && (
              <CardTitle className={cn(
                deviceType === "mobile" ? "text-lg" : "text-xl"
              )}>
                {title}
              </CardTitle>
            )}
            {description && (
              <p className={cn(
                "text-muted-foreground",
                deviceType === "mobile" ? "text-sm" : "text-base"
              )}>
                {description}
              </p>
            )}
          </CardHeader>
        )}
        <CardContent className={cn(deviceType === "mobile" && "px-4")}>
          {formContent}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      {(title || description) && (
        <div className={cn("space-y-2", deviceType === "mobile" && "px-4")}>
          {title && (
            <h2 className={cn(
              "font-semibold",
              deviceType === "mobile" ? "text-lg" : "text-xl"
            )}>
              {title}
            </h2>
          )}
          {description && (
            <p className={cn(
              "text-muted-foreground",
              deviceType === "mobile" ? "text-sm" : "text-base"
            )}>
              {description}
            </p>
          )}
        </div>
      )}
      {formContent}
    </div>
  );
}

// Specialized form field component for responsive layouts
interface ResponsiveFormFieldProps {
  children: React.ReactNode;
  className?: string;
  span?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  fullWidth?: boolean;
}

export function ResponsiveFormField({
  children,
  className,
  span,
  fullWidth = false,
}: ResponsiveFormFieldProps) {
  const { deviceType } = useResponsive();

  const getSpanClasses = () => {
    if (fullWidth) {
      return "col-span-full";
    }
    
    if (!span) return "";

    const classes = [];
    if (span.mobile) classes.push(`col-span-${span.mobile}`);
    if (span.tablet) classes.push(`md:col-span-${span.tablet}`);
    if (span.desktop) classes.push(`lg:col-span-${span.desktop}`);
    
    return classes.join(" ");
  };

  return (
    <div className={cn("space-y-2", getSpanClasses(), className)}>
      {children}
    </div>
  );
}

// Form section component for grouping related fields
interface ResponsiveFormSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  border?: boolean;
}

export function ResponsiveFormSection({
  children,
  title,
  description,
  className,
  border = false,
}: ResponsiveFormSectionProps) {
  const { deviceType } = useResponsive();

  return (
    <div className={cn(
      "col-span-full space-y-4",
      border && "pb-4 border-b border-border",
      className
    )}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className={cn(
              "font-medium",
              deviceType === "mobile" ? "text-base" : "text-lg"
            )}>
              {title}
            </h3>
          )}
          {description && (
            <p className={cn(
              "text-muted-foreground",
              deviceType === "mobile" ? "text-xs" : "text-sm"
            )}>
              {description}
            </p>
          )}
        </div>
      )}
      <div className={cn(
        "grid gap-4",
        "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      )}>
        {children}
      </div>
    </div>
  );
}

// Form actions component for buttons
interface ResponsiveFormActionsProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
  stack?: boolean;
}

export function ResponsiveFormActions({
  children,
  className,
  align = "right",
  stack = false,
}: ResponsiveFormActionsProps) {
  const { isMobile } = useResponsive();

  const getAlignClasses = () => {
    switch (align) {
      case "left":
        return "justify-start";
      case "center":
        return "justify-center";
      default:
        return "justify-end";
    }
  };

  return (
    <div className={cn(
      "col-span-full pt-4 border-t border-border",
      className
    )}>
      <div className={cn(
        "flex gap-3",
        (isMobile || stack) ? "flex-col" : "flex-row",
        !isMobile && !stack && getAlignClasses()
      )}>
        {children}
      </div>
    </div>
  );
}