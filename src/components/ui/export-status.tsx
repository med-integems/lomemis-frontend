"use client";

import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle, 
  Download,
  FileText,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportStatusProps {
  isExporting: boolean;
  error: string | null;
  lastExportCount: number;
  progress?: number;
  onRetry?: () => void;
  onReset?: () => void;
  className?: string;
  compact?: boolean;
}

export const ExportStatus: React.FC<ExportStatusProps> = ({
  isExporting,
  error,
  lastExportCount,
  progress = 0,
  onRetry,
  onReset,
  className,
  compact = false
}) => {
  // Error state
  if (error) {
    if (compact) {
      return (
        <div className={cn("flex items-center gap-2 text-sm text-destructive", className)}>
          <AlertTriangle className="h-4 w-4" />
          <span>Export failed</span>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          )}
        </div>
      );
    }

    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Export Failed</AlertTitle>
        <AlertDescription className="mt-2">
          <div className="space-y-2">
            <p>{error}</p>
            <div className="flex gap-2">
              {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
              {onReset && (
                <Button variant="ghost" size="sm" onClick={onReset}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Exporting state
  if (isExporting) {
    if (compact) {
      return (
        <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>
            {progress > 0 ? `Exporting... ${Math.round(progress)}%` : "Preparing export..."}
          </span>
        </div>
      );
    }

    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">
                  {progress > 0 ? "Exporting data..." : "Preparing export..."}
                </span>
                {progress > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {Math.round(progress)}%
                  </span>
                )}
              </div>
              {progress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state (show briefly after successful export)
  if (lastExportCount > 0 && !error) {
    if (compact) {
      return (
        <div className={cn("flex items-center gap-2 text-sm text-green-600", className)}>
          <CheckCircle className="h-4 w-4" />
          <span>Exported {lastExportCount} records</span>
        </div>
      );
    }

    return (
      <Alert className={cn("border-green-200 bg-green-50", className)}>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Export Successful</AlertTitle>
        <AlertDescription className="text-green-700">
          Successfully exported {lastExportCount} records to CSV file.
          {onReset && (
            <Button variant="ghost" size="sm" onClick={onReset} className="ml-2">
              Clear
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // No status to show
  return null;
};

// Loading state component for inline use
export const ExportLoadingState: React.FC<{
  progress?: number;
  message?: string;
  className?: string;
}> = ({
  progress = 0,
  message = "Exporting data...",
  className
}) => {
  return (
    <div className={cn("flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg", className)}>
      <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-blue-800">{message}</span>
          {progress > 0 && (
            <span className="text-sm text-blue-600">{Math.round(progress)}%</span>
          )}
        </div>
        {progress > 0 && (
          <div className="w-full bg-blue-100 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Success message component
export const ExportSuccessMessage: React.FC<{
  recordCount: number;
  onDismiss?: () => void;
  className?: string;
}> = ({
  recordCount,
  onDismiss,
  className
}) => {
  return (
    <Alert className={cn("border-green-200 bg-green-50", className)}>
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-800">Export Complete</AlertTitle>
      <AlertDescription className="text-green-700">
        <div className="flex items-center justify-between">
          <span>Successfully exported {recordCount} records</span>
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              ✕
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

// Error message component
export const ExportErrorMessage: React.FC<{
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}> = ({
  error,
  onRetry,
  onDismiss,
  className
}) => {
  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Export Failed</AlertTitle>
      <AlertDescription>
        <div className="space-y-3">
          <p>{error}</p>
          <div className="flex gap-2">
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

// Export info panel with statistics
export const ExportInfoPanel: React.FC<{
  totalRecords?: number;
  filteredRecords?: number;
  lastExportDate?: Date;
  lastExportCount?: number;
  className?: string;
}> = ({
  totalRecords,
  filteredRecords,
  lastExportDate,
  lastExportCount,
  className
}) => {
  return (
    <Card className={cn("bg-gray-50", className)}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <FileText className="h-4 w-4" />
          Export Information
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          {totalRecords !== undefined && (
            <div>
              <span className="text-gray-500">Total Records:</span>
              <span className="ml-2 font-medium">{totalRecords.toLocaleString()}</span>
            </div>
          )}
          
          {filteredRecords !== undefined && (
            <div>
              <span className="text-gray-500">Filtered:</span>
              <span className="ml-2 font-medium">{filteredRecords.toLocaleString()}</span>
            </div>
          )}
          
          {lastExportDate && (
            <div>
              <span className="text-gray-500">Last Export:</span>
              <span className="ml-2 font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lastExportDate.toLocaleDateString()}
              </span>
            </div>
          )}
          
          {lastExportCount !== undefined && lastExportCount > 0 && (
            <div>
              <span className="text-gray-500">Last Count:</span>
              <span className="ml-2 font-medium flex items-center gap-1">
                <Download className="h-3 w-3" />
                {lastExportCount.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};