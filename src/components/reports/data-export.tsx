"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Download,
  Database,
  FileText,
  Package,
  Truck,
  Building2,
  School,
  Users,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";

interface DataSource {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "core" | "operations" | "users" | "system";
  recordCount?: number;
  lastUpdated?: string;
  roles: string[];
  formats: ("csv" | "xlsx" | "json")[];
}

interface ExportJob {
  id: string;
  dataSource: string;
  format: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  fileSize?: string;
  downloadUrl?: string;
}

export function DataExport() {
  const { user } = useAuth();
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string>("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);

  const dataSources: DataSource[] = [
    {
      id: "items",
      name: "Items Master",
      description: "All items with codes, descriptions, and specifications",
      icon: Package,
      category: "core",
      recordCount: 1250,
      lastUpdated: "2025-08-01T10:30:00Z",
      roles: ["super_admin", "national_manager", "view_only"],
      formats: ["csv", "xlsx", "json"],
    },
    {
      id: "warehouses",
      name: "Warehouses",
      description: "Warehouse locations and contact information",
      icon: Database,
      category: "core",
      recordCount: 4,
      lastUpdated: "2025-07-30T15:45:00Z",
      roles: ["super_admin", "national_manager"],
      formats: ["csv", "xlsx", "json"],
    },
    {
      id: "schools",
      name: "Schools Directory",
      description: "Complete list of schools with enrollment data",
      icon: School,
      category: "core",
      recordCount: 1247,
      lastUpdated: "2025-08-01T08:15:00Z",
      roles: ["super_admin", "national_manager", "lc_officer", "view_only"],
      formats: ["csv", "xlsx", "json"],
    },
    {
      id: "councils",
      name: "Local Councils",
      description: "Local council information and contact details",
      icon: Building2,
      category: "core",
      recordCount: 14,
      lastUpdated: "2025-07-25T12:00:00Z",
      roles: ["super_admin", "national_manager"],
      formats: ["csv", "xlsx", "json"],
    },
    {
      id: "inventory",
      name: "Inventory Data",
      description: "Current inventory levels across all locations",
      icon: Package,
      category: "operations",
      recordCount: 8420,
      lastUpdated: "2025-08-01T11:00:00Z",
      roles: ["super_admin", "national_manager", "lc_officer"],
      formats: ["csv", "xlsx"],
    },
    {
      id: "shipments",
      name: "Shipments",
      description: "All shipment records with tracking information",
      icon: Truck,
      category: "operations",
      recordCount: 156,
      lastUpdated: "2025-08-01T09:30:00Z",
      roles: ["super_admin", "national_manager", "lc_officer", "view_only"],
      formats: ["csv", "xlsx", "json"],
    },
    {
      id: "distributions",
      name: "Distributions",
      description: "Distribution records from councils to schools",
      icon: Building2,
      category: "operations",
      recordCount: 289,
      lastUpdated: "2025-08-01T10:15:00Z",
      roles: [
        "super_admin",
        "national_manager",
        "lc_officer",
        "school_rep",
        "view_only",
      ],
      formats: ["csv", "xlsx", "json"],
    },
    {
      id: "users",
      name: "System Users",
      description: "User accounts and role assignments",
      icon: Users,
      category: "users",
      recordCount: 87,
      lastUpdated: "2025-07-31T16:20:00Z",
      roles: ["super_admin"],
      formats: ["csv", "xlsx"],
    },
    {
      id: "audit-log",
      name: "Audit Log",
      description: "System activity and user actions log",
      icon: FileText,
      category: "system",
      recordCount: 12456,
      lastUpdated: "2025-08-01T11:30:00Z",
      roles: ["super_admin"],
      formats: ["csv", "json"],
    },
  ];

  const mockExportJobs: ExportJob[] = [
    {
      id: "1",
      dataSource: "Items Master",
      format: "xlsx",
      status: "completed",
      createdAt: "2025-08-01T10:00:00Z",
      completedAt: "2025-08-01T10:05:00Z",
      fileSize: "2.3 MB",
      downloadUrl: "/downloads/items-master-20250801.xlsx",
    },
    {
      id: "2",
      dataSource: "Shipments",
      format: "csv",
      status: "processing",
      createdAt: "2025-08-01T11:15:00Z",
    },
  ];

  const visibleSources = dataSources.filter((source) =>
    source.roles.includes(user?.role || "view_only")
  );

  const handleSourceToggle = (sourceId: string) => {
    setSelectedSources((prev) =>
      prev.includes(sourceId)
        ? prev.filter((id) => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleExport = async () => {
    if (selectedSources.length === 0) return;

    setIsExporting(true);

    // Simulate export process
    setTimeout(() => {
      const newJob: ExportJob = {
        id: Date.now().toString(),
        dataSource:
          selectedSources.length === 1
            ? dataSources.find((s) => s.id === selectedSources[0])?.name ||
              "Multiple"
            : `${selectedSources.length} data sources`,
        format: selectedFormat,
        status: "processing",
        createdAt: new Date().toISOString(),
      };

      setExportJobs((prev) => [newJob, ...prev]);
      setSelectedSources([]);
      setIsExporting(false);
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "processing":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "core":
        return "bg-blue-100 text-blue-800";
      case "operations":
        return "bg-green-100 text-green-800";
      case "users":
        return "bg-purple-100 text-purple-800";
      case "system":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Export Data</h1>
          <p className="text-muted-foreground">
            Export system data in various formats for analysis and reporting
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Data Sources Selection */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Select Data Sources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {["core", "operations", "users", "system"].map((category) => {
                const categorySources = visibleSources.filter(
                  (s) => s.category === category
                );
                if (categorySources.length === 0) return null;

                return (
                  <div key={category}>
                    <h3 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                      {category.replace("_", " ")}
                    </h3>
                    <div className="space-y-3">
                      {categorySources.map((source) => (
                        <div
                          key={source.id}
                          className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <Checkbox
                            id={source.id}
                            checked={selectedSources.includes(source.id)}
                            onCheckedChange={() =>
                              handleSourceToggle(source.id)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <source.icon className="h-4 w-4 text-muted-foreground" />
                              <Label
                                htmlFor={source.id}
                                className="font-medium cursor-pointer"
                              >
                                {source.name}
                              </Label>
                              <Badge
                                variant="secondary"
                                className={getCategoryColor(source.category)}
                              >
                                {source.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {source.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>
                                {source.recordCount?.toLocaleString()} records
                              </span>
                              <span>
                                Updated{" "}
                                {new Date(
                                  source.lastUpdated!
                                ).toLocaleDateString()}
                              </span>
                              <div className="flex gap-1">
                                {source.formats.map((format) => (
                                  <Badge
                                    key={format}
                                    variant="outline"
                                    className="text-xs py-0"
                                  >
                                    {format.toUpperCase()}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Export Options */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Export Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Format</Label>
                <div className="mt-2 space-y-2">
                  {["csv", "xlsx", "json"].map((format) => (
                    <div key={format} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={format}
                        name="format"
                        value={format}
                        checked={selectedFormat === format}
                        onChange={(e) => setSelectedFormat(e.target.value)}
                        aria-label={`Select ${format} format`}
                        className="text-green-600"
                      />
                      <Label htmlFor={format} className="cursor-pointer">
                        {format.toUpperCase()}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedSources.length} data source
                  {selectedSources.length !== 1 ? "s" : ""} selected
                </p>
                <Button
                  onClick={handleExport}
                  disabled={selectedSources.length === 0 || isExporting}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? "Preparing Export..." : "Start Export"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Export Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Exports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...exportJobs, ...mockExportJobs].slice(0, 5).map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <p className="font-medium text-sm">{job.dataSource}</p>
                        <p className="text-xs text-muted-foreground">
                          {job.format.toUpperCase()} •{" "}
                          {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {job.status === "completed" && job.downloadUrl && (
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}

                {exportJobs.length === 0 && mockExportJobs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent exports
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Important Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Exported data may contain sensitive information. Please ensure proper
          handling and storage of downloaded files according to your
          organization&apos;s data protection policies.
        </AlertDescription>
      </Alert>
    </div>
  );
}
