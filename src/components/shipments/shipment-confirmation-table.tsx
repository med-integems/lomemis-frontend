"use client";

import { useState } from "react";
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
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Package, 
  Eye,
  FileText
} from "lucide-react";
import { ShipmentWithDetails } from "@/types";
import { formatDate } from "@/lib/utils";

interface ShipmentConfirmationTableProps {
  shipments: ShipmentWithDetails[];
  onConfirm: (shipment: ShipmentWithDetails) => void;
  showActions?: boolean;
}

export function ShipmentConfirmationTable({
  shipments,
  onConfirm,
  showActions = true,
}: ShipmentConfirmationTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'in_transit':
        return <Badge variant="default"><Package className="h-3 w-3 mr-1" />In Transit</Badge>;
      case 'delivered':
        return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="default">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  if (shipments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No shipments found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Shipment ID</TableHead>
            <TableHead>From Warehouse</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Shipped Date</TableHead>
            <TableHead>Expected Delivery</TableHead>
            <TableHead>Discrepancies</TableHead>
            {showActions && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipments.map((shipment) => (
            <TableRow key={shipment.id}>
              <TableCell className="font-medium">
                SH-{shipment.id.toString().padStart(6, '0')}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{shipment.originWarehouseName}</div>
                  <div className="text-sm text-muted-foreground">
                    {shipment.originAddress}
                  </div>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(shipment.status)}</TableCell>
              <TableCell>{getPriorityBadge(shipment.priority || 'medium')}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>{shipment.totalItems || 0} items</span>
                </div>
              </TableCell>
              <TableCell>
                {formatDate(shipment.shippedDate || shipment.createdAt)}
              </TableCell>
              <TableCell>
                {shipment.expectedDeliveryDate ? 
                  formatDate(shipment.expectedDeliveryDate) : 
                  'Not specified'
                }
              </TableCell>
              <TableCell>
                {shipment.hasDiscrepancies ? (
                  <div className="flex items-center gap-1 text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">Yes</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">None</span>
                )}
              </TableCell>
              {showActions && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    {(shipment.status === 'pending' || shipment.status === 'in_transit') && (
                      <Button
                        size="sm"
                        onClick={() => onConfirm(shipment)}
                        className="h-8"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Confirm
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Handle view details
                        console.log('View shipment details:', shipment.id);
                      }}
                      className="h-8"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}