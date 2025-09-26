"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package, FileText, Search, CheckCircle, Menu } from "lucide-react";
import { useResponsive } from "@/hooks/useResponsive";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShipmentTable } from "./shipment-table";
import { ShipmentCreateForm } from "./shipment-create-form";
import { ShipmentSearch } from "./shipment-search";
import { ShipmentTracking } from "./shipment-tracking";
import { DiscrepancyResolutionDialog } from "./discrepancy-resolution-dialog";
import { ShipmentFilters } from "@/types";
import { useFilteredExport, ExportButton, ExportStatus } from "@/components/export";
import { shipmentsApi } from "@/lib/api";
import { useUser } from "@/hooks/useUser";
import { usePermissions } from "@/hooks/usePermissions";
import { ScopeIndicator } from "@/components/ui/scope-indicator";

interface ShipmentManagementProps {
  className?: string;
}

export function ShipmentManagement({ className }: ShipmentManagementProps) {
  const { user } = useUser();
  const { deviceType, isMobile, isTouchDevice } = useResponsive();
  const { isDistrictOfficer } = usePermissions();
  const [activeTab, setActiveTab] = useState("list");
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  // Apply role-based default filters
  const getDefaultFilters = (): ShipmentFilters => {
    if (!user) return {};

    // District Officers see only shipments to councils in their district
    if (user.role === "district_officer" && user.district) {
      return { district: user.district };
    }

    // LC Officers see only shipments to their council
    if (user.role === "lc_officer" && user.localCouncilId) {
      return { destinationCouncilId: user.localCouncilId };
    }

    // National managers see shipments from their warehouse
    if (user.role === "national_manager" && user.warehouseId) {
      return { originWarehouseId: user.warehouseId };
    }

    return {};
  };

  const [filters, setFilters] = useState<ShipmentFilters>(getDefaultFilters());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedShipmentForTracking, setSelectedShipmentForTracking] =
    useState<number | null>(null);
  const [selectedShipmentForDiscrepancy, setSelectedShipmentForDiscrepancy] =
    useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Shipment export functionality with filtering integration
  const { exportData, isExporting, error: exportError, lastExportCount, reset: resetExport } = useFilteredExport({
    includeFiltersInAPI: true,
    apiCall: async (params) => {
      console.log('Export API call with filters:', { ...filters, ...params?.filters }); // Debug log
      const result = await shipmentsApi.getShipments(
        1,
        params?.maxRecords || 1000,
        { ...filters, ...params?.filters }
      );
      console.log('Export API result:', result); // Debug log
      
      // Extract shipments from the nested response structure
      const shipments = result.success && result.data ? result.data.shipments : [];
      console.log('Extracted shipments for export:', shipments); // Debug log
      return shipments;
    },
    getCurrentFilters: () => filters,
    applyFilters: (data, currentFilters) => {
      // Backend API handles all filtering via includeFiltersInAPI: true
      // No additional client-side filtering needed
      return data;
    },
    headers: [
      "Shipment Number",
      "Origin Warehouse", 
      "Destination Council",
      "Status",
      "Item Types",
      "Total Items",
      "Total Qty Shipped",
      "Total Qty Received",
      "Item Names",
      "Dispatch Date",
      "Expected Arrival",
      "Actual Arrival",
      "Dispatched By",
      "Received By",
      "Created By",
      "Created Date",
      "Updated Date",
      "Discrepancy Notes"
    ],
    dataTransform: (shipments) => {
      console.log('Export shipments data:', shipments); // Debug log
      return shipments.map((shipment: any) => [
        shipment.shipmentNumber || '',
        shipment.originWarehouseName || '',
        shipment.destinationCouncilName || '',
        shipment.status || '',
        shipment.itemTypesCount != null ? String(shipment.itemTypesCount) : '',
        shipment.totalItems?.toString() || '0',
        shipment.totalQuantityShipped != null ? String(shipment.totalQuantityShipped) : '',
        shipment.totalQuantityReceived != null ? String(shipment.totalQuantityReceived) : '',
        shipment.itemNames || '',
        shipment.dispatchDate ? new Date(shipment.dispatchDate).toLocaleDateString() : '',
        shipment.expectedArrivalDate ? new Date(shipment.expectedArrivalDate).toLocaleDateString() : '',
        shipment.actualArrivalDate ? new Date(shipment.actualArrivalDate).toLocaleDateString() : '',
        shipment.dispatchedByName || '',
        shipment.receivedByName || '',
        shipment.createdByName || '',
        shipment.createdAt ? new Date(shipment.createdAt).toLocaleDateString() : '',
        shipment.updatedAt ? new Date(shipment.updatedAt).toLocaleDateString() : '',
        shipment.discrepancyNotes || ''
      ]);
    },
    filename: `shipments-${new Date().toISOString().split('T')[0]}.csv`,
    maxRecords: 1000
  });

  const handleFiltersChange = (newFilters: ShipmentFilters) => {
    setFilters(newFilters);
    // Switch to list tab when filters are applied
    if (activeTab !== "list") {
      setActiveTab("list");
    }
  };

  const handleCreateShipment = () => {
    setShowCreateForm(true);
    setActiveTab("create");
  };

  const handleShipmentCreated = () => {
    setShowCreateForm(false);
    setActiveTab("list");
    // Refresh the shipment list by clearing and reapplying filters
    setFilters({ ...filters });
  };


  const handleViewDetails = (shipmentId: number) => {
    setSelectedShipmentForTracking(shipmentId);
    setActiveTab("tracking");
  };

  const handleResolveDiscrepancy = (shipment: any) => {
    setSelectedShipmentForDiscrepancy(shipment);
  };

  const handleDiscrepancyResolved = () => {
    setSelectedShipmentForDiscrepancy(null);
    // Force refresh the shipment list
    setRefreshTrigger(prev => prev + 1);
  };

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
          <SheetTitle>Shipment Actions</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <ExportButton 
            onExport={exportData}
            isExporting={isExporting}
            disabled={user?.role !== 'national_warehouse_manager' && user?.role !== 'national_manager' && user?.role !== 'super_admin'}
            tooltip={user?.role === 'national_warehouse_manager' || user?.role === 'national_manager' || user?.role === 'super_admin' 
              ? `Export shipment data${Object.keys(filters).length > 0 ? ' (with current filters)' : ''}` 
              : "Export not available for your role"
            }
            showProgress={true}
            className="w-full justify-start"
          />
          <Button
            onClick={() => {
              handleCreateShipment();
              setMobileActionsOpen(false);
            }}
            className="w-full justify-start bg-[#007A33] hover:bg-[#005A25]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Shipment
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className={className}>
      <div className={cn(
        "flex justify-between items-center mb-6",
        deviceType === "mobile" && "flex-col space-y-4 items-start"
      )}>
        <div className={cn(
          deviceType === "mobile" && "w-full"
        )}>
          <h1 className={cn(
            "font-bold text-foreground",
            deviceType === "mobile" ? "text-xl" : "text-3xl"
          )}>
            {deviceType === "mobile" ? "Shipments" : "Shipment Management"}
          </h1>
          <p className={cn(
            "text-muted-foreground",
            deviceType === "mobile" ? "text-sm" : "text-base"
          )}>
            {deviceType === "mobile" 
              ? "Create, dispatch, and track shipments to local councils."
              : "Create, dispatch, and track shipments from national warehouses to local councils. Local councils confirm receipt on their dedicated page."
            }
          </p>
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-2">
          <ExportButton 
            onExport={exportData}
            isExporting={isExporting}
            disabled={user?.role !== 'national_warehouse_manager' && user?.role !== 'national_manager' && user?.role !== 'super_admin'}
            tooltip={user?.role === 'national_warehouse_manager' || user?.role === 'national_manager' || user?.role === 'super_admin' 
              ? `Export shipment data${Object.keys(filters).length > 0 ? ' (with current filters)' : ''}` 
              : "Export not available for your role"
            }
            showProgress={true}
          />
          <Button
            onClick={handleCreateShipment}
            className="bg-[#007A33] hover:bg-[#005A25]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Shipment
          </Button>
        </div>
        
        {/* Mobile Actions */}
        <MobileActionsSheet />
      </div>

      {/* Scope Indicator */}
      {user?.role === "district_officer" && user.district && (
        <ScopeIndicator
          type="district"
          scopeName={user.district}
          dataType="shipments"
        />
      )}
      {user?.role === "lc_officer" && user.localCouncilId && (
        <ScopeIndicator
          type="council"
          scopeName={`Council ${user.localCouncilId}`}
          dataType="shipments"
        />
      )}
      {user?.role === "national_manager" && user.warehouseId && (
        <ScopeIndicator
          type="warehouse"
          scopeName={`Warehouse ${user.warehouseId}`}
          dataType="shipments"
        />
      )}

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
        className="space-y-6"
      >
        <TabsList className={cn(
          "grid w-full",
          deviceType === "mobile" 
            ? "grid-cols-2 h-auto" 
            : "grid-cols-5"
        )}>
          {deviceType === "mobile" ? (
            // Mobile: Show only essential tabs
            <>
              <TabsTrigger value="list" className={cn(
                "flex items-center gap-2 py-3 text-sm",
                deviceType === "mobile" && "justify-center"
              )}>
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">All Shipments</span>
                <span className="sm:hidden">All</span>
              </TabsTrigger>
              <TabsTrigger value="create" className={cn(
                "flex items-center gap-2 py-3 text-sm",
                deviceType === "mobile" && "justify-center"
              )}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create</span>
                <span className="sm:hidden">New</span>
              </TabsTrigger>
            </>
          ) : (
            // Desktop: Show all tabs
            <>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                All Shipments
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Shipment
              </TabsTrigger>
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search & Filter
              </TabsTrigger>
              <TabsTrigger value="receipts" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                In Transit
              </TabsTrigger>
              <TabsTrigger value="tracking" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Tracking
              </TabsTrigger>
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
              variant={activeTab === "receipts" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("receipts")}
              className="flex-shrink-0"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              In Transit
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

        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardHeader className={cn(
              deviceType === "mobile" && "px-4 py-3"
            )}>
              <CardTitle className={cn(
                "flex items-center gap-2",
                deviceType === "mobile" ? "text-lg" : "text-xl"
              )}>
                <Package className={cn(
                  deviceType === "mobile" ? "h-4 w-4" : "h-5 w-5"
                )} />
                {deviceType === "mobile" ? "Shipments" : "Shipment Tracking"}
              </CardTitle>
            </CardHeader>
            <CardContent className={cn(
              deviceType === "mobile" && "px-4 pb-4"
            )}>
              <p className={cn(
                "text-muted-foreground mb-4",
                deviceType === "mobile" ? "text-sm" : "text-sm"
              )}>
                {deviceType === "mobile"
                  ? "View and track all shipments with status updates."
                  : "View and track all shipments with real-time status updates, dispatch information, and delivery confirmations."
                }
              </p>
              <ShipmentTable
                filters={filters}
                onViewDetails={handleViewDetails}
                onResolveDiscrepancy={handleResolveDiscrepancy}
                refreshTrigger={refreshTrigger}
                className="mt-4"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader className={cn(
              deviceType === "mobile" && "px-4 py-3"
            )}>
              <CardTitle className={cn(
                "flex items-center gap-2",
                deviceType === "mobile" ? "text-lg" : "text-xl"
              )}>
                <Plus className={cn(
                  deviceType === "mobile" ? "h-4 w-4" : "h-5 w-5"
                )} />
                {deviceType === "mobile" ? "New Shipment" : "Create New Shipment"}
              </CardTitle>
            </CardHeader>
            <CardContent className={cn(
              deviceType === "mobile" && "px-4 pb-4"
            )}>
              <p className={cn(
                "text-muted-foreground mb-4",
                deviceType === "mobile" ? "text-sm" : "text-sm"
              )}>
                {deviceType === "mobile"
                  ? "Select destination council and add items from inventory."
                  : "Create a new shipment by selecting a destination council and adding items from available national warehouse inventory."
                }
              </p>
              <ShipmentCreateForm
                onShipmentCreated={handleShipmentCreated}
                onCancel={() => setActiveTab("list")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <ShipmentSearch
            onFiltersChange={handleFiltersChange}
            initialFilters={filters}
            className="mb-6"
          />
        </TabsContent>

        <TabsContent value="receipts" className="space-y-6">
          <Card>
            <CardHeader className={cn(
              deviceType === "mobile" && "px-4 py-3"
            )}>
              <CardTitle className={cn(
                "flex items-center gap-2",
                deviceType === "mobile" ? "text-lg" : "text-xl"
              )}>
                <CheckCircle className={cn(
                  deviceType === "mobile" ? "h-4 w-4" : "h-5 w-5"
                )} />
                {deviceType === "mobile" ? "In Transit" : "Shipments In Transit"}
              </CardTitle>
            </CardHeader>
            <CardContent className={cn(
              deviceType === "mobile" && "px-4 pb-4"
            )}>
              <p className={cn(
                "text-muted-foreground mb-4",
                deviceType === "mobile" ? "text-sm" : "text-sm"
              )}>
                {deviceType === "mobile"
                  ? "Dispatched shipments awaiting council confirmation."
                  : "Shipments that have been dispatched and are currently in transit to local council destinations. Local councils will confirm receipt using their dedicated \"Confirm Receipts\" page."
                }
              </p>
              <ShipmentTable
                filters={{ ...filters, status: "IN_TRANSIT" }}
                onViewDetails={handleViewDetails}
                onResolveDiscrepancy={handleResolveDiscrepancy}
                refreshTrigger={refreshTrigger}
                className="mt-4"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6">
          {selectedShipmentForTracking ? (
            <Card>
              <CardHeader className={cn(
                deviceType === "mobile" && "px-4 py-3"
              )}>
                <CardTitle className={cn(
                  "flex items-center gap-2",
                  deviceType === "mobile" ? "text-lg" : "text-xl"
                )}>
                  <FileText className={cn(
                    deviceType === "mobile" ? "h-4 w-4" : "h-5 w-5"
                  )} />
                  {deviceType === "mobile" ? "Tracking" : "Shipment Tracking"}
                </CardTitle>
              </CardHeader>
              <CardContent className={cn(
                deviceType === "mobile" && "px-4 pb-4"
              )}>
                <ShipmentTracking
                  shipmentId={selectedShipmentForTracking}
                  onStatusUpdate={() => setFilters({ ...filters })}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className={cn(
                "pt-6",
                deviceType === "mobile" && "px-4 py-6"
              )}>
                <div className={cn(
                  "text-center",
                  deviceType === "mobile" ? "py-8" : "py-12"
                )}>
                  <FileText className={cn(
                    "mx-auto text-muted-foreground mb-4",
                    deviceType === "mobile" ? "h-8 w-8" : "h-12 w-12"
                  )} />
                  <h3 className={cn(
                    "font-medium text-foreground mb-2",
                    deviceType === "mobile" ? "text-base" : "text-lg"
                  )}>
                    No Shipment Selected
                  </h3>
                  <p className={cn(
                    "text-muted-foreground",
                    deviceType === "mobile" ? "text-sm" : "text-base"
                  )}>
                    {deviceType === "mobile"
                      ? "Select a shipment to view tracking details"
                      : "Click \"View\" on any shipment to see detailed tracking information"
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>


      {/* Discrepancy Resolution Dialog */}
      {selectedShipmentForDiscrepancy && (
        <DiscrepancyResolutionDialog
          shipment={selectedShipmentForDiscrepancy}
          isOpen={true}
          onClose={() => setSelectedShipmentForDiscrepancy(null)}
          onResolved={handleDiscrepancyResolved}
        />
      )}
    </div>
  );
}
