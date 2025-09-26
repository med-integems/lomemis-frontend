"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Package,
  Search,
  School,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  FileText,
  RefreshCw,
  Download,
  Filter,
  Clock,
  Activity,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { useResponsive } from "@/hooks/useResponsive";
import { schoolInventoryApi } from "@/lib/api";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";
import { SchoolSelector } from "@/components/warehouse/SchoolSelector";
import {
  useFilteredExport,
  ExportButton,
  ExportStatus,
} from "@/components/export";
import UtilizationEntryForm from "@/components/school/UtilizationEntryForm";
import UtilizationDashboard from "@/components/school/UtilizationDashboard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface InventoryItem {
  id: number;
  itemName: string;
  itemCode: string;
  category: string;
  unitOfMeasure: string;
  currentQuantity: number;
  minimumThreshold?: number;
  lastReceivedDate?: string;
  lastReceivedQuantity?: number;
  totalReceived: number;
  totalDistributed: number;
  // Utilization tracking fields
  total_consumed?: number;
  last_usage_date?: string;
  usage_rate?: number;
  reorder_point?: number;
  // estimatedValue removed; cost not tracked in receipts
  condition: "new" | "good" | "fair" | "damaged";
}

export default function SchoolInventoryPage() {
  const { user } = useUser();
  const { isMobile, isTablet } = useResponsive();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showUtilizationForm, setShowUtilizationForm] = useState(false);
  const [selectedItemForUtilization, setSelectedItemForUtilization] = useState<InventoryItem | null>(null);
  const [showUtilizationDashboard, setShowUtilizationDashboard] = useState(false);

  // Access control check
  const allowedRoleNames = new Set([
    "School Representative",
    "Local Council M&E Officer",
    "District Education Officer",
    "Super Administrator",
    "System Administrator",
    "View-Only User",
  ]);
  const allowedRoles = new Set([
    "school_rep",
    "lc_officer",
    "district_officer",
    "super_admin",
    "system_admin",
    "view_only",
  ]);

  const hasAccess =
    !!user && (allowedRoleNames.has(user.roleName) || allowedRoles.has(user.role));

  // Resolve effective schoolId from URL or user context
  const schoolIdParam = searchParams.get("schoolId");
  const effectiveSchoolId = schoolIdParam
    ? Number(schoolIdParam)
    : user?.schoolId || null;

  const fetchInventory = async () => {
    if (!effectiveSchoolId) {
      // No school selected (e.g., Super Admin / LC Officer). Stop loading and show guidance.
      setLoading(false);
      setInventory([]);
      return;
    }

    try {
      setLoading(true);

      const result = await schoolInventoryApi.getSchoolInventory(
        effectiveSchoolId,
        1,
        100
      );

      if (result.success && result.data) {
        // Transform API data to match UI interface
        const transformedInventory: InventoryItem[] = result.data.items.map(
          (item: any) => ({
            id: item.id,
            itemName: item.itemName,
            itemCode: item.itemCode,
            category: item.itemCategory,
            unitOfMeasure: item.unitOfMeasure,
            currentQuantity: item.currentQuantity,
            minimumThreshold: item.minimumThreshold,
            lastReceivedDate: item.lastReceivedDate,
            lastReceivedQuantity: item.lastReceivedQuantity,
            // Use backend-provided cumulative receipts; never derive from current stock
            totalReceived: item.total_received ?? item.totalReceived ?? 0,
            // Backward compatibility: mirror total_consumed into totalDistributed when present
            totalDistributed: item.total_consumed ?? item.totalDistributed ?? 0,
            // Utilization tracking fields
            total_consumed: item.total_consumed || 0,
            last_usage_date: item.last_usage_date,
            usage_rate: item.usage_rate || 0,
            reorder_point: item.reorder_point || 0,
            // estimatedValue removed; backend value ignored
            condition:
              (item.conditionStatus?.toLowerCase() as
                | "new"
                | "good"
                | "fair"
                | "damaged") || "good",
          })
        );

        setInventory(transformedInventory);
      } else {
        console.error("API response error:", result);
        toast.error(result.error?.message || "Failed to load school inventory");
        setInventory([]); // Set empty array on error
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Failed to load school inventory");
      setInventory([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [effectiveSchoolId]);

  // Utilization handlers
  const handleRecordUtilization = (item?: InventoryItem) => {
    setSelectedItemForUtilization(item || null);
    setShowUtilizationForm(true);
  };

  const handleUtilizationSuccess = () => {
    setShowUtilizationForm(false);
    setSelectedItemForUtilization(null);
    fetchInventory(); // Refresh inventory data
    toast.success('Material utilization recorded successfully');
  };

  const handleUtilizationCancel = () => {
    setShowUtilizationForm(false);
    setSelectedItemForUtilization(null);
  };

  const categories = [
    "all",
    ...Array.from(new Set(inventory.map((item) => item.category))),
  ];

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentQuantity === 0) {
      return {
        status: "Out of Stock",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: AlertTriangle,
      };
    } else if (
      item.minimumThreshold &&
      item.currentQuantity <= item.minimumThreshold
    ) {
      return {
        status: "Low Stock",
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: TrendingDown,
      };
    } else {
      return {
        status: "In Stock",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: TrendingUp,
      };
    }
  };

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case "new":
        return <Badge className="bg-green-100 text-green-800">New</Badge>;
      case "good":
        return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
      case "fair":
        return <Badge className="bg-yellow-100 text-yellow-800">Fair</Badge>;
      case "damaged":
        return <Badge variant="destructive">Damaged</Badge>;
      default:
        return <Badge variant="outline">{condition}</Badge>;
    }
  };

  const totalItems = inventory.length;
  const totalItemQuantity = inventory.reduce(
    (sum, item) => sum + (item.currentQuantity || 0),
    0
  );
  const lowStockItems = inventory.filter(
    (item) =>
      item.minimumThreshold && item.currentQuantity <= item.minimumThreshold
  ).length;
  const outOfStockItems = inventory.filter(
    (item) => item.currentQuantity === 0
  ).length;
  // Total value removed (no cost available at school level)
  const totalValue = 0;

  // Enhanced export functionality using the new export system
  const {
    exportData,
    isExporting,
    error: exportError,
    lastExportCount,
    reset: resetExport,
  } = useFilteredExport({
    apiCall: async (params) => {
      if (!effectiveSchoolId) {
        throw new Error("School information not available");
      }
      return schoolInventoryApi.getSchoolInventory(
        effectiveSchoolId,
        1,
        params?.maxRecords || 1000
      );
    },
    getCurrentFilters: () => ({
      searchTerm,
      category: selectedCategory,
    }),
    applyFilters: (data, filters) => {
      return data.filter((item: any) => {
        const matchesSearch =
          !filters.searchTerm ||
          item.itemName
            .toLowerCase()
            .includes(filters.searchTerm.toLowerCase()) ||
          item.itemCode
            .toLowerCase()
            .includes(filters.searchTerm.toLowerCase());
        const matchesCategory =
          filters.category === "all" || item.itemCategory === filters.category;
        return matchesSearch && matchesCategory;
      });
    },
    headers: [
      "Item Code",
      "Item Name",
      "Category",
      "Current Quantity",
      "Unit of Measure",
      "Minimum Threshold",
      "Last Received Date",
      "Last Received Quantity",
      "Condition",
    ],
    dataTransform: (items) =>
      items.map((item: any) => [
        item.itemCode,
        item.itemName,
        item.itemCategory,
        item.currentQuantity.toString(),
        item.unitOfMeasure,
        item.minimumThreshold?.toString() || "",
        item.lastReceivedDate
          ? new Date(item.lastReceivedDate).toLocaleDateString()
          : "",
        item.lastReceivedQuantity?.toString() || "",
        item.conditionStatus,
      ]),
    filename: `school-inventory-${
      user?.schoolName?.replace(/\s+/g, "") || "export"
    }-${new Date().toISOString().split("T")[0]}.csv`,
    maxRecords: 5000,
  });

  // Old export function replaced with new export system above

  // Show access restricted message if user doesn't have access
  // If user has access but no effective school selected, show inline selector
  if (!effectiveSchoolId) {
    return (
      <div className={`${isMobile ? "space-y-4" : "space-y-6"}`}>
        <div
          className={`flex items-center ${
            isMobile ? "flex-col space-y-3" : "justify-between"
          }`}
        >
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div
              className={`flex items-center justify-center ${
                isMobile ? "w-10 h-10" : "w-12 h-12"
              } bg-green-100 rounded-lg`}
            >
              <Package
                className={`${isMobile ? "w-5 h-5" : "w-6 h-6"} text-green-600`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1
                className={`${
                  isMobile ? "text-xl" : isTablet ? "text-2xl" : "text-3xl"
                } font-bold text-foreground`}
              >
                School Inventory
              </h1>
              <p
                className={`${
                  isMobile ? "text-sm" : "text-base"
                } text-muted-foreground`}
              >
                Select a school to view inventory
              </p>
            </div>
          </div>
        </div>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className={`${isMobile ? "p-3" : "p-4"} space-y-4`}>
            <div className="max-w-xl">
              <SchoolSelector
                selectedSchoolId={0}
                onSchoolChange={(id) =>
                  router.push(`/schools/inventory?schoolId=${id}`)
                }
                required
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-sm mx-auto px-4">
          <AlertTriangle
            className={`${
              isMobile ? "h-10 w-10" : "h-12 w-12"
            } mx-auto text-amber-500 mb-4`}
          />
          <h3
            className={`${
              isMobile ? "text-base" : "text-lg"
            } font-medium text-foreground mb-2`}
          >
            Access Restricted
          </h3>
          <p
            className={`${
              isMobile ? "text-sm" : "text-base"
            } text-muted-foreground`}
          >
            This page is only available to School Representatives, LC Officers,
            District Education Officers, Administrators, and View-Only Users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? "space-y-4" : "space-y-6"}`}>
      {/* Header */}
      <div
        className={`flex items-center ${
          isMobile ? "flex-col space-y-3" : "justify-between"
        }`}
      >
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div
            className={`flex items-center justify-center ${
              isMobile ? "w-10 h-10" : "w-12 h-12"
            } bg-green-100 rounded-lg`}
          >
            <Package
              className={`${isMobile ? "w-5 h-5" : "w-6 h-6"} text-green-600`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1
              className={`${
                isMobile ? "text-xl" : isTablet ? "text-2xl" : "text-3xl"
              } font-bold text-foreground`}
            >
              School Inventory
            </h1>
            <p
              className={`${
                isMobile ? "text-sm" : "text-base"
              } text-muted-foreground`}
            >
              {user?.roleName === "School Representative"
                ? isMobile
                  ? `Manage ${user?.schoolName || "school"} inventory`
                  : `Manage inventory for ${user?.schoolName || "your school"}`
                : isMobile
                ? "View school inventory"
                : "View school inventory levels and educational materials"}
            </p>
          </div>
        </div>

        <div
          className={`flex items-center ${isMobile ? "gap-1 w-full" : "gap-2"}`}
        >
          {user?.roleName === "School Representative" && (
            <>
              <Button
                onClick={() => setShowUtilizationDashboard(true)}
                variant="outline"
                className={`${isMobile ? "" : "mr-2"}`}
              >
                <BarChart3 className={`h-4 w-4 ${isMobile ? "" : "mr-2"}`} />
                {!isMobile && "Usage Analytics"}
              </Button>
              <Button
                onClick={() => handleRecordUtilization()}
                className={`${isMobile ? "" : "mr-2"}`}
              >
                <Activity className={`h-4 w-4 ${isMobile ? "" : "mr-2"}`} />
                {!isMobile && "Record Usage"}
              </Button>
            </>
          )}
          <ExportButton
            onExport={exportData}
            isExporting={isExporting}
            disabled={!effectiveSchoolId || inventory.length === 0}
            showProgress={true}
            tooltip={
              filteredInventory.length > 0
                ? `Export ${filteredInventory.length} filtered records`
                : "No data to export"
            }
          />
          <Button
            onClick={fetchInventory}
            variant="outline"
            disabled={loading}
            className={`${isMobile ? "flex-1" : ""}`}
          >
            <RefreshCw
              className={`h-4 w-4 ${isMobile ? "" : "mr-2"} ${
                loading ? "animate-spin" : ""
              }`}
            />
            {!isMobile && "Refresh"}
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

      {/* Quick Stats */}
      <div
        className={`grid gap-3 sm:gap-4 ${
          isMobile ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        <Card>
          <CardContent className={`${isMobile ? "p-3" : "p-6"}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p
                  className={`${
                    isMobile ? "text-xs" : "text-sm"
                  } font-medium text-muted-foreground`}
                >
                  Total Items
                </p>
                <p
                  className={`${
                    isMobile ? "text-lg" : "text-2xl"
                  } font-bold text-blue-600 truncate`}
                >
                  {totalItems}
                </p>
              </div>
              <Package
                className={`${
                  isMobile ? "w-6 h-6" : "w-8 h-8"
                } text-blue-500 flex-shrink-0`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={`${isMobile ? "p-3" : "p-6"}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p
                  className={`${
                    isMobile ? "text-xs" : "text-sm"
                  } font-medium text-muted-foreground`}
                >
                  Total Quantity
                </p>
                <p
                  className={`${
                    isMobile ? "text-lg" : "text-2xl"
                  } font-bold text-violet-600 truncate`}
                >
                  {totalItemQuantity.toLocaleString()}
                </p>
              </div>
              <Package
                className={`${
                  isMobile ? "w-6 h-6" : "w-8 h-8"
                } text-violet-500 flex-shrink-0`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={`${isMobile ? "p-3" : "p-6"}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p
                  className={`${
                    isMobile ? "text-xs" : "text-sm"
                  } font-medium text-muted-foreground`}
                >
                  {isMobile ? "Low Stock" : "Low Stock Items"}
                </p>
                <p
                  className={`${
                    isMobile ? "text-lg" : "text-2xl"
                  } font-bold text-orange-600 truncate`}
                >
                  {lowStockItems}
                </p>
              </div>
              <TrendingDown
                className={`${
                  isMobile ? "w-6 h-6" : "w-8 h-8"
                } text-orange-500 flex-shrink-0`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={`${isMobile ? "p-3" : "p-6"}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p
                  className={`${
                    isMobile ? "text-xs" : "text-sm"
                  } font-medium text-muted-foreground`}
                >
                  Out of Stock
                </p>
                <p
                  className={`${
                    isMobile ? "text-lg" : "text-2xl"
                  } font-bold text-red-600 truncate`}
                >
                  {outOfStockItems}
                </p>
              </div>
              <AlertTriangle
                className={`${
                  isMobile ? "w-6 h-6" : "w-8 h-8"
                } text-red-500 flex-shrink-0`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Estimated value quick stat removed */}
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`flex ${
              isMobile ? "flex-col" : "flex-col md:flex-row"
            } gap-4`}
          >
            <div className="flex-1">
              <Label
                htmlFor="search"
                className={`${isMobile ? "text-sm" : ""}`}
              >
                {isMobile ? "Search items" : "Search by item name or code"}
              </Label>
              <Input
                id="search"
                placeholder={
                  isMobile ? "Search..." : "Enter item name or code..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`mt-1 ${isMobile ? "text-base" : ""}`}
              />
            </div>
            <div className={`${isMobile ? "w-full" : "md:w-48"}`}>
              <Label
                htmlFor="category"
                className={`${isMobile ? "text-sm" : ""}`}
              >
                Category
              </Label>
              <select
                id="category"
                aria-label="Category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`mt-1 w-full rounded-md border border-input bg-background px-3 py-2 ${
                  isMobile ? "text-base" : "text-sm"
                }`}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Items ({filteredInventory.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                Loading inventory...
              </span>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No Items Found
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedCategory !== "all"
                  ? "No items match your search criteria"
                  : "No inventory items available"}
              </p>
            </div>
          ) : (
            <div className={`${isMobile ? "space-y-3" : "space-y-4"}`}>
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item);
                const StatusIcon = stockStatus.icon;

                return (
                  <div
                    key={item.id}
                    className={`border rounded-lg ${
                      isMobile ? "p-3" : "p-4"
                    } hover:bg-gray-50 transition-colors`}
                  >
                    <div
                      className={`flex items-start ${
                        isMobile ? "flex-col space-y-2" : "justify-between"
                      } mb-3`}
                    >
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`${
                            isMobile ? "text-base" : "text-lg"
                          } font-semibold mb-1`}
                        >
                          {item.itemName}
                        </h3>
                        <div
                          className={`flex items-center gap-2 ${
                            isMobile ? "text-xs" : "text-sm"
                          } text-muted-foreground`}
                        >
                          <span>Code: {item.itemCode}</span>
                          <span>•</span>
                          <span>{item.category}</span>
                        </div>
                      </div>
                      <div
                        className={`flex items-center gap-2 ${
                          isMobile ? "flex-wrap" : ""
                        }`}
                      >
                        <Badge className={stockStatus.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {isMobile
                            ? stockStatus.status.split(" ")[0]
                            : stockStatus.status}
                        </Badge>
                        {getConditionBadge(item.condition)}
                      </div>
                    </div>

                    <div
                      className={`grid ${
                        isMobile
                          ? "grid-cols-1 gap-3"
                          : "grid-cols-2 md:grid-cols-4 gap-4"
                      } text-sm`}
                    >
                      <div className={`${isMobile ? "border-b pb-2" : ""}`}>
                        <p className="text-muted-foreground">Current Stock</p>
                        <p
                          className={`font-semibold ${
                            isMobile ? "text-base" : "text-lg"
                          }`}
                        >
                          {item.currentQuantity} {item.unitOfMeasure}
                        </p>
                        {item.minimumThreshold && (
                          <p className="text-xs text-muted-foreground">
                            Min: {item.minimumThreshold}
                          </p>
                        )}
                      </div>

                      <div className={`${isMobile ? "border-b pb-2" : ""}`}>
                        <p className="text-muted-foreground">Total Received</p>
                        <p className="font-medium text-green-600">
                          {item.totalReceived} {item.unitOfMeasure}
                        </p>
                        {item.lastReceivedDate && (
                          <p className="text-xs text-muted-foreground">
                            Last:{" "}
                            {new Date(
                              item.lastReceivedDate
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <div className={`${isMobile ? "border-b pb-2" : ""}`}>
                        <p className="text-muted-foreground">Total Used</p>
                        <p className="font-medium text-orange-600">
                          {item.total_consumed || item.totalDistributed} {item.unitOfMeasure}
                        </p>
                        {item.usage_rate && item.usage_rate > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Rate: {item.usage_rate.toFixed(1)}/day
                          </p>
                        )}
                      </div>

                      {item.last_usage_date && (
                        <div className={`${isMobile ? "border-b pb-2" : ""}`}>
                          <p className="text-muted-foreground">Last Used</p>
                          <p className="font-medium text-blue-600">
                            {new Date(item.last_usage_date).toLocaleDateString()}
                          </p>
                          {item.reorder_point && item.reorder_point > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Reorder at: {item.reorder_point}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Estimated value removed: cost not tracked at school receipts */}
                    </div>

                    {/* Quick Action Buttons - Only for School Representatives */}
                    {user?.roleName === "School Representative" && item.currentQuantity > 0 && (
                      <div className={`mt-3 pt-3 border-t flex ${isMobile ? "flex-col gap-2" : "gap-3"}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRecordUtilization(item)}
                          className={`${isMobile ? "w-full" : ""}`}
                        >
                          <Activity className="h-4 w-4 mr-1" />
                          Record Usage
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className={`${isMobile ? "p-3" : "p-4"}`}>
          <div
            className={`flex items-start ${
              isMobile ? "space-x-2" : "space-x-3"
            }`}
          >
            <FileText
              className={`${
                isMobile ? "w-4 h-4" : "w-5 h-5"
              } text-green-600 mt-0.5 flex-shrink-0`}
            />
            <div className="flex-1 min-w-0">
              <h3
                className={`font-medium text-green-800 mb-1 ${
                  isMobile ? "text-sm" : ""
                }`}
              >
                Inventory Management Tips
              </h3>
              <ul
                className={`${
                  isMobile ? "text-xs" : "text-sm"
                } text-green-700 space-y-1`}
              >
                <li>
                  • Monitor items with low stock status and request
                  replenishment
                </li>
                <li>
                  • Report damaged or missing items through the receipts system
                </li>
                <li>
                  • Keep track of consumption patterns to improve planning
                </li>
                <li>
                  • Use the export function to create reports for school
                  administration
                </li>
                <li>
                  • Contact your Local Council M&E Officer for inventory
                  concerns
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Utilization Entry Dialog */}
      <Dialog open={showUtilizationForm} onOpenChange={setShowUtilizationForm}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Record Material Utilization</DialogTitle>
          </DialogHeader>
          {effectiveSchoolId && (
            <UtilizationEntryForm
              schoolId={effectiveSchoolId}
              preselectedItemId={selectedItemForUtilization?.id}
              onSuccess={handleUtilizationSuccess}
              onCancel={handleUtilizationCancel}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Utilization Dashboard Dialog */}
      <Dialog open={showUtilizationDashboard} onOpenChange={setShowUtilizationDashboard}>
        <DialogContent
          className="max-w-7xl max-h-[95vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Material Utilization Analytics</DialogTitle>
          </DialogHeader>
          {effectiveSchoolId && (
            <UtilizationDashboard
              schoolId={effectiveSchoolId}
              onRecordUtilization={() => {
                setShowUtilizationDashboard(false);
                setShowUtilizationForm(true);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
