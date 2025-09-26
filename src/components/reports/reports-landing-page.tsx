"use client";

import { useState, useEffect } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  FileText,
  TrendingUp,
  Package,
  Truck,
  School,
  Building2,
  Users,
  Download,
  Clock,
  AlertCircle,
  ArrowRight,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { reportsApi } from "@/lib/api";
import { addDownload } from "@/lib/downloads";
import { toast } from "sonner";

interface QuickReport {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: string;
  roles: string[];
  estimatedTime: string;
  dataPoints?: number;
}

const QUICK_REPORTS: QuickReport[] = [
  {
    id: "inventory_summary",
    title: "Inventory Summary",
    description: "Current stock levels across all warehouses",
    icon: Package,
    category: "National Level",
    roles: ["super_admin", "national_manager", "lc_officer", "view_only"],
    estimatedTime: "< 1 min",
  },
  {
    id: "shipment_history",
    title: "Shipment History",
    description: "Recent shipments and delivery status",
    icon: Truck,
    category: "National Level",
    roles: ["super_admin", "national_manager", "lc_officer", "view_only"],
    estimatedTime: "< 1 min",
  },
  {
    id: "distribution_summary",
    title: "Distribution Summary",
    description: "Distributions from councils to schools",
    icon: School,
    category: "Council Level",
    roles: ["super_admin", "national_manager", "lc_officer", "view_only"],
    estimatedTime: "< 1 min",
  },
  {
    id: "performance_metrics",
    title: "Performance Metrics",
    description: "Key performance indicators and operational metrics",
    icon: TrendingUp,
    category: "National Level",
    roles: ["super_admin", "national_manager"],
    estimatedTime: "1-2 min",
  },
  {
    id: "stock_movement",
    title: "Stock Movement Report",
    description: "Detailed tracking of inventory transactions",
    icon: BarChart3,
    category: "National Level",
    roles: ["super_admin", "national_manager"],
    estimatedTime: "2-3 min",
  },
  {
    id: "user_activity",
    title: "User Activity Report",
    description: "System usage and user login statistics",
    icon: Users,
    category: "Administrative",
    roles: ["super_admin"],
    estimatedTime: "< 1 min",
  },
];

interface RecentReport {
  id: string;
  name: string;
  type: string;
  generatedAt: string;
  recordCount: number;
  downloadUrl?: string;
}

export function ReportsLandingPage() {
  const { user } = useAuth();
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);

  // Get available report templates
  const {
    data: templates,
    isLoading: templatesLoading,
    error: templatesError,
  } = useQuery({
    queryKey: ["report-templates"],
    queryFn: async () => {
      try {
        console.log("Fetching report templates...");
        const result = await reportsApi.getTemplates();
        console.log("Templates fetched successfully:", result);
        return result;
      } catch (error) {
        console.error("Failed to fetch templates:", error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Filter reports based on user role
  const availableReports = QUICK_REPORTS.filter(
    (report) =>
      report.roles.includes("all") || report.roles.includes(user?.role || "")
  );

  // Group reports by category
  const reportsByCategory = availableReports.reduce((acc, report) => {
    const category = report.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(report);
    return acc;
  }, {} as Record<string, QuickReport[]>);

  const handleGenerateReport = async (reportId: string) => {
    setGeneratingReport(reportId);

    try {
      // Debug logging
      console.log("Looking for template with ID:", reportId);
      console.log("Available templates object:", templates);
      console.log("Templates data:", templates?.data);

      // Find template by ID or by type (since our hardcoded IDs might match type instead of ID)
      const template = templates?.data?.find(
        (t: any) => t.id === reportId || t.type === reportId
      );
      if (!template) {
        console.error(
          "Available templates:",
          templates?.data?.map((t: any) => ({ id: t.id, type: t.type }))
        );
        console.error("Report ID being searched:", reportId);
        throw new Error(
          `Report template not found for ID: ${reportId}. Available templates: ${
            templates?.data?.length || 0
          }`
        );
      }

      console.log("Using template:", template);
      const result = await reportsApi.generateReport({
        type: template.type,
        exportFormat: "csv",
        ...template.defaultConfig,
      });

      if (result.data) {
        // Add to recent reports (local state)
        const newReport: RecentReport = {
          id: Date.now().toString(),
          name: template.name,
          type: template.type,
          generatedAt: new Date().toISOString(),
          recordCount: result.data.metadata?.recordCount || 0,
          downloadUrl: result.data.exportUrl,
        };

        setRecentReports((prev) => [newReport, ...prev.slice(0, 4)]);

        // Add to downloads (persistent)
        addDownload({
          name: template.name,
          type: template.type,
          format: "csv",
          status: "completed",
          completedAt: new Date().toISOString(),
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(), // 7 days from now
          recordCount: result.data.metadata?.recordCount || 0,
          downloadUrl:
            result.data.exportUrl ||
            `/exports/${template.type}-${Date.now()}.csv`,
          generatedBy: user?.name || "Unknown User",
          fileSize: result.data?.metadata?.fileSize || "Unknown size",
        });

        toast.success(`${template.name} generated successfully`);
      }
    } catch (error: any) {
      toast.error(`Failed to generate report: ${error.message}`);
    } finally {
      setGeneratingReport(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "National Level":
        return Building2;
      case "Council Level":
        return MapPin;
      case "School Level":
        return School;
      case "Administrative":
        return Users;
      default:
        return FileText;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "National Level":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Council Level":
        return "bg-green-50 text-green-700 border-green-200";
      case "School Level":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Administrative":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  if (templatesLoading) {
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

  if (templatesError) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Reports Dashboard
          </h1>
          <p className="text-muted-foreground">
            Generate reports and analyze system data based on your role and
            responsibilities
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

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Reports Dashboard
        </h1>
        <p className="text-muted-foreground">
          Generate reports and analyze system data based on your role and
          responsibilities
        </p>
      </div>

      {/* Role-based welcome message */}
      <Alert>
        <BarChart3 className="h-4 w-4" />
        <AlertDescription>
          Welcome, {user?.name}! As a {user?.roleName}, you have access to{" "}
          {availableReports.length} report types.
          {user?.role === "lc_officer" &&
            user?.localCouncilName &&
            ` Reports will be filtered for ${user.localCouncilName}.`}
          {user?.role === "school_rep" &&
            user?.schoolName &&
            ` Reports will be filtered for ${user.schoolName}.`}
        </AlertDescription>
      </Alert>

      {/* Recent Reports */}
      {recentReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Reports
            </CardTitle>
            <CardDescription>Your recently generated reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{report.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {report.recordCount} records • Generated{" "}
                      {new Date(report.generatedAt).toLocaleString()}
                    </p>
                  </div>
                  {report.downloadUrl && (
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Categories */}
      {Object.entries(reportsByCategory).map(([category, reports]) => {
        const CategoryIcon = getCategoryIcon(category);

        return (
          <div key={category} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getCategoryColor(category)}`}>
                <CategoryIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{category} Reports</h2>
                <p className="text-sm text-muted-foreground">
                  {reports.length} report{reports.length !== 1 ? "s" : ""}{" "}
                  available
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reports.map((report) => {
                const Icon = report.icon;
                const isGenerating = generatingReport === report.id;

                return (
                  <Card
                    key={report.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Icon className="h-8 w-8 text-primary" />
                        <Badge variant="secondary" className="text-xs">
                          {report.estimatedTime}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button
                        onClick={() => handleGenerateReport(report.id)}
                        disabled={isGenerating}
                        className="w-full"
                      >
                        {isGenerating ? (
                          "Generating..."
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
          </div>
        );
      })}

      {/* No reports available message */}
      {availableReports.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reports Available</h3>
            <p className="text-muted-foreground text-center">
              You don't have access to any reports with your current role.
              Contact your administrator if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
