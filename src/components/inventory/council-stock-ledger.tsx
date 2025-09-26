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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package,
  FileText,
} from "lucide-react";
import { ArrowUpDown } from "lucide-react";
import { councilInventoryApi } from "@/lib/api";
import Link from "next/link";
import {
  CouncilStockMovement,
  CouncilMovementFilters,
  PaginatedResponse,
} from "@/types";

interface CouncilStockLedgerProps {
  filters?: CouncilMovementFilters;
  className?: string;
}

export function CouncilStockLedger({
  filters = {},
  className,
}: CouncilStockLedgerProps) {
  const [movements, setMovements] = useState<CouncilStockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [pageSize, setPageSize] = useState<number>(20);
  const [sortBy, setSortBy] = useState<"date" | "quantity" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Load preferences
  useEffect(() => {
    const savedSize = typeof window !== 'undefined' ? window.localStorage.getItem('councilLedger.pageSize') : null;
    if (savedSize) {
      const n = parseInt(savedSize);
      if (!isNaN(n) && [20, 50, 100].includes(n)) setPageSize(n);
    }
    const savedSort = typeof window !== 'undefined' ? window.localStorage.getItem('councilLedger.sort') : null;
    if (savedSort) {
      try {
        const { by, order } = JSON.parse(savedSort);
        if (["date", "quantity"].includes(by)) setSortBy(by);
        if (["asc", "desc"].includes(order)) setSortOrder(order);
      } catch { /* noop */ }
    }
  }, []);

  const fetchMovements = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      let response;
      const councilId = (filters as any)?.councilId;
      if (filters.itemId && councilId) {
        // Use item-specific endpoint to get running balance per movement
        response = await councilInventoryApi.getCouncilItemStockMovements(
          councilId,
          filters.itemId,
          page,
          pageSize,
          { ...(filters as any), sortBy: sortBy || undefined, sortOrder: sortOrder || undefined }
        );
      } else {
        response = await councilInventoryApi.getCouncilStockMovements(
          page,
          pageSize,
          { ...(filters as any), sortBy: sortBy || undefined, sortOrder: sortOrder || undefined }
        );
      }

      if (response.success && response.data) {
        const data = response.data as PaginatedResponse<CouncilStockMovement>;
        // Handle movements array from backend
        let movementsData = (data as any).movements || [];
        // Client-side fallback sort if API ignores sort params
        if (Array.isArray(movementsData) && sortBy) {
          const dir = sortOrder === 'asc' ? 1 : -1;
          movementsData = [...movementsData].sort((a: any, b: any) => {
            if (sortBy === 'date') {
              const av = a.transactionDate ? new Date(a.transactionDate).getTime() : 0;
              const bv = b.transactionDate ? new Date(b.transactionDate).getTime() : 0;
              return av > bv ? dir : av < bv ? -dir : 0;
            }
            if (sortBy === 'quantity') {
              const av = Math.abs(a.quantity || 0);
              const bv = Math.abs(b.quantity || 0);
              return av > bv ? dir : av < bv ? -dir : 0;
            }
            return 0;
          });
        }
        setMovements(Array.isArray(movementsData) ? movementsData as CouncilStockMovement[] : []);
        setTotalItems((data as any).total);
        setTotalPages(Math.ceil((data as any).total / pageSize));
        setCurrentPage((data as any).page);
      } else {
        setError(response.error?.message || "Failed to fetch stock movements");
      }
    } catch (err) {
      setError("An error occurred while fetching movement data");
      console.error("Council stock movements fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pageSize, sortBy, sortOrder]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchMovements(page);
    }
  };

  const toggleSort = (col: "date" | "quantity") => {
    if (sortBy === col) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('councilLedger.sort', JSON.stringify({ by: col, order: sortOrder === 'asc' ? 'desc' : 'asc' }));
    }
  };

  const handlePageSizeChange = (value: string) => {
    const n = parseInt(value);
    if (!isNaN(n)) {
      setPageSize(n);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('councilLedger.pageSize', String(n));
      }
      fetchMovements(1);
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

  const getTransactionTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string; variant: string; icon: any; className?: string }> = {
      "SHIPMENT_RECEIVED": { 
        label: "Received", 
        variant: "default", 
        icon: TrendingUp, 
        className: "bg-[#007A33] hover:bg-[#005A25] text-white" 
      },
      "STOCK_RECEIPT": { 
        label: "Stock Receipt", 
        variant: "default", 
        icon: TrendingUp, 
        className: "bg-[#007A33] hover:bg-[#005A25] text-white" 
      },
      "DISTRIBUTION": { 
        label: "Distributed", 
        variant: "destructive", 
        icon: TrendingDown 
      },
      "SHIPMENT_OUTGOING": { 
        label: "Shipped Out", 
        variant: "destructive", 
        icon: TrendingDown 
      },
      "ADJUSTMENT_INCREASE": { 
        label: "Adjustment (+)", 
        variant: "secondary", 
        icon: TrendingUp, 
        className: "text-green-600 border-green-600" 
      },
      "ADJUSTMENT_DECREASE": { 
        label: "Adjustment (-)", 
        variant: "secondary", 
        icon: TrendingDown, 
        className: "text-red-600 border-red-600" 
      },
      "ADJUSTMENT": { 
        label: "Adjustment", 
        variant: "outline", 
        icon: FileText 
      },
    };

    const config = typeMap[type] || { label: type.replace(/_/g, ' '), variant: "outline", icon: FileText };
    const IconComponent = config.icon;

    return (
      <Badge 
        variant={config.variant as any} 
        className={`flex items-center gap-1 ${config.className || ''}`}
      >
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getReferenceBadge = (movement: CouncilStockMovement) => {
    const type = movement.referenceType;
    const content = (label: string, className?: string) => (
      <Badge variant="outline" className={className}>{label}</Badge>
    );
    if (type === "SHIPMENT" && movement.referenceId) {
      return (
        <Link href={`/warehouse/shipments/${movement.referenceId}`} className="hover:underline">
          {content("Shipment", "text-[#005DAA] border-[#005DAA]")}
        </Link>
      );
    }
    if (type === "DISTRIBUTION" && movement.referenceId) {
      return (
        <Link href={`/distributions/${movement.referenceId}?from=/councils/inventory`} className="hover:underline">
          {content("Distribution", "text-[#A3C940] border-[#A3C940]")}
        </Link>
      );
    }
    if (type === "ADJUSTMENT") return content("Adjustment");
    return content(type);
  };

  const formatQuantity = (movement: CouncilStockMovement) => {
    const quantity = movement.quantity || 0;
    const isIncrease = movement.transactionType === "SHIPMENT_RECEIVED" || 
                      movement.transactionType === "ADJUSTMENT_INCREASE" ||
                      movement.transactionType === "STOCK_RECEIPT";
    
    const isDecrease = movement.transactionType === "DISTRIBUTION" ||
                      movement.transactionType === "ADJUSTMENT_DECREASE" ||
                      movement.transactionType === "SHIPMENT_OUTGOING";

    let displayQuantity = Math.abs(quantity);
    let sign = "";
    let color = "text-gray-600";

    if (isIncrease) {
      sign = "+";
      color = "text-green-600";
    } else if (isDecrease) {
      sign = "-";
      color = "text-red-600";
    }

    return (
      <div className="text-right">
        <span className={`font-medium ${color}`}>
          {sign}{displayQuantity.toLocaleString()}
        </span>
        <div className="text-xs text-muted-foreground">
          {movement.unitOfMeasure || 'units'}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
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

  if (movements.length === 0) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No stock movements found
              </h3>
              <p className="text-muted-foreground">
                {Object.keys(filters).length > 0
                  ? "Try adjusting your search filters"
                  : "No stock movements have been recorded yet"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Stock Movement Ledger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('date')}>
                <div className="inline-flex items-center gap-1">Date & Time <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" /></div>
              </TableHead>
              <TableHead>Item Details</TableHead>
              <TableHead>Council</TableHead>
              <TableHead>Transaction</TableHead>
              <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort('quantity')}>
                <div className="inline-flex items-center gap-1">Quantity <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" /></div>
              </TableHead>
                  <TableHead>Reference</TableHead>
                  {filters.itemId && (
                    <TableHead className="text-right">Running Balance</TableHead>
                  )}
              <TableHead>User</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
                {movements.map((movement, index) => (
                  <TableRow key={movement.transactionId || movement.id || `movement-${index}`}>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {formatDate(movement.transactionDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">
                          {movement.itemName || 'Unknown Item'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {movement.itemCode || 'N/A'}
                        </div>
                        {movement.itemCategory && (
                          <div className="text-xs text-muted-foreground">
                            {movement.itemCategory}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {movement.councilName || (movement as any).localCouncilName || (movement as any).destinationCouncilName || (movement as any).sourceCouncilName || '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTransactionTypeBadge(movement.transactionType)}
                    </TableCell>
                    <TableCell>
                      {formatQuantity(movement)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getReferenceBadge(movement)}
                        {movement.referenceNumber && (
                          <div className="text-xs text-muted-foreground">
                            #{movement.referenceNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {filters.itemId && (
                      <TableCell className="text-right">
                        <div className="font-medium">{typeof (movement as any).balanceAfter === 'number' ? (movement as any).balanceAfter.toLocaleString() : '—'}</div>
                        <div className="text-xs text-muted-foreground">{movement.unitOfMeasure || 'units'}</div>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="text-sm font-medium">
                        {movement.userName || 'System'}
                      </div>
                      {movement.userRole && (
                        <div className="text-xs text-muted-foreground">
                          {movement.userRole}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {movement.notes && (
                        <div className="text-sm text-muted-foreground max-w-xs">
                          <div className="truncate" title={movement.notes}>
                            {movement.notes}
                          </div>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination and page size */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mt-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="ledger-page-size" className="text-xs text-muted-foreground">Rows per page</Label>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger id="ledger-page-size" className="h-8 w-[90px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground ml-3">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} movements
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
        </CardContent>
      </Card>
    </div>
  );
}
