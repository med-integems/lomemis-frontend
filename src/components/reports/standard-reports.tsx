"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Calendar,
  Package,
  Truck,
  GraduationCap,
  Building,
  Users,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { reportsApi } from "@/lib/api";
import { toast } from "sonner";

export interface StandardReport {
  id: string;
  title: string;
  description: string;
  category: "inventory" | "shipments" | "distributions" | "users" | "analytics";
  icon: React.ComponentType<{ className?: string }>;
  frequency: "daily" | "weekly" | "monthly" | "on-demand";
  lastGenerated?: string;
  fileSize?: string;
  roles: string[];
}

interface StandardReportsProps {
  userRole?: string;
  onGenerateReport: (reportId: string) => void;
  onDownloadReport: (reportId: string) => void;
  onPreviewData?: (result: any) => void; // callback to show preview in container
  isGenerating?: string; // reportId currently being generated
}

const standardReports: StandardReport[] = [
  {
    id: "national-inventory",
    title: "National Inventory Summary",
    description: "Complete overview of all items in national warehouses",
    category: "inventory",
    icon: Package,
    frequency: "daily",
    lastGenerated: "2024-01-15T10:30:00Z",
    fileSize: "2.3 MB",
    roles: ["super_admin", "national_manager", "view_only"],
  },
  {
    id: "shipment-history",
    title: "Shipment History Report",
    description:
      "Detailed history of all shipments between warehouses and councils",
    category: "shipments",
    icon: Truck,
    frequency: "weekly",
    lastGenerated: "2024-01-14T15:45:00Z",
    fileSize: "1.8 MB",
    roles: ["super_admin", "national_manager", "lc_officer", "view_only"],
  },
  {
    id: "council-stock",
    title: "Local Council Stock Levels",
    description: "Current inventory levels across all local councils",
    category: "inventory",
    icon: Building,
    frequency: "daily",
    lastGenerated: "2024-01-15T08:15:00Z",
    fileSize: "1.2 MB",
    roles: ["super_admin", "national_manager", "lc_officer", "view_only"],
  },
  {
    id: "distribution-by-school",
    title: "Distribution by School",
    description: "Summary of all distributions made to schools",
    category: "distributions",
    icon: GraduationCap,
    frequency: "monthly",
    lastGenerated: "2024-01-01T12:00:00Z",
    fileSize: "3.1 MB",
    roles: ["super_admin", "national_manager", "lc_officer", "view_only"],
  },
  {
    id: "user-activity",
    title: "User Activity Report",
    description: "System usage and user activity analytics",
    category: "users",
    icon: Users,
    frequency: "weekly",
    lastGenerated: "2024-01-13T16:20:00Z",
    fileSize: "0.8 MB",
    roles: ["super_admin"],
  },
  {
    id: "inventory-movements",
    title: "Inventory Movement Analytics",
    description: "Detailed analysis of inventory movements and trends",
    category: "analytics",
    icon: BarChart3,
    frequency: "monthly",
    lastGenerated: "2024-01-01T09:30:00Z",
    fileSize: "2.7 MB",
    roles: ["super_admin", "national_manager", "view_only"],
  },
];

export function StandardReports({
  userRole,
  onGenerateReport,
  onDownloadReport,
  isGenerating,
}: StandardReportsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch report templates from backend
  const { data: templatesData, isLoading: templatesLoading } = useApiQuery(
    ["report-templates"],
    reportsApi.getReportTemplates
  );

  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // Prefer preview first to avoid backend export failures during demo
  const previewMutation = useApiMutation(
    ({ reportType, config }: { reportType: string; config: any }) =>
      reportsApi.previewReport({ type: reportType, ...config }),
    {
      meta: { showErrorToast: false },
      onMutate: ({ reportType }) => setGeneratingId(reportType),
      onSuccess: (res) => {
        toast.success("Preview ready");
        onPreviewData?.(res.data);
      },
      onError: (error: any) => {
        toast.error(`Failed to preview report: ${error.message}`);
      },
      onSettled: () => setGeneratingId(null),
    }
  );

  const backendTemplates = templatesData?.data || [];

  const categories = [
    { id: "all", label: "All Reports", count: 0 },
    { id: "inventory", label: "Inventory", count: 0 },
    { id: "shipments", label: "Shipments", count: 0 },
    { id: "distributions", label: "Distributions", count: 0 },
    { id: "users", label: "Users", count: 0 },
    { id: "analytics", label: "Analytics", count: 0 },
  ];

  // Merge backend templates with static reports, prioritizing backend data
  const allReports = [
    ...backendTemplates.map((template: any) => ({
      id: template.id,
      title: template.name,
      description: template.description,
      category: template.type.includes("inventory")
        ? "inventory"
        : template.type.includes("shipment")
        ? "shipments"
        : template.type.includes("distribution")
        ? "distributions"
        : template.type.includes("user")
        ? "users"
        : "analytics",
      icon: getIconForType(template.type),
      frequency: "on-demand" as const,
      roles: template.roles,
      template: template,
    })),
    ...standardReports.filter(
      (report) => !backendTemplates.some((t: any) => t.id === report.id)
    ),
  ];

  // Filter reports based on user role
  const filteredReports = allReports.filter(
    (report) => !userRole || report.roles.includes(userRole)
  );

  // Filter by category
  const displayedReports =
    selectedCategory === "all"
      ? filteredReports
      : filteredReports.filter(
          (report) => report.category === selectedCategory
        );

  // Update category counts
  categories.forEach((category) => {
    if (category.id === "all") {
      category.count = filteredReports.length;
    } else {
      category.count = filteredReports.filter(
        (r) => r.category === category.id
      ).length;
    }
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "inventory":
        return "bg-blue-100 text-blue-800";
      case "shipments":
        return "bg-green-100 text-green-800";
      case "distributions":
        return "bg-purple-100 text-purple-800";
      case "users":
        return "bg-orange-100 text-orange-800";
      case "analytics":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case "daily":
        return "bg-green-100 text-green-800";
      case "weekly":
        return "bg-blue-100 text-blue-800";
      case "monthly":
        return "bg-purple-100 text-purple-800";
      case "on-demand":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatLastGenerated = (dateString?: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  function getIconForType(type: string) {
    if (type.includes("inventory")) return Package;
    if (type.includes("shipment")) return Truck;
    if (type.includes("distribution")) return GraduationCap;
    if (type.includes("user")) return Users;
    if (type.includes("performance")) return BarChart3;
    return FileText;
  }

  const handleGenerateReport = (reportId: string) => {
    const report = filteredReports.find((r) => r.id === reportId);
    // Default last30 date filter for demo
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    const filters = {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };

    // Prefer preview instead of export; when needed, export can be triggered from Preview
    const reportType = (report as any)?.template?.type || reportId;
    previewMutation.mutate({ reportType, config: { filters, limit: 100 } });
  };

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="flex items-center gap-2"
          >
            {category.label}
            <Badge variant="secondary" className="ml-1">
              {category.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedReports.map((report) => {
          const Icon = report.icon;
          const isCurrentlyGenerating = isGenerating === report.id;

          return (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            getCategoryColor(report.category)
                          )}
                        >
                          {report.category}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            getFrequencyColor(report.frequency)
                          )}
                        >
                          {report.frequency}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {report.description}
                </p>

                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Last generated:{" "}
                      {formatLastGenerated(report.lastGenerated)}
                    </span>
                  </div>
                  {report.fileSize && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      <span>File size: {report.fileSize}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleGenerateReport(report.id)}
                    disabled={
                      isCurrentlyGenerating ||
                      (generatingId !== null && generatingId !== report.id) ||
                      previewMutation.isPending
                    }
                    className="flex-1"
                  >
                    {isCurrentlyGenerating || previewMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="h-3 w-3 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>

                  {report.lastGenerated && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDownloadReport(report.id)}
                      disabled={isCurrentlyGenerating}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {displayedReports.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No reports available
          </h3>
          <p className="text-muted-foreground">
            {selectedCategory === "all"
              ? "You don't have access to any reports with your current role."
              : `No ${selectedCategory} reports are available for your role.`}
          </p>
        </div>
      )}
    </div>
  );
}
