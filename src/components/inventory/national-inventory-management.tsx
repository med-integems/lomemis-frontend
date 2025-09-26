"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Package, Filter, ArrowLeft, Download, Menu } from "lucide-react";
import { StockReceiptForm } from "./stock-receipt-form";
import { InventoryTable } from "./inventory-table";
import { useFilteredExport, ExportButton, ExportStatus } from "@/components/export";
import { nationalInventoryApi } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { useResponsive } from "@/hooks/useResponsive";
import {
  ResponsiveDashboardLayout,
  DashboardSection,
  ResponsiveDashboardGrid,
  DashboardWidget,
} from "../dashboard/responsive-dashboard-grid";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface NationalInventoryManagementProps {
  className?: string;
}

export function NationalInventoryManagement({
  className,
}: NationalInventoryManagementProps) {
  const { user } = useUser();
  const { deviceType, isMobile, isTouchDevice } = useResponsive();
  const [showStockReceiptForm, setShowStockReceiptForm] = useState(false);
  const [activeTab, setActiveTab] = useState("inventory");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // State for current filters from InventoryTable
  const [currentFilters, setCurrentFilters] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState("");

  // Handle filter changes from InventoryTable
  const handleFiltersChange = (filters: any, search: string) => {
    setCurrentFilters(filters);
    setSearchTerm(search);
  };

  // National inventory export functionality with filtering integration
  const { exportData, isExporting, error: exportError, lastExportCount, reset: resetExport } = useFilteredExport({
    includeFiltersInAPI: true,
    apiCall: async (params) => {
      // Use a reasonable limit that the API accepts - based on other components using 10-100
      const limit = Math.min(params?.maxRecords || 1000, 100); // Max 100 per request to match other components
      const filters = { ...currentFilters, ...params?.filters };
      
      try {
        const result = await nationalInventoryApi.getNationalInventory(1, limit, filters);
        return result;
      } catch (error) {
        console.error('National inventory API call failed:', error);
        throw error;
      }
    },
    getCurrentFilters: () => ({
      ...currentFilters,
      searchTerm
    }),
    applyFilters: (data, filters) => {
      // Backend API handles all filtering via includeFiltersInAPI: true
      // No additional client-side filtering needed
      return data;
    },
    headers: [
      "Item ID",
      "Warehouse ID",
      "Warehouse Location",
      "Item Code", 
      "Item Name",
      "Category",
      "Quantity On Hand",
      "Available Quantity",
      "Reserved Quantity",
      "Unit of Measure",
      "Minimum Stock Level",
      "Last Updated",
      "Condition Status",
      "Estimated Value (Le)",
      "On-hand Value (Le)",
      "Available Value (Le)",
      "Reorder Status",
      "Alert Level",
      "Stock Age (days)",
      "Stock Age Band",
      "Days of Cover",
      "Reorder Gap",
      "Last Receipt Date",
      "Last Issue Date",
      "Receipts 30d",
      "Issues 30d",
      "Created Date",
      "Created By",
      "Updated By"
    ],
    dataTransform: (items) => items.map((item: any) => [
      item.itemId,
      item.warehouseId,
      item.warehouseName || item.locationName || 'National Warehouse',
      item.itemCode,
      item.itemName,
      item.category || item.itemCategory,
      item.quantityOnHand?.toString() || '0',
      item.availableQuantity?.toString() || '0',
      item.reservedQuantity?.toString() || '0',
      item.unitOfMeasure,
      item.minimumStockLevel?.toString() || item.minimumThreshold?.toString() || '',
      item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : 
        item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '',
      item.conditionStatus || item.condition || 'Good',
      item.estimatedValue ? formatCurrency(item.estimatedValue) : '',
      item.onHandValue != null ? formatCurrency(item.onHandValue) : '',
      item.availableValue != null ? formatCurrency(item.availableValue) : '',
      item.reorderStatus || '',
      item.alertLevel || '',
      item.stockAgeDays != null ? String(item.stockAgeDays) : '',
      item.stockAgeBand || '',
      item.daysOfCover != null ? String(item.daysOfCover) : '',
      item.reorderGap != null ? String(item.reorderGap) : '',
      item.lastReceiptDate ? new Date(item.lastReceiptDate).toLocaleDateString() : '',
      item.lastIssueDate ? new Date(item.lastIssueDate).toLocaleDateString() : '',
      item.receipts30d != null ? String(item.receipts30d) : '',
      item.issues30d != null ? String(item.issues30d) : '',
      item.createdDate ? new Date(item.createdDate).toLocaleDateString() : '',
      item.createdByName || '',
      item.updatedByName || ''
    ]),
    filename: `national-inventory-${new Date().toISOString().split('T')[0]}.csv`,
    maxRecords: 100
  });

  const handleStockReceiptSuccess = () => {
    setShowStockReceiptForm(false);
    // Refresh inventory data by switching tabs
    setActiveTab("inventory");
  };

  // Mobile actions menu component
  const MobileActionsMenu = () => (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[60vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Inventory Actions</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <ExportButton 
            onExport={exportData}
            isExporting={isExporting}
            disabled={user?.role !== 'national_warehouse_manager' && user?.role !== 'national_manager' && user?.role !== 'super_admin'}
            tooltip={user?.role === 'national_warehouse_manager' || user?.role === 'national_manager' || user?.role === 'super_admin' 
              ? `Export national inventory data${Object.keys(currentFilters).length > 0 || searchTerm ? ' (with current filters)' : ''}` 
              : "Export not available for your role"
            }
            showProgress={true}
            className="w-full justify-start"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </ExportButton>
          <Button
            onClick={() => {
              setShowStockReceiptForm(true);
              setMobileMenuOpen(false);
            }}
            className="w-full justify-start bg-[#007A33] hover:bg-[#005A25]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Receive Stock
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );

  if (showStockReceiptForm) {
    return (
      <ResponsiveDashboardLayout
        header={
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStockReceiptForm(false)}
              className={cn(
                "mr-4",
                isTouchDevice && "min-h-[44px] px-3"
              )}
            >
              <ArrowLeft className={cn(
                "mr-2",
                deviceType === "mobile" ? "h-5 w-5" : "h-4 w-4"
              )} />
              {deviceType === "mobile" ? "Back" : "Back to Inventory"}
            </Button>
            <h1 className={cn(
              "font-bold",
              deviceType === "mobile" ? "text-lg" : "text-xl"
            )}>
              Receive Stock
            </h1>
          </div>
        }
        className={className}
      >
        <StockReceiptForm
          onSuccess={handleStockReceiptSuccess}
          onCancel={() => setShowStockReceiptForm(false)}
        />
      </ResponsiveDashboardLayout>
    );
  }

  return (
    <ResponsiveDashboardLayout
      header={
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className={cn(
              "font-bold text-foreground",
              deviceType === "mobile" ? "text-xl" : "text-3xl"
            )}>
              {deviceType === "mobile" ? "National Inventory" : "National Warehouse Inventory"}
            </h1>
            <p className={cn(
              "text-muted-foreground",
              deviceType === "mobile" ? "text-sm" : "text-base"
            )}>
              {deviceType === "mobile" 
                ? "Manage national warehouse stock" 
                : "Manage inventory at national warehouses with real-time tracking"
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
                ? `Export national inventory data${Object.keys(currentFilters).length > 0 || searchTerm ? ' (with current filters)' : ''}` 
                : "Export not available for your role"
              }
              showProgress={true}
            />
            <Button
              onClick={() => setShowStockReceiptForm(true)}
              className="bg-[#007A33] hover:bg-[#005A25]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Receive Stock
            </Button>
          </div>
          
          {/* Mobile Actions */}
          <MobileActionsMenu />
        </div>
      }
      className={className}
    >
      <div className="space-y-6">

        {/* Status Section */}
        <DashboardSection>
          <div className="space-y-4">
            {/* Export Status */}
            <ExportStatus 
              isExporting={isExporting}
              error={exportError}
              lastExportCount={lastExportCount}
              onRetry={exportData}
              onReset={resetExport}
              compact={deviceType === "mobile"}
            />

            {/* Filter Status for Export */}
            {(searchTerm || Object.keys(currentFilters).length > 0) && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className={cn(
                  "pt-4",
                  deviceType === "mobile" ? "px-3 py-3" : "px-6 py-4"
                )}>
                  <p className={cn(
                    "text-blue-800 flex items-start gap-2",
                    deviceType === "mobile" ? "text-sm" : "text-sm"
                  )}>
                    <Filter className={cn(
                      "mt-0.5 flex-shrink-0",
                      deviceType === "mobile" ? "h-4 w-4" : "h-4 w-4"
                    )} />
                    <span>
                      <span className="font-medium">Filters active:</span> Export will include only filtered data
                      {searchTerm && (
                        <span className="block">Search: "{searchTerm}"</span>
                      )}
                      {currentFilters.category && (
                        <span className="block">Category: "{currentFilters.category}"</span>
                      )}
                      {currentFilters.warehouseId && (
                        <span className="block">Warehouse filter applied</span>
                      )}
                      {currentFilters.lowStockOnly && (
                        <span className="block">Low stock items only</span>
                      )}
                      {currentFilters.dateFrom && (
                        <span className="block">From: {new Date(currentFilters.dateFrom).toLocaleDateString()}</span>
                      )}
                      {currentFilters.dateTo && (
                        <span className="block">To: {new Date(currentFilters.dateTo).toLocaleDateString()}</span>
                      )}
                    </span>
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </DashboardSection>

        {/* Main Content Tabs */}
        <DashboardSection>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className={cn(
              "grid w-full grid-cols-1",
              deviceType === "mobile" && "h-auto"
            )}>
              <TabsTrigger 
                value="inventory" 
                className={cn(
                  "flex items-center gap-2",
                  deviceType === "mobile" ? "py-3 text-sm" : "py-2"
                )}
              >
                <Package className={cn(
                  deviceType === "mobile" ? "h-4 w-4" : "h-4 w-4"
                )} />
                <span className={deviceType === "mobile" ? "hidden sm:inline" : ""}>
                  National Inventory Management
                </span>
                <span className={deviceType === "mobile" ? "sm:hidden" : "hidden"}>
                  Inventory
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inventory" className="space-y-6">
              <DashboardWidget
                title="National Inventory Management"
                description={deviceType === "mobile" 
                  ? "View, search, and filter inventory with real-time updates"
                  : "Comprehensive inventory management with real-time updates, advanced search, filtering by category/warehouse/date range, low stock alerts, and data export capabilities. All search and filter operations are integrated below."
                }
              >
                <InventoryTable 
                  viewMode="detailed" 
                  onFiltersChange={handleFiltersChange}
                />
              </DashboardWidget>
            </TabsContent>

          </Tabs>
        </DashboardSection>
      </div>
    </ResponsiveDashboardLayout>
  );
}
