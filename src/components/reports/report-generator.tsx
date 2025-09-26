"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// note: Separator and Badge removed as they were unused
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Download,
  Settings,
  Filter,
  BarChart3,
  PieChart,
  Users,
  Package,
  Truck,
  School,
  Eye,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { reportsApi, warehousesApi } from "@/lib/api";
import React from "react";

interface ReportGeneratorProps {
  onGenerate?: (config: ReportConfig) => void;
  onPreview?: (config: ReportConfig) => void;
  userRole?: string;
}

interface ReportConfig {
  type: string;
  title?: string;
  description?: string;
  filters?: {
    startDate?: string;
    endDate?: string;
    warehouseId?: number;
    councilId?: number;
    schoolId?: number;
    itemId?: number;
    status?: string;
    category?: string;
  };
  exportFormat?: "excel" | "csv";
  includeCharts?: boolean;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  defaultConfig: Partial<ReportConfig>;
  requiredFilters: string[];
  availableFilters: string[];
  roles: string[];
}

// FilterOption removed (unused)

const defaultConfig: ReportConfig = {
  type: "inventory_summary",
  title: "",
  description: "",
  filters: {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  },
  exportFormat: "csv",
  includeCharts: false,
};

export function ReportGenerator({
  onGenerate,
  onPreview,
  userRole,
}: ReportGeneratorProps) {
  const [config, setConfig] = useState<ReportConfig>(defaultConfig);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [previewData, setPreviewData] = useState<
    Array<Record<string, unknown>> | undefined
  >(undefined);
  // Helper to stringify unknown error objects safely
  const formatError = (error: unknown) => {
    if (!error) return "Unknown error";
    if (typeof error === "string") return error;
    if (typeof error === "object") {
      const errObj = error as Record<string, unknown>;
      if (typeof errObj.message === "string") return errObj.message;
      if (typeof errObj.error === "string") return errObj.error;
      return JSON.stringify(errObj);
    }
    return String(error);
  };
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Fetch report templates
  const { data: templatesData } = useApiQuery(
    ["report-templates"],
    reportsApi.getReportTemplates
  );

  // Fetch filter options
  const { data: warehousesData } = useApiQuery(["warehouses"], () =>
    warehousesApi.getWarehouses(1, 100)
  );

  // items are not currently used in this component

  // Generate report mutation
  const generateReportMutation = useApiMutation(
    (config: ReportConfig) => reportsApi.generateReport(config),
    {
      onSuccess: () => {
        toast.success("Report generated successfully");
        if (onGenerate) {
          onGenerate(config);
        }
      },
      onError: (error: unknown) => {
        toast.error(`Failed to generate report: ${formatError(error)}`);
      },
    }
  );

  // Preview report mutation
  const previewReportMutation = useApiMutation(
    (config: ReportConfig) =>
      reportsApi.previewReport({ ...config, limit: 10 }),
    {
      onSuccess: (data) => {
        setPreviewData(
          (data.data?.data as Array<Record<string, unknown>>) || []
        );
        toast.success("Report preview generated");
        if (onPreview) {
          onPreview(config);
        }
      },
      onError: (error: unknown) => {
        toast.error(`Failed to preview report: ${formatError(error)}`);
      },
    }
  );

  // Validate config mutation
  const validateConfigMutation = useApiMutation(
    (config: ReportConfig) => reportsApi.validateReportConfig(config),
    {
      onSuccess: (data) => {
        if (data.data?.isValid) {
          setValidationErrors([]);
        } else {
          setValidationErrors(data.data?.errors || []);
        }
      },
    }
  );

  const templates = templatesData?.data || [];
  const warehouses = warehousesData?.data?.items || [];

  // Filter templates by user role
  const availableTemplates = templates.filter(
    (template: ReportTemplate) =>
      !userRole ||
      template.roles.includes(userRole) ||
      template.roles.includes("all")
  );

  const reportTypes = [
    { id: "inventory_summary", name: "Inventory Summary", icon: Package },
    { id: "shipment_history", name: "Shipment History", icon: Truck },
    { id: "distribution_summary", name: "Distribution Summary", icon: School },
    { id: "stock_movement", name: "Stock Movement", icon: BarChart3 },
    { id: "performance_metrics", name: "Performance Metrics", icon: PieChart },
    { id: "user_activity", name: "User Activity", icon: Users },
  ];

  const statusOptions = [
    { value: "DRAFT", label: "Draft" },
    { value: "IN_TRANSIT", label: "In Transit" },
    { value: "RECEIVED", label: "Received" },
    { value: "DISCREPANCY", label: "Discrepancy" },
  ];

  const categoryOptions = [
    { value: "Textbooks", label: "Textbooks" },
    { value: "Exercise Books", label: "Exercise Books" },
    { value: "Stationery", label: "Stationery" },
    { value: "Teaching Materials", label: "Teaching Materials" },
  ];

  useEffect(() => {
    if (selectedTemplate) {
      const template = availableTemplates.find(
        (t: ReportTemplate) => t.id === selectedTemplate
      );
      if (template) {
        setConfig({
          ...defaultConfig,
          ...template.defaultConfig,
          type: template.type,
          title: template.name,
          description: template.description,
        });
      }
    }
  }, [selectedTemplate, availableTemplates]);

  const handleGenerate = async () => {
    if (!config.title) {
      toast.error("Please provide a report title");
      return;
    }

    // Validate configuration first
    await validateConfigMutation.mutateAsync(config);

    if (validationErrors.length > 0) {
      toast.error("Please fix validation errors before generating");
      return;
    }

    generateReportMutation.mutate(config);
  };

  const handlePreview = async () => {
    if (!config.type) {
      toast.error("Please select a report type");
      return;
    }

    previewReportMutation.mutate(config);
  };

  const updateConfig = (field: string, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateFilters = (field: string, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        [field]: value,
      },
    }));
  };

  const getReportTypeIcon = (type: string) => {
    const reportType = reportTypes.find((rt) => rt.id === type);
    return reportType?.icon || FileText;
  };

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Selection */}
          <div>
            <label className="text-sm font-medium">
              Use Template (Optional)
            </label>
            <Select
              value={selectedTemplate}
              onValueChange={setSelectedTemplate}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a template or create custom report" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom Report</SelectItem>
                {availableTemplates.map((template: ReportTemplate) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      {React.createElement(getReportTypeIcon(template.type), {
                        className: "h-4 w-4",
                      })}
                      {template.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Basic Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Report Title</label>
              <Input
                value={config.title || ""}
                onChange={(e) => updateConfig("title", e.target.value)}
                placeholder="Enter report title"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Report Type</label>
              <Select
                value={config.type}
                onValueChange={(value) => updateConfig("type", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={config.description || ""}
              onChange={(e) => updateConfig("description", e.target.value)}
              placeholder="Describe the purpose and scope of this report..."
              className="mt-1"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Please fix the following errors:</p>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={config.filters?.startDate || ""}
                onChange={(e) => updateFilters("startDate", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={config.filters?.endDate || ""}
                onChange={(e) => updateFilters("endDate", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Additional Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Warehouse</label>
              <Select
                value={config.filters?.warehouseId?.toString() || ""}
                onValueChange={(value) =>
                  updateFilters(
                    "warehouseId",
                    value ? parseInt(value) : undefined
                  )
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All warehouses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All warehouses</SelectItem>
                  {warehouses.map((warehouse: { id: number; name: string }) => (
                    <SelectItem
                      key={warehouse.id}
                      value={warehouse.id.toString()}
                    >
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={config.filters?.status || ""}
                onValueChange={(value) =>
                  updateFilters("status", value || undefined)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Category</label>
              <Select
                value={config.filters?.category || ""}
                onValueChange={(value) =>
                  updateFilters("category", value || undefined)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Output Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Output Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Export Format</label>
              <Select
                value={(config.exportFormat as string) || "csv"}
                onValueChange={(value) => updateConfig("exportFormat", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">
                    Excel Spreadsheet (XLSX)
                  </SelectItem>
                  <SelectItem value="csv">CSV Data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 mt-6">
              <Checkbox
                id="includeCharts"
                checked={config.includeCharts || false}
                onCheckedChange={(checked) =>
                  updateConfig("includeCharts", checked)
                }
              />
              <label htmlFor="includeCharts" className="text-sm font-medium">
                Include Charts & Visualizations
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Data */}
      {previewData && previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Report Preview ({previewData.length} rows)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    {Object.keys(previewData[0]).map((key) => (
                      <th
                        key={key}
                        className="border border-gray-200 px-4 py-2 text-left font-medium"
                      >
                        {key
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 5).map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {Object.values(row).map((value: unknown, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="border border-gray-200 px-4 py-2"
                        >
                          {value !== null && value !== undefined
                            ? String(value)
                            : "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.length > 5 && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Showing first 5 rows of {previewData.length} results
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setConfig(defaultConfig)}>
          Reset
        </Button>

        <Button
          variant="outline"
          onClick={handlePreview}
          disabled={previewReportMutation.isPending || !config.type}
          className="min-w-32"
        >
          {previewReportMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Previewing...
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </>
          )}
        </Button>

        <Button
          onClick={handleGenerate}
          disabled={generateReportMutation.isPending || !config.title}
          className="min-w-32"
        >
          {generateReportMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
