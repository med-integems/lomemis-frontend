"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Eye,
  Download,
  FileText,
  BarChart3,
  Calendar,
  Filter,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ReportPreviewProps {
  reportData?: {
    data: any[];
    metadata: {
      generatedAt: string;
      recordCount: number;
      reportType: string;
      filters: any;
      executionTime: number;
    };
    charts?: any[];
  };
  isLoading?: boolean;
  error?: string;
  onDownload?: () => void;
  onRegenerateWithExport?: (format: "excel" | "csv") => void;
}

export function ReportPreview({
  reportData,
  isLoading,
  error,
  onDownload,
  onRegenerateWithExport,
}: ReportPreviewProps) {
  const [selectedFormat, setSelectedFormat] = useState<"excel" | "csv">("csv");

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">
              Generating report preview...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to generate report preview: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!reportData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Eye className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">No Preview Available</h3>
              <p className="text-muted-foreground">
                Generate a report to see the preview here
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { data, metadata, charts } = reportData;

  const formatReportType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatExecutionTime = (time: number) => {
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };

  const renderTableData = () => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No data available for this report
          </p>
        </div>
      );
    }

    const headers = Object.keys(data[0]);
    const displayData = data.slice(0, 10); // Show first 10 rows

    return (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header} className="font-medium">
                    {header
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((row, index) => (
                <TableRow key={index}>
                  {headers.map((header) => (
                    <TableCell key={header}>
                      {formatCellValue(row[header])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {data.length > 10 && (
          <div className="text-center text-sm text-muted-foreground">
            Showing first 10 rows of {data.length} total records
          </div>
        )}
      </div>
    );
  };

  const formatCellValue = (value: any) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "number") {
      // Format numbers with appropriate precision
      if (value % 1 === 0) return value.toLocaleString();
      return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    if (typeof value === "string") {
      // Format dates
      if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        return new Date(value).toLocaleDateString();
      }
      // Truncate long strings
      if (value.length > 50) {
        return value.substring(0, 47) + "...";
      }
    }
    return String(value);
  };

  const renderFilters = () => {
    if (!metadata.filters || Object.keys(metadata.filters).length === 0) {
      return (
        <p className="text-sm text-muted-foreground">No filters applied</p>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {Object.entries(metadata.filters).map(([key, value]) => {
          if (!value) return null;
          return (
            <Badge key={key} variant="secondary" className="text-xs">
              {key.replace(/([A-Z])/g, " $1").toLowerCase()}: {String(value)}
            </Badge>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Report Metadata */}
      <Card className="print:border-0">
        <CardHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Report Preview
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.print()}
              >
                Print
              </Button>
              <select
                aria-label="Select export format"
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
              </select>
              <Button
                size="sm"
                onClick={() => onRegenerateWithExport?.(selectedFormat)}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export as {selectedFormat.toUpperCase()}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Report Type
              </p>
              <p className="text-sm">{formatReportType(metadata.reportType)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Records
              </p>
              <p className="text-sm">{metadata.recordCount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Generated
              </p>
              <p className="text-sm">
                {new Date(metadata.generatedAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Execution Time
              </p>
              <p className="text-sm">
                {formatExecutionTime(metadata.executionTime)}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-4 w-4" />
              <p className="text-sm font-medium">Applied Filters</p>
            </div>
            {renderFilters()}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      {charts && charts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Charts & Visualizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {charts.map((chart, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="font-medium">{chart.title}</h4>
                  <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Chart: {chart.type}</p>
                      <p className="text-xs">
                        {chart.data?.length || 0} data points
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Data
          </CardTitle>
        </CardHeader>
        <CardContent>{renderTableData()}</CardContent>
      </Card>
    </div>
  );
}
