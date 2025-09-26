"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useResponsive } from "@/hooks/useResponsive";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Package,
  Truck,
  School,
  Warehouse,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import {
  DirectShipmentWithDetails,
  ShipmentStatus,
  ShipmentType,
  PriorityLevel,
  ConfirmDirectShipmentReceiptRequest,
} from "@/types";
import { directShipmentsApi } from "@/lib/api";
import EmergencyShipmentAlert from "@/components/warehouse/EmergencyShipmentAlert";

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

export default function DirectShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const [loading, setLoading] = useState(true);
  const [shipment, setShipment] = useState<DirectShipmentWithDetails | null>(
    null
  );
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [receiptNotes, setReceiptNotes] = useState("");
  const [showDispatchForm, setShowDispatchForm] = useState(false);
  const [dispatchData, setDispatchData] = useState({
    transportMethod: "",
    trackingNumber: "",
    dispatchNotes: "",
    expectedDeliveryDate: "",
  });

  const shipmentId = parseInt(params.id as string);

  // Check permissions
  const canViewShipment =
    user?.role === "super_admin" ||
    user?.role === "national_manager" ||
    user?.role === "view_only" ||
    (user?.role === "school_rep" && shipment?.schoolId === user.schoolId);

  const canConfirmReceipt =
    user?.role === "super_admin" ||
    (user?.role === "school_rep" && shipment?.schoolId === user.schoolId);

  const canDispatch =
    user?.role === "super_admin" || user?.role === "national_manager";

  useEffect(() => {
    loadShipment();
  }, [shipmentId]);

  const loadShipment = async () => {
    setLoading(true);
    try {
      const response = await directShipmentsApi.getDirectShipmentById(
        shipmentId
      );

      if (response.success && response.data) {
        setShipment(response.data);
      } else {
        toast.error(
          response.error?.message || "Failed to load shipment details"
        );
      }
    } catch (error) {
      console.error("Error loading shipment:", error);
      toast.error("Failed to load shipment details");
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async () => {
    if (!shipment) return;

    try {
      const response = await directShipmentsApi.dispatchDirectShipment(
        shipment.id,
        {
          transportMethod:
            dispatchData.transportMethod || shipment.transportMethod,
          trackingNumber:
            dispatchData.trackingNumber || shipment.trackingNumber,
          expectedDeliveryDate: dispatchData.expectedDeliveryDate,
          notes: dispatchData.dispatchNotes || "Shipment dispatched",
        }
      );

      if (response.success) {
        toast.success("Shipment dispatched successfully!");
        setShowDispatchForm(false);
        loadShipment(); // Reload to get updated status
      } else {
        toast.error(response.error?.message || "Failed to dispatch shipment");
      }
    } catch (error) {
      console.error("Error dispatching shipment:", error);
      toast.error("Failed to dispatch shipment");
    }
  };

  const handleConfirmReceipt = async () => {
    if (!shipment) return;

    try {
      const receiptData: ConfirmDirectShipmentReceiptRequest = {
        actualDeliveryDate: new Date().toISOString(),
        receivingUserId: user?.id,
        notes: receiptNotes,
        items: shipment.items.map((item) => ({
          itemId: item.itemId,
          quantityReceived: item.quantityShipped, // Default to shipped quantity
          conditionOnReceipt: "good",
          conditionNotes: "",
        })),
      };

      const response = await directShipmentsApi.confirmDirectShipmentReceipt(
        shipment.id,
        receiptData
      );

      if (response.success) {
        toast.success("Receipt confirmed successfully!");
        setShowReceiptForm(false);
        loadShipment(); // Reload to get updated status
      } else {
        toast.error(response.error?.message || "Failed to confirm receipt");
      }
    } catch (error) {
      console.error("Error confirming receipt:", error);
      toast.error("Failed to confirm receipt");
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-sm">Loading shipment details...</span>
      </div>
    );
  }

  if (!canViewShipment || !shipment) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-sm mx-auto px-4">
          <XCircle className={`${isMobile ? 'h-10 w-10' : 'h-12 w-12'} text-red-500 mx-auto mb-4`} />
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-900 mb-2`}>
            Access Denied
          </h3>
          <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-600`}>
            You don&apos;t have permission to view this shipment or it
            doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'space-y-4 px-4' : 'space-y-6'}`}>
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center space-x-4'}`}>
          <Button
            variant="outline"
            size={isMobile ? "default" : "sm"}
            onClick={() => router.back()}
            className={`flex items-center space-x-2 ${isMobile ? 'w-full h-12' : ''}`}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>

          <div className="flex-1 min-w-0">
            <h1 className={`${isMobile ? 'text-lg' : isTablet ? 'text-2xl' : 'text-3xl'} font-bold text-foreground truncate`}>
              {shipment.referenceNumber}
            </h1>
            <p className={`${isMobile ? 'text-sm' : 'text-base'} text-muted-foreground`}>
              {isMobile ? "Shipment Details" : "Direct Shipment Details"}
            </p>
          </div>
        </div>

        <div className={`flex items-center ${isMobile ? 'flex-wrap gap-2' : 'space-x-2'}`}>
          {getStatusBadge(shipment.status)}
          {getPriorityBadge(shipment.priorityLevel)}
          {getTypeBadge(shipment.shipmentType)}
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`flex items-center ${isMobile ? 'flex-col space-y-2' : 'flex-wrap gap-2'}`}>
        {canDispatch && shipment.status === "pending" && (
          <Button
            onClick={() => setShowDispatchForm(true)}
            className={`bg-blue-600 hover:bg-blue-700 ${isMobile ? 'w-full h-12' : ''}`}
          >
            <Send className="h-4 w-4 mr-2" />
            {isMobile ? "Dispatch" : "Dispatch Shipment"}
          </Button>
        )}

        {canConfirmReceipt && shipment.status === "delivered" && (
          <Button
            onClick={() => setShowReceiptForm(true)}
            className={`bg-green-600 hover:bg-green-700 ${isMobile ? 'w-full h-12' : ''}`}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {isMobile ? "Confirm" : "Confirm Receipt"}
          </Button>
        )}

        {/* Emergency Priority Actions */}
        {(shipment.priorityLevel === "critical" ||
          shipment.priorityLevel === "urgent" ||
          shipment.shipmentType === "emergency") && (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            {shipment.priorityLevel === "critical" ||
            shipment.shipmentType === "emergency"
              ? "EMERGENCY PRIORITY"
              : "URGENT PRIORITY"}
          </Badge>
        )}

        {/* Tracking Button */}
        {shipment.status === "dispatched" && shipment.trackingNumber && (
          <Button variant="outline" className={`${isMobile ? 'w-full h-12' : ''}`}>
            <Truck className="h-4 w-4 mr-2" />
            {isMobile ? `Track: ${shipment.trackingNumber}` : `Track: ${shipment.trackingNumber}`}
          </Button>
        )}
      </div>

      {/* Emergency/Priority Alert */}
      <EmergencyShipmentAlert
        shipment={shipment}
        onEscalate={async (shipmentId) => {
          // Implement escalation logic
          await directShipmentsApi.updateDirectShipmentStatus(shipmentId, {
            status: "pending",
            notes: "Escalated to emergency response team",
          });
          loadShipment();
        }}
        onPriorityUpdate={async (shipmentId, priority) => {
          // Implement priority update logic
          await directShipmentsApi.updateDirectShipmentStatus(shipmentId, {
            priorityLevel: priority,
          });
          loadShipment();
        }}
      />

      <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-2 gap-6'}`}>
        {/* Shipment Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Shipment Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Shipment ID
                </Label>
                <p className="font-medium">{shipment.id}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Reference Number
                </Label>
                <p className="font-medium">{shipment.referenceNumber}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Total Items
                </Label>
                <p className="font-medium">{shipment.totalItems}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Created Date
                </Label>
                <p className="font-medium">{formatDate(shipment.createdAt)}</p>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Authorization Reason
              </Label>
              <p className="mt-1 text-sm">{shipment.authorizationReason}</p>
            </div>

            {shipment.notes && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Notes
                </Label>
                <p className="mt-1 text-sm">{shipment.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Origin & Destination */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Origin & Destination</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Warehouse className="h-5 w-5 mt-0.5 text-blue-600" />
                <div className="flex-1">
                  <Label className="text-sm font-medium text-muted-foreground">
                    From Warehouse
                  </Label>
                  <p className="font-medium">{shipment.warehouseName}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <School className="h-5 w-5 mt-0.5 text-green-600" />
                <div className="flex-1">
                  <Label className="text-sm font-medium text-muted-foreground">
                    To School
                  </Label>
                  <p className="font-medium">{shipment.schoolName}</p>
                  <p className="text-sm text-muted-foreground">
                    {shipment.schoolCode}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className={`grid grid-cols-1 ${isMobile ? 'gap-2' : 'gap-3'}`}>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Expected Delivery
                </Label>
                <p className="font-medium">
                  {formatDate(shipment.expectedDeliveryDate)}
                </p>
              </div>

              {shipment.actualDeliveryDate && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Actual Delivery
                  </Label>
                  <p className="font-medium">
                    {formatDate(shipment.actualDeliveryDate)}
                  </p>
                </div>
              )}

              {shipment.transportMethod && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Transport Method
                  </Label>
                  <p className="font-medium">{shipment.transportMethod}</p>
                </div>
              )}

              {shipment.trackingNumber && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Tracking Number
                  </Label>
                  <p className="font-medium">{shipment.trackingNumber}</p>
                </div>
              )}

              {shipment.deliveryInstructions && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Delivery Instructions
                  </Label>
                  <p className="text-sm">{shipment.deliveryInstructions}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* People */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>People Involved</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Authorized By
              </Label>
              <p className="font-medium">{shipment.authorizedByName}</p>
            </div>

            {shipment.dispatchUserName && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Dispatched By
                </Label>
                <p className="font-medium">{shipment.dispatchUserName}</p>
              </div>
            )}

            {shipment.receivingUserName && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Received By
                </Label>
                <p className="font-medium">{shipment.receivingUserName}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Timeline</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(shipment.createdAt)}
                </p>
              </div>
            </div>

            {shipment.dispatchDate && (
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium">Dispatched</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(shipment.dispatchDate)}
                  </p>
                </div>
              </div>
            )}

            {shipment.actualDeliveryDate && (
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium">Delivered</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(shipment.actualDeliveryDate)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Shipment Items ({shipment.items.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isMobile ? (
            <div className="space-y-3">
              {shipment.items.map((item) => (
                <Card key={item.id} className="p-3">
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium text-sm">{item.itemName}</p>
                      <p className="text-xs text-muted-foreground">{item.itemCode}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Category</p>
                        <Badge variant="outline" className="text-xs">{item.itemCategory}</Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Quantity</p>
                        <p className="font-medium">{item.quantityShipped} {item.unitOfMeasure}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Unit Cost</p>
                        <p>{item.unitCost ? `$${item.unitCost.toFixed(2)}` : "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p>{item.unitCost ? `$${(item.quantityShipped * item.unitCost).toFixed(2)}` : "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Condition</p>
                        <Badge variant="outline" className="bg-green-50 text-green-800 text-xs">
                          {item.conditionOnDispatch || "New"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Batch</p>
                        <p>{item.batchNumber || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity Shipped</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Batch</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipment.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.itemName}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.itemCode}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.itemCategory}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {item.quantityShipped} {item.unitOfMeasure}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.unitCost ? `$${item.unitCost.toFixed(2)}` : "N/A"}
                    </TableCell>
                    <TableCell>
                      {item.unitCost
                        ? `$${(item.quantityShipped * item.unitCost).toFixed(
                            2
                          )}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-800"
                      >
                        {item.conditionOnDispatch || "New"}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.batchNumber || "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dispatch Form */}
      {showDispatchForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Send className="h-5 w-5" />
              <span>Dispatch Shipment</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
              <div>
                <Label htmlFor="transportMethod">Transport Method</Label>
                <Input
                  id="transportMethod"
                  value={dispatchData.transportMethod}
                  onChange={(e) =>
                    setDispatchData((prev) => ({
                      ...prev,
                      transportMethod: e.target.value,
                    }))
                  }
                  placeholder="e.g., Government truck, Private carrier"
                />
              </div>
              <div>
                <Label htmlFor="trackingNumber">Tracking Number</Label>
                <Input
                  id="trackingNumber"
                  value={dispatchData.trackingNumber}
                  onChange={(e) =>
                    setDispatchData((prev) => ({
                      ...prev,
                      trackingNumber: e.target.value,
                    }))
                  }
                  placeholder="Enter tracking number"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="expectedDeliveryDate">
                Expected Delivery Date
              </Label>
              <Input
                id="expectedDeliveryDate"
                type="date"
                value={dispatchData.expectedDeliveryDate}
                onChange={(e) =>
                  setDispatchData((prev) => ({
                    ...prev,
                    expectedDeliveryDate: e.target.value,
                  }))
                }
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div>
              <Label htmlFor="dispatchNotes">Dispatch Notes</Label>
              <Textarea
                id="dispatchNotes"
                value={dispatchData.dispatchNotes}
                onChange={(e) =>
                  setDispatchData((prev) => ({
                    ...prev,
                    dispatchNotes: e.target.value,
                  }))
                }
                placeholder="Add any notes about the dispatch..."
                rows={3}
              />
            </div>

            <div className={`flex items-center ${isMobile ? 'flex-col space-y-2' : 'space-x-2'}`}>
              <Button
                onClick={handleDispatch}
                className={`bg-blue-600 hover:bg-blue-700 ${isMobile ? 'w-full h-12' : ''}`}
              >
                <Send className="h-4 w-4 mr-2" />
                Confirm Dispatch
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDispatchForm(false)}
                className={`${isMobile ? 'w-full h-12' : ''}`}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Receipt Confirmation Form */}
      {showReceiptForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Confirm Receipt</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="receiptNotes">Receipt Notes</Label>
              <Textarea
                id="receiptNotes"
                value={receiptNotes}
                onChange={(e) => setReceiptNotes(e.target.value)}
                placeholder="Add any notes about the received items..."
                rows={3}
              />
            </div>

            <div className={`flex items-center ${isMobile ? 'flex-col space-y-2' : 'space-x-2'}`}>
              <Button
                onClick={handleConfirmReceipt}
                className={`bg-green-600 hover:bg-green-700 ${isMobile ? 'w-full h-12' : ''}`}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Receipt
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowReceiptForm(false)}
                className={`${isMobile ? 'w-full h-12' : ''}`}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
