"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Plus } from "lucide-react";
import { ShipmentCreateForm } from "@/components/shipments";
import Link from "next/link";
import { useResponsive } from "@/hooks/useResponsive";

export default function CreateShipmentPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const { isMobile, isTablet } = useResponsive();

  const handleShipmentCreated = () => {
    router.push("/warehouse/shipments");
  };

  const handleCancel = () => {
    router.push("/warehouse/shipments");
  };

  return (
    <div className={`${isMobile ? 'space-y-4 px-4' : 'space-y-6'}`}>
      {/* Header */}
      <div className={`${isMobile ? 'flex flex-col space-y-3' : 'flex items-center gap-4'}`}>
        <Link href="/warehouse/shipments">
          <Button variant="outline" size="sm" className={`${isMobile ? 'h-10' : ''}`}>
            <ArrowLeft className={`mr-2 ${isMobile ? 'h-4 w-4' : 'h-4 w-4'}`} />
            Back to Shipments
          </Button>
        </Link>
        <div>
          <h1 className={`font-bold text-foreground ${
            isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-3xl'
          }`}>Create New Shipment</h1>
          <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
            {isMobile 
              ? "Create shipment to local council" 
              : "Create a shipment from national warehouse to local council"
            }
          </p>
        </div>
      </div>

      {/* Create Form */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
            <Plus className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
            Shipment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-muted-foreground mb-6 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {isMobile 
              ? "Select council and add items. Shipment will be created in DRAFT status."
              : "Select destination council and add items from available national warehouse inventory. The shipment will be created in DRAFT status and can be dispatched once confirmed."
            }
          </p>
          <ShipmentCreateForm
            onShipmentCreated={handleShipmentCreated}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}