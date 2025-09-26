"use client";

import React, { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { useResponsive } from "@/hooks/useResponsive";
import {
  schoolInventoryApi,
  distributionsApi,
  directShipmentsApi,
  schoolsApi,
  schoolReportsApi,
} from "@/lib/api";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Package,
  School,
  Users,
  BarChart3,
  PieChart,
  LineChart,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  GraduationCap,
  MapPin,
  Filter,
  RefreshCw,
  Search,
  RotateCcw,
  Activity,
  Target,
  Timer,
  Loader2,
} from "lucide-react";
import { ChartComponent } from "./chart-component";
import { PDFGenerator } from "@/lib/pdf-generator";

interface SchoolReportData {
  inventoryReport: {
    totalItems: number;
    totalValue: number;
    itemsInUse: number;
    itemsNeedingMaintenance: number;
    categories: {
      name: string;
      count: number;
      condition: string;
    }[];
    utilizationRate: number;
    studentRatio: number;
  };
  distributionReport: {
    totalDistributions: number;
    totalItemsReceived: number;
    confirmationRate: number;
    averageConfirmationTime: number;
    byMonth: { month: string; count: number; items: number }[];
    bySource: { name: string; count: number; items: number }[];
  };
  utilizationReport: {
    activeItems: number;
    utilizationRate: number;
    itemUtilization: {
      category: string;
      utilized: number;
      total: number;
      percentage: number;
    }[];
    resourceEfficiency: number;
  };
  performanceMetrics: {
    inventoryHealth: number;
    utilizationEfficiency: number;
    confirmationTimeliness: number;
    itemConditionScore: number;
    resourceOptimization: number;
  };
}

interface SchoolReportsManagementProps {
  className?: string;
}

export function SchoolReportsManagement({
  className,
}: SchoolReportsManagementProps) {
  const { user } = useUser();
  const { isMobile, isTablet } = useResponsive();
  const [activeTab, setActiveTab] = useState("overview");
  const [reportData, setReportData] = useState<SchoolReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });
  const [tempDateRange, setTempDateRange] = useState({
    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [selectedReportType, setSelectedReportType] = useState("overview");
  const [generating, setGenerating] = useState(false);
  const [filtersApplying, setFiltersApplying] = useState(false);
  const [hasUnappliedChanges, setHasUnappliedChanges] = useState(false);
  const [schools, setSchools] = useState([]);
  const [viewMode, setViewMode] = useState("single"); // single or multi

  // Store timeout ref for debounce
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch schools list
  const fetchSchools = async () => {
    try {
      const response = await schoolsApi.getSchools(1, 100);
      if (response.success) {
        const schoolList = (response.data?.schools || []).map(
          (school: any) => ({
            id: school.id.toString(),
            name: school.name || school.schoolName,
            location: school.location || school.district,
            council: school.council || school.localCouncil,
          })
        );
        setSchools(schoolList);
      } else {
        console.error("Failed to fetch schools:", response.error);
      }
    } catch (error) {
      console.error("Error fetching schools:", error);
      // No fallback schools - use empty array
      setSchools([]);
    }
  };

  // Fetch comprehensive school report data
  const fetchReportData = async (customDateRange?: {
    from: string;
    to: string;
  }) => {
    if (!user) return;

    const effectiveDateRange = customDateRange || dateRange;
    console.log(
      "Fetching school report data with date range:",
      effectiveDateRange
    );

    try {
      setLoading(true);

      const filters = {
        schoolId: selectedSchool !== "all" ? selectedSchool : undefined,
        startDate: effectiveDateRange.from,
        endDate: effectiveDateRange.to,
        userRole: user?.role || "Super Administrator",
        userSchoolId: user?.schoolId,
      };

      console.log("User role:", user?.role);
      console.log("User school:", user?.schoolId);
      console.log("Request filters:", filters);

      // Fetch data from school reports API endpoints
      const [
        inventoryResponse,
        distributionResponse,
        utilizationResponse,
        performanceResponse,
      ] = await Promise.all([
        schoolReportsApi.getSchoolInventoryReport(filters),
        schoolReportsApi.getSchoolDistributionReport(filters),
        schoolReportsApi.getSchoolUtilizationReport(filters),
        schoolReportsApi.getSchoolPerformanceReport(filters),
      ]);

      // Process the responses - the school reports API returns structured data
      const inventoryData = inventoryResponse.data || {};
      const distributionData = distributionResponse.data || {};
      const utilizationData = utilizationResponse.data || {};
      const performanceData = performanceResponse.data || {};

      console.log("School Reports API Response data:", {
        inventoryData,
        distributionData,
        utilizationData,
        performanceData,
      });

      // API connectivity OK; no user-facing toast needed

      // Check if we got valid structured data from the API
      const hasValidData = inventoryData && (inventoryData.totalItems !== undefined || 
        Object.keys(inventoryData).length > 0);

      if (!hasValidData) {
        console.log("No valid API data found");
        toast.error("No school report data available from the database");
        setReportData(null);
        return;
      }

      console.log("Processing valid API data");

      // Use the structured data directly from the backend service
      const inventoryReport = {
        totalItems: inventoryData.totalItems || 0,
        totalValue: inventoryData.totalValue || 0,
        itemsInUse: inventoryData.itemsInUse || 0,
        itemsNeedingMaintenance: inventoryData.damagedItems || inventoryData.itemsNeedingMaintenance || 0,
        categories: inventoryData.categories || [],
        utilizationRate: inventoryData.utilizationRate || 0,
        studentRatio: inventoryData.studentRatio || 0,
      };

      // Use the structured data directly from the backend service
      const distributionReport = {
        totalDistributions: distributionData.totalDistributions || 0,
        totalItemsReceived: distributionData.totalItemsReceived || 0,
        confirmationRate: distributionData.confirmationRate || 0,
        averageConfirmationTime: distributionData.averageConfirmationTime || 0,
        byMonth: distributionData.byMonth || [],
        // prefer bySource (DISTRIBUTION vs DIRECT_SHIPMENT); fallback to byCategory if needed
        bySource: distributionData.bySource || distributionData.byCategory || [],
      };

      // Use the structured data directly from the backend service  
      const utilizationReport = {
        activeItems: utilizationData.activeItems || inventoryReport.itemsInUse,
        utilizationRate: utilizationData.utilizationRate || inventoryReport.utilizationRate,
        itemUtilization: utilizationData.utilizationByCategory || utilizationData.itemUtilization || [],
        resourceEfficiency: utilizationData.effectivenessScore || utilizationData.resourceEfficiency || 0,
      };

      // Use the structured data directly from the backend service
      const performanceMetrics = {
        inventoryHealth: performanceData.inventoryHealth || 0,
        utilizationEfficiency: performanceData.utilizationEfficiency || utilizationReport.utilizationRate,
        confirmationTimeliness: performanceData.confirmationTimeliness || 0,
        itemConditionScore: performanceData.itemConditionScore || 0,
        resourceOptimization: performanceData.resourceOptimization || utilizationReport.resourceEfficiency,
      };

      setReportData({
        inventoryReport,
        distributionReport,
        utilizationReport,
        performanceMetrics,
      });
    } catch (error) {
      console.error("Error fetching school report data:", error);

      // Provide helpful error message based on error type
      if (error instanceof Error) {
        if (
          error.message.includes("Network Error") ||
          error.message.includes("timeout")
        ) {
          toast.error(
            "Network error: Please check your internet connection and try again"
          );
        } else if (error.message.includes("404")) {
          toast.error(
            "School reports API endpoint not found. Check if the backend is running on port 3001."
          );
        } else if (
          error.message.includes("401") ||
          error.message.includes("403")
        ) {
          toast.error("Authentication error: Please log in again");
        } else {
          toast.error(`Failed to load school report data: ${error.message}`);
        }
      } else {
        toast.error(
          "Failed to load school report data. Using demo data for now."
        );
      }

      // No demo data fallback - let the error be displayed to the user
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters with loading state
  const applyFilters = async () => {
    // Clear debounce timeout since user is manually applying
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    setFiltersApplying(true);
    setDateRange(tempDateRange);
    await fetchReportData(tempDateRange);
    setFiltersApplying(false);
    toast.success("Filters applied successfully");
  };

  // Auto-apply filters when date changes (with debounce)
  const applyFiltersAutomatically = async () => {
    if (
      tempDateRange.from !== dateRange.from ||
      tempDateRange.to !== dateRange.to
    ) {
      setFiltersApplying(true);
      setDateRange(tempDateRange);
      await fetchReportData(tempDateRange);
      setFiltersApplying(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    const defaultRange = {
      from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      to: new Date().toISOString().split("T")[0],
    };
    setTempDateRange(defaultRange);
    setDateRange(defaultRange);
    setSelectedSchool("all");
    setSelectedReportType("overview");
    fetchReportData(defaultRange);
    toast.success("Filters reset");
  };

  // Generate and download report
  const generateReport = async () => {
    if (!reportData) {
      toast.error("No report data available");
      return;
    }

    setGenerating(true);
    try {
      const reportConfig = {
        title: `School ${
          selectedReportType.charAt(0).toUpperCase() +
          selectedReportType.slice(1)
        } Report`,
        dateRange: `${dateRange.from} to ${dateRange.to}`,
        school:
          selectedSchool === "all"
            ? "All Schools"
            : schools.find((s: any) => s.id === selectedSchool)?.name ||
              "Unknown",
        data: reportData,
      };

      if (selectedReportType === "overview") {
        await PDFGenerator.generateSchoolOverviewReport(reportConfig);
      } else {
        await PDFGenerator.generateSchoolDetailedReport(
          reportConfig,
          selectedReportType
        );
      }

      toast.success("Report generated successfully");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error(
        `Failed to generate report: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setGenerating(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchSchools();
    fetchReportData();
  }, [user]);

  // Refresh data when school selection changes
  useEffect(() => {
    if (user) {
      fetchReportData();
    }
  }, [selectedSchool]);

  // Track unapplied changes
  useEffect(() => {
    const hasChanges =
      tempDateRange.from !== dateRange.from ||
      tempDateRange.to !== dateRange.to;
    setHasUnappliedChanges(hasChanges);
  }, [tempDateRange.from, tempDateRange.to, dateRange.from, dateRange.to]);

  // Auto-apply date filters with debounce
  useEffect(() => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      applyFiltersAutomatically();
    }, 1000); // 1 second debounce

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [tempDateRange.from, tempDateRange.to]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Loading school reports...
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "distributions", label: "Receipts", icon: Users },
    { id: "utilization", label: "Utilization", icon: Activity },
    { id: "performance", label: "Performance", icon: Target },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Section */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              School Reports
            </h2>
            <p className="text-muted-foreground">
              Comprehensive analytics and insights for school operations
            </p>
            {/* Current Filter Status */}
            <div className="flex flex-wrap gap-2 mt-2 text-sm">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md">
                📅 {dateRange.from} to {dateRange.to}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md">
                🏫{" "}
                {selectedSchool === "all"
                  ? "All Schools"
                  : schools.find((s: any) => s.id === selectedSchool)?.name ||
                    "Unknown"}
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => fetchReportData()}
              variant="outline"
              size={isMobile ? "sm" : "default"}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={generateReport}
              disabled={generating || !reportData}
              size={isMobile ? "sm" : "default"}
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              {generating ? "Generating..." : "Export Report"}
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Quick Date Presets */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quick Date Ranges</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Last 7 days", days: 7 },
                  { label: "Last 30 days", days: 30 },
                  { label: "Last 90 days", days: 90 },
                  { label: "This year", days: null, isYear: true },
                ].map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const today = new Date().toISOString().split("T")[0];
                      let fromDate;
                      if (preset.isYear) {
                        fromDate = new Date(new Date().getFullYear(), 0, 1)
                          .toISOString()
                          .split("T")[0];
                      } else {
                        fromDate = new Date(
                          Date.now() - preset.days! * 24 * 60 * 60 * 1000
                        )
                          .toISOString()
                          .split("T")[0];
                      }
                      setTempDateRange({ from: fromDate, to: today });
                    }}
                    className="h-8 px-3 text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* School Selection */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">School</label>
                <Select
                  value={selectedSchool}
                  onValueChange={setSelectedSchool}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-blue-500 rounded-full" />
                        All Schools
                      </div>
                    </SelectItem>
                    {schools.map((school: any) => (
                      <SelectItem key={school.id} value={school.id}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full" />
                          {school.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Start</label>
                <Input
                  type="date"
                  value={tempDateRange.from}
                  onChange={(e) =>
                    setTempDateRange({ ...tempDateRange, from: e.target.value })
                  }
                  max={tempDateRange.to}
                  className={hasUnappliedChanges ? "border-amber-300" : ""}
                />
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">End</label>
                <Input
                  type="date"
                  value={tempDateRange.to}
                  onChange={(e) =>
                    setTempDateRange({ ...tempDateRange, to: e.target.value })
                  }
                  min={tempDateRange.from}
                  max={new Date().toISOString().split("T")[0]}
                  className={hasUnappliedChanges ? "border-amber-300" : ""}
                />
              </div>

              {/* Report Type */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Report</label>
                <Select
                  value={selectedReportType}
                  onValueChange={setSelectedReportType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">
                      <div className="flex flex-col">
                        <span>Overview Report</span>
                        <span className="text-xs text-muted-foreground">
                          Complete school summary
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="inventory">
                      <div className="flex flex-col">
                        <span>Inventory Details</span>
                        <span className="text-xs text-muted-foreground">
                          Stock levels and categories
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="distributions">
                      <div className="flex flex-col">
                        <span>Distribution Analysis</span>
                        <span className="text-xs text-muted-foreground">
                          Received items analysis
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="utilization">
                      <div className="flex flex-col">
                        <span>Utilization Report</span>
                        <span className="text-xs text-muted-foreground">
                          Resource usage analysis
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="performance">
                      <div className="flex flex-col">
                        <span>Performance Metrics</span>
                        <span className="text-xs text-muted-foreground">
                          KPIs and efficiency metrics
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Actions */}
              <div className="space-y-2">
                <Label className="text-sm font-medium invisible">Actions</Label>
                <div className="flex flex-col gap-2">
                  {filtersApplying && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Applying filters...
                    </div>
                  )}
                  {hasUnappliedChanges && !filtersApplying && (
                    <div className="flex items-center gap-2 text-sm text-amber-600">
                      <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
                      Auto-apply in 1s
                    </div>
                  )}
                  <div className="flex gap-2">
                    {hasUnappliedChanges && (
                      <Button
                        onClick={applyFilters}
                        disabled={filtersApplying}
                        size="sm"
                        className="flex-1"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Apply Now
                      </Button>
                    )}
                    <Button onClick={resetFilters} variant="outline" size="sm">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <div className="w-full overflow-x-auto">
          <TabsList
            className={`grid w-full ${
              isMobile
                ? "grid-cols-2"
                : isTablet
                ? "grid-cols-3"
                : "grid-cols-5"
            }`}
          >
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <tab.icon className="h-4 w-4" />
                {isMobile ? tab.label.split(" ")[0] : tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {reportData ? (
            <>
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Inventory Items
                    </CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reportData.inventoryReport.totalItems.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {reportData.inventoryReport.itemsInUse} items in use
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Quantity
                    </CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {parseInt(reportData.utilizationReport.inactiveItems || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total items in inventory
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reportData.distributionReport.totalDistributions}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {reportData.distributionReport.confirmationRate.toFixed(
                        1
                      )}
                      % confirmed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Utilization Rate
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reportData.inventoryReport.utilizationRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Resource efficiency
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Inventory by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartComponent
                      type="pie"
                      data={reportData.inventoryReport.categories?.map(
                        (cat) => ({
                          name: cat.name,
                          value: parseInt(cat.count) || 0,
                        })
                      ) || []}
                      xField="name"
                      yField="value"
                      title="Inventory by Category"
                      height={300}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Receipts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartComponent
                      type="line"
                      data={reportData.distributionReport.byMonth?.map(
                        (item) => ({
                          name: item.month,
                          value: parseInt(item.count) || 0,
                        })
                      ) || []}
                      xField="name"
                      yField="value"
                      title="Monthly Receipts"
                      height={300}
                    />
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center space-y-4">
                  <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-lg font-semibold">
                      School Reports API Not Available
                    </p>
                    <p className="text-sm text-muted-foreground">
                      The school reports API endpoints may not be implemented
                      yet. This is normal for a prototype system.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Expected endpoints: /api/schools/reports/overview,
                      /api/schools/reports/inventory, /api/schools/reports/distributions,
                      /api/schools/reports/utilization, /api/schools/reports/performance
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={() => fetchReportData()}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry API
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Other tabs would go here - Inventory, Distributions, Utilization, Performance */}
        {/* For now, I'll add placeholder content */}

        <TabsContent value="inventory" className="space-y-6">
          {reportData ? (
            <>
              {/* Inventory Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Items Types</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reportData.inventoryReport.totalItems}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Different item categories
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {parseInt(reportData.utilizationReport.inactiveItems || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total quantity in stock
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Items in Use</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reportData.inventoryReport.itemsInUse}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Currently utilized
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Damaged Items</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reportData.inventoryReport.damagedItems || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Need attention
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Inventory Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Stock by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reportData.inventoryReport.categories?.length > 0 ? (
                        reportData.inventoryReport.categories.map((category, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{category.name || 'Uncategorized'}</p>
                              <p className="text-sm text-muted-foreground">
                                Condition: {category.condition}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold">{parseInt(category.count).toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">items</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2" />
                          <p>No inventory categories found</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Inventory Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartComponent
                      type="bar"
                      data={reportData.inventoryReport.categories?.map(
                        (cat) => ({
                          name: cat.name || 'Uncategorized',
                          value: parseInt(cat.count) || 0,
                        })
                      ) || []}
                      xField="name"
                      yField="value"
                      title="Items by Category"
                      height={300}
                    />
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center space-y-4">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-lg font-semibold">No Inventory Data</p>
                    <p className="text-sm text-muted-foreground">
                      No inventory data available for the selected criteria.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="distributions" className="space-y-6">
          {reportData ? (
            <>
              {/* Receipts Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reportData.distributionReport.totalDistributions}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      From all sources
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Items Received</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {parseInt(reportData.distributionReport.totalItemsReceived).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total quantity
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Confirmation Rate</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reportData.distributionReport.confirmationRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Receipts confirmed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Confirmation Time</CardTitle>
                    <Timer className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reportData.distributionReport.averageConfirmationTime.toFixed(1)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Days to confirm
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Receipt Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Receipt Sources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reportData.distributionReport.bySource?.map((source, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{source.name === 'DISTRIBUTION' ? 'Council Distributions' : 'Direct Shipments'}</p>
                            <p className="text-sm text-muted-foreground">
                              {parseInt(source.count)} receipts
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{parseInt(source.items).toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">items</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Receipt Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartComponent
                      type="line"
                      data={reportData.distributionReport.byMonth?.map(
                        (item) => ({
                          name: item.month,
                          value: parseInt(item.count) || 0,
                        })
                      ) || []}
                      xField="name"
                      yField="value"
                      title="Receipts per Month"
                      height={300}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Receipts by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reportData.distributionReport.byCategory?.length > 0 ? (
                      reportData.distributionReport.byCategory.map((category, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">{category.name || 'Uncategorized'}</h4>
                            <Badge variant="secondary">{parseInt(category.count)} receipts</Badge>
                          </div>
                          <div className="text-2xl font-bold">{parseInt(category.items || 0).toLocaleString()}</div>
                          <p className="text-xs text-muted-foreground">items received</p>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2" />
                        <p>No receipt categories found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center space-y-4">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-lg font-semibold">No Receipt Data</p>
                    <p className="text-sm text-muted-foreground">
                      No receipt data available for the selected criteria.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="utilization" className="space-y-6">
          {reportData ? (
            <>
              {/* Utilization Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Items in Use</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reportData.utilizationReport.activeItems}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Currently utilized
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Items Available</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reportData.utilizationReport.inactiveItems || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ready for use
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reportData.inventoryReport.utilizationRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Resource efficiency
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Effectiveness Score</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(reportData.utilizationReport.effectivenessScore || 0).toFixed(1)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Overall effectiveness
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Utilization Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Utilization by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reportData.utilizationReport.utilizationByCategory?.length > 0 ? (
                        reportData.utilizationReport.utilizationByCategory.map((category, index) => {
                          const utilizationPercentage = category.usage > 0 ? (category.usage / (category.usage + 100)) * 100 : 0;
                          return (
                            <div key={index} className="space-y-2">
                              <div className="flex justify-between">
                                <span className="font-medium">{category.category}</span>
                                <span className="text-sm text-muted-foreground">{category.usage} used</span>
                              </div>
                              <Progress value={utilizationPercentage} className="h-2" />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Condition: {category.condition}</span>
                                <span>{utilizationPercentage.toFixed(1)}% utilization</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Activity className="h-8 w-8 mx-auto mb-2" />
                          <p>No utilization data found</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Usage Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartComponent
                      type="bar"
                      data={reportData.utilizationReport.utilizationByCategory?.map(
                        (cat) => ({
                          name: cat.category,
                          value: cat.usage || 0,
                        })
                      ) || []}
                      xField="name"
                      yField="value"
                      title="Items Used by Category"
                      height={300}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Additional Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Utilization Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {((reportData.utilizationReport.activeItems / Math.max(parseInt(reportData.utilizationReport.inactiveItems || 0), 1)) * 100).toFixed(1)}%
                      </div>
                      <p className="text-sm text-muted-foreground">Items Currently in Use</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {reportData.utilizationReport.needsReplacement || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Items Need Replacement</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        {(reportData.utilizationReport.effectivenessScore || 0).toFixed(1)}
                      </div>
                      <p className="text-sm text-muted-foreground">Overall Effectiveness Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center space-y-4">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-lg font-semibold">No Utilization Data</p>
                    <p className="text-sm text-muted-foreground">
                      No utilization data available for the selected criteria.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {reportData ? (
            <>
              {/* Performance KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inventory Health</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(reportData.performanceMetrics.inventoryHealth || 0).toFixed(1)}%
                    </div>
                    <Progress 
                      value={reportData.performanceMetrics.inventoryHealth || 0} 
                      className="mt-2 h-2" 
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Utilization Efficiency</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(reportData.performanceMetrics.utilizationEfficiency || 0).toFixed(1)}%
                    </div>
                    <Progress 
                      value={reportData.performanceMetrics.utilizationEfficiency || 0} 
                      className="mt-2 h-2" 
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Confirmation Timeliness</CardTitle>
                    <Timer className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(reportData.performanceMetrics.confirmationTimeliness || 0).toFixed(1)}%
                    </div>
                    <Progress 
                      value={reportData.performanceMetrics.confirmationTimeliness || 0} 
                      className="mt-2 h-2" 
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Item Condition</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(reportData.performanceMetrics.itemConditionScore || 0).toFixed(1)}%
                    </div>
                    <Progress 
                      value={reportData.performanceMetrics.itemConditionScore || 0} 
                      className="mt-2 h-2" 
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Resource Optimization</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(reportData.performanceMetrics.resourceOptimization || 0).toFixed(1)}%
                    </div>
                    <Progress 
                      value={reportData.performanceMetrics.resourceOptimization || 0} 
                      className="mt-2 h-2" 
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Performance Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartComponent
                      type="bar"
                      data={[
                        { name: 'Inventory Health', value: reportData.performanceMetrics.inventoryHealth || 0 },
                        { name: 'Utilization Efficiency', value: reportData.performanceMetrics.utilizationEfficiency || 0 },
                        { name: 'Confirmation Timeliness', value: reportData.performanceMetrics.confirmationTimeliness || 0 },
                        { name: 'Item Condition', value: reportData.performanceMetrics.itemConditionScore || 0 },
                        { name: 'Resource Optimization', value: reportData.performanceMetrics.resourceOptimization || 0 }
                      ]}
                      xField="name"
                      yField="value"
                      title="Performance Metrics (%)"
                      height={300}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">Overall Performance</h4>
                          <Badge variant={
                            (((reportData.performanceMetrics.inventoryHealth || 0) + 
                              (reportData.performanceMetrics.utilizationEfficiency || 0) + 
                              (reportData.performanceMetrics.confirmationTimeliness || 0) + 
                              (reportData.performanceMetrics.itemConditionScore || 0) + 
                              (reportData.performanceMetrics.resourceOptimization || 0)) / 5) >= 70 
                            ? "default" : "secondary"
                          }>
                            {(
                              ((reportData.performanceMetrics.inventoryHealth || 0) + 
                               (reportData.performanceMetrics.utilizationEfficiency || 0) + 
                               (reportData.performanceMetrics.confirmationTimeliness || 0) + 
                               (reportData.performanceMetrics.itemConditionScore || 0) + 
                               (reportData.performanceMetrics.resourceOptimization || 0)) / 5
                            ).toFixed(1)}%
                          </Badge>
                        </div>
                        <Progress 
                          value={((reportData.performanceMetrics.inventoryHealth || 0) + 
                                 (reportData.performanceMetrics.utilizationEfficiency || 0) + 
                                 (reportData.performanceMetrics.confirmationTimeliness || 0) + 
                                 (reportData.performanceMetrics.itemConditionScore || 0) + 
                                 (reportData.performanceMetrics.resourceOptimization || 0)) / 5} 
                          className="h-3" 
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex justify-between items-center p-3 border rounded">
                          <span className="text-sm">Confirmation Rate</span>
                          <span className="font-bold">{reportData.distributionReport.confirmationRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center p-3 border rounded">
                          <span className="text-sm">Avg Confirmation Time</span>
                          <span className="font-bold">{reportData.distributionReport.averageConfirmationTime.toFixed(1)} days</span>
                        </div>
                        <div className="flex justify-between items-center p-3 border rounded">
                          <span className="text-sm">Utilization Rate</span>
                          <span className="font-bold">{reportData.inventoryReport.utilizationRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center p-3 border rounded">
                          <span className="text-sm">Damaged Items</span>
                          <span className="font-bold">{reportData.inventoryReport.damagedItems || 0}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Insights & Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium text-green-600">Strengths</h4>
                      {reportData.distributionReport.confirmationRate > 80 && (
                        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium">High Confirmation Rate</p>
                            <p className="text-xs text-muted-foreground">
                              {reportData.distributionReport.confirmationRate.toFixed(1)}% of receipts are confirmed
                            </p>
                          </div>
                        </div>
                      )}
                      {reportData.inventoryReport.totalItems > 5 && (
                        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Good Inventory Diversity</p>
                            <p className="text-xs text-muted-foreground">
                              {reportData.inventoryReport.totalItems} different item types
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium text-amber-600">Areas for Improvement</h4>
                      {reportData.inventoryReport.utilizationRate < 10 && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded">
                          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Low Utilization Rate</p>
                            <p className="text-xs text-muted-foreground">
                              Consider promoting usage of available resources
                            </p>
                          </div>
                        </div>
                      )}
                      {(reportData.inventoryReport.damagedItems || 0) > 0 && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded">
                          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Items Need Attention</p>
                            <p className="text-xs text-muted-foreground">
                              {reportData.inventoryReport.damagedItems} damaged items need repair/replacement
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center space-y-4">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-lg font-semibold">No Performance Data</p>
                    <p className="text-sm text-muted-foreground">
                      No performance data available for the selected criteria.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper functions for school-specific data processing
const aggregateSchoolByCategory = (inventory: any[]) => {
  if (!Array.isArray(inventory) || inventory.length === 0) {
    return [];
  }

  const categoryMap = new Map();
  inventory.forEach((item) => {
    const category = item.category || item.itemCategory || "Unknown";
    const existing = categoryMap.get(category) || {
      name: category,
      count: 0,
      condition: "good",
    };
    existing.count += item.quantityOnHand || item.quantity || 0;

    // Determine condition based on damaged items
    const totalItems = item.quantityOnHand || item.quantity || 0;
    const damaged = item.damaged || 0;
    const conditionRatio = damaged / (totalItems || 1);

    if (conditionRatio > 0.2) existing.condition = "poor";
    else if (conditionRatio > 0.1) existing.condition = "fair";
    else if (conditionRatio > 0.05) existing.condition = "good";
    else existing.condition = "excellent";

    categoryMap.set(category, existing);
  });
  return Array.from(categoryMap.values());
};

const aggregateSchoolByMonth = (
  items: any[],
  dateField: string = "createdAt"
) => {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const monthMap = new Map();
  items.forEach((item) => {
    const date = new Date(item[dateField] || item.created_at || item.date);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    const existing = monthMap.get(monthKey) || {
      month: monthKey,
      count: 0,
      items: 0,
    };
    existing.count += 1;

    const itemList =
      item.items || item.distributionItems || item.shipmentItems || [];
    existing.items += Array.isArray(itemList)
      ? itemList.reduce(
          (sum: number, subItem: any) =>
            sum +
            (subItem.quantity ||
              subItem.quantityDistributed ||
              subItem.quantityShipped ||
              0),
          0
        )
      : 0;

    monthMap.set(monthKey, existing);
  });
  return Array.from(monthMap.values())
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 12);
};

const aggregateBySource = (distributions: any[], directShipments: any[]) => {
  const sources = [];

  // Process council distributions
  if (Array.isArray(distributions) && distributions.length > 0) {
    const councilMap = new Map();
    distributions.forEach((dist) => {
      const sourceName =
        dist.localCouncilName || dist.sourceName || "Local Council";
      const existing = councilMap.get(sourceName) || {
        name: sourceName,
        count: 0,
        items: 0,
      };
      existing.count += 1;
      const items = dist.items || dist.distributionItems || [];
      existing.items += Array.isArray(items)
        ? items.reduce(
            (sum: number, item: any) =>
              sum + (item.quantity || item.quantityDistributed || 0),
            0
          )
        : 0;
      councilMap.set(sourceName, existing);
    });
    sources.push(...Array.from(councilMap.values()));
  }

  // Process direct shipments from warehouses
  if (Array.isArray(directShipments) && directShipments.length > 0) {
    const directItems = directShipments.reduce((sum, shipment) => {
      const items = shipment.items || shipment.shipmentItems || [];
      return (
        sum +
        (Array.isArray(items)
          ? items.reduce(
              (itemSum: number, item: any) =>
                itemSum + (item.quantity || item.quantityShipped || 0),
              0
            )
          : 0)
      );
    }, 0);

    sources.push({
      name: "Direct from Warehouse",
      count: directShipments.length,
      items: directItems,
    });
  }

  return sources.sort((a, b) => b.items - a.items);
};

const calculateUtilizationRate = (inventory: any[]) => {
  if (!inventory.length) return 80.0; // Default fallback

  const totalItems = inventory.reduce(
    (sum, item) => sum + (item.quantityOnHand || item.quantity || 0),
    0
  );
  const unusedItems = inventory.reduce(
    (sum, item) => sum + (item.unused || 0),
    0
  );
  const utilizationRate =
    totalItems > 0 ? ((totalItems - unusedItems) / totalItems) * 100 : 80;

  return Math.min(100, Math.max(0, utilizationRate));
};

const calculateItemUtilization = (inventory: any[]) => {
  const categoryMap = new Map();
  inventory.forEach((item) => {
    const category = item.category || item.itemCategory || "Unknown";
    const existing = categoryMap.get(category) || {
      category,
      utilized: 0,
      total: 0,
      percentage: 0,
    };
    const total = item.quantityOnHand || item.quantity || 0;
    const utilized = Math.max(
      0,
      total - (item.unused || 0) - (item.damaged || 0)
    );

    existing.utilized += utilized;
    existing.total += total;
    categoryMap.set(category, existing);
  });

  return Array.from(categoryMap.values()).map((cat) => ({
    ...cat,
    percentage: cat.total > 0 ? (cat.utilized / cat.total) * 100 : 0,
  }));
};

const calculateStudentRatio = (
  inventory: any[],
  studentCount: number = 500
) => {
  const totalItems = inventory.reduce(
    (sum, item) => sum + (item.quantityOnHand || item.quantity || 0),
    0
  );
  return totalItems / studentCount;
};

const calculateResourceEfficiency = (
  inventory: any[],
  distributions: any[]
) => {
  const totalReceived = distributions.reduce((sum, dist) => {
    const items =
      dist.items || dist.distributionItems || dist.shipmentItems || [];
    return (
      sum +
      items.reduce(
        (itemSum: number, item: any) =>
          itemSum +
          (item.quantity ||
            item.quantityDistributed ||
            item.quantityShipped ||
            0),
        0
      )
    );
  }, 0);

  const totalInUse = inventory.reduce((sum, item) => {
    const total = item.quantityOnHand || item.quantity || 0;
    const unused = item.unused || 0;
    const damaged = item.damaged || 0;
    return sum + Math.max(0, total - unused - damaged);
  }, 0);

  return totalReceived > 0 ? (totalInUse / totalReceived) * 100 : 75.0;
};

const calculateConfirmationRate = (distributions: any[]) => {
  if (!distributions.length) return 95.0; // Default fallback
  const confirmed = distributions.filter(
    (d) =>
      d.status === "confirmed" ||
      d.status === "delivered" ||
      d.status === "completed"
  ).length;
  return (confirmed / distributions.length) * 100;
};

const calculateAverageConfirmationTime = (distributions: any[]) => {
  const confirmedDistributions = distributions.filter(
    (d) =>
      (d.status === "confirmed" ||
        d.status === "delivered" ||
        d.status === "completed") &&
      d.createdAt &&
      d.confirmedAt
  );

  if (!confirmedDistributions.length) return 2.5; // Default fallback

  const confirmationTimes = confirmedDistributions
    .map((d) => {
      const created = new Date(d.createdAt || d.created_at);
      const confirmed = new Date(
        d.confirmedAt || d.confirmed_at || d.updatedAt || d.updated_at
      );
      return (
        Math.abs(confirmed.getTime() - created.getTime()) /
        (1000 * 60 * 60 * 24)
      ); // days
    })
    .filter((time) => time > 0 && time < 30); // Filter out invalid times

  return confirmationTimes.length > 0
    ? confirmationTimes.reduce((sum, time) => sum + time, 0) /
        confirmationTimes.length
    : 2.5;
};

const calculateInventoryHealth = (inventory: any[]) => {
  if (!inventory.length) return 85.0; // Default fallback

  const totalItems = inventory.reduce(
    (sum, item) => sum + (item.quantityOnHand || item.quantity || 0),
    0
  );
  const healthyItems = inventory.reduce((sum, item) => {
    const total = item.quantityOnHand || item.quantity || 0;
    const damaged = item.damaged || 0;
    return sum + Math.max(0, total - damaged);
  }, 0);

  return totalItems > 0 ? (healthyItems / totalItems) * 100 : 85.0;
};

const calculateDistributionEfficiency = (distributions: any[]) => {
  if (!distributions.length) return 90.0; // Default fallback

  const onTimeDistributions = distributions.filter((d) => {
    if (!d.createdAt || !d.confirmedAt) return false;
    const created = new Date(d.createdAt);
    const confirmed = new Date(d.confirmedAt || d.updatedAt);
    const daysDiff =
      Math.abs(confirmed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7; // Consider on-time if confirmed within 7 days
  }).length;

  return (onTimeDistributions / distributions.length) * 100;
};

const calculateMaintenanceScore = (inventory: any[]) => {
  if (!inventory.length) return 80.0; // Default fallback

  const totalItems = inventory.reduce(
    (sum, item) => sum + (item.quantityOnHand || item.quantity || 0),
    0
  );
  const itemsNeedingMaintenance = inventory.reduce(
    (sum, item) => sum + (item.needsMaintenance || item.damaged || 0),
    0
  );

  return totalItems > 0
    ? ((totalItems - itemsNeedingMaintenance) / totalItems) * 100
    : 80.0;
};
