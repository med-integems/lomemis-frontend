"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useResponsive } from "@/hooks/useResponsive";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  Plus,
  Eye,
  Filter,
  Calendar,
  Package,
  Truck,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApiQuery } from "@/hooks/useApi";
import { useFilteredExport, ExportButton, ExportStatus } from "@/components/export";
import { stockReceiptApi, warehousesApi } from "@/lib/api";
import { ReceiptStatusManager } from "@/components/warehouse/ReceiptStatusManager";
import type {
  StockReceiptWithDetails,
  StockReceiptFilters,
  SupplierType,
  ReceiptStatus,
} from "@/types";

export default function WarehouseReceiptsPage() {
  const { user } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [supplierTypeFilter, setSupplierTypeFilter] = useState<string>("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("");
  const [filters, setFilters] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const limit = 10;

  // For National Warehouse Managers, automatically set their warehouse filter
  const effectiveWarehouseFilter = (user?.role as any) === 'national_warehouse_manager' && user?.warehouseId 
    ? user.warehouseId.toString() 
    : warehouseFilter;

  // Build filters for API
  const apiFilters: StockReceiptFilters = {};
  if (searchTerm) {
    apiFilters.supplierName = searchTerm;
  }
  if (statusFilter && statusFilter !== "ALL") {
    apiFilters.status = statusFilter as ReceiptStatus;
  }
  if (supplierTypeFilter && supplierTypeFilter !== "ALL") {
    apiFilters.supplierType = supplierTypeFilter as SupplierType;
  }
  if (effectiveWarehouseFilter && effectiveWarehouseFilter !== "ALL") {
    apiFilters.warehouseId = parseInt(effectiveWarehouseFilter);
  }
  if (filters.startDate) {
    apiFilters.startDate = filters.startDate;
  }
  if (filters.endDate) {
    apiFilters.endDate = filters.endDate;
  }

  // Export hook wired to current filters
  const {
    exportData,
    isExporting,
    error: exportError,
    lastExportCount,
    reset: resetExport,
  } = useFilteredExport<{ receipts: any[] }>({
    apiCall: async (params) => {
      // Adapt current UI filters to backend filters
      const adapted: any = {};
      const f = params?.filters || {};
      if (f.searchTerm) adapted.supplierName = f.searchTerm;
      if (f.statusFilter && f.statusFilter !== "ALL") adapted.status = f.statusFilter;
      if (f.supplierTypeFilter && f.supplierTypeFilter !== "ALL") adapted.supplierType = f.supplierTypeFilter;
      if (f.warehouseFilter && f.warehouseFilter !== "ALL") adapted.warehouseId = parseInt(f.warehouseFilter);
      if (f.startDate) adapted.startDate = f.startDate;
      if (f.endDate) adapted.endDate = f.endDate;

      // Backend caps limit at 100. Paginate to collect up to maxRecords.
      const pageSize = 100;
      const max = params?.maxRecords && params.maxRecords > 0 ? params.maxRecords : 1000;
      let page = 1;
      let collected: any[] = [];
      let total = Infinity;

      while (collected.length < max && (page - 1) * pageSize < total) {
        const res = await stockReceiptApi.getStockReceipts(page, pageSize, adapted);
        if (!res.success) {
          throw new Error(res.error?.message || "Failed to fetch receipts for export");
        }
        const data = res.data || {};
        const batch: any[] = data.receipts || [];
        total = typeof data.total === 'number' ? data.total : batch.length;
        if (batch.length === 0) break;
        collected = collected.concat(batch);
        if (batch.length < pageSize) break; // last page
        page += 1;
      }

      if (collected.length > max) collected = collected.slice(0, max);
      return { success: true, data: collected } as any;
    },
    getCurrentFilters: () => ({
      searchTerm,
      statusFilter,
      supplierTypeFilter,
      warehouseFilter: effectiveWarehouseFilter,
      startDate: filters.startDate,
      endDate: filters.endDate,
    } as any),
    includeFiltersInAPI: true,
    headers: [
      "Receipt Number",
      "Warehouse",
      "Supplier Name",
      "Supplier Type",
      "Delivery Reference",
      "Attachment Count",
      "Has Delivery Note",
      "Status",
      "Receipt Date",
      "Validated Date",
      "Validated By",
      "Created Date",
      "Created By",
      "Item Types",
      "Item Names",
      "Total Items",
      "Total Quantity",
      "Total Value",
      "Status Age (days)",
      "Days to Validate",
      "Discrepancy Notes",
      "Notes",
    ],
    dataTransform: (receipts: any[]) =>
      receipts.map((r) => [
        r.receiptNumber || "",
        r.warehouseName || "",
        r.supplierName || "",
        (r.supplierType || "").toString().replace(/_/g, " "),
        r.deliveryReference || "",
        String(r.attachmentCount ?? 0),
        (r.hasDeliveryNote ? 'Yes' : 'No'),
        (r.status || "").toString().replace(/_/g, " "),
        r.receiptDate ? new Date(r.receiptDate).toLocaleDateString() : "",
        r.validationDate ? new Date(r.validationDate).toLocaleDateString() : "",
        r.validatedByName || "",
        r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "",
        r.receivedByName || "",
        (Array.isArray(r.items) ? String(r.items.length) : String(r.totalItems ?? '')),
        (Array.isArray(r.items) ? r.items.map((it:any)=>it.itemName).filter(Boolean).join('; ') : ''),
        String(r.totalItems ?? 0),
        String(r.totalQuantity ?? 0),
        (r.totalValue != null ? Number(r.totalValue).toFixed(2) : "0.00"),
        String(r.statusAgeDays ?? 0),
        r.daysToValidate != null ? String(r.daysToValidate) : "",
        r.discrepancyNotes || "",
        r.notes || "",
      ]),
    filename: `warehouse-receipts-${new Date().toISOString().split("T")[0]}.csv`,
    maxRecords: 5000,
  });

  // Fetch stock receipts with pagination and filtering
  const {
    data: receiptsResponse,
    isLoading: loading,
    error: apiError,
    refetch,
  } = useApiQuery(
    ["stock-receipts", currentPage, limit, apiFilters],
    () => stockReceiptApi.getStockReceipts(currentPage, limit, apiFilters),
    {}
  );

  // Fetch statistics for dashboard
  const { data: statisticsResponse } = useApiQuery(
    ["stock-receipts-statistics", apiFilters],
    () =>
      stockReceiptApi.getReceiptStatistics({
        warehouseId: apiFilters.warehouseId,
        startDate: apiFilters.startDate,
        endDate: apiFilters.endDate,
      }),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch warehouses for filter dropdown
  const { data: warehousesResponse } = useApiQuery(
    ["warehouses"],
    () => warehousesApi.getWarehouses(1, 100, { isActive: true }),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const receipts = (receiptsResponse as any)?.success
    ? (receiptsResponse as any).data?.receipts || []
    : [];
  const totalReceipts = (receiptsResponse as any)?.success
    ? (receiptsResponse as any).data?.total || 0
    : 0;
  const totalPages = Math.ceil(totalReceipts / limit);
  const statistics = (statisticsResponse as any)?.success
    ? (statisticsResponse as any).data
    : null;
  const warehouses = (warehousesResponse as any)?.success
    ? (warehousesResponse as any).data?.warehouses || []
    : [];
  const error = apiError ? "Failed to load stock receipts" : null;

  const getStatusBadge = (status: string) => {
    if (!status) return "bg-gray-100 text-gray-800 border-gray-200";
    const statusColors = {
      DRAFT: "bg-gray-100 text-gray-800 border-gray-200",
      RECEIVED: "bg-blue-100 text-blue-800 border-blue-200",
      VALIDATED: "bg-green-100 text-green-800 border-green-200",
      DISCREPANCY: "bg-red-100 text-red-800 border-red-200",
    };
    return (
      statusColors[status as keyof typeof statusColors] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  const getSupplierTypeBadge = (type: string) => {
    if (!type) return "bg-gray-100 text-gray-800 border-gray-200";
    const typeColors = {
      GOVERNMENT: "bg-emerald-100 text-emerald-800 border-emerald-200",
      NGO: "bg-blue-100 text-blue-800 border-blue-200",
      CHARITY: "bg-pink-100 text-pink-800 border-pink-200",
      INTERNATIONAL_DONOR: "bg-indigo-100 text-indigo-800 border-indigo-200",
      PRIVATE: "bg-orange-100 text-orange-800 border-orange-200",
      OTHER: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return (
      typeColors[type as keyof typeof typeColors] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  // Reset to first page when filters change
  const resetToFirstPage = () => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  // Effect to reset page when filters change
  React.useEffect(() => {
    resetToFirstPage();
  }, [
    searchTerm,
    statusFilter,
    supplierTypeFilter,
    effectiveWarehouseFilter,
    filters.startDate,
    filters.endDate,
  ]);

  const handleViewReceipt = (receiptId: number) => {
    router.push(`/warehouse/receipts/${receiptId}`);
  };

  const handleCreateReceipt = () => {
    router.push("/warehouse/receipts/create");
  };

  if (loading) {
    return (
      <div className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-between items-center'}`}>
          <div>
            <Skeleton className={`h-8 ${isMobile ? 'w-48' : 'w-64'}`} />
            <Skeleton className={`h-4 ${isMobile ? 'w-64' : 'w-96'} mt-2`} />
          </div>
          {!isMobile && <Skeleton className="h-10 w-40" />}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-between items-center'}`}>
        <div className="flex-1 min-w-0">
          <h1 className={`${isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900`}>
            {isMobile ? "Stock Receipts" : "Warehouse Stock Receipts"}
          </h1>
          <p className={`mt-2 ${isMobile ? 'text-sm' : 'text-sm'} text-gray-600`}>
            {isMobile 
              ? "Manage incoming stock and deliveries"
              : "Manage incoming stock receipts and track deliveries from suppliers"
            }
          </p>
        </div>
        <div className={`flex items-center ${isMobile ? 'w-full space-x-2 mt-2' : 'space-x-2'}`}>
          <ExportButton
            onExport={exportData}
            isExporting={isExporting}
            tooltip={`Export receipts${searchTerm ? ' (with current search)' : ''}`}
            showProgress={true}
          />
          {(user?.role === "super_admin" || user?.role === "national_manager") && (
            <Button
              onClick={handleCreateReceipt}
              className={`bg-green-600 hover:bg-green-700 ${isMobile ? 'h-12' : ''}`}
            >
              <Plus className="w-4 h-4 mr-2" />
              {isMobile ? "New" : "New Receipt"}
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className={`grid gap-3 sm:gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
          <Card>
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className="flex items-center">
                <Package className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-blue-600 flex-shrink-0`} />
                <div className={`${isMobile ? 'ml-2' : 'ml-4'} flex-1 min-w-0`}>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>
                    {isMobile ? "Total" : "Total Receipts"}
                  </p>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 truncate`}>
                    {statistics.totalReceipts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className="flex items-center">
                <CheckCircle className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-green-600 flex-shrink-0`} />
                <div className={`${isMobile ? 'ml-2' : 'ml-4'} flex-1 min-w-0`}>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Validated</p>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 truncate`}>
                    {statistics.validatedReceipts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className="flex items-center">
                <Clock className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-yellow-600 flex-shrink-0`} />
                <div className={`${isMobile ? 'ml-2' : 'ml-4'} flex-1 min-w-0`}>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Pending</p>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 truncate`}>
                    {statistics.draftReceipts + statistics.receivedReceipts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className="flex items-center">
                <AlertTriangle className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-red-600 flex-shrink-0`} />
                <div className={`${isMobile ? 'ml-2' : 'ml-4'} flex-1 min-w-0`}>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>
                    {isMobile ? "Issues" : "Discrepancies"}
                  </p>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 truncate`}>
                    {statistics.discrepancyReceipts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Filter className="w-5 h-5 mr-2" />
            Filter Receipts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Export status feedback */}
          <div className="mb-4">
            <ExportStatus
              isExporting={isExporting}
              error={exportError}
              lastExportCount={lastExportCount}
              onRetry={exportData}
              onReset={resetExport}
              compact={true}
            />
          </div>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
            <div className="space-y-2">
              <Label htmlFor="search" className={`${isMobile ? 'text-sm' : ''}`}>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder={isMobile ? "Search..." : "Search by reference, supplier..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 ${isMobile ? 'text-base' : ''}`}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className={`${isMobile ? 'text-sm' : ''}`}>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={`${isMobile ? 'text-base' : ''}`}>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="RECEIVED">Received</SelectItem>
                  <SelectItem value="VALIDATED">Validated</SelectItem>
                  <SelectItem value="DISCREPANCY">Discrepancy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-type" className={`${isMobile ? 'text-sm' : ''}`}>
                {isMobile ? "Type" : "Supplier Type"}
              </Label>
              <Select
                value={supplierTypeFilter}
                onValueChange={setSupplierTypeFilter}
              >
                <SelectTrigger className={`${isMobile ? 'text-base' : ''}`}>
                  <SelectValue placeholder={isMobile ? "All Types" : "All Supplier Types"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="GOVERNMENT">Government</SelectItem>
                  <SelectItem value="NGO">NGO</SelectItem>
                  <SelectItem value="CHARITY">Charity</SelectItem>
                  <SelectItem value="INTERNATIONAL_DONOR">
                    International Donor
                  </SelectItem>
                  <SelectItem value="PRIVATE_COMPANY">
                    Private Company
                  </SelectItem>
                  <SelectItem value="INDIVIDUAL_DONOR">
                    Individual Donor
                  </SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Hide warehouse filter for National Warehouse Managers - they can only see their own warehouse */}
            {!(user?.role === 'national_manager' && user?.warehouseId) && (
              <div className="space-y-2">
                <Label htmlFor="warehouse" className={`${isMobile ? 'text-sm' : ''}`}>Warehouse</Label>
                <Select
                  value={warehouseFilter}
                  onValueChange={setWarehouseFilter}
                >
                  <SelectTrigger className={`${isMobile ? 'text-base' : ''}`}>
                    <SelectValue placeholder={isMobile ? "All" : "All Warehouses"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Warehouses</SelectItem>
                    {warehouses.map((warehouse: any) => (
                      <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                        <div className="flex flex-col">
                          <span>{warehouse.name}</span>
                          {warehouse.location && (
                            <span className="text-xs text-muted-foreground">
                              {warehouse.location}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Date Range Filters */}
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4 mt-4`}>
            <div className="space-y-2">
              <Label htmlFor="start-date" className={`${isMobile ? 'text-sm' : ''}`}>Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={filters.startDate || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className={`${isMobile ? 'text-base' : ''}`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date" className={`${isMobile ? 'text-sm' : ''}`}>End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={filters.endDate || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className={`${isMobile ? 'text-base' : ''}`}
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className={`flex items-center ${isMobile ? 'flex-col gap-3' : 'justify-between'} mt-4`}>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
                setSupplierTypeFilter("ALL");
                setWarehouseFilter("ALL");
                setFilters({});
              }}
              className={`${isMobile ? 'w-full h-12' : ''}`}
            >
              Clear Filters
            </Button>
            <Button 
              onClick={() => refetch()}
              className={`${isMobile ? 'w-full h-12' : ''}`}
            >
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Status Management - Only show for authorized users */}
      {(user?.role === "super_admin" || user?.role === "national_manager") &&
        receipts.length > 0 && (
          <ReceiptStatusManager
            receipts={receipts.map((receipt: any) => ({
              id: receipt.id,
              receiptNumber: receipt.receiptNumber,
              supplierName: receipt.supplierName,
              status: receipt.status || "DRAFT",
              totalItems: receipt.totalItems,
              receiptDate: receipt.receiptDate,
              warehouseName: receipt.warehouseName,
            }))}
            onStatusUpdate={() => refetch()}
          />
        )}

      {/* Receipts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Stock Receipts ({receipts.length})
            </div>
          </CardTitle>
          <CardDescription>
            Track and manage all incoming stock receipts from various suppliers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {receipts.length === 0 ? (
            <div className="text-center py-8">
              <Package className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} text-gray-400 mx-auto mb-4`} />
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-900 mb-2`}>
                No receipts found
              </h3>
              <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-500 mb-4`}>
                {totalReceipts === 0
                  ? "No stock receipts have been created yet."
                  : "No receipts match your current filters."}
              </p>
              {(user?.role === "super_admin" ||
                user?.role === "national_manager") &&
                totalReceipts === 0 && (
                  <Button
                    onClick={handleCreateReceipt}
                    className={`bg-green-600 hover:bg-green-700 ${isMobile ? 'w-full h-12' : ''}`}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Receipt
                  </Button>
                )}
            </div>
          ) : (
            <>
              {isMobile ? (
                <div className="space-y-3">
                  {receipts.map((receipt: any) => (
                    <Card key={receipt.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold mb-1 truncate">
                            {receipt.receiptNumber}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">
                            {receipt.supplierName}
                          </p>
                          {receipt.supplierOrganization && (
                            <p className="text-xs text-gray-500 truncate">
                              {receipt.supplierOrganization}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <Badge
                            className={getStatusBadge(receipt.status || "")}
                          >
                            {(receipt.status || "")
                              .replace("_", " ")
                              .toUpperCase()}
                          </Badge>
                          <Badge
                            className={getSupplierTypeBadge(
                              receipt.supplierType || ""
                            )}
                          >
                            {(receipt.supplierType || "").replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm border-t pt-3">
                        <div>
                          <p className="text-gray-500">Items</p>
                          <p className="font-medium">{receipt.totalItems}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Date</p>
                          <p className="font-medium">
                            {new Date(receipt.receiptDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-500">Warehouse</p>
                          <p className="font-medium truncate">{receipt.warehouseName}</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t">
                        <Button
                          variant="outline"
                          onClick={() => handleViewReceipt(receipt.id)}
                          className="w-full h-12 text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference #</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Receipt Date</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receipts.map((receipt: any) => (
                        <TableRow key={receipt.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {receipt.receiptNumber}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {receipt.supplierName}
                              </div>
                              {receipt.supplierOrganization && (
                                <div className="text-sm text-gray-500">
                                  {receipt.supplierOrganization}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getSupplierTypeBadge(
                                receipt.supplierType || ""
                              )}
                            >
                              {(receipt.supplierType || "").replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getStatusBadge(receipt.status || "")}
                            >
                              {(receipt.status || "")
                                .replace("_", " ")
                                .toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>{receipt.totalItems}</TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                              {new Date(receipt.receiptDate).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <Truck className="w-4 h-4 mr-1 text-gray-400" />
                              {receipt.warehouseName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewReceipt(receipt.id)}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={`flex items-center ${isMobile ? 'flex-col space-y-3' : 'justify-between'} mt-6`}>
                  <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-700 ${isMobile ? 'order-2' : ''}`}>
                    Showing {(currentPage - 1) * limit + 1} to{" "}
                    {Math.min(currentPage * limit, totalReceipts)} of{" "}
                    {totalReceipts} receipts
                  </div>
                  <div className={`flex items-center ${isMobile ? 'space-x-1 order-1' : 'space-x-2'}`}>
                    <Button
                      variant="outline"
                      size={isMobile ? "sm" : "sm"}
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className={`${isMobile ? 'px-2' : ''}`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      {!isMobile && "Previous"}
                    </Button>

                    {!isMobile && (
                      <div className="flex items-center space-x-1">
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={
                                  currentPage === pageNum ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="w-8 h-8 p-0"
                              >
                                {pageNum}
                              </Button>
                            );
                          }
                        )}
                      </div>
                    )}

                    {isMobile && (
                      <span className="text-sm font-medium px-3">
                        {currentPage} / {totalPages}
                      </span>
                    )}

                    <Button
                      variant="outline"
                      size={isMobile ? "sm" : "sm"}
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className={`${isMobile ? 'px-2' : ''}`}
                    >
                      {!isMobile && "Next"}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
