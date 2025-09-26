"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Clock,
  Truck,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  DirectShipmentWithDetails,
  PriorityLevel,
  ShipmentType,
} from "@/types";
import { toast } from "sonner";

interface EmergencyShipmentAlertProps {
  shipment: DirectShipmentWithDetails;
  onEscalate?: (shipmentId: number) => void;
  onPriorityUpdate?: (shipmentId: number, priority: PriorityLevel) => void;
}

const EMERGENCY_CONTACTS = [
  {
    role: "National Emergency Coordinator",
    name: "Emergency Hotline",
    phone: "+256-XXX-XXXX",
    email: "emergency@lomemis.gov.ug",
  },
  {
    role: "Regional Coordinator",
    name: "Regional Office",
    phone: "+256-XXX-XXXX",
    email: "regional@lomemis.gov.ug",
  },
];

export function EmergencyShipmentAlert({
  shipment,
  onEscalate,
  onPriorityUpdate,
}: EmergencyShipmentAlertProps) {
  const [escalating, setEscalating] = useState(false);

  const isEmergency =
    shipment.priorityLevel === "critical" ||
    shipment.priorityLevel === "urgent" ||
    shipment.shipmentType === "emergency" ||
    shipment.shipmentType === "disaster_relief";

  const isOverdue =
    shipment.expectedDeliveryDate &&
    new Date(shipment.expectedDeliveryDate) < new Date() &&
    shipment.status !== "delivered" &&
    shipment.status !== "confirmed";

  if (!isEmergency && !isOverdue) {
    return null;
  }

  const handleEscalate = async () => {
    setEscalating(true);
    try {
      await onEscalate?.(shipment.id);
      toast.success("Shipment escalated to emergency response team");
    } catch (error) {
      toast.error("Failed to escalate shipment");
    } finally {
      setEscalating(false);
    }
  };

  const getAlertLevel = () => {
    if (
      shipment.priorityLevel === "critical" ||
      shipment.shipmentType === "emergency"
    ) {
      return "critical";
    }
    if (shipment.priorityLevel === "urgent" || isOverdue) {
      return "urgent";
    }
    return "normal";
  };

  const alertLevel = getAlertLevel();

  return (
    <Card
      className={`border-l-4 ${
        alertLevel === "critical"
          ? "border-l-red-500 bg-red-50"
          : alertLevel === "urgent"
          ? "border-l-orange-500 bg-orange-50"
          : "border-l-yellow-500 bg-yellow-50"
      }`}
    >
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle
            className={`h-5 w-5 ${
              alertLevel === "critical"
                ? "text-red-600"
                : alertLevel === "urgent"
                ? "text-orange-600"
                : "text-yellow-600"
            }`}
          />
          <span>
            {alertLevel === "critical"
              ? "CRITICAL EMERGENCY"
              : alertLevel === "urgent"
              ? "URGENT PRIORITY"
              : "HIGH PRIORITY"}{" "}
            SHIPMENT
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alert Information */}
        <div className="p-3 bg-white rounded border border-orange-200">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-orange-600" />
            <div className="text-sm">
              {shipment.shipmentType === "emergency" && (
                <span>
                  This is an emergency delivery requiring immediate attention.
                </span>
              )}
              {shipment.shipmentType === "disaster_relief" && (
                <span>This shipment is part of disaster relief efforts.</span>
              )}
              {isOverdue && (
                <span>
                  This shipment is overdue for delivery by{" "}
                  {Math.ceil(
                    (new Date().getTime() -
                      new Date(shipment.expectedDeliveryDate!).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  days.
                </span>
              )}
              {shipment.priorityLevel === "critical" && (
                <span>
                  Critical priority shipment requiring immediate dispatch.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Emergency Actions */}
        <div className="flex items-center space-x-2">
          {shipment.status === "pending" && (
            <Button
              onClick={handleEscalate}
              disabled={escalating}
              className="bg-red-600 hover:bg-red-700"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {escalating ? "Escalating..." : "Escalate to Emergency Team"}
            </Button>
          )}

          {onPriorityUpdate && shipment.priorityLevel !== "critical" && (
            <Button
              variant="outline"
              onClick={() => onPriorityUpdate(shipment.id, "critical")}
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Upgrade to Critical
            </Button>
          )}
        </div>

        {/* Emergency Contacts */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Emergency Contacts</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {EMERGENCY_CONTACTS.map((contact, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-white rounded border"
              >
                <div>
                  <p className="text-sm font-medium">{contact.role}</p>
                  <p className="text-xs text-muted-foreground">
                    {contact.name}
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Phone className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Mail className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Authorization Reason */}
        {shipment.authorizationReason && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Authorization Reason</h4>
            <p className="text-sm text-muted-foreground bg-white p-3 rounded border">
              {shipment.authorizationReason}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EmergencyShipmentAlert;
