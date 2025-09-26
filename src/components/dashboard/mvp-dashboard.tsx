"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KpiCard, KpiGrid, KpiCardSkeleton } from "./kpi-card";
import { ListCard, ListCardSkeleton } from "./list-card";
import { GlobalFilterBar, GlobalFilterBarSkeleton } from "./global-filter-bar";
import { AlertBanner, AlertBannerSkeleton } from "./alert-banner";
import { Button } from "@/components/ui/button";
import { ExternalLink, Filter, X } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { useUser } from "@/hooks/useUser";
import { useResponsive } from "@/hooks/useResponsive";
import {
  ResponsiveDashboardLayout,
  DashboardSection,
  ResponsiveDashboardGrid,
  DashboardWidget,
} from "./responsive-dashboard-grid";
import { cn } from "@/lib/utils";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface TrendDataPoint {
  period: string;
  value: number;
  date?: string;
}

interface DashboardKPI {
  key: string;
  title: string;
  value: number | string;
  unit?: string;
  trend?: number;
  trendData?: TrendDataPoint[];
  previousValue?: number;
  target?: number;
  description?: string;
  insights?: string[];
  link?: string;
}

interface DashboardListItem {
  label: string;
  sublabel?: string;
  value: string | number;
  link: string;
  status?: "pending" | "confirmed" | "sent" | "dispatched" | "low" | "critical";
}

interface DashboardSection {
  title: string;
  items: DashboardListItem[];
}

interface DashboardAlert {
  type: "warning" | "error" | "info";
  label: string;
  count: number;
  link: string;
}

interface DashboardData {
  role: string;
  kpis: DashboardKPI[];
  lists: { [key: string]: DashboardSection };
  alerts: DashboardAlert[];
  links: { label: string; url: string }[];
  metadata?: {
    dateRange: string;
    userRole: string;
    scope: {
      schoolId?: number;
      councilId?: number;
      warehouseId?: number;
    };
    timestamp: string;
    cached: boolean;
  };
}

export function MVPDashboard() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { deviceType, isMobile } = useResponsive();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const isReadOnly = (user?.role || "").toLowerCase() === "view_only";

  // URL state management
  const [dateRange, setDateRange] = useState(
    searchParams.get("dateRange") || "last30"
  );
  const [schoolId, setSchoolId] = useState(searchParams.get("schoolId") || "");
  const [councilId, setCouncilId] = useState(
    searchParams.get("councilId") || ""
  );
  const [warehouseId, setWarehouseId] = useState(
    searchParams.get("warehouseId") || ""
  );

  // Update URL when filters change
  const updateUrl = useCallback((params: Record<string, string>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value);
      } else {
        newSearchParams.delete(key);
      }
    });

    router.push(`?${newSearchParams.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const handleDateRangeChange = useCallback((newDateRange: string) => {
    setDateRange(newDateRange);
    updateUrl({ dateRange: newDateRange, schoolId, councilId, warehouseId });
  }, [updateUrl, schoolId, councilId, warehouseId]);

  const handleScopeChange = useCallback((scope: {
    schoolId?: string;
    councilId?: string;
    warehouseId?: string;
  }) => {
    setSchoolId(scope.schoolId || "");
    setCouncilId(scope.councilId || "");
    setWarehouseId(scope.warehouseId || "");
    updateUrl({
      dateRange,
      schoolId: scope.schoolId || "",
      councilId: scope.councilId || "",
      warehouseId: scope.warehouseId || "",
    });
  }, [updateUrl, dateRange]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        dateRange,
        ...(schoolId && { schoolId }),
        ...(councilId && { councilId }),
        ...(warehouseId && { warehouseId }),
      });

      const response = await api.get(
        `/dashboard/overview?${params.toString()}`
      );

      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch dashboard data"
        );
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [user, dateRange, schoolId, councilId, warehouseId]);

  // Effect to fetch data when filters change
  useEffect(() => {
    if (!userLoading && user) {
      fetchDashboardData();
    }
  }, [userLoading, user, fetchDashboardData]);

  // Show loading state
  if (userLoading || loading) {
    return <DashboardSkeleton />;
  }

  // Show error state
  if (error) {
    return (
      <ResponsiveDashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <h2 className={cn(
              "font-semibold text-red-600 mb-2",
              deviceType === "mobile" ? "text-lg" : "text-xl"
            )}>
              Error Loading Dashboard
            </h2>
            <p className={cn(
              "text-gray-600 mb-4",
              deviceType === "mobile" ? "text-sm" : "text-base"
            )}>
              {error}
            </p>
            <Button onClick={fetchDashboardData} className="w-full sm:w-auto">
              Retry
            </Button>
          </div>
        </div>
      </ResponsiveDashboardLayout>
    );
  }

  // Show no data state
  if (!dashboardData) {
    return (
      <ResponsiveDashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <h2 className={cn(
              "font-semibold text-gray-600 mb-2",
              deviceType === "mobile" ? "text-lg" : "text-xl"
            )}>
              No Dashboard Data
            </h2>
            <p className={cn(
              "text-gray-500 mb-4",
              deviceType === "mobile" ? "text-sm" : "text-base"
            )}>
              Unable to load dashboard information
            </p>
            <Button onClick={fetchDashboardData} className="w-full sm:w-auto">
              Refresh
            </Button>
          </div>
        </div>
      </ResponsiveDashboardLayout>
    );
  }

  // Mobile filter drawer component
  const MobileFilterDrawer = () => (
    <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Dashboard Filters</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <GlobalFilterBar
            userRole={user?.role || ""}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            schoolId={schoolId}
            councilId={councilId}
            warehouseId={warehouseId}
            onScopeChange={handleScopeChange}
            loading={loading}
            onRefresh={fetchDashboardData}
          />
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <ResponsiveDashboardLayout
      header={
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className={cn(
              "font-bold text-gray-900 mb-1",
              deviceType === "mobile" ? "text-xl" : "text-2xl"
            )}>
              Dashboard
            </h1>
            <p className={cn(
              "text-gray-600",
              deviceType === "mobile" ? "text-sm" : "text-base"
            )}>
              System overview for {dateRange.replace("last", "last ")}
            </p>
            {/* Weekly summary for quick comprehension */}
            {(() => {
              const getVal = (key: string) => Number((dashboardData?.kpis || []).find(k => k.key === key)?.value || 0);
              const inbound = getVal('inbound_this_week');
              const outbound = getVal('outbound_this_week');
              const issues = getVal('low_stock_skus') + getVal('expiry_risk');
              if (!inbound && !outbound && !issues) return null;
              return (
                <p className={cn(
                  "text-gray-700 mt-1",
                  deviceType === "mobile" ? "text-sm" : "text-sm"
                )}>
                  This week: {inbound} inbound, {outbound} outbound, {issues} issues
                </p>
              );
            })()}
          </div>
          {isMobile && <MobileFilterDrawer />}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Desktop Filters */}
        <div className="hidden lg:block">
          <GlobalFilterBar
            userRole={user?.role || ""}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            schoolId={schoolId}
            councilId={councilId}
            warehouseId={warehouseId}
            onScopeChange={handleScopeChange}
            loading={loading}
            onRefresh={fetchDashboardData}
          />
        </div>

        {/* Alerts */}
        {!!dashboardData.alerts?.length && (
          <DashboardWidget>
            <AlertBanner alerts={dashboardData.alerts as any} dismissible={true} />
          </DashboardWidget>
        )}

        {/* KPI Cards Section */}
        <DashboardSection
          title="This Week at a Glance"
          description={`Current metrics for ${dateRange.replace("last", "last ")}`}
        >
          <ResponsiveDashboardGrid
            maxColumns={{ mobile: 1, tablet: 2, desktop: 4 }}
            minItemWidth={250}
          >
            {(dashboardData.kpis || []).map((kpi, index) => (
              <KpiCard
                key={kpi.key}
                title={kpi.title}
                value={kpi.value}
                unit={kpi.unit}
                trend={kpi.trend}
                trendData={kpi.trendData}
                previousValue={kpi.previousValue}
                target={kpi.target}
                description={kpi.description}
                insights={kpi.insights}
                variant={getKpiVariant(kpi.key, kpi.value)}
                link={kpi.link}
              />
            ))}
          </ResponsiveDashboardGrid>
        </DashboardSection>

        {/* Activity Lists Section */}
        {Object.keys(dashboardData.lists || {}).length > 0 && (
          <DashboardSection
            title="Recent Activity"
            description="Current status and pending actions"
          >
            <ResponsiveDashboardGrid
              maxColumns={{ mobile: 1, tablet: 1, desktop: 2 }}
              minItemWidth={400}
            >
              {Object.entries(dashboardData.lists || {}).map(([key, section]) => (
                <ListCard
                  key={key}
                  title={section.title}
                  items={section.items || []}
                  readOnly={isReadOnly}
                  emptyMessage={`No ${
                    section.title?.toLowerCase?.() || "items"
                  } found`}
                />
              ))}
            </ResponsiveDashboardGrid>
          </DashboardSection>
        )}

        {/* Quick Actions */}
        {!!dashboardData.links?.length && !isReadOnly && (
          <DashboardSection
            title="Quick Actions"
            description="Frequently used operations"
          >
            <ResponsiveDashboardGrid
              maxColumns={{ mobile: 1, tablet: 2, desktop: 4 }}
              minItemWidth={200}
              spacing="sm"
            >
              {(dashboardData.links || []).map((link, index) => (
                <Button key={index} variant="outline" asChild className="justify-start">
                  <Link href={link.url}>
                    <ExternalLink className={cn(
                      "mr-2",
                      deviceType === "mobile" ? "h-5 w-5" : "h-4 w-4"
                    )} />
                    {link.label}
                  </Link>
                </Button>
              ))}
            </ResponsiveDashboardGrid>
          </DashboardSection>
        )}

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === "development" && dashboardData.metadata && (
          <DashboardSection title="Debug Information" collapsible defaultCollapsed>
            <div className={cn(
              "p-3 bg-gray-100 rounded overflow-auto",
              deviceType === "mobile" ? "text-xs" : "text-sm"
            )}>
              <pre>{JSON.stringify(dashboardData.metadata, null, 2)}</pre>
            </div>
          </DashboardSection>
        )}
      </div>
    </ResponsiveDashboardLayout>
  );
}

// Helper function to determine KPI card variant based on context
function getKpiVariant(
  key: string,
  value: number | string
): "default" | "success" | "warning" | "destructive" {
  if (typeof value !== "number") return "default";

  // Critical/warning indicators
  if (
    key.includes("critical") ||
    key.includes("expiry") ||
    key.includes("overdue")
  ) {
    return value > 0 ? "destructive" : "success";
  }

  // Low stock indicators
  if (key.includes("low_stock") || key.includes("pending")) {
    if (value > 10) return "destructive";
    if (value > 5) return "warning";
    return "default";
  }

  // Positive metrics
  if (
    key.includes("confirmed") ||
    key.includes("completed") ||
    key.includes("delivered")
  ) {
    return "success";
  }

  return "default";
}

// Responsive loading skeleton
export function DashboardSkeleton() {
  const { deviceType } = useResponsive();
  const skeletonKpiCount = deviceType === "mobile" ? 2 : 4;
  const skeletonListCount = deviceType === "mobile" ? 1 : 2;
  
  return (
    <ResponsiveDashboardLayout
      header={
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            <div className={cn(
              "bg-gray-200 rounded animate-pulse",
              deviceType === "mobile" ? "h-6 w-32" : "h-8 w-48"
            )}></div>
            <div className={cn(
              "bg-gray-200 rounded animate-pulse",
              deviceType === "mobile" ? "h-3 w-48" : "h-4 w-64"
            )}></div>
          </div>
          {deviceType === "mobile" && (
            <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Filter Bar Skeleton */}
        <div className="hidden lg:block">
          <GlobalFilterBarSkeleton />
        </div>

        {/* Alert Skeleton - Temporarily disabled */}
        {/* <AlertBannerSkeleton /> */}

        {/* KPI Section Skeleton */}
        <div className="space-y-4">
          <div className="space-y-1">
            <div className={cn(
              "bg-gray-200 rounded animate-pulse",
              deviceType === "mobile" ? "h-5 w-40" : "h-6 w-56"
            )}></div>
            <div className={cn(
              "bg-gray-200 rounded animate-pulse",
              deviceType === "mobile" ? "h-3 w-32" : "h-4 w-48"
            )}></div>
          </div>
          
          <ResponsiveDashboardGrid
            maxColumns={{ mobile: 1, tablet: 2, desktop: 4 }}
            minItemWidth={250}
          >
            {Array.from({ length: skeletonKpiCount }).map((_, i) => (
              <KpiCardSkeleton key={i} />
            ))}
          </ResponsiveDashboardGrid>
        </div>

        {/* Activity Lists Section Skeleton */}
        <div className="space-y-4">
          <div className="space-y-1">
            <div className={cn(
              "bg-gray-200 rounded animate-pulse",
              deviceType === "mobile" ? "h-5 w-32" : "h-6 w-40"
            )}></div>
            <div className={cn(
              "bg-gray-200 rounded animate-pulse",
              deviceType === "mobile" ? "h-3 w-40" : "h-4 w-56"
            )}></div>
          </div>
          
          <ResponsiveDashboardGrid
            maxColumns={{ mobile: 1, tablet: 1, desktop: 2 }}
            minItemWidth={400}
          >
            {Array.from({ length: skeletonListCount }).map((_, i) => (
              <ListCardSkeleton key={i} title={`Section ${i + 1}`} />
            ))}
          </ResponsiveDashboardGrid>
        </div>

        {/* Quick Actions Skeleton */}
        <div className="space-y-4">
          <div className="space-y-1">
            <div className={cn(
              "bg-gray-200 rounded animate-pulse",
              deviceType === "mobile" ? "h-5 w-28" : "h-6 w-32"
            )}></div>
            <div className={cn(
              "bg-gray-200 rounded animate-pulse",
              deviceType === "mobile" ? "h-3 w-36" : "h-4 w-44"
            )}></div>
          </div>
          
          <ResponsiveDashboardGrid
            maxColumns={{ mobile: 1, tablet: 2, desktop: 4 }}
            minItemWidth={200}
            spacing="sm"
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "bg-gray-200 rounded animate-pulse",
                  deviceType === "mobile" ? "h-12" : "h-10"
                )}
              ></div>
            ))}
          </ResponsiveDashboardGrid>
        </div>
      </div>
    </ResponsiveDashboardLayout>
  );
}
