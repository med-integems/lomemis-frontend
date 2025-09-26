"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Package, Menu, Search, FileText } from "lucide-react";
import { useResponsive } from "@/hooks/useResponsive";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DistributionTable } from "./distribution-table";
import { DistributionCreateForm } from "./distribution-create-form";
import { DistributionSearch } from "./distribution-search";
import { SchoolConfirmationDialog } from "./school-confirmation-dialog";
import { DistributionTracking } from "./distribution-tracking";
import { DistributionDiscrepancyResolutionDialog } from "./distribution-discrepancy-resolution-dialog";
import { distributionsApi } from "@/lib/api";
import { useFilteredExport, ExportButton, ExportStatus } from "@/components/export";
import {
  DistributionWithDetails,
  DistributionFilters,
  PaginatedResponse,
  UserRole,
} from "@/types";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";

export function DistributionManagement() {
  const { user } = useUser();
  const { deviceType, isMobile, isTouchDevice } = useResponsive();
  const [distributions, setDistributions] = useState<DistributionWithDetails[]>(
    []
  );
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<DistributionFilters>({});
  const [activeTab, setActiveTab] = useState("list");
  const [selectedDistribution, setSelectedDistribution] =
    useState<DistributionWithDetails | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedDistributionForTracking, setSelectedDistributionForTracking] =
    useState<number | null>(null);
  const [
    selectedDistributionForDiscrepancy,
    setSelectedDistributionForDiscrepancy,
  ] = useState<any>(null);

  const pageSize = 10;

  useEffect(() => {
    fetchDistributions();
  }, [currentPage, filters]);

  const fetchDistributions = async () => {
    try {
      setLoading(true);
      let response: PaginatedResponse<DistributionWithDetails>;

      if (user?.role === "lc_officer" && user.councilId) {
        response = await distributionsApi.getDistributionsByCouncil(
          user.councilId,
          currentPage,
          pageSize,
          filters
        ) as unknown as PaginatedResponse<DistributionWithDetails>;
      } else if (user?.role === "school_rep" && user.schoolId) {
        response = await distributionsApi.getDistributionsBySchool(
          user.schoolId,
          currentPage,
          pageSize,
          filters
        ) as unknown as PaginatedResponse<DistributionWithDetails>;
      } else {
        response = await distributionsApi.getDistributions(
          currentPage,
          pageSize,
          filters
        ) as unknown as PaginatedResponse<DistributionWithDetails>;
      }

      setDistributions(response.distributions || []);
      setTotalCount(response.total);
    } catch (error) {
      console.error("Error fetching distributions:", error);
      toast.error("Failed to load distributions");
    } finally {
      setLoading(false);
    }
  };

  // Distribution export functionality with role-based API selection
  const { exportData, isExporting, error: exportError, lastExportCount, reset: resetExport } = useFilteredExport({
    apiCall: async (params) => {
      const maxRecords = params?.maxRecords || 1000;
      const exportFilters = { ...filters, ...params?.filters };

      // Use appropriate API based on user role
      if (user?.role === "lc_officer" && user.councilId) {
        return distributionsApi.getDistributionsByCouncil(
          user.councilId,
          1,
          maxRecords,
          exportFilters
        );
      } else if (user?.role === "school_rep" && user.schoolId) {
        return distributionsApi.getDistributionsBySchool(
          user.schoolId,
          1,
          maxRecords,
          exportFilters
        );
      } else {
        return distributionsApi.getDistributions(
          1,
          maxRecords,
          exportFilters
        );
      }
    },
    getCurrentFilters: () => filters,
    applyFilters: (data: any[], currentFilters: any) => {
      return data.filter((distribution: any) => {
        // Apply filters client-side if needed
        const matchesStatus = !currentFilters.status || distribution.status === currentFilters.status;
        const matchesCouncil = !currentFilters.councilId || distribution.councilId === currentFilters.councilId;
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
      "Delivery Date",
      "Created By",
      "Created Date",
      "Confirmation Status",
      "Recipient Name"
    ],
    dataTransform: (distributions) => distributions.map((dist: any) => [
      dist.distributionNumber || `DIST-${dist.id}`,
      dist.councilName || '',
      dist.schoolName || '',
      dist.status,
      dist.totalItems?.toString() || '0',
      dist.distributionDate ? new Date(dist.distributionDate).toLocaleDateString() : '',
      dist.deliveryDate ? new Date(dist.deliveryDate).toLocaleDateString() : '',
      dist.createdByName || '',
      dist.createdAt ? new Date(dist.createdAt).toLocaleDateString() : '',
      dist.isConfirmed ? 'Confirmed' : 'Pending',
      dist.recipientName || ''
    ]),
    filename: () => {
      const rolePrefix = user?.role === 'lc_officer' ? 'council' : 
                        user?.role === 'school_rep' ? 'school' : 'all';
      return `distributions-${rolePrefix}-${new Date().toISOString().split('T')[0]}.csv`;
    },
    maxRecords: 1000
  });

  const handleCreateDistribution = async (distributionData: any) => {
    try {
      await distributionsApi.createDistribution(distributionData);
      toast.success("Distribution created successfully");
      setActiveTab("list");
      fetchDistributions();
    } catch (error) {
      console.error("Error creating distribution:", error);
      toast.error("Failed to create distribution");
      throw error;
    }
  };

  const handleConfirmReceipt = (distribution: DistributionWithDetails) => {
    setSelectedDistribution(distribution);
    setShowConfirmDialog(true);
  };

  const handleConfirmReceiptSubmit = async (confirmationData: any) => {
    if (!selectedDistribution) return;

    try {
      await distributionsApi.confirmDistributionReceipt(
        selectedDistribution.id,
        confirmationData
      );
      toast.success("Distribution receipt confirmed successfully");
      setShowConfirmDialog(false);
      setSelectedDistribution(null);
      fetchDistributions();
    } catch (error) {
      console.error("Error confirming distribution receipt:", error);
      toast.error("Failed to confirm distribution receipt");
      throw error;
    }
  };

  const handleSearch = (searchFilters: DistributionFilters) => {
    setFilters(searchFilters);
    setCurrentPage(1);
  };

  const handleViewDetails = (distributionId: number) => {
    setSelectedDistributionForTracking(distributionId);
    setActiveTab("tracking");
  };

  const handleResolveDiscrepancy = (distribution: any) => {
    setSelectedDistributionForDiscrepancy(distribution);
  };

  const handleDiscrepancyResolved = () => {
    setSelectedDistributionForDiscrepancy(null);
    fetchDistributions();
  };

  const canCreateDistribution = user?.role === "lc_officer";
  const canConfirmReceipt = user?.role === "school_rep";

  // Mobile Actions Sheet
  const MobileActionsSheet = () => (
    <Sheet open={mobileActionsOpen} onOpenChange={setMobileActionsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[60vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Distribution Actions</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <ExportButton 
            onExport={exportData}
            isExporting={isExporting}
            disabled={!user?.role || (user.role !== 'lc_officer' && user.role !== 'school_rep' && user.role !== 'super_admin')}
            tooltip={user?.role === 'lc_officer' || user?.role === 'school_rep' || user?.role === 'super_admin' 
              ? `Export distribution data${Object.keys(filters).length > 0 ? ' (with current filters)' : ''}` 
              : "Export not available for your role"
            }
            showProgress={true}
            className="w-full justify-start"
          />
          {canCreateDistribution && (
            <Button
              onClick={() => {
                setActiveTab("create");
                setMobileActionsOpen(false);
              }}
              className="w-full justify-start bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Distribution
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className={cn(
      "space-y-6",
      deviceType === "mobile" && "space-y-4"
    )}>
      <div className={cn(
        "flex justify-between items-start",
        deviceType === "mobile" && "flex-col space-y-4 items-start"
      )}>
        <div className={cn(
          deviceType === "mobile" && "w-full"
        )}>
          <h1 className={cn(
            "font-bold text-foreground",
            deviceType === "mobile" ? "text-xl" : "text-3xl"
          )}>
            {deviceType === "mobile" ? "Distributions" : "Distribution Management"}
          </h1>
          <p className={cn(
            "text-muted-foreground",
            deviceType === "mobile" ? "text-sm" : "text-base"
          )}>
            {deviceType === "mobile" 
              ? "Manage distributions to schools"
              : "Manage distributions from local councils to schools"
            }
          </p>
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-2">
          <ExportButton 
            onExport={exportData}
            isExporting={isExporting}
            disabled={!user?.role || (user.role !== 'lc_officer' && user.role !== 'school_rep' && user.role !== 'super_admin')}
            tooltip={user?.role === 'lc_officer' || user?.role === 'school_rep' || user?.role === 'super_admin' 
              ? `Export distribution data${Object.keys(filters).length > 0 ? ' (with current filters)' : ''}` 
              : "Export not available for your role"
            }
            showProgress={true}
          />
          {canCreateDistribution && (
            <Button
              onClick={() => setActiveTab("create")}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Distribution
            </Button>
          )}
        </div>
        
        {/* Mobile Actions */}
        <MobileActionsSheet />
      </div>

      {/* Export Status */}
      <ExportStatus 
        isExporting={isExporting}
        error={exportError}
        lastExportCount={lastExportCount}
        onRetry={exportData}
        onReset={resetExport}
        compact={deviceType === "mobile"}
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className={cn(
          "grid w-full",
          deviceType === "mobile" 
            ? "grid-cols-2 h-auto" 
            : canCreateDistribution ? "grid-cols-4" : "grid-cols-3"
        )}>
          {deviceType === "mobile" ? (
            // Mobile: Show only essential tabs
            <>
              <TabsTrigger value="list" className={cn(
                "flex items-center gap-2 py-3 text-sm justify-center"
              )}>
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Distributions</span>
                <span className="sm:hidden">List</span>
              </TabsTrigger>
              {canCreateDistribution ? (
                <TabsTrigger value="create" className={cn(
                  "flex items-center gap-2 py-3 text-sm justify-center"
                )}>
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Create</span>
                  <span className="sm:hidden">New</span>
                </TabsTrigger>
              ) : (
                <TabsTrigger value="search" className={cn(
                  "flex items-center gap-2 py-3 text-sm justify-center"
                )}>
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Search</span>
                  <span className="sm:hidden">Find</span>
                </TabsTrigger>
              )}
            </>
          ) : (
            // Desktop: Show all tabs
            <>
              <TabsTrigger value="list">Distribution List</TabsTrigger>
              <TabsTrigger value="search">Search & Filter</TabsTrigger>
              <TabsTrigger value="tracking">Tracking</TabsTrigger>
              {canCreateDistribution && (
                <TabsTrigger value="create">Create Distribution</TabsTrigger>
              )}
            </>
          )}
        </TabsList>
        
        {/* Mobile Secondary Navigation */}
        {deviceType === "mobile" && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={activeTab === "search" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("search")}
              className="flex-shrink-0"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button
              variant={activeTab === "tracking" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("tracking")}
              className="flex-shrink-0"
            >
              <FileText className="h-4 w-4 mr-2" />
              Tracking
            </Button>
          </div>
        )}

        <TabsContent value="list" className="space-y-4">
          <DistributionTable
            distributions={distributions}
            loading={loading}
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onConfirmReceipt={
              canConfirmReceipt ? handleConfirmReceipt : undefined
            }
            onViewDetails={handleViewDetails}
            onResolveDiscrepancy={handleResolveDiscrepancy}
            userRole={user?.role as UserRole}
          />
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <DistributionSearch
            onSearch={handleSearch}
            currentFilters={filters}
            userRole={user?.role as UserRole}
            councilId={user?.councilId}
            schoolId={user?.schoolId}
          />
        </TabsContent>

        <TabsContent value="tracking" className="space-y-4">
          {selectedDistributionForTracking ? (
            <DistributionTracking
              distributionId={selectedDistributionForTracking}
              onStatusUpdate={fetchDistributions}
            />
          ) : (
            <div className={cn(
              "text-center",
              deviceType === "mobile" ? "py-8" : "py-12"
            )}>
              <Package className={cn(
                "mx-auto text-muted-foreground mb-4",
                deviceType === "mobile" ? "h-8 w-8" : "h-12 w-12"
              )} />
              <h3 className={cn(
                "font-medium text-foreground mb-2",
                deviceType === "mobile" ? "text-base" : "text-lg"
              )}>
                No Distribution Selected
              </h3>
              <p className={cn(
                "text-muted-foreground",
                deviceType === "mobile" ? "text-sm" : "text-base"
              )}>
                {deviceType === "mobile"
                  ? "Select a distribution to view tracking details"
                  : "Click \"View\" on any distribution to see detailed tracking information"
                }
              </p>
            </div>
          )}
        </TabsContent>

        {canCreateDistribution && (
          <TabsContent value="create" className="space-y-4">
            <DistributionCreateForm
              onSubmit={handleCreateDistribution}
              councilId={user?.councilId}
            />
          </TabsContent>
        )}
      </Tabs>

      {showConfirmDialog && selectedDistribution && (
        <SchoolConfirmationDialog
          distribution={selectedDistribution}
          onConfirm={handleConfirmReceiptSubmit}
          onClose={() => {
            setShowConfirmDialog(false);
            setSelectedDistribution(null);
          }}
        />
      )}

      {selectedDistributionForDiscrepancy && (
        <DistributionDiscrepancyResolutionDialog
          distribution={selectedDistributionForDiscrepancy}
          isOpen={true}
          onClose={() => setSelectedDistributionForDiscrepancy(null)}
          onResolved={handleDiscrepancyResolved}
        />
      )}
    </div>
  );
}
