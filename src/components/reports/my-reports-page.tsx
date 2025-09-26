"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  BarChart3,
  Package,
  Truck,
  School,
  TrendingUp,
  Users,
  Star,
  Clock,
  ArrowRight,
} from "lucide-react";
import type { ComponentType } from "react";
import { useAuth } from "@/contexts/auth-context";
import { reportsApi } from "@/lib/api";
import { addDownload } from "@/lib/downloads";
import { toast } from "sonner";

interface RoleSpecificReport {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<Record<string, unknown>>;
  frequency: "daily" | "weekly" | "monthly";
  relevance: "high" | "medium" | "low";
  lastGenerated?: string;
  nextScheduled?: string;
}

type ReportTemplate = {
  id: string;
  type?: string;
  name?: string;
  defaultConfig?: unknown;
  roles?: string[];
};

const ROLE_SPECIFIC_REPORTS: Record<string, RoleSpecificReport[]> = {
  super_admin: [
    {
      id: "system_overview",
      title: "System Overview Dashboard",
      description:
        "Complete system status, user activity, and performance metrics",
      icon: BarChart3,
      frequency: "daily",
      relevance: "high",
    },
    {
      id: "inventory_summary",
      title: "National Inventory Summary",
      description: "Stock levels across all warehouses and regions",
      icon: Package,
      frequency: "daily",
      relevance: "high",
    },
    {
      id: "user_activity",
      title: "User Activity Report",
      description: "Login patterns, system usage, and user performance",
      icon: Users,
      frequency: "weekly",
      relevance: "medium",
    },
    {
      id: "performance_metrics",
      title: "System Performance Metrics",
      description: "KPIs, efficiency indicators, and operational analytics",
      icon: TrendingUp,
      frequency: "weekly",
      relevance: "medium",
    },
  ],
  national_manager: [
    {
      id: "inventory_summary",
      title: "National Inventory Summary",
      description: "Current stock levels and warehouse capacity",
      icon: Package,
      frequency: "daily",
      relevance: "high",
    },
    {
      id: "shipment_history",
      title: "Shipment Status Report",
      description: "Active shipments and delivery performance",
      icon: Truck,
      frequency: "daily",
      relevance: "high",
    },
    {
      id: "distribution_summary",
      title: "Distribution Analytics",
      description: "Council-to-school distribution patterns and efficiency",
      icon: School,
      frequency: "weekly",
      relevance: "medium",
    },
    {
      id: "performance_metrics",
      title: "Operational Metrics",
      description: "Supply chain KPIs and performance indicators",
      icon: TrendingUp,
      frequency: "weekly",
      relevance: "medium",
    },
  ],
  lc_officer: [
    {
      id: "council_inventory",
      title: "My Council Inventory",
      description: "Current stock levels and upcoming needs for your council",
      icon: Package,
      frequency: "daily",
      relevance: "high",
    },
    {
      id: "incoming_shipments",
      title: "Incoming Shipments",
      description: "Shipments destined for your council",
      icon: Truck,
      frequency: "daily",
      relevance: "high",
    },
    {
      id: "school_distributions",
      title: "School Distribution Status",
      description: "Distributions to schools in your council area",
      icon: School,
      frequency: "weekly",
      relevance: "high",
    },
  ],
  school_rep: [
    {
      id: "school_inventory",
      title: "My School Inventory",
      description: "Current materials and supplies at your school",
      icon: Package,
      frequency: "weekly",
      relevance: "high",
    },
    {
      id: "receipt_history",
      title: "Receipt History",
      description: "History of materials received by your school",
      icon: FileText,
      frequency: "monthly",
      relevance: "medium",
    },
  ],
  view_only: [
    {
      id: "inventory_summary",
      title: "Inventory Overview",
      description: "Read-only view of system inventory levels",
      icon: Package,
      frequency: "daily",
      relevance: "medium",
    },
    {
      id: "shipment_history",
      title: "Shipment Overview",
      description: "View shipment status and history",
      icon: Truck,
      frequency: "weekly",
      relevance: "medium",
    },
  ],
};

export function MyReportsPage() {
  const { user } = useAuth();
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [favoriteReports, setFavoriteReports] = useState<string[]>([]);
  

  // Get report templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ["report-templates"],
    queryFn: async () => {
      try {
        console.log("Fetching report templates in My Reports...");
        const result = await reportsApi.getTemplates();
        console.log("Templates fetched successfully in My Reports:", result);
        return result;
      } catch (error) {
        console.error("Failed to fetch templates in My Reports:", error);
        throw error;
      }
    },
    retry: 3,
  });

  const userRole = user?.role || "";
  const roleSpecificReports = ROLE_SPECIFIC_REPORTS[userRole] || [];

  const handleGenerateReport = async (reportId: string) => {
    setGeneratingReport(reportId);

    try {
      // Check if templates are loaded
      if (!templates) {
        toast.error("Templates are still loading. Please wait and try again.");
        return;
      }

      // Extract template array from API response - handle both direct array and wrapped data
      const templateArray = Array.isArray(templates) ? templates : 
                           (templates.data && Array.isArray(templates.data)) ? templates.data : 
                           [];
      
      if (templateArray.length === 0) {
        console.error("No templates available");
        toast.error("No report templates are available. Please contact your administrator.");
        return;
      }

      // Find template by ID or by type (since our hardcoded IDs might match type instead of ID)
      const template = templateArray.find(
        (t: ReportTemplate) => t.id === reportId || t.type === reportId
      );
      if (!template) {
        console.error(
          "Available templates:",
          templateArray.map((t: ReportTemplate) => ({
            id: t.id || 'no-id',
            type: t.type || 'no-type',
            name: t.name || 'no-name'
          }))
        );
        toast.error(`Report template not found for ID: ${reportId}. Please check the available templates.`);
        return;
      }

      const config: {
        type: string;
        title?: string;
        description?: string;
        filters?: Record<string, unknown>;
        exportFormat?: "excel" | "csv";
        includeCharts?: boolean;
      } = {
        type: String(template.type || template.id),
        exportFormat: "csv",
        ...((template.defaultConfig as Record<string, unknown>) || {}),
      };

      // Apply role-based filters safely
      config.filters = { ...(config.filters || {}) };
      if (user?.localCouncilId && userRole === "lc_officer") {
        config.filters = { ...config.filters, councilId: user.localCouncilId };
      }
      if (user?.schoolId && userRole === "school_rep") {
        config.filters = { ...config.filters, schoolId: user.schoolId };
      }

      const result = await reportsApi.generateReport(config);

      // Add to downloads
      addDownload({
        name: template.name,
        type: template.type,
        format: "csv",
        status: "completed",
        completedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        recordCount: result.data?.metadata?.recordCount || 0,
        downloadUrl:
          result.data?.exportUrl ||
          `/exports/${template.type}-${Date.now()}.csv`,
        generatedBy: user?.name || "Unknown User",
        fileSize: result.data?.metadata?.fileSize || "Unknown size",
      });

      toast.success(`${template.name} generated successfully`);

      if (result.data?.exportUrl) {
        // Auto-download the report using authenticated API client
        (async () => {
          try {
            const downloadUrl = result.data.exportUrl as string;
            const parts = downloadUrl.split("/").filter(Boolean);
            let filename = parts
              .reverse()
              .find((p: string) => /\.[a-zA-Z0-9]+$/.test(p));
            if (!filename) {
              const reversed = parts;
              if (reversed[1]) filename = reversed[1];
            }
            if (!filename) filename = parts[0] ?? ``;
            filename = decodeURIComponent(filename);

            const blob = await reportsApi.downloadExport(filename);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${reportId}-report.csv`;
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
    } catch (error: unknown) {
      console.error("Report generation error:", error);
      let message = "An unexpected error occurred";
      
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        message = String((error as any).message);
      }
      
      toast.error(`Failed to generate report: ${message}`);
    } finally {
      setGeneratingReport(null);
    }
  };

  const toggleFavorite = (reportId: string) => {
    setFavoriteReports((prev) =>
      prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId]
    );
  };

  const getRelevanceBadge = (relevance: string) => {
    switch (relevance) {
      case "high":
        return <Badge className="bg-red-100 text-red-800">High Priority</Badge>;
      case "medium":
        return <Badge variant="secondary">Medium Priority</Badge>;
      case "low":
        return <Badge variant="outline">Low Priority</Badge>;
      default:
        return null;
    }
  };

  const getFrequencyBadge = (frequency: string) => {
    switch (frequency) {
      case "daily":
        return <Badge variant="default">Daily</Badge>;
      case "weekly":
        return <Badge variant="secondary">Weekly</Badge>;
      case "monthly":
        return <Badge variant="outline">Monthly</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">My Reports</h1>
        <p className="text-muted-foreground">
          Reports tailored specifically for your role
          {user?.localCouncilName && ` in ${user.localCouncilName}`}
          {user?.schoolName && ` at ${user.schoolName}`}
        </p>
      </div>

      <Tabs defaultValue="role-specific" className="space-y-6">
        <TabsList>
          <TabsTrigger value="role-specific">Role-Specific Reports</TabsTrigger>
          <TabsTrigger value="favorites">
            Favorites ({favoriteReports.length})
          </TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>

        <TabsContent value="role-specific" className="space-y-6">
          {roleSpecificReports.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {roleSpecificReports.map((report) => {
                const Icon = report.icon;
                const isGenerating = generatingReport === report.id;
                const isFavorite = favoriteReports.includes(report.id);

                return (
                  <Card
                    key={report.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <Icon className="h-8 w-8 text-primary" />
                        <div className="flex items-center gap-2">
                          {getRelevanceBadge(report.relevance)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFavorite(report.id)}
                            className={`p-1 h-8 w-8 ${
                              isFavorite ? "text-yellow-500" : "text-gray-400"
                            }`}
                          >
                            <Star
                              className={`h-4 w-4 ${
                                isFavorite ? "fill-current" : ""
                              }`}
                            />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        {getFrequencyBadge(report.frequency)}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Updated {report.frequency}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleGenerateReport(report.id)}
                        disabled={isGenerating || isLoading}
                        className="w-full"
                      >
                        {isGenerating ? (
                          "Generating..."
                        ) : isLoading ? (
                          "Loading Templates..."
                        ) : (
                          <>
                            Generate Report
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Role-Specific Reports
                </h3>
                <p className="text-muted-foreground text-center">
                  No reports are currently configured for your role.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-6">
          {favoriteReports.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {favoriteReports.map((reportId) => {
                const report = roleSpecificReports.find(
                  (r) => r.id === reportId
                );
                if (!report) return null;

                const Icon = report.icon;
                const isGenerating = generatingReport === report.id;

                return (
                  <Card
                    key={report.id}
                    className="hover:shadow-md transition-shadow border-yellow-200"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <Icon className="h-8 w-8 text-primary" />
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      </div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => handleGenerateReport(report.id)}
                        disabled={isGenerating || isLoading}
                        className="w-full"
                      >
                        {isGenerating ? (
                          "Generating..."
                        ) : isLoading ? (
                          "Loading Templates..."
                        ) : (
                          <>
                            Generate Report
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Star className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Favorite Reports
                </h3>
                <p className="text-muted-foreground text-center">
                  Star reports to add them to your favorites for quick access.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Recent Reports</h3>
              <p className="text-muted-foreground text-center">
                Generate reports to see your recent activity here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
