"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Package,
  School,
  TrendingUp,
  AlertTriangle,
  FileText,
  Calendar,
  Users,
  CheckCircle,
  ClipboardList,
  RotateCcw,
  Building2,
} from "lucide-react";
import { DistributionTable } from "./distribution-table";
import { DistributionCreateForm } from "./distribution-create-form";
import { DistributionSearch } from "./distribution-search";
// import { DistributionPlanningTools } from "./distribution-planning-tools";
import { SchoolsForDistributions } from "../schools/schools-for-distributions";
import { distributionsApi, councilInventoryApi } from "@/lib/api";
import {
  DistributionWithDetails,
  DistributionFilters,
  PaginatedResponse,
  UserRole,
} from "@/types";
import { useUser } from "@/hooks/useUser";
import { useResponsive } from "@/hooks/useResponsive";
import { toast } from "sonner";
import { useFilteredExport, ExportButton, ExportStatus } from "@/components/export";

interface CouncilDistributionManagementProps {
  className?: string;
}

interface DistributionKPIs {
  totalDistributions: number;
  pendingDistributions: number;
  completedDistributions: number;
  totalSchoolsServed: number;
  totalItemsDistributed: number;
  averageDeliveryTime: number;
  distributionSuccessRate: number;
  lastDistributionDate: Date | null;
}

export function CouncilDistributionManagement({
  className,
}: CouncilDistributionManagementProps) {
  const router = useRouter();
  const { user } = useUser();
  const { isMobile, isTablet } = useResponsive();
  const [activeTab, setActiveTab] = useState("overview");
  const [distributions, setDistributions] = useState<DistributionWithDetails[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [kpiData, setKpiData] = useState<DistributionKPIs | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<DistributionFilters>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [showSchoolSelection, setShowSchoolSelection] = useState(false);

  // DEO and Council Selection State
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedCouncilId, setSelectedCouncilId] = useState<number | null>(null);
  const [councils, setCouncils] = useState<any[]>([]);
  const [councilsLoading, setCouncilsLoading] = useState(false);
  const [userDistrict, setUserDistrict] = useState<string | null>(null);

  const pageSize = 10;

  // Council distribution export functionality
  const { exportData, isExporting, error: exportError, lastExportCount, reset: resetExport } = useFilteredExport({
    apiCall: async (params) => {
      const maxRecords = params?.maxRecords || 1000;
      const apiFilters: any = { ...(params?.filters || {}) };
      // Scope to user's council or selected council
      const effectiveCouncilId = resolveEffectiveCouncilId();
      if (!apiFilters.localCouncilId && effectiveCouncilId) {
        apiFilters.localCouncilId = effectiveCouncilId;
      }
      return distributionsApi.getDistributions(
        1,
        maxRecords,
        apiFilters
      );
    },
    getCurrentFilters: () => filters,
    applyFilters: (data: any[], currentFilters: any) => {
      return data.filter((distribution: any) => {
        // Apply filters client-side if needed
        const matchesStatus = !currentFilters.status || distribution.status === currentFilters.status;
        const matchesCouncil =
          !currentFilters.localCouncilId ||
          distribution.localCouncilId === currentFilters.localCouncilId;
        const matchesSchool = !currentFilters.schoolId || distribution.schoolId === currentFilters.schoolId;
        const matchesDateRange = (!currentFilters.startDate || new Date(distribution.createdAt) >= new Date(currentFilters.startDate)) &&
                                (!currentFilters.endDate || new Date(distribution.createdAt) <= new Date(currentFilters.endDate));
        
        return matchesStatus && matchesCouncil && matchesSchool && matchesDateRange;
      });
    },
    headers: [
      "Distribution Number",
      "Council Name",
      "School Name", 
      "Status",
      "Total Items",
      "Distribution Date",
      "Confirmation Date",
      "Created By",
      "Created Date",
      "Confirmation Status",
      "Confirmed By"
    ],
    dataTransform: (distributions) => distributions.map((dist: any) => [
      dist.distributionNumber || `DIST-${dist.id || ''}`,
      dist.localCouncilName || '',
      dist.schoolName || '',
      dist.status || '',
      dist.totalItems?.toString() || '0',
      dist.distributionDate ? new Date(dist.distributionDate).toLocaleDateString() : '',
      dist.confirmationDate ? new Date(dist.confirmationDate).toLocaleDateString() : '',
      dist.createdByName || '',
      dist.createdAt ? new Date(dist.createdAt).toLocaleDateString() : '',
      dist.status === 'CONFIRMED' ? 'Confirmed' : 'Pending',
      dist.confirmedByName || ''
    ]),
    filename: `council-distributions-${new Date().toISOString().split('T')[0]}.csv`,
    maxRecords: 1000,
    includeFiltersInAPI: true
  });

  // Fetch user profile and set up DEO/Council access
  useEffect(() => {
    const fetchUserAndSetupAccess = async () => {
      try {
        setKpiLoading(true);
        setAccessError(null);

        // Get user profile first
        const { usersApi } = await import('@/lib/api');
        const profileResponse = await usersApi.getCurrentUser();

        if (!profileResponse.success) {
          setAccessError("Authentication required: Please log in to access this section.");
          setUserProfile({ hasAccess: false });
          return;
        }

        const userInfo = profileResponse.data;
        if (!userInfo) {
          setAccessError("Unable to load user profile.");
          setUserProfile({ hasAccess: false });
          return;
        }

        // Check if user has the right role
        const isSuperAdmin = userInfo.roleName === "Super Administrator";
        const isLCOfficer = userInfo.roleName === "Local Council M&E Officer" || userInfo.roleName === "LC M&E Officer";
        const isDistrictOfficer = userInfo.roleName === "District Education Officer";
        const hasViewAccess = isSuperAdmin || isLCOfficer || isDistrictOfficer || userInfo.roleName === "View-Only User" || userInfo.roleName === "National Warehouse Manager";

        if (!hasViewAccess) {
          setAccessError("Access denied: This section requires Super Administrator, National Warehouse Manager, Local Council M&E Officer, or District Education Officer privileges.");
          setUserProfile({ hasAccess: false });
          return;
        }

        // For Super Admins and other authorized users, fetch councils list
        if (isSuperAdmin || userInfo.roleName === "National Warehouse Manager" || userInfo.roleName === "View-Only User") {
          setCouncilsLoading(true);
          try {
            const { localCouncilsApi } = await import('@/lib/api');
            const councilsResponse = await localCouncilsApi.getLocalCouncils(1, 100);

            if (councilsResponse.success && councilsResponse.data?.councils) {
              setCouncils(councilsResponse.data.councils);
            }
          } catch (error) {
            console.error('Error fetching councils:', error);
          } finally {
            setCouncilsLoading(false);
          }

          const profileDetails = {
            hasAccess: true,
            role: userInfo.roleName,
            userId: userInfo.id,
            canSelectCouncil: true,
          };
          setUserProfile(profileDetails);
          await fetchDistributionKPIs({ profile: profileDetails });
          await fetchDistributions({ profile: profileDetails });
          return;
        }

        if (isDistrictOfficer) {
          const districtName = (userInfo.district || "").trim();
          setUserDistrict(districtName);

          if (!districtName) {
            setAccessError("Configuration error: District Education Officer account is not assigned to a district. Please contact your administrator.");
            setUserProfile({ hasAccess: false });
            return;
          }

          try {
            setCouncilsLoading(true);
            const { localCouncilsApi } = await import("@/lib/api");
            const councilsResponse = await localCouncilsApi.getLocalCouncils(1, 200, {
              district: districtName,
            });

            const districtCouncils = Array.isArray(councilsResponse.data?.councils)
              ? councilsResponse.data.councils
              : [];

            if (districtCouncils.length === 0) {
              setAccessError(`No councils were found for district "${districtName}". Please verify your district assignment.`);
              setUserProfile({ hasAccess: false, role: userInfo.roleName });
              setCouncils([]);
              setKpiLoading(false);
              return;
            }

            setCouncils(districtCouncils);

            // For single council districts, behave like LC Officer
            let profileDetails: any;
            if (districtCouncils.length === 1) {
              const singleCouncilId = districtCouncils[0].id;
              profileDetails = {
                hasAccess: true,
                role: userInfo.roleName,
                userId: userInfo.id,
                councilId: singleCouncilId,
                canSelectCouncil: false,
              };
            } else {
              // For multiple councils, allow selection
              profileDetails = {
                hasAccess: true,
                role: userInfo.roleName,
                userId: userInfo.id,
                canSelectCouncil: true,
              };
            }

            setUserProfile(profileDetails);
            await fetchDistributionKPIs({ profile: profileDetails });
            await fetchDistributions({ profile: profileDetails });
            return;
          } catch (error) {
            console.error("Error loading district councils", error);
            setAccessError("System error: Unable to load councils for your district.");
            setUserProfile({ hasAccess: false });
          } finally {
            setCouncilsLoading(false);
          }

          return;
        }

        // For LC Officers, get their council-specific data
        if (isLCOfficer && userInfo.localCouncilId) {
          const profileDetails = {
            hasAccess: true,
            role: userInfo.roleName,
            userId: userInfo.id,
            councilId: userInfo.localCouncilId,
            canSelectCouncil: false,
          };
          setUserProfile(profileDetails);
          await fetchDistributionKPIs({ profile: profileDetails });
          await fetchDistributions({ profile: profileDetails });
          return;
        }

        // Default fallback
        setAccessError("Unable to determine user access level.");
        setUserProfile({ hasAccess: false });
      } catch (error) {
        console.error("Error setting up user access:", error);
        setAccessError("System error: Unable to load distribution management.");
        setUserProfile({ hasAccess: false });
      } finally {
        setKpiLoading(false);
        setLoading(false);
      }
    };

    fetchUserAndSetupAccess();
  }, []);

  // Refetch distributions when page or filters change
  useEffect(() => {
    if (!accessError && userProfile?.hasAccess) {
      fetchDistributions();
    }
  }, [currentPage, filters, accessError, userProfile?.councilId, userProfile?.hasAccess, selectedCouncilId]);

  function resolveEffectiveCouncilId(
    options?: { councilId?: number | null; profile?: any }
  ): number | null {
    if (options && Object.prototype.hasOwnProperty.call(options, "councilId")) {
      return options.councilId ?? null;
    }

    const profile = options?.profile ?? userProfile;

    if (typeof profile?.councilId === "number") {
      return profile.councilId;
    }

    if (typeof selectedCouncilId === "number") {
      return selectedCouncilId;
    }

    return null;
  }

  const fetchDistributionKPIs = async (
    options?: { councilId?: number | null; profile?: any }
  ) => {
    try {
      // Since there's no specific distribution KPIs endpoint yet, we'll calculate from distribution data
      const effectiveCouncilId = resolveEffectiveCouncilId(options);
      const kpiFilters = effectiveCouncilId
        ? { localCouncilId: effectiveCouncilId }
        : {};
      const response = await distributionsApi.getDistributions(1, 100, kpiFilters);

      if (response.success && response.data) {
        const allDistributions = response.data.distributions || [];

        const totalDistributions = allDistributions.length;
        const totalSchoolsServed = new Set(
          allDistributions.map((d: any) => d.schoolId)
        ).size;
        const totalItemsDistributed = allDistributions.reduce(
          (sum: number, d: any) => sum + (d.totalQuantity || 0),
          0
        );

        // Calculate dynamic average delivery time
        const distributionsWithDeliveryTime = allDistributions.filter((d: any) => {
          return d.distributionDate && d.confirmationDate && 
                 d.status === 'CONFIRMED' && 
                 new Date(d.confirmationDate) > new Date(d.distributionDate);
        });

        let averageDeliveryTime = 0;
        if (distributionsWithDeliveryTime.length > 0) {
          const totalDeliveryTime = distributionsWithDeliveryTime.reduce((sum: number, d: any) => {
            const distributionDate = new Date(d.distributionDate);
            const confirmationDate = new Date(d.confirmationDate);
            const deliveryTimeInDays = Math.ceil((confirmationDate.getTime() - distributionDate.getTime()) / (1000 * 60 * 60 * 24));
            return sum + deliveryTimeInDays;
          }, 0);
          averageDeliveryTime = totalDeliveryTime / distributionsWithDeliveryTime.length;
        }

        // Fix the status filtering to match actual distribution statuses
        const confirmedDistributions = allDistributions.filter(
          (d: any) => d.status === "CONFIRMED" || d.status === "confirmed"
        ).length;
        const sentDistributions = allDistributions.filter(
          (d: any) => d.status === "SENT" || d.status === "sent"
        ).length;
        const createdDistributions = allDistributions.filter(
          (d: any) => d.status === "CREATED" || d.status === "created"
        ).length;

        // Calculate success rate based on confirmed distributions
        const distributionSuccessRate = totalDistributions > 0
          ? (confirmedDistributions / totalDistributions) * 100
          : 0;

        // Get the most recent distribution date (sort by date descending)
        const sortedDistributions = allDistributions
          .filter((d: any) => d.distributionDate)
          .sort((a: any, b: any) => new Date(b.distributionDate).getTime() - new Date(a.distributionDate).getTime());

        const lastDistributionDate = sortedDistributions.length > 0
          ? new Date(sortedDistributions[0].distributionDate)
          : null;

        const kpis: DistributionKPIs = {
          totalDistributions,
          pendingDistributions: createdDistributions + sentDistributions, // Created and Sent are pending confirmation
          completedDistributions: confirmedDistributions,
          totalSchoolsServed,
          totalItemsDistributed,
          averageDeliveryTime: Math.round(averageDeliveryTime * 10) / 10, // Round to 1 decimal
          distributionSuccessRate,
          lastDistributionDate,
        };

        setKpiData(kpis);
      }
    } catch (error) {
      console.error("Error fetching distribution KPIs:", error);
    }
  };

  const fetchDistributions = async (
    options?: { councilId?: number | null; profile?: any; page?: number }
  ) => {
    try {
      setLoading(true);
      const effectiveCouncilId = resolveEffectiveCouncilId(options);
      const apiFilters = { ...filters } as Record<string, unknown>;
      if (effectiveCouncilId) {
        apiFilters.localCouncilId = effectiveCouncilId;
      } else {
        delete apiFilters.localCouncilId;
      }
      const pageToUse = options?.page ?? currentPage;
      const response = await distributionsApi.getDistributions(
        pageToUse,
        pageSize,
        apiFilters
      );

      if (response.success && response.data) {
        setDistributions(response.data.distributions || []);
        setTotalCount(response.data.total || 0);
      } else {
        toast.error("Failed to fetch distributions");
      }
    } catch (error) {
      console.error("Error fetching distributions:", error);
      toast.error("Error loading distributions");
    } finally {
      setLoading(false);
    }
  };

  // Handle council selection for Super Admins and DEO users
  const handleCouncilSelection = async (councilId: string) => {
    if (councilId === "ALL") {
      setSelectedCouncilId(null);
      setCurrentPage(1);
      setKpiLoading(true);

      try {
        await fetchDistributionKPIs({ councilId: null });
      } catch (error: any) {
        console.error('Error fetching aggregate distribution data:', error);
      } finally {
        setKpiLoading(false);
      }
      return;
    }

    const councilIdNum = parseInt(councilId);
    if (isNaN(councilIdNum)) return;

    setSelectedCouncilId(councilIdNum);
    setCurrentPage(1);
    setKpiLoading(true);

    try {
      await fetchDistributionKPIs({ councilId: councilIdNum });
    } catch (error: any) {
      console.error('Error fetching council distribution data:', error);
    } finally {
      setKpiLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: DistributionFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    // Switch to distributions tab when filters are applied
    if (activeTab !== "distributions") {
      setActiveTab("distributions");
    }
  };

  const handleDistributionCreated = async (distributionData: any) => {
    try {
      // Create the distribution via API
      const response = await distributionsApi.createDistribution(
        distributionData
      );

      if (response.success) {
        setShowCreateForm(false);
        setSelectedSchool(null);
        fetchDistributions();
        fetchDistributionKPIs();
        setActiveTab("distributions");
        toast.success("Distribution created successfully");
      } else {
        toast.error(response.error?.message || "Failed to create distribution");
      }
    } catch (error) {
      console.error("Error creating distribution:", error);
      toast.error("Failed to create distribution");
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "No distributions yet";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatAverageDeliveryTime = (averageTime: number) => {
    if (averageTime === 0) return "N/A";
    return `${averageTime} days`;
  };

  const formatSuccessRate = (rate: number, total: number) => {
    if (total === 0) return "N/A";
    return `${rate.toFixed(0)}%`;
  };

  if (accessError) {
    return (
      <div className={className}>
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-0 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Distribution Management
            </h1>
            <p className="text-sm lg:text-base text-muted-foreground">
              Manage and track educational material distributions to schools
            </p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{accessError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-0 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Distribution Management
          </h1>
          <p className="text-sm lg:text-base text-muted-foreground">
            Manage and track educational material distributions to schools
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <ExportButton 
            onExport={exportData}
            isExporting={isExporting}
            disabled={!user?.role || (user.role !== 'lc_officer' && user.role !== 'super_admin')}
            tooltip={user?.role === 'lc_officer' || user?.role === 'super_admin' 
              ? `Export distribution data${Object.keys(filters).length > 0 ? ' (with current filters)' : ''}` 
              : "Export not available for your role"
            }
            showProgress={true}
            className="w-full sm:w-auto"
          />
          <Button
            onClick={() => {
              if (userProfile?.role === "District Education Officer" && userProfile?.canSelectCouncil && !resolveEffectiveCouncilId()) {
                toast.warning("Please select a council first to create distributions for schools in that council.");
                return;
              }
              setActiveTab("create");
              setSelectedSchool(null); // Reset any previously selected school
              setShowCreateForm(false);
            }}
            className="bg-[#007A33] hover:bg-[#005A25] w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isMobile ? 'New' : 'New Distribution'}
          </Button>
        </div>
      </div>

      {/* Export Status */}
      <ExportStatus 
        isExporting={isExporting}
        error={exportError}
        lastExportCount={lastExportCount}
        onRetry={exportData}
        onReset={resetExport}
        compact={true}
      />

      {/* Council selector and district display for DEO */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center gap-3">
          {userDistrict && userProfile?.role === "District Education Officer" && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">District: {userDistrict}</span>
            </div>
          )}
          {!accessError && userProfile?.canSelectCouncil && (
            <div className="flex items-center gap-3">
              <div className="min-w-[260px]">
                <Select
                  value={selectedCouncilId?.toString() || "ALL"}
                  onValueChange={handleCouncilSelection}
                  disabled={councilsLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        councilsLoading
                          ? "Loading councils..."
                          : userProfile?.role === "District Education Officer"
                          ? "Select a district council"
                          : "Select a council"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">
                      <div className="flex flex-col">
                        <span>
                          {userProfile?.role === "District Education Officer"
                            ? "All District Councils"
                            : "All Councils"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {userProfile?.role === "District Education Officer"
                            ? "View district-wide data"
                            : "View aggregate data"}
                        </span>
                      </div>
                    </SelectItem>
                    {councils.map((council) => (
                      <SelectItem key={council.id} value={council.id.toString()}>
                        <div className="flex flex-col">
                          <span>{council.name}</span>
                          {council.code && (
                            <span className="text-xs text-muted-foreground">{council.code}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-3' : isTablet ? 'grid-cols-4' : 'grid-cols-4'}`}>
          <TabsTrigger value="overview" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
            <Package className="h-3 w-3 lg:h-4 lg:w-4" />
            {isMobile ? 'Info' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger
            value="distributions"
            className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm"
          >
            <ClipboardList className="h-3 w-3 lg:h-4 lg:w-4" />
            {isMobile ? 'List' : 'Distributions'}
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
            <Plus className="h-3 w-3 lg:h-4 lg:w-4" />
            Create
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
            <FileText className="h-3 w-3 lg:h-4 lg:w-4" />
            {isMobile ? 'Filter' : 'Search & Filter'}
          </TabsTrigger>
          {false && !isMobile && (
            <TabsTrigger value="planning" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
              <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4" />
              {isTablet ? 'Plan' : 'Planning'}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Distribution KPIs */}
          {kpiLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            kpiData && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs lg:text-sm font-medium">
                      {isMobile ? 'Total' : 'Total Distributions'}
                    </CardTitle>
                    <Package className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg lg:text-2xl font-bold">
                      {kpiData.totalDistributions}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {kpiData.pendingDistributions} pending
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs lg:text-sm font-medium">
                      {isMobile ? 'Schools' : 'Schools Served'}
                    </CardTitle>
                    <School className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg lg:text-2xl font-bold">
                      {kpiData.totalSchoolsServed}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isMobile ? 'Institutions' : 'Educational institutions'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs lg:text-sm font-medium">
                      {isMobile ? 'Items' : 'Items Distributed'}
                    </CardTitle>
                    <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg lg:text-2xl font-bold">
                      {isMobile 
                        ? kpiData.totalItemsDistributed > 1000 
                          ? `${(kpiData.totalItemsDistributed / 1000).toFixed(1)}k`
                          : kpiData.totalItemsDistributed.toString()
                        : kpiData.totalItemsDistributed.toLocaleString()
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isMobile ? 'Materials' : 'Educational materials'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs lg:text-sm font-medium">
                      {isMobile ? 'Success' : 'Success Rate'}
                    </CardTitle>
                    <CheckCircle className="h-3 w-3 lg:h-4 lg:w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg lg:text-2xl font-bold text-green-600">
                      {formatSuccessRate(kpiData.distributionSuccessRate, kpiData.totalDistributions)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isMobile ? 'Completion' : 'Distribution completion'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )
          )}

          {/* Recent Distributions Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Recent Distribution Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {kpiData && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">
                        Latest Distribution
                      </h4>
                      <p className="text-lg lg:text-2xl font-bold">
                        {formatDate(kpiData.lastDistributionDate)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">
                        Average Delivery Time
                      </h4>
                      <p className="text-lg lg:text-2xl font-bold">
                        {formatAverageDeliveryTime(kpiData.averageDeliveryTime)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Completion Rate</h4>
                      <p className="text-lg lg:text-2xl font-bold text-green-600">
                        {formatSuccessRate(kpiData.distributionSuccessRate, kpiData.totalDistributions)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distributions" className="space-y-6">
          {/* Quick Search Bar */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Quick search by distribution number, school name..."
                    value={filters.search || ""}
                    onChange={(e) => {
                      const newFilters = { ...filters, search: e.target.value };
                      handleFiltersChange(newFilters);
                    }}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Select
                    value={filters.status || "ALL"}
                    onValueChange={(value) => {
                      const newFilters = { ...filters, status: value === "ALL" ? undefined : value as any };
                      handleFiltersChange(newFilters);
                    }}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="CREATED">Created</SelectItem>
                      <SelectItem value="SENT">Sent</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                      <SelectItem value="DISCREPANCY">Discrepancy</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("search")}
                    className="whitespace-nowrap"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {isMobile ? 'More' : 'Advanced Filter'}
                  </Button>
                  {(filters.search || filters.status) && (
                    <Button
                      variant="ghost"
                      onClick={() => handleFiltersChange({})}
                      className="whitespace-nowrap"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {isMobile ? 'Clear' : 'Clear Filters'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Distribution Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DistributionTable
                distributions={distributions}
                loading={loading}
                currentPage={currentPage}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                userRole={(user?.role as UserRole) || "view_only"}
                onViewDetails={(id) => {
                  const params = new URLSearchParams();
                  params.set("from", "/councils/distributions");
                  params.set("page", currentPage.toString());
                  // Preserve active filters
                  Object.entries(filters).forEach(([k, v]) => {
                    if (v !== undefined && v !== null && v !== "") {
                      params.set(k, String(v));
                    }
                  });
                  router.push(`/distributions/${id}?${params.toString()}`);
                }}
                onMarkSent={async (distribution) => {
                  try {
                    const res = await distributionsApi.markDistributionAsSent(
                      distribution.id
                    );
                    if (res.success) {
                      const receiptNum = (res as any).meta?.schoolReceiptNumber;
                      toast.success(
                        receiptNum
                          ? `Distribution marked as SENT. Receipt ${receiptNum} created.`
                          : "Distribution marked as SENT. School receipt created."
                      );
                      fetchDistributions();
                      fetchDistributionKPIs();
                    } else {
                      toast.error(
                        res.error?.message || "Failed to mark as sent"
                      );
                    }
                  } catch (err) {
                    console.error("Error marking distribution as sent", err);
                    toast.error("Error marking distribution as sent");
                  }
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          {userProfile?.role === "District Education Officer" && userProfile?.canSelectCouncil && !resolveEffectiveCouncilId() ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please select a council from the dropdown above to create distributions for schools in that council.
              </AlertDescription>
            </Alert>
          ) : !selectedSchool ? (
            <SchoolsForDistributions
              onSelectSchool={(school) => {
                setSelectedSchool(school);
                setShowSchoolSelection(false);
                setShowCreateForm(true);
              }}
              councilId={resolveEffectiveCouncilId()}
              className="w-full"
            />
          ) : (
            <div className="space-y-6">
              {/* Selected School Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Create Distribution for {selectedSchool.name}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSchool(null);
                        setShowCreateForm(false);
                      }}
                    >
                      Change School
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">School Type</div>
                      <div className="font-medium">
                        {selectedSchool.schoolType || "PRIMARY"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Location</div>
                      <div className="font-medium">
                        {selectedSchool.address}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Local Council</div>
                      <div className="font-medium">
                        {selectedSchool.localCouncilName || "Not specified"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Distribution Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Distribution Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DistributionCreateForm
                    onSubmit={handleDistributionCreated}
                    councilId={selectedSchool.localCouncilId}
                    preSelectedSchool={selectedSchool}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {false && (
          <TabsContent value="planning" className="space-y-6">
            {/* <DistributionPlanningTools councilId={user?.localCouncilId} /> */}
          </TabsContent>
        )}

        <TabsContent value="search" className="space-y-6">
          <DistributionSearch
            onFiltersChange={handleFiltersChange}
            initialFilters={filters}
            userRole={(user?.role as UserRole) || "view_only"}
            councilId={userProfile?.councilId || selectedCouncilId || user?.localCouncilId}
            schoolId={user?.schoolId}
            className="mb-6"
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Distribution Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Status Distribution</h4>
                    {kpiData && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Completed</span>
                          <Badge variant="default" className="bg-green-600">
                            {kpiData.completedDistributions}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Pending</span>
                          <Badge variant="secondary">
                            {kpiData.pendingDistributions}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Performance Metrics</h4>
                    {kpiData && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Success Rate</span>
                          <span className="font-medium text-green-600">
                            {formatSuccessRate(kpiData.distributionSuccessRate, kpiData.totalDistributions)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Avg. Delivery</span>
                          <span className="font-medium">
                            {formatAverageDeliveryTime(kpiData.averageDeliveryTime)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
