"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, RefreshCw, MoreHorizontal, Edit, Move, ClipboardCheck, Settings, Eye } from "lucide-react";
import { nationalInventoryApi, warehousesApi } from "@/lib/api";
import {
  NationalInventoryItem,
  Warehouse,
  NationalInventoryFilters,
} from "@/types";
import { toast } from "sonner";
import { useResponsive } from "@/hooks/useResponsive";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StockAdjustmentDialog } from "./stock-adjustment-dialog";
import { StockTransferDialog } from "./stock-transfer-dialog";
import { InventoryAuditDialog } from "./inventory-audit-dialog";
import { MinimumStockDialog } from "./minimum-stock-dialog";
import { ItemDetailsDialog } from "./item-details-dialog";

interface InventoryTableProps {
  viewMode?: "detailed" | "summary";
  onFiltersChange?: (filters: NationalInventoryFilters, searchTerm: string) => void;
}

export function InventoryTable({ viewMode = "detailed", onFiltersChange }: InventoryTableProps) {
  const { deviceType, isMobile, isTouchDevice } = useResponsive();
  const [inventory, setInventory] = useState<NationalInventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [filters, setFilters] = useState<NationalInventoryFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  // Dialog states
  const [selectedItem, setSelectedItem] = useState<NationalInventoryItem | null>(null);
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [showStockTransfer, setShowStockTransfer] = useState(false);
  const [showInventoryAudit, setShowInventoryAudit] = useState(false);
  const [showMinimumStock, setShowMinimumStock] = useState(false);
  const [showItemDetails, setShowItemDetails] = useState(false);

  useEffect(() => {
    loadWarehouses();
  }, []);

  // Auto-search with debounce when searchTerm changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined) {
        setPage(1);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Notify parent component when filters change
  useEffect(() => {
    onFiltersChange?.(filters, searchTerm);
  }, [filters, searchTerm, onFiltersChange]);

  const loadWarehouses = async () => {
    try {
      const response = await warehousesApi.getWarehouses(1, 100, {
        isActive: true,
      });
      if (response.success && response.data?.warehouses) {
        setWarehouses(response.data.warehouses);
      }
    } catch (error) {
      console.error("Failed to load warehouses:", error);
    }
  };

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      // Include searchTerm in the filters
      const filtersWithSearch = {
        ...filters,
        ...(searchTerm && { search: searchTerm })
      };

      const response =
        viewMode === "summary"
          ? await nationalInventoryApi.getNationalInventorySummary(
              page,
              limit,
              filtersWithSearch
            )
          : await nationalInventoryApi.getNationalInventory(
              page,
              limit,
              filtersWithSearch
            );

      if (response.success && response.data) {
        setInventory(response.data.items || []);
        setTotal(response.data.total || 0);
      } else {
        toast.error("Failed to load inventory data");
      }
    } catch (error) {
      console.error("Failed to load inventory:", error);
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters, searchTerm, viewMode]);

  // Load inventory when loadInventory function changes
  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleSearch = useCallback(() => {
    setPage(1);
    loadInventory();
  }, [loadInventory]);

  const handleFilterChange = (
    key: keyof NationalInventoryFilters,
    value: any
  ) => {
    const newFilters = { ...filters, [key]: value };
    if (value === "" || value === undefined) {
      delete newFilters[key];
    }
    setFilters(newFilters);
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getWarehouseName = (warehouseId: number) => {
    if (!Array.isArray(warehouses)) return `Warehouse ${warehouseId}`;
    const warehouse = warehouses.find((w) => w.id === warehouseId);
    return warehouse?.name || `Warehouse ${warehouseId}`;
  };

  const handleActionClick = (action: string, item: NationalInventoryItem) => {
    setSelectedItem(item);
    switch (action) {
      case 'adjust':
        setShowStockAdjustment(true);
        break;
      case 'transfer':
        setShowStockTransfer(true);
        break;
      case 'audit':
        setShowInventoryAudit(true);
        break;
      case 'minimum':
        setShowMinimumStock(true);
        break;
      case 'details':
        setShowItemDetails(true);
        break;
    }
  };

  const handleDialogSuccess = () => {
    // Reload inventory data after successful action
    loadInventory();
  };

  // Mobile Item Card Component
  const MobileInventoryCard = ({ item }: { item: NationalInventoryItem }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Item Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">{item.itemName}</h3>
              <p className="text-sm text-muted-foreground">{item.itemCode}</p>
              {item.category && (
                <Badge variant="secondary" className="mt-1 text-xs">{item.category}</Badge>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleActionClick('adjust', item)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Stock Adjustment
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleActionClick('transfer', item)}
                  disabled={item.availableQuantity <= 0}
                >
                  <Move className="mr-2 h-4 w-4" />
                  Transfer Stock
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleActionClick('audit', item)}>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Inventory Audit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleActionClick('minimum', item)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Set Minimum Level
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleActionClick('details', item)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            {item.isLowStock ? (
              <Badge variant="destructive">Low Stock</Badge>
            ) : (
              <Badge variant="default" className="bg-green-100 text-green-800">
                Normal
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {item.warehouseName}
            </span>
          </div>

          {/* Stock Details Grid */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">On Hand:</span>
              <div className="font-medium">{item.quantityOnHand.toLocaleString()} {item.unitOfMeasure}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Available:</span>
              <div className="font-medium">{item.availableQuantity.toLocaleString()} {item.unitOfMeasure}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Reserved:</span>
              <div className="font-medium">{item.reservedQuantity.toLocaleString()} {item.unitOfMeasure}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Min Level:</span>
              <div className="font-medium">{item.minimumStockLevel.toLocaleString()} {item.unitOfMeasure}</div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Updated: {formatDate(item.lastUpdated)}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Mobile Filters Sheet
  const MobileFiltersSheet = () => (
    <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Inventory</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3">
              Category
            </label>
            <Input
              placeholder="Filter by category"
              value={filters.category || ""}
              onChange={(e) => handleFilterChange("category", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-3">
              Warehouse
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007A33]"
              value={filters.warehouseId || ""}
              onChange={(e) =>
                handleFilterChange(
                  "warehouseId",
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
            >
              <option value="">All Warehouses</option>
              {Array.isArray(warehouses) && warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-3">
              Date From
            </label>
            <Input
              type="date"
              value={filters.dateFrom || ""}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-3">
              Date To
            </label>
            <Input
              type="date"
              value={filters.dateTo || ""}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="lowStockMobile"
              checked={filters.lowStockOnly || false}
              onChange={(e) =>
                handleFilterChange(
                  "lowStockOnly",
                  e.target.checked || undefined
                )
              }
              className="rounded"
            />
            <label htmlFor="lowStockMobile" className="text-sm font-medium">
              Low Stock Only
            </label>
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={clearFilters} variant="outline" className="flex-1">
              Clear Filters
            </Button>
            <Button 
              onClick={() => setMobileFiltersOpen(false)} 
              className="flex-1 bg-[#007A33] hover:bg-[#005A25]"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className={cn(
          "flex items-center justify-between",
          deviceType === "mobile" && "flex-col space-y-3 items-start"
        )}>
          <span className={cn(
            deviceType === "mobile" ? "text-lg" : "text-xl"
          )}>
            {deviceType === "mobile" ? "Inventory" : "National Inventory"}
          </span>
          <Button
            onClick={loadInventory}
            size={deviceType === "mobile" ? "sm" : "sm"}
            variant="outline"
            disabled={loading}
            className={cn(
              deviceType === "mobile" && "w-full justify-center"
            )}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder={deviceType === "mobile" ? "Search..." : "Search items..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className={cn(
                  isTouchDevice && "min-h-[44px]"
                )}
              />
              <Button 
                onClick={handleSearch} 
                size={deviceType === "mobile" ? "sm" : "sm"}
                className={cn(
                  isTouchDevice && "min-h-[44px] px-3"
                )}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Desktop Filters */}
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size="sm"
              className={cn(
                "hidden lg:flex",
                isTouchDevice && "min-h-[44px]"
              )}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            
            {/* Mobile Filters */}
            <MobileFiltersSheet />
          </div>

          {/* Desktop Filters Panel */}
          {showFilters && (
            <div className="hidden lg:block">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Category
                  </label>
                  <Input
                    placeholder="Filter by category"
                    value={filters.category || ""}
                    onChange={(e) =>
                      handleFilterChange("category", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Warehouse
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007A33]"
                    value={filters.warehouseId || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        "warehouseId",
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                  >
                    <option value="">All Warehouses</option>
                    {Array.isArray(warehouses) && warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Date From
                  </label>
                  <Input
                    type="date"
                    value={filters.dateFrom || ""}
                    onChange={(e) =>
                      handleFilterChange("dateFrom", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Date To
                  </label>
                  <Input
                    type="date"
                    value={filters.dateTo || ""}
                    onChange={(e) =>
                      handleFilterChange("dateTo", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.lowStockOnly || false}
                      onChange={(e) =>
                        handleFilterChange(
                          "lowStockOnly",
                          e.target.checked || undefined
                        )
                      }
                      className="mr-2"
                    />
                    Low Stock Only
                  </label>
                </div>
                <div className="lg:col-span-5 flex justify-end">
                  <Button onClick={clearFilters} variant="outline" size="sm">
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Inventory Display */}
        {deviceType === "mobile" ? (
          /* Mobile Card View */
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="h-3 bg-gray-200 rounded"></div>
                          <div className="h-3 bg-gray-200 rounded"></div>
                          <div className="h-3 bg-gray-200 rounded"></div>
                          <div className="h-3 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : inventory.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No inventory data found</p>
                </CardContent>
              </Card>
            ) : (
              inventory.map((item) => (
                <MobileInventoryCard key={`${item.itemId}-${item.warehouseId}`} item={item} />
              ))
            )}
          </div>
        ) : (
          /* Desktop Table View */
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[25%]">Item Details</TableHead>
                  <TableHead className="w-[18%]">Warehouse</TableHead>
                  <TableHead className="w-[20%] text-center">Stock Levels</TableHead>
                  <TableHead className="w-[15%] text-center">Available</TableHead>
                  <TableHead className="w-[12%] text-center">Status</TableHead>
                  <TableHead className="w-[10%] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Loading inventory data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : inventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No inventory data found
                    </TableCell>
                  </TableRow>
                ) : (
                  inventory.map((item) => (
                    <TableRow key={`${item.itemId}-${item.warehouseId}`}>
                      {/* Item Details - Combined Name, Code, Category */}
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <div className="font-semibold text-gray-900">{item.itemName}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span className="font-mono">{item.itemCode}</span>
                            {item.category && (
                              <>
                                <span>•</span>
                                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">{item.category}</Badge>
                              </>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      {/* Warehouse */}
                      <TableCell>
                        <div className="text-sm font-medium">{item.warehouseName}</div>
                        <div className="text-xs text-gray-500">
                          Updated {formatDate(item.lastUpdated)}
                        </div>
                      </TableCell>
                      
                      {/* Stock Levels - Combined On Hand + Reserved */}
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">
                            {item.quantityOnHand.toLocaleString()} {item.unitOfMeasure}
                          </div>
                          <div className="text-xs text-gray-500">
                            Reserved: {item.reservedQuantity.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            Min: {item.minimumStockLevel.toLocaleString()}
                          </div>
                        </div>
                      </TableCell>
                      
                      {/* Available - Highlighted */}
                      <TableCell className="text-center">
                        <div className={cn(
                          "font-semibold text-lg",
                          item.availableQuantity <= item.minimumStockLevel 
                            ? "text-red-600" 
                            : item.availableQuantity <= item.minimumStockLevel * 1.5 
                            ? "text-yellow-600" 
                            : "text-green-600"
                        )}>
                          {item.availableQuantity.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">{item.unitOfMeasure}</div>
                      </TableCell>
                      
                      {/* Status - Compact */}
                      <TableCell className="text-center">
                        {item.isLowStock ? (
                          <Badge variant="destructive" className="text-xs">Low</Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-100 text-green-800 text-xs">OK</Badge>
                        )}
                      </TableCell>
                      
                      {/* Actions */}
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Inventory Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleActionClick('adjust', item)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Stock Adjustment
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleActionClick('transfer', item)}
                              disabled={item.availableQuantity <= 0}
                            >
                              <Move className="mr-2 h-4 w-4" />
                              Transfer Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleActionClick('audit', item)}>
                              <ClipboardCheck className="mr-2 h-4 w-4" />
                              Inventory Audit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleActionClick('minimum', item)}>
                              <Settings className="mr-2 h-4 w-4" />
                              Set Minimum Level
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleActionClick('details', item)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className={cn(
            "flex items-center mt-6 pt-4 border-t",
            deviceType === "mobile" 
              ? "flex-col space-y-3" 
              : "justify-between"
          )}>
            <div className={cn(
              "text-sm text-muted-foreground",
              deviceType === "mobile" && "text-center"
            )}>
              Showing {(page - 1) * limit + 1} to{" "}
              {Math.min(page * limit, total)} of {total} items
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                variant="outline"
                size="sm"
                className={cn(
                  isTouchDevice && "min-h-[44px] px-4"
                )}
              >
                Previous
              </Button>
              <Button
                onClick={() => setPage(page + 1)}
                disabled={page * limit >= total}
                variant="outline"
                size="sm"
                className={cn(
                  isTouchDevice && "min-h-[44px] px-4"
                )}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Action Dialogs */}
      <StockAdjustmentDialog
        isOpen={showStockAdjustment}
        onClose={() => setShowStockAdjustment(false)}
        inventoryItem={selectedItem}
        onSuccess={handleDialogSuccess}
      />

      <StockTransferDialog
        isOpen={showStockTransfer}
        onClose={() => setShowStockTransfer(false)}
        inventoryItem={selectedItem}
        onSuccess={handleDialogSuccess}
      />

      <InventoryAuditDialog
        isOpen={showInventoryAudit}
        onClose={() => setShowInventoryAudit(false)}
        inventoryItem={selectedItem}
        onSuccess={handleDialogSuccess}
      />

      <MinimumStockDialog
        isOpen={showMinimumStock}
        onClose={() => setShowMinimumStock(false)}
        inventoryItem={selectedItem}
        onSuccess={handleDialogSuccess}
      />

      <ItemDetailsDialog
        isOpen={showItemDetails}
        onClose={() => setShowItemDetails(false)}
        inventoryItem={selectedItem}
      />
    </Card>
  );
}
