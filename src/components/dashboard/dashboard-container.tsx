"use client";

import { useQuery } from "@tanstack/react-query";
import { KPICards, type KPIData } from "./kpi-cards";
import { InventoryCharts, type InventoryChartData } from "./inventory-charts";
import { ActivityFeed, type ActivityItem } from "./activity-feed";
import { dashboardApi } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/usePermissions";
import { ScopeIndicator } from "@/components/ui/scope-indicator";

interface DashboardContainerProps {
  userRole?: string;
}

export function DashboardContainer({ userRole }: DashboardContainerProps) {
  const { user } = useAuth();
  const { isDistrictOfficer } = usePermissions();
  // Fetch KPI data
  const {
    data: kpiData,
    isLoading: kpiLoading,
    error: kpiError,
    refetch: refetchKPI,
  } = useQuery({
    queryKey: ["dashboard", "kpi"],
    queryFn: dashboardApi.getKPIData,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time data
    retry: 2,
  });

  // Fetch enhanced inventory chart data
  const {
    data: chartData,
    isLoading: chartLoading,
    error: chartError,
    refetch: refetchCharts,
  } = useQuery({
    queryKey: ["dashboard", "enhanced-charts"],
    queryFn: dashboardApi.getEnhancedChartData,
    refetchInterval: 60000, // Refetch every minute
    retry: 2,
  });

  // Fetch recent activity
  const {
    data: activityData,
    isLoading: activityLoading,
    error: activityError,
    refetch: refetchActivity,
  } = useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: () => dashboardApi.getRecentActivity(10),
    refetchInterval: 15000, // Refetch every 15 seconds
    retry: 2,
  });

  const handleRefreshAll = () => {
    refetchKPI();
    refetchCharts();
    refetchActivity();
  };

  // Mock data for development (will be replaced by real API data)
  const mockKPIData: KPIData = {
    // System overview
    totalWarehouses: 4,
    totalCouncils: 16,
    totalSchools: 1250,
    totalUsers: 45,
    activeUsers: 32,
    systemUptime: 99.8,
    criticalAlerts: 2,

    // Inventory overview
    totalItems: 1250,
    totalInventoryValue: 125000,
    lowStockItems: 8,
    criticalStockItems: 3,
    lowStockThreshold: 25,
    inventoryTurnoverRate: 2.5,
    avgStockLevel: 150,

    // Operations overview
    activeShipments: 8,
    pendingReceipts: 5,
    pendingDistributions: 12,
    completedShipments: 23,
    overdueShipments: 2,
    avgDeliveryTime: 3.5,
    processingEfficiency: 87.5,

    // Direct shipments
    totalDirectShipments: 15,
    directShipmentsPending: 3,
    directShipmentsDispatched: 5,
    directShipmentsDelivered: 4,
    directShipmentsConfirmed: 3,
    avgDirectShipmentDeliveryTime: 2.8,

    // Performance metrics
    monthlyShipmentGrowth: 12.5,
    distributionEfficiency: 85.2,
    userEngagementRate: 71.1,
    systemPerformanceScore: 95.5,

    // Financial metrics
    totalValueProcessed: 25000,
    costPerTransaction: 125.5,
    inventoryUtilization: 78.5,
  };

  const mockChartData: InventoryChartData = {
    categoryDistribution: [
      {
        name: "Textbooks",
        value: 450,
        itemCount: 25,
        totalValue: 45000,
        lowStockCount: 2,
        color: "#007A33",
      },
      {
        name: "Exercise Books",
        value: 320,
        itemCount: 18,
        totalValue: 32000,
        lowStockCount: 1,
        color: "#005DAA",
      },
      {
        name: "Stationery",
        value: 280,
        itemCount: 35,
        totalValue: 28000,
        lowStockCount: 3,
        color: "#A3C940",
      },
      {
        name: "Teaching Aids",
        value: 200,
        itemCount: 12,
        totalValue: 20000,
        lowStockCount: 2,
        color: "#FF8042",
      },
    ],
    shipmentTrend: [
      {
        period: "2024-01",
        shipments: 15,
        delivered: 12,
        inTransit: 2,
        discrepancies: 1,
      },
      {
        period: "2024-02",
        shipments: 18,
        delivered: 16,
        inTransit: 1,
        discrepancies: 1,
      },
      {
        period: "2024-03",
        shipments: 22,
        delivered: 20,
        inTransit: 2,
        discrepancies: 0,
      },
      {
        period: "2024-04",
        shipments: 20,
        delivered: 18,
        inTransit: 1,
        discrepancies: 1,
      },
      {
        period: "2024-05",
        shipments: 25,
        delivered: 23,
        inTransit: 2,
        discrepancies: 0,
      },
      {
        period: "2024-06",
        shipments: 23,
        delivered: 21,
        inTransit: 1,
        discrepancies: 1,
      },
    ],
    inventoryMovement: [
      {
        period: "2024-06-01",
        transaction_type: "RECEIPT",
        totalQuantity: 500,
        transactionCount: 5,
      },
      {
        period: "2024-06-01",
        transaction_type: "SHIPMENT_OUT",
        totalQuantity: 300,
        transactionCount: 3,
      },
      {
        period: "2024-06-02",
        transaction_type: "RECEIPT",
        totalQuantity: 200,
        transactionCount: 2,
      },
      {
        period: "2024-06-02",
        transaction_type: "DISTRIBUTION_OUT",
        totalQuantity: 150,
        transactionCount: 4,
      },
    ],
    warehouseUtilization: [
      {
        id: 1,
        name: "Freetown Central",
        uniqueItems: 45,
        totalQuantity: 850,
        totalValue: 85000,
        utilizationPercentage: 85,
      },
      {
        id: 2,
        name: "Bo Regional",
        uniqueItems: 32,
        totalQuantity: 650,
        totalValue: 65000,
        utilizationPercentage: 81,
      },
      {
        id: 3,
        name: "Kenema Hub",
        uniqueItems: 28,
        totalQuantity: 420,
        totalValue: 42000,
        utilizationPercentage: 70,
      },
      {
        id: 4,
        name: "Makeni Store",
        uniqueItems: 25,
        totalQuantity: 380,
        totalValue: 38000,
        utilizationPercentage: 76,
      },
    ],
    topMovingItems: [
      {
        id: 1,
        name: "Grade 3 Math Textbook",
        category: "Textbooks",
        totalMovement: 150,
        transactionCount: 8,
        currentStock: 200,
        turnoverRatio: 0.75,
      },
      {
        id: 2,
        name: "Exercise Book A4",
        category: "Exercise Books",
        totalMovement: 120,
        transactionCount: 6,
        currentStock: 300,
        turnoverRatio: 0.4,
      },
      {
        id: 3,
        name: "Pencils HB",
        category: "Stationery",
        totalMovement: 100,
        transactionCount: 10,
        currentStock: 500,
        turnoverRatio: 0.2,
      },
    ],
    geographicDistribution: [
      {
        councilId: 1,
        councilName: "Western Area Urban",
        region: "Western",
        district: "Western Urban",
        totalSchools: 245,
        pendingDistributions: 5,
        completedDistributions: 20,
        inventoryValue: 50000,
        distributionEfficiency: 80,
      },
      {
        councilId: 2,
        councilName: "Western Area Rural",
        region: "Western",
        district: "Western Rural",
        totalSchools: 180,
        pendingDistributions: 3,
        completedDistributions: 15,
        inventoryValue: 35000,
        distributionEfficiency: 83.3,
      },
      {
        councilId: 3,
        councilName: "Bo District",
        region: "Southern",
        district: "Bo",
        totalSchools: 220,
        pendingDistributions: 4,
        completedDistributions: 18,
        inventoryValue: 45000,
        distributionEfficiency: 81.8,
      },
    ],
    alertsSummary: {
      critical: 2,
      high: 3,
      medium: 5,
      low: 8,
    },
    alerts: [
      {
        id: "alert_1",
        itemId: 1,
        itemName: "Grade 1 Reading Book",
        currentStock: 5,
        reorderLevel: 25,
        severity: "critical",
        location: "Freetown Central",
        daysUntilStockout: 2,
      },
      {
        id: "alert_2",
        itemId: 2,
        itemName: "Pencils HB",
        currentStock: 15,
        reorderLevel: 50,
        severity: "high",
        location: "Bo Regional",
        daysUntilStockout: 5,
      },
    ],
    movementTrends: [
      {
        date: "2024-06-01",
        transactionType: "RECEIPT",
        inbound: 500,
        outbound: 0,
        transactionCount: 5,
      },
      {
        date: "2024-06-01",
        transactionType: "SHIPMENT_OUT",
        inbound: 0,
        outbound: 300,
        transactionCount: 3,
      },
      {
        date: "2024-06-02",
        transactionType: "DISTRIBUTION_OUT",
        inbound: 0,
        outbound: 150,
        transactionCount: 4,
      },
    ],
  };

  const mockActivityData: ActivityItem[] = [
    {
      id: "1",
      type: "receipt",
      title: "Stock Receipt Processed",
      description: "Received 500 Grade 3 Mathematics textbooks from supplier",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      user: "John Kamara",
      status: "success",
      metadata: {
        itemCount: 500,
        location: "Freetown Central Warehouse",
        reference: "RCP-2024-001",
      },
    },
    {
      id: "2",
      type: "shipment",
      title: "Shipment Dispatched",
      description: "Shipment to Bo District Council dispatched",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      user: "Mary Sesay",
      status: "info",
      metadata: {
        itemCount: 150,
        location: "Bo District",
        reference: "SHP-2024-045",
      },
    },
    {
      id: "3",
      type: "distribution",
      title: "School Distribution Confirmed",
      description: "Distribution to St. Mary's Primary School confirmed",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
      user: "Abdul Rahman",
      status: "success",
      metadata: {
        itemCount: 75,
        location: "Western Area Urban",
        reference: "DST-2024-123",
      },
    },
    {
      id: "4",
      type: "shipment",
      title: "Shipment Discrepancy Reported",
      description: "Discrepancy reported for shipment to Kenema District",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
      user: "Fatima Koroma",
      status: "warning",
      metadata: {
        itemCount: 200,
        location: "Kenema District",
        reference: "SHP-2024-042",
      },
    },
    {
      id: "5",
      type: "user_action",
      title: "New User Account Created",
      description: "New LC Officer account created for Kailahun District",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
      user: "System Admin",
      status: "info",
      metadata: {
        location: "Kailahun District",
        reference: "USR-2024-089",
      },
    },
  ];

  // Use mock data if API data is not available
  const finalKPIData = kpiData?.success ? kpiData.data : mockKPIData;
  const finalChartData = chartData?.success ? chartData.data : mockChartData;
  const finalActivityData = activityData?.success
    ? activityData.data
    : mockActivityData;

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {user?.role === "district_officer" && user.district
              ? `${user.district} District Dashboard`
              : user?.role === "lc_officer" && user.localCouncilId
              ? `Council ${user.localCouncilId} Dashboard`
              : user?.role === "national_manager" && user.warehouseId
              ? `Warehouse ${user.warehouseId} Dashboard`
              : "Dashboard"
            }
          </h1>
          <p className="text-muted-foreground">
            {user?.role === "district_officer"
              ? `District-level overview for ${user.district || "your assigned district"}`
              : user?.role === "lc_officer"
              ? "Local council inventory and distribution management"
              : user?.role === "national_manager"
              ? "National warehouse operations and shipment management"
              : user?.role === "school_rep"
              ? "School inventory and receipt management"
              : "Welcome to the LoMEMIS Teaching and Learning Materials Management System"
            }
          </p>
        </div>
        <Button
          onClick={handleRefreshAll}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Scope Indicator */}
      {user?.role === "district_officer" && user.district && (
        <ScopeIndicator
          type="district"
          scopeName={user.district}
          dataType="dashboard data"
        />
      )}
      {user?.role === "lc_officer" && user.localCouncilId && (
        <ScopeIndicator
          type="council"
          scopeName={`Council ${user.localCouncilId}`}
          dataType="dashboard data"
        />
      )}
      {user?.role === "national_manager" && user.warehouseId && (
        <ScopeIndicator
          type="warehouse"
          scopeName={`Warehouse ${user.warehouseId}`}
          dataType="dashboard data"
        />
      )}

      {/* Error alerts */}
      {(kpiError || chartError || activityError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Some dashboard data could not be loaded. Using cached or sample
            data.{" "}
            <Button
              variant="link"
              size="sm"
              onClick={handleRefreshAll}
              className="p-0 h-auto text-destructive underline"
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <KPICards
        data={finalKPIData}
        isLoading={kpiLoading}
        userRole={userRole}
      />

      {/* Charts and Activity Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <InventoryCharts
            data={finalChartData}
            isLoading={chartLoading}
            userRole={userRole}
          />
        </div>
        <div className="xl:col-span-1">
          <ActivityFeed
            activities={finalActivityData}
            isLoading={activityLoading}
            userRole={userRole}
          />
        </div>
      </div>
    </div>
  );
}
