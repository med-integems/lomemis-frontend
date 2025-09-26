"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  Truck,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { cn, formatCurrencyCompact } from "@/lib/utils";
import { useResponsive } from "@/hooks/useResponsive";

export interface KPIData {
  // System overview
  totalWarehouses: number;
  totalCouncils: number;
  totalSchools: number;
  totalUsers: number;
  activeUsers: number;
  systemUptime: number;
  criticalAlerts: number;

  // Inventory overview
  totalItems: number;
  totalInventoryValue: number;
  lowStockItems: number;
  criticalStockItems: number;
  lowStockThreshold: number;
  inventoryTurnoverRate: number;
  avgStockLevel: number;

  // Operations overview
  activeShipments: number;
  pendingReceipts: number;
  pendingDistributions: number;
  completedShipments: number;
  overdueShipments: number;
  avgDeliveryTime: number;
  processingEfficiency: number;

  // Direct shipments
  totalDirectShipments: number;
  directShipmentsPending: number;
  directShipmentsDispatched: number;
  directShipmentsDelivered: number;
  directShipmentsConfirmed: number;
  avgDirectShipmentDeliveryTime: number;

  // Performance metrics
  monthlyShipmentGrowth: number;
  distributionEfficiency: number;
  userEngagementRate: number;
  systemPerformanceScore: number;

  // Financial metrics
  totalValueProcessed: number;
  costPerTransaction: number;
  inventoryUtilization: number;
}

interface KPICardsProps {
  data?: KPIData;
  isLoading?: boolean;
  userRole?: string;
}

export function KPICards({ data, isLoading, userRole }: KPICardsProps) {
  const { deviceType, isTouchDevice } = useResponsive();

  const getKPIConfig = () => {
    const baseKPIs = [
      {
        title: "Total Items",
        value: data?.totalItems || 0,
        icon: Package,
        color: "text-primary",
        bgColor: "bg-primary/10",
        description: "Items in system",
        roles: ["super_admin", "national_manager", "lc_officer", "view_only"],
      },
      {
        title: "Active Shipments",
        value: data?.activeShipments || 0,
        icon: Truck,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        description: "In transit",
        roles: ["super_admin", "national_manager", "lc_officer", "view_only"],
      },
      {
        title: "Pending Distributions",
        value: data?.pendingDistributions || 0,
        icon: GraduationCap,
        color: "text-green-600",
        bgColor: "bg-green-100",
        description: "Awaiting processing",
        roles: ["super_admin", "national_manager", "lc_officer", "view_only"],
      },
      {
        title: "Low Stock Items",
        value: data?.lowStockItems || 0,
        icon: AlertTriangle,
        color: "text-orange-600",
        bgColor: "bg-orange-100",
        description: "Need attention",
        roles: ["super_admin", "national_manager", "lc_officer"],
      },
      {
        title: "Completed Shipments",
        value: data?.completedShipments || 0,
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-100",
        description: "This month",
        roles: ["super_admin", "national_manager", "view_only"],
      },
      {
        title: "Pending Receipts",
        value: data?.pendingReceipts || 0,
        icon: TrendingUp,
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        description: "Awaiting confirmation",
        roles: ["super_admin", "national_manager", "lc_officer"],
      },
      {
        title: "System Uptime",
        value: `${(data?.systemUptime || 99.5).toFixed(1)}%`,
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-100",
        description: "System availability",
        roles: ["super_admin", "national_manager"],
      },
      {
        title: "Critical Alerts",
        value: data?.criticalAlerts || 0,
        icon: AlertTriangle,
        color: (data?.criticalAlerts || 0) > 0 ? "text-red-600" : "text-green-600",
        bgColor: (data?.criticalAlerts || 0) > 0 ? "bg-red-100" : "bg-green-100",
        description:
          (data?.criticalAlerts || 0) > 0 ? "Require attention" : "All systems normal",
        roles: ["super_admin", "national_manager", "lc_officer"],
      },
      {
        title: "Processing Efficiency",
        value: `${(data?.processingEfficiency || 0).toFixed(1)}%`,
        icon: TrendingUp,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        description: "Completion rate",
        roles: ["super_admin", "national_manager"],
      },
      {
        title: "Direct Shipments",
        value: data?.totalDirectShipments || 0,
        icon: Truck,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
        description: "This month",
        roles: ["super_admin", "national_manager"],
      },
      {
        title: "Inventory Value",
        value: formatCurrencyCompact(data?.totalInventoryValue || 0),
        icon: Package,
        color: "text-green-600",
        bgColor: "bg-green-100",
        description: "Total value (Le)",
        roles: ["super_admin", "national_manager"],
      },
      {
        title: "User Engagement",
        value: `${(data?.userEngagementRate || 0).toFixed(1)}%`,
        icon: CheckCircle,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        description: "Active users",
        roles: ["super_admin"],
      },
    ];

    // Filter KPIs based on user role and show most relevant ones
    const filteredKPIs = baseKPIs.filter(
      (kpi) => !userRole || kpi.roles.includes(userRole as any)
    );

    // Return top 6 most relevant KPIs for the role
    if (userRole === "super_admin") {
      return filteredKPIs.slice(0, 8);
    } else if (userRole === "national_manager") {
      return filteredKPIs.slice(0, 6);
    } else {
      return filteredKPIs.slice(0, 4);
    }
  };

  const kpiConfig = getKPIConfig();

  if (isLoading) {
    const skeletonCount = deviceType === "mobile" ? 2 : 4;

    return (
      <div className={cn(
        "grid gap-6",
        "grid-cols-1",
        "md:grid-cols-2",
        "lg:grid-cols-4"
      )}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <Card key={index} className={cn(
            isTouchDevice && "touch-manipulation"
          )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className={cn(
                "w-24",
                deviceType === "mobile" ? "h-5" : "h-4"
              )} />
              <Skeleton className={cn(
                deviceType === "mobile" ? "h-5 w-5" : "h-4 w-4"
              )} />
            </CardHeader>
            <CardContent>
              <Skeleton className={cn(
                "w-16 mb-2",
                deviceType === "mobile" ? "h-10" : "h-8"
              )} />
              <Skeleton className={cn(
                "w-20",
                deviceType === "mobile" ? "h-4" : "h-3"
              )} />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn(
      "grid gap-6",
      "grid-cols-1",
      "md:grid-cols-2",
      "lg:grid-cols-4",
      // Ensure equal height cards
      "auto-rows-fr"
    )}>
      {kpiConfig.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <Card key={index} className={cn(
            "hover:shadow-md transition-shadow",
            // Touch optimization
            isTouchDevice && "touch-manipulation hover:shadow-lg",
            // Mobile-specific styling
            deviceType === "mobile" && "active:scale-[0.98]"
          )}>
            <CardHeader className={cn(
              "flex flex-row items-center justify-between space-y-0",
              deviceType === "mobile" ? "pb-3" : "pb-2"
            )}>
              <CardTitle className={cn(
                "font-medium text-muted-foreground",
                deviceType === "mobile" ? "text-base" : "text-sm"
              )}>
                {kpi.title}
              </CardTitle>
              <div className={cn(
                "rounded-full",
                kpi.bgColor,
                deviceType === "mobile" ? "p-2.5" : "p-2"
              )}>
                <Icon className={cn(
                  kpi.color,
                  deviceType === "mobile" ? "h-5 w-5" : "h-4 w-4"
                )} />
              </div>
            </CardHeader>
            <CardContent className={cn(
              deviceType === "mobile" && "pb-4"
            )}>
              <div className={cn(
                "font-bold text-foreground",
                deviceType === "mobile" ? "text-3xl" : "text-2xl"
              )}>
                {typeof kpi.value === 'string' ? kpi.value : kpi.value.toLocaleString()}
              </div>
              <p className={cn(
                "text-muted-foreground mt-1",
                deviceType === "mobile" ? "text-sm" : "text-xs"
              )}>
                {kpi.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
