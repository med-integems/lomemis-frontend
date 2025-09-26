"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportButtonProps {
  onExport: () => Promise<void> | void;
  isExporting?: boolean;
  disabled?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showProgress?: boolean;
  progress?: number;
  className?: string;
  children?: React.ReactNode;
  error?: string | null;
  tooltip?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  isExporting = false,
  disabled = false,
  variant = "outline",
  size = "default",
  showProgress = false,
  progress = 0,
  className,
  children,
  error,
  tooltip
}) => {
  const handleClick = async () => {
    if (isExporting || disabled) return;
    
    try {
      await onExport();
    } catch (err) {
      console.error("Export button error:", err);
    }
  };

  const getButtonContent = () => {
    if (error) {
      return (
        <>
          <AlertTriangle className="h-4 w-4 mr-2" />
          Retry Export
        </>
      );
    }

    if (isExporting) {
      return (
        <>
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          {showProgress && progress > 0 
            ? `Exporting... ${Math.round(progress)}%`
            : "Exporting..."
          }
        </>
      );
    }

    if (children) {
      return children;
    }

    return (
      <>
        <Download className="h-4 w-4 mr-2" />
        Export
      </>
    );
  };

  const buttonVariant = error ? "destructive" : variant;

  return (
    <Button
      variant={buttonVariant}
      size={size}
      disabled={disabled || isExporting}
      onClick={handleClick}
      className={cn("gap-2", className)}
      title={tooltip || (isExporting ? "Export in progress..." : "Export data to CSV")}
      aria-label={
        isExporting 
          ? `Export in progress${showProgress ? `, ${Math.round(progress)}% complete` : ""}`
          : "Export data"
      }
    >
      {getButtonContent()}
    </Button>
  );
};

// Specialized variants for common use cases
export const ExportIconButton: React.FC<Omit<ExportButtonProps, 'children' | 'size'>> = (props) => (
  <ExportButton {...props} size="icon">
    {props.isExporting ? (
      <RefreshCw className="h-4 w-4 animate-spin" />
    ) : props.error ? (
      <AlertTriangle className="h-4 w-4" />
    ) : (
      <Download className="h-4 w-4" />
    )}
  </ExportButton>
);

export const ExportSmallButton: React.FC<ExportButtonProps> = (props) => (
  <ExportButton {...props} size="sm" />
);

// Export button with built-in progress bar
interface ExportButtonWithProgressProps extends ExportButtonProps {
  showProgressBar?: boolean;
}

export const ExportButtonWithProgress: React.FC<ExportButtonWithProgressProps> = ({
  showProgressBar = false,
  progress = 0,
  isExporting = false,
  ...props
}) => {
  return (
    <div className="relative">
      <ExportButton
        {...props}
        isExporting={isExporting}
        progress={progress}
        showProgress={true}
      />
      {showProgressBar && isExporting && (
        <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
};