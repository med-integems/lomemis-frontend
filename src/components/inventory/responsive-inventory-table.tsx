"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  RefreshCw, 
  MoreHorizontal, 
  Edit, 
  Move, 
  ClipboardCheck, 
  Settings,
  Package,
  Warehouse,
  Calendar
} from "lucide-react";
import { nationalInventoryApi, warehousesApi } from "@/lib/api";
import {
  NationalInventoryItem,
  Warehouse,
  NationalInventoryFilters,
} from "@/types";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResponsiveTable, ResponsiveColumn } from "@/components/ui/responsive-table";
import { StockAdjustmentDialog } from "./stock-adjustment-dialog";
import { StockTransferDialog } from "./stock-transfer-dialog";
import { InventoryAuditDialog } from "./inventory-audit-dialog";
import { MinimumStockDialog } from "./minimum-stock-dialog";
import { useResponsive } from "@/hooks/useResponsive";
import { cn } from "@/lib/utils";

interface ResponsiveInventoryTableProps {
  viewMode?: "detailed" | "summary";
  onFiltersChange?: (filters: NationalInventoryFilters, searchTerm: string) => void;
}

export function ResponsiveInventoryTable({ 
  viewMode = "detailed", 
  onFiltersChange 
}: ResponsiveInventoryTableProps) {
  const { isMobile, isTouchDevice } = useResponsive();
  const [inventory, setInventory] = useState<NationalInventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [filters, setFilters] = useState<NationalInventoryFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Dialog states
  const [selectedItem, setSelectedItem] = useState<NationalInventoryItem | null>(null);
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [showStockTransfer, setShowStockTransfer] = useState(false);
  const [showInventoryAudit, setShowInventoryAudit] = useState(false);
  const [showMinimumStock, setShowMinimumStock] = useState(false);

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined) {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

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
      const filtersWithSearch = {
        ...filters,
        ...(searchTerm && { search: searchTerm })
      };

      const response = viewMode === "summary"
        ? await nationalInventoryApi.getNationalInventorySummary(page, limit, filtersWithSearch)
        : await nationalInventoryApi.getNationalInventory(page, limit, filtersWithSearch);

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

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleSearch = useCallback(() => {
    setPage(1);
    loadInventory();
  }, [loadInventory]);

  const handleFilterChange = (key: keyof NationalInventoryFilters, value: any) => {
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
    }
  };

  const handleDialogSuccess = () => {
    loadInventory();
  };

  // Define responsive columns
  const columns: ResponsiveColumn<NationalInventoryItem>[] = [
    {
      key: "itemName",
      header: "Item",
      priority: 1,
      sticky: true,
      renderMobile: (item) => (
        <div className="min-w-0">
          <div className="font-medium truncate">{item.itemName}</div>
          {item.itemDescription && (
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {item.itemDescription}
            </div>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">{item.itemCode}</Badge>
            {item.category && (
              <Badge variant="secondary" className="text-xs">{item.category}</Badge>
            )}
          </div>
        </div>
      ),
      renderDesktop: (item) => (
        <div>
          <div className="font-medium">{item.itemName}</div>
          {item.itemDescription && (
            <div className="text-sm text-muted-foreground mt-1">
              {item.itemDescription}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "itemCode",
      header: "Code",
      desktopVisible: true,
      tabletVisible: true,
      mobileVisible: false,
      priority: 8,
    },
    {
      key: "category",
      header: "Category",
      desktopVisible: true,
      tabletVisible: false,
      mobileVisible: false,
      priority: 9,
      renderDesktop: (item) => (
        item.category ? <Badge variant="secondary">{item.category}</Badge> : null
      ),
    },
    {
      key: "warehouseName",
      header: "Location",
      priority: 2,
      renderMobile: (item) => (
        <div className="flex items-center gap-1">
          <Warehouse className="w-3 h-3 text-muted-foreground" />
          <span className="text-sm truncate">{item.warehouseName}</span>
        </div>
      ),
    },
    {
      key: "quantityOnHand",
      header: "On Hand",
      align: "right",
      priority: 3,
      renderMobile: (item) => (
        <div className="text-right">
          <div className="font-medium">
            {item.quantityOnHand.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">{item.unitOfMeasure}</div>
        </div>
      ),
      renderDesktop: (item) => (
        <span>
          {item.quantityOnHand.toLocaleString()} {item.unitOfMeasure}
        </span>
      ),
    },
    {
      key: "reservedQuantity",
      header: "Reserved",
      align: "right",
      desktopVisible: true,
      tabletVisible: true,
      mobileVisible: false,
      priority: 6,
      renderDesktop: (item) => (
        <span>
          {item.reservedQuantity.toLocaleString()} {item.unitOfMeasure}
        </span>
      ),
    },
    {
      key: "availableQuantity",
      header: "Available",
      align: "right",
      desktopVisible: true,
      tabletVisible: true,
      mobileVisible: false,
      priority: 4,
      renderDesktop: (item) => (
        <span className={cn(
          item.availableQuantity <= 0 && "text-destructive font-medium"
        )}>
          {item.availableQuantity.toLocaleString()} {item.unitOfMeasure}
        </span>
      ),
    },
    {
      key: "minimumStockLevel",
      header: "Min Level",
      align: "right",
      desktopVisible: true,
      tabletVisible: false,
      mobileVisible: false,
      priority: 7,
      renderDesktop: (item) => (
        <span>
          {item.minimumStockLevel.toLocaleString()} {item.unitOfMeasure}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      priority: 5,
      renderMobile: (item) => (
        item.isLowStock ? (
          <Badge variant="destructive" className="text-xs">Low Stock</Badge>
        ) : (
          <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
            Normal
          </Badge>
        )
      ),
      renderDesktop: (item) => (
        item.isLowStock ? (
          <Badge variant="destructive">Low Stock</Badge>
        ) : (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Normal
          </Badge>
        )
      ),
    },
    {
      key: "lastUpdated",
      header: "Updated",
      desktopVisible: true,
      tabletVisible: false,
      mobileVisible: false,
      priority: 10,
      renderDesktop: (item) => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="w-3 h-3" />
          {formatDate(item.lastUpdated)}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      width: "60px",
      priority: 11,
      renderMobile: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "h-8 w-8 p-0",
                isTouchDevice && "h-11 w-11"
              )}
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Inventory Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleActionClick('adjust', item)}
              className={isTouchDevice ? "py-3" : ""}
            >
              <Edit className="mr-2 h-4 w-4" />
              Stock Adjustment
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleActionClick('transfer', item)}
              disabled={item.availableQuantity <= 0}
              className={isTouchDevice ? "py-3" : ""}
            >
              <Move className="mr-2 h-4 w-4" />
              Transfer Stock
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleActionClick('audit', item)}
              className={isTouchDevice ? "py-3" : ""}
            >
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Inventory Audit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleActionClick('minimum', item)}
              className={isTouchDevice ? "py-3" : ""}
            >
              <Settings className="mr-2 h-4 w-4" />
              Set Minimum Level
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      renderDesktop: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
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
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>National Inventory</span>
          <Button
            onClick={loadInventory}
            size={isMobile ? "default" : "sm"}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
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
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className={cn(isTouchDevice && "h-11")}
              />
              <Button 
                onClick={handleSearch} 
                size={isMobile ? "default" : "sm"}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size={isMobile ? "default" : "sm"}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <Input
                  placeholder="Filter by category"
                  value={filters.category || ""}
                  onChange={(e) => handleFilterChange("category", e.target.value)}
                  className={cn(isTouchDevice && "h-11")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Warehouse</label>
                <select
                  className={cn(
                    "w-full px-3 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring",
                    isTouchDevice ? "py-3 h-11" : "py-2"
                  )}
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
                    className={cn(
                      "mr-2",
                      isTouchDevice && "w-5 h-5"
                    )}
                  />
                  Low Stock Only
                </label>
              </div>
              <div className="md:col-span-3 flex justify-end">
                <Button 
                  onClick={clearFilters} 
                  variant="outline" 
                  size={isMobile ? "default" : "sm"}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Responsive Table */}
        <ResponsiveTable
          data={inventory}
          columns={columns}
          loading={loading}
          emptyMessage="No inventory data found"
          showPagination={total > limit}
          currentPage={page}
          totalPages={Math.ceil(total / limit)}
          onPageChange={setPage}
          pageSize={limit}
          total={total}
          maxMobileColumns={3}
          keyExtractor={(item) => `${item.itemId}-${item.warehouseId}`}
        />
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
    </Card>
  );
}