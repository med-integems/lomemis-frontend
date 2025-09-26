"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Package,
} from "lucide-react";
import { councilInventoryApi } from "@/lib/api";
import { ArrowUpDown } from "lucide-react";
import {
  CouncilInventoryItem,
  CouncilInventoryFilters,
  PaginatedResponse,
} from "@/types";
import { MinimumStockDialog } from "@/components/inventory";
// toast removed with reserve action

interface CouncilInventoryTableProps {
  filters?: CouncilInventoryFilters;
  className?: string;
  councilId?: number; // effective council context
  onInventoryChanged?: () => void; // notify parent to refresh KPIs, etc.
}

export function CouncilInventoryTable({
  filters = {},
  className,
  councilId,
  onInventoryChanged,
}: CouncilInventoryTableProps) {
  const [inventory, setInventory] = useState<CouncilInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState<number>(20);

  const [sortBy, setSortBy] = useState<"available" | "minLevel" | "lastUpdated" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [minDialogOpen, setMinDialogOpen] = useState(false);
  const [minDialogItem, setMinDialogItem] = useState<CouncilInventoryItem | null>(null);

  // Reserve action removed

  // Load preferences
  useEffect(() => {
    const savedSize = typeof window !== 'undefined' ? window.localStorage.getItem('councilInv.pageSize') : null;
    if (savedSize) {
      const n = parseInt(savedSize);
      if (!isNaN(n) && [20, 50, 100].includes(n)) setPageSize(n);
    }
    const savedSort = typeof window !== 'undefined' ? window.localStorage.getItem('councilInv.sort') : null;
    if (savedSort) {
      try {
        const { by, order } = JSON.parse(savedSort);
        if (["available", "minLevel", "lastUpdated"].includes(by)) setSortBy(by);
        if (["asc", "desc"].includes(order)) setSortOrder(order);
      } catch { /* noop */ }
    }
  }, []);

  const fetchInventory = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await councilInventoryApi.getCouncilInventory(
        page,
        pageSize,
        { ...(filters || {}), sortBy: sortBy || undefined, sortOrder: sortOrder || undefined }
      );

      if (response.success && response.data) {
        const data = response.data as PaginatedResponse<CouncilInventoryItem>;
        // Handle both items and inventory array from backend
        let items = (data.inventory || data.items || []) as CouncilInventoryItem[];
        // Client-side fallback sort if API ignores sort params
        if (sortBy) {
          const dir = sortOrder === 'asc' ? 1 : -1;
          items = [...items].sort((a, b) => {
            let av: number | string | Date = 0;
            let bv: number | string | Date = 0;
            if (sortBy === 'available') { av = a.availableQuantity || 0; bv = b.availableQuantity || 0; }
            if (sortBy === 'minLevel') { av = a.minimumStockLevel || 0; bv = b.minimumStockLevel || 0; }
            if (sortBy === 'lastUpdated') { av = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0; bv = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0; }
            return (av as number) > (bv as number) ? dir : (av as number) < (bv as number) ? -dir : 0;
          });
        }
        setInventory(items);
        setTotalItems(data.total);
        setTotalPages(Math.ceil(data.total / pageSize));
        setCurrentPage(data.page);
      } else {
        setError(
          response.error?.message || "Failed to fetch council inventory"
        );
      }
    } catch (err) {
      setError("An error occurred while fetching inventory data");
      console.error("Council inventory fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const openMinDialog = (item: CouncilInventoryItem) => {
    setMinDialogItem(item);
    setMinDialogOpen(true);
  };

  const closeMinDialog = () => {
    setMinDialogOpen(false);
    setMinDialogItem(null);
  };

  // Reserve action removed

  const mapToNationalItem = (item: CouncilInventoryItem) => ({
    itemId: item.itemId,
    itemName: item.itemName,
    itemCode: item.itemCode,
    itemDescription: item.itemDescription,
    category: item.category,
    unitOfMeasure: item.unitOfMeasure,
    warehouseId: 0,
    warehouseName: 'Council',
    quantityOnHand: item.quantityOnHand,
    reservedQuantity: item.reservedQuantity,
    availableQuantity: item.availableQuantity,
    minimumStockLevel: item.minimumStockLevel,
    lastUpdated: item.lastUpdated,
    isLowStock: item.isLowStock,
  });

  useEffect(() => {
    fetchInventory(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pageSize, sortBy, sortOrder]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchInventory(page);
    }
  };

  const toggleSort = (col: "available" | "minLevel" | "lastUpdated") => {
    if (sortBy === col) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('councilInv.sort', JSON.stringify({ by: col, order: sortOrder === 'asc' ? 'desc' : 'asc' }));
    }
  };

  const handlePageSizeChange = (value: string) => {
    const n = parseInt(value);
    if (!isNaN(n)) {
      setPageSize(n);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('councilInv.pageSize', String(n));
      }
      fetchInventory(1);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return "Not available";
    }
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const getStockStatusBadge = (item: CouncilInventoryItem) => {
    if (item.isLowStock) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Low Stock
        </Badge>
      );
    }
    if ((item.availableQuantity || 0) === 0) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Package className="h-3 w-3" />
          Out of Stock
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="bg-[#007A33] hover:bg-[#005A25]">
        In Stock
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (inventory.length === 0) {
    return (
      <div className={className}>
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No inventory items found
          </h3>
          <p className="text-muted-foreground">
            {Object.keys(filters).length > 0
              ? "Try adjusting your search filters"
              : "No inventory items are currently available"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Details</TableHead>
              <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort('available')}>
                <div className="inline-flex items-center gap-1">Available <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" /></div>
              </TableHead>
              <TableHead className="text-right cursor-pointer select-none hidden sm:table-cell" onClick={() => toggleSort('minLevel')}>
                <div className="inline-flex items-center gap-1">Min Level <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" /></div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell cursor-pointer select-none" onClick={() => toggleSort('lastUpdated')}>
                <div className="inline-flex items-center gap-1">Last Updated <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" /></div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => (
              <TableRow key={`${item.itemId}-${item.councilId}`}>
                <TableCell>
                  <div>
                    <div className="font-medium text-foreground">
                      {item.itemName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.itemCode}
                      {item.category && ` • ${item.category}`}
                    </div>
                    {item.itemDescription && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.itemDescription}
                      </div>
                    )}
                  </div>
                </TableCell>
                {/* On Hand column removed for council view */}
                <TableCell className="text-right">
                  <div className="font-medium">
                    {(item.availableQuantity || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.unitOfMeasure || 'units'}
                  </div>
                </TableCell>
                <TableCell className="text-right hidden sm:table-cell">
                  <div className="font-medium">
                    {(item.minimumStockLevel || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.unitOfMeasure || 'units'}
                  </div>
                </TableCell>
                <TableCell>{getStockStatusBadge(item)}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="text-sm">{formatDate(item.lastUpdated)}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => openMinDialog(item)} className="bg-blue-600 hover:bg-blue-700 text-white">Set Min</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Minimum Stock Dialog (global item threshold) */}
      <MinimumStockDialog
        isOpen={minDialogOpen}
        onClose={closeMinDialog}
        inventoryItem={minDialogItem ? (mapToNationalItem(minDialogItem) as any) : null}
        councilId={councilId || filters.councilId || minDialogItem?.councilId || null}
        onSuccess={() => {
          // Refresh to show updated minimum level
          fetchInventory(currentPage);
          // Notify parent for KPI refresh
          try { onInventoryChanged && onInventoryChanged(); } catch {}
        }}
      />

      {/* Reserve Items Dialog removed */}

      {/* Pagination and page size */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mt-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="page-size" className="text-xs text-muted-foreground">Rows per page</Label>
          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger id="page-size" className="h-8 w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground ml-3">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} items
          </div>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center space-x-2 self-end md:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className={
                      currentPage === page
                        ? "bg-[#007A33] hover:bg-[#005A25]"
                        : ""
                    }
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
