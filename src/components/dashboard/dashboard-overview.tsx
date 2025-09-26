"use client";

import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyCompact } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Package,
  Truck,
  Building2,
  School,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  FileText,
  Users,
  TrendingUp,
  Activity,
  Warehouse,
  RefreshCw,
  BarChart3,
  Target,
  Zap,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import {
  KPICard,
  SimpleLineChart,
  SimpleBarChart,
  StatusBadge,
} from "@/components/ui/charts";

export function DashboardOverview() {
  const { user, isLoading: authLoading } = useAuth();

  // Types for API data used in this component
  type ActivityItem = {
    id: string | number;
    title: string;
    description?: string;
    status: string;
    timestamp: string;
    metadata?: { reference?: string };
  };

  type CouncilDistribution = {
    councilName: string;
    totalSchools: number;
  };

  type InventoryAlert = {
    id: string | number;
    itemName: string;
    location: string;
    severity: string;
    currentStock: number;
    daysUntilStockout: number;
  };

  // Fetch dashboard data
  const {
    data: kpiData,
    isLoading: kpiLoading,
    error: kpiError,
    refetch: refetchKPI,
  } = useQuery({
    queryKey: ["dashboard", "kpi", user?.role],
    queryFn: dashboardApi.getKPIData,
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!user && !authLoading && !!localStorage.getItem("auth_token"),
    retry: 1, // Reduce retries for faster error handling
  });

  // Fetch enhanced chart data
  const {
    data: chartData,
    isLoading: chartLoading,
    refetch: refetchCharts,
  } = useQuery({
    queryKey: ["dashboard", "enhanced-charts", user?.role],
    queryFn: dashboardApi.getEnhancedChartData,
    refetchInterval: 60000, // Refresh every minute
    enabled: !!user && !authLoading,
    retry: 1,
  });

  // Fetch inventory alerts
  const {
    data: alertsData,
    isLoading: alertsLoading,
    refetch: refetchAlerts,
  } = useQuery({
    queryKey: ["dashboard", "alerts", user?.role],
    queryFn: dashboardApi.getInventoryAlerts,
    refetchInterval: 30000,
    enabled: !!user && !authLoading,
    retry: 1,
  });

  // Fetch performance metrics
  const {
    data: performanceData,
    isLoading: performanceLoading,
    refetch: refetchPerformance,
  } = useQuery({
    queryKey: ["dashboard", "performance", user?.role],
    queryFn: dashboardApi.getPerformanceMetrics,
    refetchInterval: 60000,
    enabled: !!user && !authLoading,
    retry: 1,
  });

  // Fetch geographic distribution
  const {
    data: geographicData,
    isLoading: geographicLoading,
    refetch: refetchGeographic,
  } = useQuery({
    queryKey: ["dashboard", "geographic", user?.role],
    queryFn: dashboardApi.getGeographicDistribution,
    refetchInterval: 300000, // Refresh every 5 minutes
    enabled: !!user && !authLoading,
    retry: 1,
  });

  // Fetch direct shipment statistics
  const {
    data: directShipmentStats,
    isLoading: dsLoading,
    refetch: refetchDS,
  } = useQuery({
    queryKey: ["dashboard", "direct-shipments", user?.role],
    queryFn: dashboardApi.getDirectShipmentStatistics,
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!user && !authLoading,
    retry: 1,
  });

  // Fetch recent activity
  const {
    data: activityData,
    isLoading: activityLoading,
    refetch: refetchActivity,
  } = useQuery({
    queryKey: ["dashboard", "activity", user?.role],
    queryFn: () => dashboardApi.getRecentActivity(10),
    refetchInterval: 15000, // Refresh every 15 seconds
    enabled: !!user && !authLoading,
    retry: 1,
  });

  const isLoading =
    authLoading ||
    kpiLoading ||
    dsLoading ||
    activityLoading ||
    chartLoading ||
    alertsLoading ||
    performanceLoading ||
    geographicLoading;
  const error = kpiError;

  const refetch = () => {
    refetchKPI();
    refetchDS();
    refetchActivity();
    refetchCharts();
    refetchAlerts();
    refetchPerformance();
    refetchGeographic();
  };

  const getQuickActions = () => {
    const actions = [];

    if (user?.role === "super_admin") {
      actions.push(
        {
          title: "Create User",
          href: "/admin/users",
          icon: Users,
          color: "bg-blue-500",
        },
        // {
        //   title: "System Reports",
        //   href: "/reports/standard",
        //   icon: FileText,
        //   color: "bg-green-500",
        // },
        {
          title: "Manage Items",
          href: "/admin/items",
          icon: Package,
          color: "bg-purple-500",
        },
        {
          title: "View Warehouses",
          href: "/admin/warehouses",
          icon: Warehouse,
          color: "bg-orange-500",
        }
      );
    }

    if (user?.role === "national_manager" || user?.role === "super_admin") {
      actions.push(
        {
          title: "Receive Stock",
          href: "/warehouse/receipts/create",
          icon: Plus,
          color: "bg-green-600",
        },
        {
          title: "Create Shipment",
          href: "/shipments/create",
          icon: Truck,
          color: "bg-blue-600",
        },
        {
          title: "Direct Shipment",
          href: "/warehouse/direct-shipments/create",
          icon: School,
          color: "bg-purple-600",
        }
      );
    }

    if (user?.role === "lc_officer" || user?.role === "super_admin") {
      actions.push({
        title: "Create Distribution",
        href: "/distributions/create",
        icon: Building2,
        color: "bg-indigo-600",
      });
    }

    return actions.slice(0, 4); // Limit to 4 actions for clean layout
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Overview</h1>
            <p className="text-muted-foreground">Loading system status...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // If user is not authenticated (should be handled by ProtectedRoute), render nothing safely
  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}! Here&apos;s your system overview.
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Enhanced KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Warehouses"
          value={kpiData?.data?.totalWarehouses || 0}
          description="Active storage facilities"
          icon={Warehouse}
          changeType="neutral"
        />

        <KPICard
          title="Local Councils"
          value={kpiData?.data?.totalCouncils || 0}
          description="Distribution centers"
          icon={Building2}
          changeType="neutral"
        />

        <KPICard
          title="Schools Served"
          value={kpiData?.data?.totalSchools || 0}
          description="Active beneficiaries"
          icon={School}
          changeType="neutral"
        />

        <KPICard
          title="System Uptime"
          value={`${kpiData?.data?.systemUptime || 99.5}%`}
          change={
            kpiData?.data?.systemUptime >= 99
              ? "+0.2% vs last week"
              : "Needs attention"
          }
          changeType={
            kpiData?.data?.systemUptime >= 99 ? "positive" : "negative"
          }
          icon={Zap}
        />
      </div>

      {/* Operational KPIs by Role (no currency) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* School Representative */}
        {user?.role === "school_rep" && (
          <>
            <KPICard
              title="Pending Receipts"
              value={kpiData?.data?.pendingReceipts || 0}
              description="Awaiting confirmation"
              icon={AlertTriangle}
              changeType={
                (kpiData?.data?.pendingReceipts || 0) > 0
                  ? "negative"
                  : "positive"
              }
            />
            <KPICard
              title="Low‑Stock Items"
              value={kpiData?.data?.lowStockItems || 0}
              description="Below threshold"
              icon={Users}
              changeType="neutral"
            />
            <KPICard
              title="Processing Efficiency"
              value={`${kpiData?.data?.processingEfficiency || 0}%`}
              change={
                kpiData?.data?.processingEfficiency >= 90
                  ? "Excellent"
                  : "Needs improvement"
              }
              changeType={
                kpiData?.data?.processingEfficiency >= 90
                  ? "positive"
                  : "neutral"
              }
              icon={Target}
            />
          </>
        )}

        {/* Local Council Officer */}
        {user?.role === "lc_officer" && (
          <>
            <KPICard
              title="Pending Dispatch"
              value={kpiData?.data?.pendingDistributions || 0}
              description="To send to schools"
              icon={AlertTriangle}
              changeType={
                (kpiData?.data?.pendingDistributions || 0) > 0
                  ? "negative"
                  : "positive"
              }
            />
            <KPICard
              title="Schools Awaiting Confirmation"
              value={kpiData?.data?.pendingReceipts || 0}
              description="Receipts not yet confirmed"
              icon={Users}
              changeType="neutral"
            />
            <KPICard
              title="Active Shipments"
              value={kpiData?.data?.activeShipments || 0}
              description="In transit"
              icon={Activity}
              changeType="neutral"
            />
            <KPICard
              title="Processing Efficiency"
              value={`${kpiData?.data?.processingEfficiency || 0}%`}
              change={
                kpiData?.data?.processingEfficiency >= 90
                  ? "Excellent"
                  : "Needs improvement"
              }
              changeType={
                kpiData?.data?.processingEfficiency >= 90
                  ? "positive"
                  : "neutral"
              }
              icon={Target}
            />
          </>
        )}

        {/* National Warehouse Manager */}
        {user?.role === "national_manager" && (
          <>
            <KPICard
              title="Inbound This Week"
              value={kpiData?.data?.activeShipments || 0}
              description="Scheduled to arrive"
              icon={Activity}
              changeType="neutral"
            />
            <KPICard
              title="Outbound This Week"
              value={kpiData?.data?.completedShipments || 0}
              description="Scheduled to dispatch"
              icon={Activity}
              changeType="neutral"
            />
            <KPICard
              title="Low‑Stock SKUs"
              value={kpiData?.data?.lowStockItems || 0}
              description="Below threshold"
              icon={Users}
              changeType="neutral"
            />
            <KPICard
              title="Critical Alerts"
              value={kpiData?.data?.criticalAlerts || 0}
              description="Expiry risk or issues"
              icon={AlertTriangle}
              changeType={
                (kpiData?.data?.criticalAlerts || 0) > 0
                  ? "negative"
                  : "positive"
              }
            />
          </>
        )}

        {/* Super Admin / Default overview */}
        {(!user?.role ||
          user?.role === "super_admin" ||
          user?.role === "view_only") && (
          <>
            <KPICard
              title="Active Shipments"
              value={kpiData?.data?.activeShipments || 0}
              description="In transit"
              icon={Activity}
              changeType="neutral"
            />
            <KPICard
              title="Pending Receipts"
              value={kpiData?.data?.pendingReceipts || 0}
              description="Awaiting confirmation"
              icon={AlertTriangle}
              changeType={
                (kpiData?.data?.pendingReceipts || 0) > 0
                  ? "negative"
                  : "positive"
              }
            />
            <KPICard
              title="Pending Dispatch"
              value={kpiData?.data?.pendingDistributions || 0}
              description="To send"
              icon={AlertTriangle}
              changeType={
                (kpiData?.data?.pendingDistributions || 0) > 0
                  ? "negative"
                  : "positive"
              }
            />
            <KPICard
              title="Processing Efficiency"
              value={`${kpiData?.data?.processingEfficiency || 0}%`}
              change={
                kpiData?.data?.processingEfficiency >= 90
                  ? "Excellent"
                  : "Needs improvement"
              }
              changeType={
                kpiData?.data?.processingEfficiency >= 90
                  ? "positive"
                  : "neutral"
              }
              icon={Target}
            />
          </>
        )}
      </div>

      {/* Active Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Active Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-blue-600 font-medium">In Transit</p>
                <p className="text-xl font-bold text-blue-900">
                  {kpiData?.data?.activeShipments || 0}
                </p>
              </div>
              <Truck className="h-6 w-6 text-blue-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm text-yellow-600 font-medium">
                  Pending Receipts
                </p>
                <p className="text-xl font-bold text-yellow-900">
                  {kpiData?.data?.pendingReceipts || 0}
                </p>
              </div>
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-green-600 font-medium">
                  Distributions
                </p>
                <p className="text-xl font-bold text-green-900">
                  {kpiData?.data?.pendingDistributions || 0}
                </p>
              </div>
              <Building2 className="h-6 w-6 text-green-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm text-red-600 font-medium">Low Stock</p>
                <p className="text-xl font-bold text-red-900">
                  {kpiData?.data?.lowStockItems || 0}
                </p>
              </div>
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Direct Shipments Statistics */}
      {(user?.role === "national_manager" || user?.role === "super_admin") &&
        directShipmentStats?.data && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5" />
                Direct Shipments Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Total</p>
                    <p className="text-xl font-bold text-gray-900">
                      {directShipmentStats.data.totalCount || 0}
                    </p>
                  </div>
                  <Package className="h-6 w-6 text-gray-600" />
                </div>

                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">
                      Pending
                    </p>
                    <p className="text-xl font-bold text-yellow-900">
                      {directShipmentStats.data.pendingCount || 0}
                    </p>
                  </div>
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">
                      Dispatched
                    </p>
                    <p className="text-xl font-bold text-blue-900">
                      {directShipmentStats.data.dispatchedCount || 0}
                    </p>
                  </div>
                  <Truck className="h-6 w-6 text-blue-600" />
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm text-green-600 font-medium">
                      Delivered
                    </p>
                    <p className="text-xl font-bold text-green-900">
                      {directShipmentStats.data.deliveredCount || 0}
                    </p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">
                      Avg Delivery
                    </p>
                    <p className="text-xl font-bold text-purple-900">
                      {Math.round(
                        directShipmentStats.data.avgDeliveryDays || 0
                      )}
                      d
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {getQuickActions().map((action, index) => (
              <Link key={index} href={action.href}>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12 hover:bg-gray-50"
                >
                  <div className={`p-2 rounded ${action.color} text-white`}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  {action.title}
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityData?.data?.map((activity: ActivityItem) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
                >
                  {getStatusIcon(activity.status)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                      {activity.metadata?.reference && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {activity.metadata.reference}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-4 text-muted-foreground">
                  No recent activity available
                </div>
              )}
            </div>
            {/* <div className="mt-4 pt-4 border-t">
              <Link href="/reports/standard">
                <Button variant="ghost" className="w-full">
                  View All Activity
                </Button>
              </Link>
            </div> */}
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {kpiData?.data?.completedShipments || 0}
            </p>
            <p className="text-sm text-muted-foreground">
              Shipments This Month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Building2 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {kpiData?.data?.pendingDistributions || 0}
            </p>
            <p className="text-sm text-muted-foreground">
              Pending Distributions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {Math.round(kpiData?.data?.avgDirectShipmentDeliveryTime || 0)}d
            </p>
            <p className="text-sm text-muted-foreground">Avg Direct Delivery</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <School className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {kpiData?.data?.totalDirectShipments || 0}
            </p>
            <p className="text-sm text-muted-foreground">Direct Shipments</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipment Trends */}
        {chartData?.data?.shipmentTrend &&
          chartData.data.shipmentTrend.length > 0 && (
            <SimpleLineChart
              title="Shipment Trends"
              description="Monthly shipment and delivery tracking"
              data={chartData.data.shipmentTrend}
              xKey="period"
              yKeys={["shipments", "delivered"]}
              colors={["#007A33", "#005DAA"]}
            />
          )}

        {/* Geographic Distribution */}
        {geographicData?.data && geographicData.data.length > 0 && (
          <SimpleBarChart
            title="Council Distribution"
            description="Schools served by local council"
            data={geographicData.data
              .slice(0, 8)
              .map((council: CouncilDistribution) => ({
                name: council.councilName.substring(0, 12),
                value: council.totalSchools,
                color:
                  council.totalSchools > 10
                    ? "#007A33"
                    : council.totalSchools > 5
                    ? "#A3C940"
                    : "#FF8042",
              }))}
            colorScheme="default"
          />
        )}
      </div>

      {/* Inventory Alerts and Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Inventory Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alertsData?.data?.slice(0, 5).map((alert: InventoryAlert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{alert.itemName}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge
                      status={
                        alert.severity === "critical"
                          ? "error"
                          : alert.severity === "high"
                          ? "warning"
                          : "info"
                      }
                    >
                      {alert.currentStock} units
                    </StatusBadge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {alert.daysUntilStockout} days left
                    </p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-4 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  No critical alerts
                </div>
              )}
            </div>
            {alertsData?.data?.length > 5 && (
              <div className="mt-4 pt-4 border-t">
                <Link href="/inventory/national">
                  <Button variant="ghost" className="w-full">
                    View All Alerts ({alertsData?.data?.length})
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Completion Rate</span>
                <span className="text-sm text-muted-foreground">
                  {performanceData?.data?.completionRate || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 bg-green-600 rounded-full"
                  style={{
                    width: `${performanceData?.data?.completionRate || 0}%`,
                  }}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">System Utilization</span>
                <span className="text-sm text-muted-foreground">
                  {performanceData?.data?.systemUtilization || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 bg-blue-600 rounded-full"
                  style={{
                    width: `${performanceData?.data?.systemUtilization || 0}%`,
                  }}
                />
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span>Avg Processing Time</span>
                  <span className="font-medium">
                    {performanceData?.data?.avgProcessingTime || 0} days
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span>User Satisfaction</span>
                  <span className="font-medium">
                    {performanceData?.data?.userSatisfactionScore || 0}/5.0
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">System Status</span>
                <StatusBadge status="success">Operational</StatusBadge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Uptime</span>
                <span className="text-sm font-medium">
                  {kpiData?.data?.systemUptime || 99.5}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Connections</span>
                <span className="text-sm font-medium">
                  {kpiData?.data?.activeUsers || 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Error Rate</span>
                <span className="text-sm text-muted-foreground">
                  {performanceData?.data?.errorRate || 0}%
                </span>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-muted-foreground">
                    Last updated: {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Critical Alerts */}
      {(kpiData?.data?.criticalAlerts > 0 ||
        kpiData?.data?.lowStockItems > 0 ||
        kpiData?.data?.overdueShipments > 0) && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="space-y-1">
              {kpiData?.data?.criticalAlerts > 0 && (
                <div>
                  System has {kpiData?.data?.criticalAlerts} critical alerts
                  requiring immediate attention.
                </div>
              )}
              {kpiData?.data?.lowStockItems > 0 && (
                <div>
                  {kpiData?.data?.lowStockItems} items are running low on stock.{" "}
                  <Link
                    href="/inventory/national"
                    className="font-medium underline"
                  >
                    View inventory
                  </Link>
                </div>
              )}
              {kpiData?.data?.overdueShipments > 0 && (
                <div>
                  {kpiData?.data?.overdueShipments} shipments are overdue.{" "}
                  <Link href="/warehouse/shipments" className="font-medium underline">
                    View shipments
                  </Link>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
