"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Truck,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Package,
  School,
  Calendar,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useResponsive } from "@/hooks/useResponsive";
import {
  DirectShipmentWithDetails,
  DirectShipmentFilters,
  ShipmentStatus,
  ShipmentType,
  PriorityLevel,
  Warehouse,
} from "@/types";
import { directShipmentsApi, warehousesApi } from "@/lib/api";
import Link from "next/link";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  dispatched: {
    label: "Dispatched",
    color: "bg-blue-100 text-blue-800",
    icon: Truck,
  },
  in_transit: {
    label: "In Transit",
    color: "bg-purple-100 text-purple-800",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-green-200 text-green-900",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
};

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "bg-gray-100 text-gray-800" },
  normal: { label: "Normal", color: "bg-blue-100 text-blue-800" },
  high: { label: "High", color: "bg-yellow-100 text-yellow-800" },
  urgent: { label: "Urgent", color: "bg-orange-100 text-orange-800" },
  critical: { label: "Critical", color: "bg-red-100 text-red-800" },
};

const TYPE_CONFIG = {
  emergency: {
    label: "Emergency",
    color: "bg-red-100 text-red-800",
    icon: AlertTriangle,
  },
  special_program: {
    label: "Special Program",
    color: "bg-blue-100 text-blue-800",
    icon: Package,
  },
  direct_allocation: {
    label: "Direct Allocation",
    color: "bg-green-100 text-green-800",
    icon: School,
  },
  pilot_program: {
    label: "Pilot Program",
    color: "bg-purple-100 text-purple-800",
    icon: Package,
  },
  disaster_relief: {
    label: "Disaster Relief",
    color: "bg-orange-100 text-orange-800",
    icon: AlertTriangle,
  },
};

export default function DirectShipmentsPage() {
  const { user } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [shipments, setShipments] = useState<DirectShipmentWithDetails[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Filters
  const [filters, setFilters] = useState<DirectShipmentFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedShipments, setSelectedShipments] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Check permissions
  const canCreateShipments =
    user?.role === "super_admin" || user?.role === "national_manager";
  const canViewAllShipments =
    user?.role === "super_admin" ||
    user?.role === "national_manager" ||
    user?.role === "view_only";

  useEffect(() => {
    loadShipments();
    loadWarehouses();
  }, [currentPage, filters]);

  const loadShipments = async () => {
    setLoading(true);
    try {
      const response = await directShipmentsApi.getDirectShipments(
        currentPage,
        pageSize,
        filters
      );

      if (response.success && response.data) {
        setShipments(response.data);
        setTotalItems((response as any)?.pagination?.total || (response as any)?.data?.total || 0);
      } else {
        toast.error(
          response.error?.message || "Failed to load direct shipments"
        );
      }
    } catch (error) {
      console.error("Error loading shipments:", error);
      toast.error("Failed to load direct shipments");
    } finally {
      setLoading(false);
    }
  };

  const loadWarehouses = async () => {
    try {
      const response = await warehousesApi.getWarehouses(1, 100);
      if (response.success && response.data?.warehouses) {
        setWarehouses(response.data.warehouses);
      }
    } catch (error) {
      console.error("Error loading warehouses:", error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters((prev) => ({ ...prev, search: value || undefined }));
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: status === "all" ? undefined : (status as ShipmentStatus),
    }));
    setCurrentPage(1);
  };

  const handleWarehouseFilter = (warehouseId: string) => {
    setFilters((prev) => ({
      ...prev,
      warehouseId: warehouseId === "all" ? undefined : parseInt(warehouseId),
    }));
    setCurrentPage(1);
  };

  const handleTypeFilter = (type: string) => {
    setFilters((prev) => ({
      ...prev,
      shipmentType: type === "all" ? undefined : (type as ShipmentType),
    }));
    setCurrentPage(1);
  };

  const handlePriorityFilter = (priority: string) => {
    setFilters((prev) => ({
      ...prev,
      priorityLevel:
        priority === "all" ? undefined : (priority as PriorityLevel),
    }));
    setCurrentPage(1);
  };

  const handleDateRangeFilter = (from: string, to: string) => {
    setDateRange({ from, to });
    setFilters((prev) => ({
      ...prev,
      startDate: from || undefined,
      endDate: to || undefined,
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
    setDateRange({ from: "", to: "" });
    setCurrentPage(1);
  };

  const handleBulkAction = async (action: string, selectedIds: number[]) => {
    if (selectedIds.length === 0) {
      toast.error("Please select shipments to perform bulk action");
      return;
    }

    try {
      switch (action) {
        case "dispatch":
          // Implement bulk dispatch
          for (const id of selectedIds) {
            await directShipmentsApi.dispatchDirectShipment(id);
          }
          toast.success(
            `${selectedIds.length} shipments dispatched successfully`
          );
          break;
        case "cancel":
          // Implement bulk cancel
          for (const id of selectedIds) {
            await directShipmentsApi.updateDirectShipmentStatus(id, {
              status: "cancelled",
            });
          }
          toast.success(
            `${selectedIds.length} shipments cancelled successfully`
          );
          break;
        default:
          toast.error("Unknown action");
          return;
      }
      loadShipments(); // Reload data
    } catch (error) {
      console.error("Bulk action error:", error);
      toast.error("Failed to perform bulk action");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedShipments(shipments.map((s) => s.id));
    } else {
      setSelectedShipments([]);
    }
  };

  const handleSelectShipment = (shipmentId: number, checked: boolean) => {
    if (checked) {
      setSelectedShipments((prev) => [...prev, shipmentId]);
    } else {
      setSelectedShipments((prev) => prev.filter((id) => id !== shipmentId));
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: ShipmentStatus) => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: PriorityLevel) => {
    const config = PRIORITY_CONFIG[priority];
    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: ShipmentType) => {
    const config = TYPE_CONFIG[type];
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (!canViewAllShipments && user?.role !== "school_rep") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Access Denied
          </h3>
          <p className="text-gray-600">
            You don&apos;t have permission to view direct shipments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-start lg:space-y-0 px-4 lg:px-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Direct Shipments
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Manage direct warehouse-to-school shipments
          </p>
        </div>
        {canCreateShipments && (
          <Link href="/warehouse/direct-shipments/create">
            <Button className="bg-green-600 hover:bg-green-700 min-h-[48px] lg:min-h-[40px] w-full lg:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create Direct Shipment
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card className="mx-4 lg:mx-0">
        <CardHeader>
          <CardTitle className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span className="text-lg lg:text-xl">Filters</span>
            </div>
            <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px] lg:min-h-[32px] text-sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                {showAdvancedFilters ? "Hide" : "Show"} Advanced
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="min-h-[44px] lg:min-h-[32px] text-sm"
                onClick={clearFilters}
              >
                Clear All
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Basic Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search shipments..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 min-h-[48px] lg:min-h-[40px]"
                />
              </div>

              <Select
                value={filters.status || "all"}
                onValueChange={handleStatusFilter}
              >
                <SelectTrigger className="min-h-[48px] lg:min-h-[40px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.warehouseId?.toString() || "all"}
                onValueChange={handleWarehouseFilter}
              >
                <SelectTrigger className="min-h-[48px] lg:min-h-[40px]">
                  <SelectValue placeholder="All Warehouses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {warehouses.map((warehouse) => (
                    <SelectItem
                      key={warehouse.id}
                      value={warehouse.id.toString()}
                    >
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.shipmentType || "all"}
                onValueChange={handleTypeFilter}
              >
                <SelectTrigger className="min-h-[48px] lg:min-h-[40px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(TYPE_CONFIG).map(([type, config]) => (
                    <SelectItem key={type} value={type}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.priorityLevel || "all"}
                onValueChange={handlePriorityFilter}
              >
                <SelectTrigger className="min-h-[48px] lg:min-h-[40px]">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => (
                    <SelectItem key={priority} value={priority}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="dateFrom">Created From</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={dateRange.from}
                      onChange={(e) =>
                        handleDateRangeFilter(e.target.value, dateRange.to)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateTo">Created To</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={dateRange.to}
                      onChange={(e) =>
                        handleDateRangeFilter(dateRange.from, e.target.value)
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="flex space-x-2">
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-700"
                      >
                        Emergency:{" "}
                        {
                          shipments.filter(
                            (s) =>
                              s.priorityLevel === "critical" ||
                              s.shipmentType === "emergency"
                          ).length
                        }
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-yellow-50 text-yellow-700"
                      >
                        Urgent:{" "}
                        {
                          shipments.filter((s) => s.priorityLevel === "urgent")
                            .length
                        }
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6 px-4 lg:px-0">
        <Card>
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">
                  Total Shipments
                </p>
                <p className="text-lg lg:text-2xl font-bold">{totalItems}</p>
              </div>
              <Package className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">
                  In Transit
                </p>
                <p className="text-lg lg:text-2xl font-bold">
                  {
                    shipments.filter(
                      (s) =>
                        s.status === "dispatched" || s.status === "in_transit"
                    ).length
                  }
                </p>
              </div>
              <Truck className="h-6 w-6 lg:h-8 lg:w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">
                  Delivered
                </p>
                <p className="text-lg lg:text-2xl font-bold">
                  {
                    shipments.filter(
                      (s) =>
                        s.status === "delivered" || s.status === "confirmed"
                    ).length
                  }
                </p>
              </div>
              <CheckCircle className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">
                  Pending
                </p>
                <p className="text-lg lg:text-2xl font-bold">
                  {shipments.filter((s) => s.status === "pending").length}
                </p>
              </div>
              <Clock className="h-6 w-6 lg:h-8 lg:w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shipments Table */}
      <Card className="mx-4 lg:mx-0">
        <CardHeader>
          <CardTitle className="text-lg lg:text-xl">Direct Shipments ({totalItems})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-3">Loading shipments...</span>
            </div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No Direct Shipments
              </h3>
              <p className="text-muted-foreground mb-4">
                {Object.keys(filters).length > 0
                  ? "No shipments match your current filters."
                  : "No direct shipments have been created yet."}
              </p>
              {canCreateShipments && Object.keys(filters).length === 0 && (
                <Link href="/warehouse/direct-shipments/create">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Direct Shipment
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Bulk Actions */}
              {selectedShipments.length > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">
                        {selectedShipments.length} shipment
                        {selectedShipments.length > 1 ? "s" : ""} selected
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {canCreateShipments && (
                        <>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleBulkAction("dispatch", selectedShipments)
                            }
                            disabled={
                              !selectedShipments.some((id) => {
                                const shipment = shipments.find(
                                  (s) => s.id === id
                                );
                                return shipment?.status === "pending";
                              })
                            }
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Dispatch Selected
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleBulkAction("cancel", selectedShipments)
                            }
                            disabled={
                              !selectedShipments.some((id) => {
                                const shipment = shipments.find(
                                  (s) => s.id === id
                                );
                                return shipment?.status === "pending";
                              })
                            }
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancel Selected
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedShipments([])}
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {isMobile ? (
                // Mobile Card Layout
                <div className="space-y-4">
                  {selectedShipments.length === 0 && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Select all shipments</span>
                      <Checkbox
                        checked={selectedShipments.length === shipments.length && shipments.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </div>
                  )}
                  {shipments.map((shipment) => (
                    <Card key={shipment.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <Checkbox
                                checked={selectedShipments.includes(shipment.id)}
                                onCheckedChange={(checked) =>
                                  handleSelectShipment(shipment.id, checked as boolean)
                                }
                              />
                              <h3 className="font-medium text-sm truncate">
                                {shipment.referenceNumber}
                              </h3>
                            </div>
                            <p className="text-xs text-muted-foreground">ID: {shipment.id}</p>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            {getStatusBadge(shipment.status)}
                            {(shipment.priorityLevel === "critical" ||
                              shipment.priorityLevel === "urgent" ||
                              shipment.shipmentType === "emergency") && (
                              <Badge variant="outline" className="bg-red-50 text-red-700 text-xs">
                                {shipment.priorityLevel === "critical" ||
                                shipment.shipmentType === "emergency"
                                  ? "EMERGENCY"
                                  : "URGENT"}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">From</p>
                            <p className="font-medium truncate">{shipment.warehouseName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">To</p>
                            <p className="font-medium truncate">{shipment.schoolName}</p>
                            {shipment.schoolCode && (
                              <p className="text-xs text-muted-foreground">{shipment.schoolCode}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {getTypeBadge(shipment.shipmentType)}
                            {getPriorityBadge(shipment.priorityLevel)}
                          </div>
                          <div className="flex items-center space-x-1 text-sm">
                            <Package className="h-3 w-3" />
                            <span>{shipment.totalItems}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground mb-3">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Created: {formatDate(shipment.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Delivery: {formatDate(shipment.expectedDeliveryDate)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex items-center space-x-2">
                            {canCreateShipments && shipment.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBulkAction("dispatch", [shipment.id])}
                                className="h-8 px-2 text-xs"
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Dispatch
                              </Button>
                            )}
                          </div>
                          <Link href={`/warehouse/direct-shipments/${shipment.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                // Desktop Table Layout
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              selectedShipments.length === shipments.length &&
                              shipments.length > 0
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>From Warehouse</TableHead>
                        <TableHead>To School</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Expected Delivery</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {shipments.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedShipments.includes(shipment.id)}
                            onCheckedChange={(checked) =>
                              handleSelectShipment(
                                shipment.id,
                                checked as boolean
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {shipment.referenceNumber}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {shipment.id}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="font-medium">
                            {shipment.warehouseName}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="font-medium">
                            {shipment.schoolName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {shipment.schoolCode}
                          </div>
                        </TableCell>

                        <TableCell>
                          {getTypeBadge(shipment.shipmentType)}
                        </TableCell>

                        <TableCell>{getStatusBadge(shipment.status)}</TableCell>

                        <TableCell>
                          {getPriorityBadge(shipment.priorityLevel)}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Package className="h-4 w-4" />
                            <span>{shipment.totalItems}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(shipment.createdAt)}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {formatDate(shipment.expectedDeliveryDate)}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {/* Quick Action Buttons */}
                            {canCreateShipments &&
                              shipment.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleBulkAction("dispatch", [shipment.id])
                                  }
                                  className="h-8 px-2"
                                >
                                  <Send className="h-3 w-3" />
                                </Button>
                              )}

                            {/* Emergency/Priority Indicator */}
                            {(shipment.priorityLevel === "critical" ||
                              shipment.priorityLevel === "urgent" ||
                              shipment.shipmentType === "emergency") && (
                              <Badge
                                variant="outline"
                                className="bg-red-50 text-red-700 text-xs"
                              >
                                {shipment.priorityLevel === "critical" ||
                                shipment.shipmentType === "emergency"
                                  ? "EMERGENCY"
                                  : "URGENT"}
                              </Badge>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/warehouse/direct-shipments/${shipment.id}`}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>

                                {canCreateShipments &&
                                  shipment.status === "pending" && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleBulkAction("dispatch", [
                                            shipment.id,
                                          ])
                                        }
                                      >
                                        <Send className="h-4 w-4 mr-2" />
                                        Dispatch Now
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleBulkAction("cancel", [
                                            shipment.id,
                                          ])
                                        }
                                        className="text-red-600"
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Cancel Shipment
                                      </DropdownMenuItem>
                                    </>
                                  )}

                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalItems > pageSize && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, totalItems)} of {totalItems}{" "}
                shipments
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from(
                    { length: Math.min(5, Math.ceil(totalItems / pageSize)) },
                    (_, i) => {
                      const pageNum = i + 1;
                      const totalPages = Math.ceil(totalItems / pageSize);

                      // Show first 2, current page +/- 1, and last 2 pages
                      if (
                        pageNum <= 2 ||
                        pageNum >= totalPages - 1 ||
                        (pageNum >= currentPage - 1 &&
                          pageNum <= currentPage + 1)
                      ) {
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
                      } else if (pageNum === 3 && currentPage > 4) {
                        return (
                          <span key={pageNum} className="px-2">
                            ...
                          </span>
                        );
                      } else if (
                        pageNum === totalPages - 2 &&
                        currentPage < totalPages - 3
                      ) {
                        return (
                          <span key={pageNum} className="px-2">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(Math.ceil(totalItems / pageSize), prev + 1)
                    )
                  }
                  disabled={currentPage >= Math.ceil(totalItems / pageSize)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
