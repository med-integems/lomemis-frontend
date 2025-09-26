"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Package,
  Truck,
  Calendar,
  User,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Building2,
} from "lucide-react";
import { shipmentsApi } from "@/lib/api";
import { ShipmentWithDetails } from "@/types";
import Link from "next/link";
import { useResponsive } from "@/hooks/useResponsive";

export default function ShipmentDetailPage() {
  const params = useParams();
  const shipmentId = parseInt(params.id as string);
  const { isMobile, isTablet } = useResponsive();
  
  const [shipment, setShipment] = useState<ShipmentWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shipmentId) {
      fetchShipmentDetails();
    }
  }, [shipmentId]);

  const fetchShipmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await shipmentsApi.getShipmentById(shipmentId);
      
      if (response.success) {
        setShipment(response.data);
      } else {
        setError("Failed to load shipment details");
      }
    } catch (err) {
      console.error("Error fetching shipment details:", err);
      setError("Failed to load shipment details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "IN_TRANSIT":
        return "bg-blue-100 text-blue-800";
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <FileText className="h-4 w-4" />;
      case "IN_TRANSIT":
        return <Truck className="h-4 w-4" />;
      case "DELIVERED":
        return <CheckCircle className="h-4 w-4" />;
      case "CANCELLED":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`${isMobile ? 'space-y-4 px-4' : 'space-y-6'}`}>
        <div className={`flex items-center ${isMobile ? 'flex-col space-y-3' : 'justify-between'}`}>
          <Skeleton className={`${isMobile ? 'h-6 w-48' : 'h-8 w-64'}`} />
          {!isMobile && <Skeleton className="h-10 w-32" />}
        </div>
        <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className={`${isMobile ? 'space-y-4 px-4' : 'space-y-6'}`}>
        <div className="flex items-center gap-4">
          <Link href="/warehouse/shipments">
            <Button variant="outline" size="sm" className={`${isMobile ? 'h-10' : ''}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shipments
            </Button>
          </Link>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Shipment not found"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'space-y-4 px-4' : 'space-y-6'}`}>
      {/* Header */}
      <div className={`${isMobile ? 'flex flex-col space-y-3' : 'flex items-center justify-between'}`}>
        <div className={`flex items-center gap-4 ${isMobile ? 'flex-col items-start space-y-3 gap-0' : ''}`}>
          <Link href="/warehouse/shipments">
            <Button variant="outline" size="sm" className={`${isMobile ? 'h-10 self-start' : ''}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shipments
            </Button>
          </Link>
          <div>
            <h1 className={`font-bold text-foreground ${
              isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-3xl'
            }`}>
              Shipment {shipment.shipmentNumber}
            </h1>
            <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
              {isMobile ? "Track details and status" : "Track shipment details and status"}
            </p>
          </div>
        </div>
        <Badge className={`${getStatusColor(shipment.status)} flex items-center gap-2 ${
          isMobile ? 'self-start' : ''
        }`}>
          {getStatusIcon(shipment.status)}
          {shipment.status.replace('_', ' ')}
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className={`grid gap-6 ${
        isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
      }`}>
        {/* Shipment Details */}
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
              <Package className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
              Shipment Information
            </CardTitle>
          </CardHeader>
          <CardContent className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
            <div className="flex justify-between items-center">
              <span className={`font-medium text-muted-foreground ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}>Shipment Number:</span>
              <span className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>
                {shipment.shipmentNumber}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`font-medium text-muted-foreground ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}>Total Items:</span>
              <span className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>
                {shipment.totalItems}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`font-medium text-muted-foreground ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}>Created:</span>
              <span className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>
                {new Date(shipment.createdAt).toLocaleDateString()}
              </span>
            </div>
            {shipment.dispatchDate && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Dispatched:</span>
                <span className="font-semibold">
                  {new Date(shipment.dispatchDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {shipment.expectedArrivalDate && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Expected Arrival:</span>
                <span className="font-semibold">
                  {new Date(shipment.expectedArrivalDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Route Information */}
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
              <Building2 className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
              Route Information
            </CardTitle>
          </CardHeader>
          <CardContent className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
            <div>
              <span className="text-sm font-medium text-muted-foreground">From:</span>
              <p className="font-semibold">{shipment.originWarehouseName}</p>
            </div>
            <div className="flex justify-center">
              <Truck className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">To:</span>
              <p className="font-semibold">{shipment.destinationCouncilName}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shipment Items */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
            <Package className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
            Shipment Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isMobile ? (
            <div className="space-y-3">
              {shipment.items?.map((item) => (
                <Card key={item.id} className="border border-border">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div>
                        <p className="font-medium text-sm">{item.itemName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.itemCode} • {item.unitOfMeasure}
                        </p>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="text-muted-foreground">Shipped: </span>
                          <span className="font-semibold">{item.quantityShipped}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Received: </span>
                          <span className="font-semibold">{item.quantityReceived || "-"}</span>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        {item.quantityReceived ? (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Received
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            In Transit
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Item</th>
                    <th className="text-right p-2 font-medium">Code</th>
                    <th className="text-right p-2 font-medium">Shipped</th>
                    <th className="text-right p-2 font-medium">Received</th>
                    <th className="text-right p-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shipment.items?.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{item.itemName}</p>
                          <p className="text-sm text-muted-foreground">{item.unitOfMeasure}</p>
                        </div>
                      </td>
                      <td className="p-2 text-right">
                        <span className="text-sm font-mono">{item.itemCode}</span>
                      </td>
                      <td className="p-2 text-right font-semibold">
                        {item.quantityShipped}
                      </td>
                      <td className="p-2 text-right font-semibold">
                        {item.quantityReceived || "-"}
                      </td>
                      <td className="p-2 text-right">
                        {item.quantityReceived ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Received
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Clock className="h-3 w-3 mr-1" />
                            In Transit
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {(shipment.notes || shipment.discrepancyNotes) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {shipment.notes && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Shipment Notes:</h4>
                <p className="text-sm">{shipment.notes}</p>
              </div>
            )}
            {shipment.discrepancyNotes && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Discrepancy Notes:</h4>
                <p className="text-sm text-red-600">{shipment.discrepancyNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Personnel Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personnel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Created By:</span>
              <p className="font-semibold">{shipment.createdByName}</p>
            </div>
            {shipment.dispatchedByName && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Dispatched By:</span>
                <p className="font-semibold">{shipment.dispatchedByName}</p>
              </div>
            )}
            {shipment.receivedByName && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Received By:</span>
                <p className="font-semibold">{shipment.receivedByName}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}