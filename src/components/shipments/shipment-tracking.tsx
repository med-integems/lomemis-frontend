"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
// Timeline components replaced with simple div structure
import {
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
  User,
  Calendar,
  History,
  FileText,
  Loader2,
} from "lucide-react";
import { shipmentsApi } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

interface ShipmentTrackingProps {
  shipmentId: number;
  shipment?: any;
  onStatusUpdate?: () => void;
}

export function ShipmentTracking({
  shipmentId,
  shipment: initialShipment,
  onStatusUpdate,
}: ShipmentTrackingProps) {
  const [shipment, setShipment] = useState(initialShipment);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(!initialShipment);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Load shipment details if not provided
  useEffect(() => {
    if (!initialShipment && shipmentId) {
      const fetchShipment = async () => {
        try {
          setLoading(true);
          const response = await shipmentsApi.getShipmentById(shipmentId);
          if (response.success) {
            setShipment(response.data);
          }
        } catch (error) {
          console.error("Error fetching shipment:", error);
          toast.error("Failed to load shipment details");
        } finally {
          setLoading(false);
        }
      };

      fetchShipment();
    }
  }, [shipmentId, initialShipment]);

  // Load status history
  const loadStatusHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await shipmentsApi.getShipmentStatusHistory(shipmentId);
      if (response.success) {
        setStatusHistory(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching status history:", error);
      toast.error("Failed to load status history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>;
      case "IN_TRANSIT":
        return <Badge variant="default">In Transit</Badge>;
      case "RECEIVED":
        return <Badge variant="success">Received</Badge>;
      case "DISCREPANCY":
        return <Badge variant="destructive">Discrepancy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <FileText className="h-4 w-4" />;
      case "IN_TRANSIT":
        return <Truck className="h-4 w-4" />;
      case "RECEIVED":
        return <CheckCircle className="h-4 w-4" />;
      case "DISCREPANCY":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "text-gray-500";
      case "IN_TRANSIT":
        return "text-blue-500";
      case "RECEIVED":
        return "text-green-500";
      case "DISCREPANCY":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading shipment details...</span>
        </CardContent>
      </Card>
    );
  }

  if (!shipment) {
    return (
      <Card>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Shipment not found or failed to load.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Shipment Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Shipment {shipment.shipmentNumber}
            </CardTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge(shipment.status)}
              <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadStatusHistory}
                  >
                    <History className="h-4 w-4 mr-2" />
                    History
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Shipment Status History</DialogTitle>
                    <DialogDescription>
                      Track all status changes for shipment{" "}
                      {shipment.shipmentNumber}
                    </DialogDescription>
                  </DialogHeader>

                  {historyLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading history...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {statusHistory.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                          No status history available
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {statusHistory.map((entry, index) => (
                            <div
                              key={entry.id}
                              className="flex gap-4 p-4 border rounded-lg"
                            >
                              <div
                                className={`flex-shrink-0 ${getStatusColor(
                                  entry.status
                                )}`}
                              >
                                {getStatusIcon(entry.status)}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">
                                  Status changed to {entry.status}
                                </div>
                                <div className="space-y-1 mt-2">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    {entry.changedByName}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    {formatDateTime(entry.changed_at)}
                                  </div>
                                  {entry.notes && (
                                    <div className="text-sm text-muted-foreground mt-2">
                                      {entry.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MapPin className="h-4 w-4" />
                Origin
              </div>
              <div className="font-medium">{shipment.originWarehouseName}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MapPin className="h-4 w-4" />
                Destination
              </div>
              <div className="font-medium">
                {shipment.destinationCouncilName}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                Created
              </div>
              <div className="font-medium">
                {formatDate(shipment.createdAt)}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Package className="h-4 w-4" />
                Items
              </div>
              <div className="font-medium">{shipment.totalItems} items</div>
            </div>
          </div>

          {shipment.dispatchDate && (
            <>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Truck className="h-4 w-4" />
                    Dispatched
                  </div>
                  <div className="font-medium">
                    {formatDate(shipment.dispatchDate)}
                  </div>
                </div>
                {shipment.expectedArrivalDate && (
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="h-4 w-4" />
                      Expected Arrival
                    </div>
                    <div className="font-medium">
                      {formatDate(shipment.expectedArrivalDate)}
                    </div>
                  </div>
                )}
                {shipment.actualArrivalDate && (
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <CheckCircle className="h-4 w-4" />
                      Actual Arrival
                    </div>
                    <div className="font-medium">
                      {formatDate(shipment.actualArrivalDate)}
                    </div>
                  </div>
                )}
                {shipment.dispatchedByName && (
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <User className="h-4 w-4" />
                      Dispatched By
                    </div>
                    <div className="font-medium">
                      {shipment.dispatchedByName}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {shipment.receivedByName && (
            <>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <User className="h-4 w-4" />
                    Received By
                  </div>
                  <div className="font-medium">{shipment.receivedByName}</div>
                </div>
              </div>
            </>
          )}

          {shipment.notes && (
            <>
              <Separator className="my-4" />
              <div>
                <div className="text-muted-foreground mb-2">Notes</div>
                <div className="text-sm bg-muted p-3 rounded-lg">
                  {shipment.notes}
                </div>
              </div>
            </>
          )}

          {shipment.discrepancyNotes && (
            <>
              <Separator className="my-4" />
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Discrepancy Notes:</div>
                  <div className="text-sm">{shipment.discrepancyNotes}</div>
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>

      {/* Items Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Shipment Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {shipment.items?.map((item: any) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <div className="font-medium">{item.itemName}</div>
                    <div className="text-sm text-muted-foreground">
                      Code: {item.itemCode}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Quantity Shipped
                    </div>
                    <div className="font-medium">
                      {item.quantityShipped} {item.unitOfMeasure}
                    </div>
                  </div>
                  {item.quantityReceived !== null && (
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Quantity Received
                      </div>
                      <div className="font-medium">
                        {item.quantityReceived} {item.unitOfMeasure}
                        {item.discrepancyQuantity !== 0 && (
                          <Badge
                            variant={
                              item.discrepancyQuantity > 0
                                ? "default"
                                : "destructive"
                            }
                            className="ml-2"
                          >
                            {item.discrepancyQuantity > 0 ? "+" : ""}
                            {item.discrepancyQuantity}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {item.notes && (
                    <div>
                      <div className="text-sm text-muted-foreground">Notes</div>
                      <div className="text-sm">{item.notes}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
