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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useResponsive } from "@/hooks/useResponsive";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Package,
  Truck,
  CheckCircle,
  Clock,
  FileText,
  Eye,
  Settings,
} from "lucide-react";
import { shipmentsApi } from "@/lib/api";
import {
  ShipmentWithDetails,
  ShipmentFilters,
  PaginatedResponse,
} from "@/types";

interface ShipmentTableProps {
  filters?: ShipmentFilters;
  onConfirmReceipt?: (shipmentId: number) => void;
  onViewDetails?: (shipmentId: number) => void;
  onResolveDiscrepancy?: (shipment: ShipmentWithDetails) => void;
  showReceiptActions?: boolean;
  className?: string;
  refreshTrigger?: number;
}

export function ShipmentTable({
  filters = {},
  onConfirmReceipt,
  onViewDetails,
  onResolveDiscrepancy,
  showReceiptActions = false,
  className,
  refreshTrigger,
}: ShipmentTableProps) {
  const { deviceType, isMobile, isTouchDevice } = useResponsive();
  const [shipments, setShipments] = useState<ShipmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const itemsPerPage = 20;

  const fetchShipments = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await shipmentsApi.getShipments(
        page,
        itemsPerPage,
        filters
      );

      if (response.success && response.data) {
        const data = response.data as PaginatedResponse<ShipmentWithDetails>;
        setShipments(data.shipments || data.items || []);
        setTotalItems(data.total);
        setTotalPages(Math.ceil(data.total / itemsPerPage));
        setCurrentPage(data.page);
      } else {
        setError(response.error?.message || "Failed to fetch shipments");
      }
    } catch (err) {
      setError("An error occurred while fetching shipments");
      console.error("Shipments fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments(1);
  }, [filters, refreshTrigger]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchShipments(page);
    }
  };

  const handleDispatch = async (shipmentId: number) => {
    try {
      const response = await shipmentsApi.dispatchShipment(shipmentId);
      if (response.success) {
        // Refresh the table
        fetchShipments(currentPage);
      } else {
        setError(response.error?.message || "Failed to dispatch shipment");
      }
    } catch (err) {
      setError("An error occurred while dispatching shipment");
      console.error("Dispatch shipment error:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isDiscrepancyResolved = (shipment: ShipmentWithDetails) => {
    return shipment.status === "DISCREPANCY" && 
           shipment.discrepancyNotes && 
           shipment.discrepancyNotes.includes("Resolution Notes");
  };

  const getStatusBadge = (shipment: ShipmentWithDetails) => {
    const { status } = shipment;
    
    switch (status) {
      case "DRAFT":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Draft
          </Badge>
        );
      case "IN_TRANSIT":
        return (
          <Badge
            variant="default"
            className="bg-[#005DAA] hover:bg-[#004080] flex items-center gap-1"
          >
            <Truck className="h-3 w-3" />
            In Transit
          </Badge>
        );
      case "RECEIVED":
        return (
          <Badge
            variant="default"
            className="bg-[#007A33] hover:bg-[#005A25] flex items-center gap-1"
          >
            <CheckCircle className="h-3 w-3" />
            Received
          </Badge>
        );
      case "DISCREPANCY":
        if (isDiscrepancyResolved(shipment)) {
          return (
            <Badge 
              variant="default"
              className="bg-orange-500 hover:bg-orange-600 flex items-center gap-1"
            >
              <CheckCircle className="h-3 w-3" />
              Received with Discrepancy
            </Badge>
          );
        } else {
          return (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Discrepancy
            </Badge>
          );
        }
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Mobile Shipment Card Component
  const MobileShipmentCard = ({ shipment }: { shipment: ShipmentWithDetails }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Shipment Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">{shipment.shipmentNumber}</h3>
              <p className="text-sm text-muted-foreground">ID: {shipment.id}</p>
              <div className="mt-1">
                {getStatusBadge(shipment)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails?.(shipment.id)}
                className={cn(isTouchDevice && "min-h-[44px] px-3")}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {shipment.status === "DRAFT" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDispatch(shipment.id)}
                  className={cn(
                    "text-[#005DAA] border-[#005DAA] hover:bg-[#005DAA] hover:text-white",
                    isTouchDevice && "min-h-[44px] px-3"
                  )}
                >
                  <Truck className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Route Information */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">From:</span>
              <span className="font-medium truncate ml-2">{shipment.originWarehouseName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">To:</span>
              <span className="font-medium truncate ml-2">{shipment.destinationCouncilName}</span>
            </div>
          </div>

          {/* Shipment Details Grid */}
          <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
            <div>
              <span className="text-muted-foreground">Items:</span>
              <div className="font-medium">{shipment.totalItems}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Created by:</span>
              <div className="font-medium text-xs">{shipment.createdByName}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Dispatched:</span>
              <div className="font-medium text-xs">
                {shipment.dispatchDate ? formatDate(shipment.dispatchDate) : "Not dispatched"}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Expected:</span>
              <div className="font-medium text-xs">
                {shipment.expectedArrivalDate ? formatDate(shipment.expectedArrivalDate) : "-"}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {(shipment.status === "IN_TRANSIT" && showReceiptActions && onConfirmReceipt) && (
            <Button
              onClick={() => onConfirmReceipt(shipment.id)}
              className="w-full bg-[#007A33] hover:bg-[#005A25]"
              size="sm"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Receipt
            </Button>
          )}
          
          {(shipment.status === "DISCREPANCY" && !isDiscrepancyResolved(shipment) && onResolveDiscrepancy) && (
            <Button
              onClick={() => onResolveDiscrepancy(shipment)}
              variant="outline"
              className="w-full text-orange-600 border-orange-600 hover:bg-orange-600 hover:text-white"
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              Resolve Discrepancy
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className={className}>
        <div className="space-y-4">
          {deviceType === "mobile" ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
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
            ))
          ) : (
            Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className={cn(
            deviceType === "mobile" && "text-sm"
          )}>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (shipments.length === 0) {
    return (
      <div className={className}>
        <Card>
          <CardContent className={cn(
            "pt-6",
            deviceType === "mobile" && "px-4 py-6"
          )}>
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
                No shipments found
              </h3>
              <p className={cn(
                "text-muted-foreground",
                deviceType === "mobile" ? "text-sm" : "text-base"
              )}>
                {Object.keys(filters).length > 0
                  ? deviceType === "mobile" ? "Try adjusting filters" : "Try adjusting your search filters"
                  : "No shipments have been created yet"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {deviceType === "mobile" ? (
        /* Mobile Card View */
        <div className="space-y-4">
          {shipments.map((shipment) => (
            <MobileShipmentCard key={shipment.id} shipment={shipment} />
          ))}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[18%]">Shipment Details</TableHead>
                <TableHead className="w-[20%]">Route</TableHead>
                <TableHead className="w-[15%]">Status & Items</TableHead>
                <TableHead className="w-[22%]">Dates</TableHead>
                <TableHead className="w-[10%]">Creator</TableHead>
                <TableHead className="w-[15%]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.map((shipment) => (
                <TableRow key={shipment.id}>
                  {/* Shipment Details - 18% */}
                  <TableCell className="w-[18%]">
                    <div className="font-medium text-foreground text-sm">
                      {shipment.shipmentNumber}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ID: {shipment.id}
                    </div>
                  </TableCell>
                  
                  {/* Route - 20% */}
                  <TableCell className="w-[20%]">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-foreground truncate">
                        <span className="text-muted-foreground">From:</span> {shipment.originWarehouseName}
                      </div>
                      <div className="text-sm font-medium text-foreground truncate">
                        <span className="text-muted-foreground">To:</span> {shipment.destinationCouncilName}
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Status & Items - 15% */}
                  <TableCell className="w-[15%]">
                    <div className="space-y-2">
                      {getStatusBadge(shipment)}
                      <div className="text-sm">
                        <span className="font-medium">{shipment.totalItems}</span>
                        <span className="text-muted-foreground"> items</span>
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Dates - 22% */}
                  <TableCell className="w-[22%]">
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-muted-foreground">Dispatched:</span>
                        <div className="font-medium">
                          {shipment.dispatchDate ? formatDate(shipment.dispatchDate) : "Not dispatched"}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expected:</span>
                        <div className="font-medium">
                          {shipment.expectedArrivalDate ? formatDate(shipment.expectedArrivalDate) : "-"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Creator - 10% */}
                  <TableCell className="w-[10%]">
                    <div className="text-sm font-medium truncate" title={shipment.createdByName}>
                      {shipment.createdByName}
                    </div>
                  </TableCell>
                  
                  {/* Actions - 15% */}
                  <TableCell className="w-[15%]">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails?.(shipment.id)}
                        title="View Details"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>

                      {shipment.status === "DRAFT" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDispatch(shipment.id)}
                          className="text-[#005DAA] border-[#005DAA] hover:bg-[#005DAA] hover:text-white"
                          title="Dispatch Shipment"
                        >
                          <Truck className="h-3 w-3" />
                        </Button>
                      )}

                      {shipment.status === "IN_TRANSIT" &&
                        showReceiptActions &&
                        onConfirmReceipt && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onConfirmReceipt(shipment.id)}
                            className="text-[#007A33] border-[#007A33] hover:bg-[#007A33] hover:text-white"
                            title="Confirm Receipt"
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}

                      {shipment.status === "DISCREPANCY" &&
                        !isDiscrepancyResolved(shipment) &&
                        onResolveDiscrepancy && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onResolveDiscrepancy(shipment)}
                            className="text-orange-600 border-orange-600 hover:bg-orange-600 hover:text-white"
                            title="Resolve Discrepancy"
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
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
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
            {deviceType === "mobile" ? "items" : "shipments"}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={cn(
                isTouchDevice && "min-h-[44px] px-4"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              {deviceType !== "mobile" && "Previous"}
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(deviceType === "mobile" ? 3 : 5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className={cn(
                      currentPage === page
                        ? "bg-[#007A33] hover:bg-[#005A25]"
                        : "",
                      isTouchDevice && "min-h-[44px] min-w-[44px]"
                    )}
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
              className={cn(
                isTouchDevice && "min-h-[44px] px-4"
              )}
            >
              {deviceType !== "mobile" && "Next"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
