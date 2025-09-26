"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Settings,
  Play,
  Save,
  Filter,
  Database,
  FileText,
  BarChart3,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { reportsApi } from "@/lib/api";
import { toast } from "sonner";

interface ReportFilter {
  startDate?: string;
  endDate?: string;
  warehouseId?: number;
  councilId?: number;
  schoolId?: number;
  itemId?: number;
  status?: string;
  category?: string;
}

type ReportTemplate = {
  id: string;
  type?: string;
  name?: string;
  description?: string;
  defaultConfig?: Record<string, unknown>;
  availableFilters?: string[];
  roles?: string[];
};

type PreviewData = {
  metadata?: {
    recordCount?: number;
    generatedAt?: string;
    executionTime?: number;
  };
  data?: unknown[];
};

interface ReportConfig {
  type: string;
  title?: string;
  description?: string;
  filters?: ReportFilter;
  exportFormat?: "excel" | "csv";
  includeCharts?: boolean;
}

export function ReportBuilderPage() {
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [filters, setFilters] = useState<ReportFilter>({});
  const [exportFormat, setExportFormat] = useState<"excel" | "csv">("csv");
  const [includeCharts, setIncludeCharts] = useState(true);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Get available templates
  const {
    data: templates,
    isLoading: templatesLoading,
    error: templatesError,
  } = useQuery({
    queryKey: ["report-templates"],
    queryFn: async () => {
      try {
        console.log("Fetching report templates in Report Builder...");
        const result = await reportsApi.getTemplates();
        console.log(
          "Templates fetched successfully in Report Builder:",
          result
        );
        return result;
      } catch (error) {
        console.error("Failed to fetch templates in Report Builder:", error);
        throw error;
      }
    },
    retry: 3,
  });
  const { data: warehouses } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () =>
      fetch("/api/warehouses")
        .then((res) => res.json())
        .catch(() => ({ data: [] })),
  });

  const { data: councils } = useQuery({
    queryKey: ["councils"],
    queryFn: () =>
      fetch("/api/councils")
        .then((res) => res.json())
        .catch(() => ({ data: [] })),
  });

  const { data: items } = useQuery({
    queryKey: ["items"],
    queryFn: () =>
      fetch("/api/items")
        .then((res) => res.json())
        .catch(() => ({ data: [] })),
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: (config: ReportConfig) => reportsApi.generateReport(config),
    onMutate: () => {
      setIsGenerating(true);
    },
    onSuccess: (result) => {
      setPreviewData(result.data);
      toast.success("Report generated successfully");

      if (result.data?.exportUrl) {
        (async () => {
          try {
            const downloadUrl = String(result.data.exportUrl || "");
            const parts = downloadUrl.split("/").filter(Boolean);
            let filename = parts
              .reverse()
              .find((p) => /\.[a-zA-Z0-9]+$/.test(p));
            if (!filename) {
              const reversed = parts;
              if (reversed[1]) filename = reversed[1];
            }
            if (!filename) filename = parts[0] ?? "";
            filename = decodeURIComponent(filename);

            const blob = await reportsApi.downloadExport(filename);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `custom-report.${exportFormat}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
          } catch (err) {
            console.error("Auto-download failed:", err);
            toast.error("Failed to download generated report");
          }
        })();
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
    },
    onSettled: () => {
      setIsGenerating(false);
    },
  });

  const handleFilterChange = (key: keyof ReportFilter, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleGenerateReport = () => {
    if (!selectedTemplate) {
      toast.error("Please select a report template");
      return;
    }

    const template = templates?.data?.find(
      (t: ReportTemplate) =>
        t.id === selectedTemplate || t.type === selectedTemplate
    );
    if (!template) {
      console.error(
        "Available templates:",
        templates?.data?.map((t: ReportTemplate) => ({
          id: t.id,
          type: t.type,
        }))
      );
      toast.error(`Invalid template selected: ${selectedTemplate}`);
      return;
    }

    const config: ReportConfig = {
      type: template.type,
      title: customTitle || template.name,
      description: customDescription || template.description,
      filters: {
        ...filters,
        // Apply role-based restrictions
        ...(user?.localCouncilId &&
          user?.role === "lc_officer" && { councilId: user.localCouncilId }),
        ...(user?.schoolId &&
          user?.role === "school_rep" && { schoolId: user.schoolId }),
      },
      exportFormat,
      includeCharts,
    };

    generateReportMutation.mutate(config);
  };

  const getFilteredTemplates = () => {
    if (!templates?.data) return [] as ReportTemplate[];

    return (templates.data as ReportTemplate[]).filter((template) => {
      if (template.roles?.includes("all")) return true;
      if (user?.role && template.roles?.includes(user.role)) return true;
      return false;
    });
  };

  if (templatesLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-96" />
          </div>
          <div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (templatesError) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Report Builder</h1>
          <p className="text-muted-foreground">
            Create custom reports with advanced filtering and export options
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load report templates. Please check your connection and
            try again.
            <br />
            <small className="text-xs">
              Error: {templatesError?.message || "Unknown error"}
            </small>
          </AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const selectedTemplateData = (
    templates?.data as ReportTemplate[] | undefined
  )?.find((t) => t.id === selectedTemplate);
  const availableTemplates = getFilteredTemplates();

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Report Builder</h1>
        <p className="text-muted-foreground">
          Create custom reports with advanced filtering and export options
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Report Template
              </CardTitle>
              <CardDescription>
                Choose a base template for your custom report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="template">Template</Label>
                <Select
                  value={selectedTemplate}
                  onValueChange={setSelectedTemplate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a report template" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTemplates.map((template: ReportTemplate) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplateData && (
                <Alert>
                  <BarChart3 className="h-4 w-4" />
                  <AlertDescription>
                    {selectedTemplateData.description}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label htmlFor="title">Custom Title (Optional)</Label>
                <Input
                  id="title"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={
                    selectedTemplateData?.name || "Enter custom title"
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">
                  Custom Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder={
                    selectedTemplateData?.description ||
                    "Enter custom description"
                  }
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          {selectedTemplateData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Report Filters
                </CardTitle>
                <CardDescription>
                  Customize what data to include in your report
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Date Range */}
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={filters.startDate || ""}
                      onChange={(e) =>
                        handleFilterChange("startDate", e.target.value)
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={filters.endDate || ""}
                      onChange={(e) =>
                        handleFilterChange("endDate", e.target.value)
                      }
                    />
                  </div>

                  {/* Warehouse Filter */}
                  {selectedTemplateData?.availableFilters?.includes(
                    "warehouseId"
                  ) &&
                    user?.role !== "lc_officer" && (
                      <div className="grid gap-2">
                        <Label htmlFor="warehouse">Warehouse</Label>
                        <Select
                          value={filters.warehouseId?.toString() || ""}
                          onValueChange={(value) =>
                            handleFilterChange(
                              "warehouseId",
                              value ? parseInt(value) : undefined
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All warehouses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All warehouses</SelectItem>
                            {(
                              (warehouses?.data as Array<
                                Record<string, unknown>
                              >) || []
                            ).map((w) => {
                              const warehouse = w as {
                                id: number | string;
                                name: string;
                              };
                              return (
                                <SelectItem
                                  key={warehouse.id}
                                  value={warehouse.id.toString()}
                                >
                                  {warehouse.name}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                  {/* Council Filter */}
                  {selectedTemplateData?.availableFilters?.includes(
                    "councilId"
                  ) &&
                    user?.role !== "lc_officer" && (
                      <div className="grid gap-2">
                        <Label htmlFor="council">Local Council</Label>
                        <Select
                          value={filters.councilId?.toString() || ""}
                          onValueChange={(value) =>
                            handleFilterChange(
                              "councilId",
                              value ? parseInt(value) : undefined
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All councils" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All councils</SelectItem>
                            {(
                              (councils?.data as Array<
                                Record<string, unknown>
                              >) || []
                            ).map((c) => {
                              const council = c as {
                                id: number | string;
                                name: string;
                              };
                              return (
                                <SelectItem
                                  key={council.id}
                                  value={council.id.toString()}
                                >
                                  {council.name}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                  {/* Item Filter */}
                  {selectedTemplateData?.availableFilters?.includes(
                    "itemId"
                  ) && (
                    <div className="grid gap-2">
                      <Label htmlFor="item">Item</Label>
                      <Select
                        value={filters.itemId?.toString() || ""}
                        onValueChange={(value) =>
                          handleFilterChange(
                            "itemId",
                            value ? parseInt(value) : undefined
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All items" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All items</SelectItem>
                          {(
                            (items?.data as Array<Record<string, unknown>>) ||
                            []
                          )
                            .slice(0, 20)
                            .map((it) => {
                              const item = it as {
                                id: number | string;
                                name: string;
                              };
                              return (
                                <SelectItem
                                  key={item.id}
                                  value={item.id.toString()}
                                >
                                  {item.name}
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Category Filter */}
                  {selectedTemplateData?.availableFilters?.includes(
                    "category"
                  ) && (
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={filters.category || ""}
                        onValueChange={(value) =>
                          handleFilterChange("category", value || undefined)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All categories</SelectItem>
                          <SelectItem value="Textbooks">Textbooks</SelectItem>
                          <SelectItem value="Stationery">Stationery</SelectItem>
                          <SelectItem value="Teaching Aids">
                            Teaching Aids
                          </SelectItem>
                          <SelectItem value="Science Equipment">
                            Science Equipment
                          </SelectItem>
                          <SelectItem value="Sports Equipment">
                            Sports Equipment
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Status Filter */}
                  {selectedTemplateData?.availableFilters?.includes(
                    "status"
                  ) && (
                    <div className="grid gap-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={filters.status || ""}
                        onValueChange={(value) =>
                          handleFilterChange("status", value || undefined)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>
                          <SelectItem value="In Stock">In Stock</SelectItem>
                          <SelectItem value="Low Stock">Low Stock</SelectItem>
                          <SelectItem value="Out of Stock">
                            Out of Stock
                          </SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Role-based restrictions notice */}
                {user?.role === "lc_officer" && user?.localCouncilName && (
                  <Alert>
                    <Database className="h-4 w-4" />
                    <AlertDescription>
                      Report data will be automatically filtered to show only{" "}
                      {user.localCouncilName} data based on your role.
                    </AlertDescription>
                  </Alert>
                )}

                {user?.role === "school_rep" && user?.schoolName && (
                  <Alert>
                    <Database className="h-4 w-4" />
                    <AlertDescription>
                      Report data will be automatically filtered to show only{" "}
                      {user.schoolName} data based on your role.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions Panel */}
        <div className="space-y-6">
          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Export Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="format">Export Format</Label>
                <Select
                  value={exportFormat}
                  onValueChange={(value: "excel" | "csv") =>
                    setExportFormat(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                    <SelectItem value="csv">CSV File</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="charts"
                  checked={includeCharts}
                  onCheckedChange={(checked) =>
                    setIncludeCharts(checked as boolean)
                  }
                />
                <Label htmlFor="charts">
                  Include charts and visualizations
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleGenerateReport}
                disabled={!selectedTemplate || isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  "Generating..."
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>

              {previewData && (
                <Button variant="outline" className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Preview Info */}
          {previewData && (
            <Card>
              <CardHeader>
                <CardTitle>Report Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Records:</span>
                    <span className="font-medium">
                      {previewData.metadata?.recordCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Generated:</span>
                    <span className="font-medium">
                      {previewData.metadata?.generatedAt
                        ? new Date(
                            previewData.metadata.generatedAt
                          ).toLocaleString()
                        : "Just now"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Execution Time:
                    </span>
                    <span className="font-medium">
                      {previewData.metadata?.executionTime || 0}ms
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
