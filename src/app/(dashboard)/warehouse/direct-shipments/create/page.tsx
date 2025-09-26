"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useResponsive } from "@/hooks/useResponsive";
import DirectShipmentForm from "@/components/warehouse/DirectShipmentForm";

export default function CreateDirectShipmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { isMobile, isTablet } = useResponsive();

  // Get pre-selected school from URL parameters
  const preSelectedSchoolId = searchParams.get("schoolId");
  const initialSchoolId = preSelectedSchoolId
    ? parseInt(preSelectedSchoolId)
    : undefined;

  // Check permissions
  const canCreateShipments =
    user?.role === "super_admin" || user?.role === "national_manager";

  if (!canCreateShipments) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-sm mx-auto px-4">
          <XCircle className={`${isMobile ? 'h-10 w-10' : 'h-12 w-12'} text-red-500 mx-auto mb-4`} />
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-900 mb-2`}>
            Access Denied
          </h3>
          <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-600 mb-4`}>
            You don&apos;t have permission to create direct shipments.
          </p>
          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
            Only Super Administrators and National Warehouse Managers can create
            direct shipments.
          </p>
        </div>
      </div>
    );
  }

  const handleSuccess = () => {
    router.push("/warehouses/schools?tab=shipments");
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className={`${isMobile ? 'space-y-4 px-4' : 'space-y-6'}`}>
      {/* Header */}
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
          <h1 className={`${isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-3xl'} font-bold text-foreground`}>
            {isMobile ? "Create Shipment" : "Create Direct Shipment"}
          </h1>
          <p className={`${isMobile ? 'text-sm' : 'text-base'} text-muted-foreground`}>
            {isMobile 
              ? "Create warehouse-to-school shipment"
              : "Create a new direct warehouse-to-school shipment"
            }
          </p>
        </div>
      </div>

      {/* Form */}
      <DirectShipmentForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        initialSchoolId={initialSchoolId}
      />
    </div>
  );
}
