"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useResponsive } from "@/hooks/useResponsive";
import { StockReceiptForm } from "@/components/warehouse/StockReceiptForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CreateStockReceiptPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isMobile, isTablet } = useResponsive();

  // Role-based access control
  const hasAccess =
    user?.role === "super_admin" || user?.role === "national_manager";

  const handleSuccess = () => {
    router.push("/warehouse/receipts");
  };

  const handleCancel = () => {
    router.push("/warehouse/receipts");
  };

  const handleBack = () => {
    router.push("/warehouse/receipts");
  };

  if (!hasAccess) {
    return (
      <div className={`${isMobile ? 'space-y-4' : 'space-y-6'} ${isMobile ? 'px-4' : ''}`}>
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center gap-4'}`}>
          <Button
            variant="outline"
            onClick={handleBack}
            className={`flex items-center gap-2 ${isMobile ? 'w-full h-12' : ''}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Receipts
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className={`${isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900`}>
              {isMobile ? "Create Receipt" : "Create Stock Receipt"}
            </h1>
            <p className={`mt-2 ${isMobile ? 'text-sm' : 'text-sm'} text-gray-600`}>
              {isMobile 
                ? "Record new stock receipts"
                : "Record new stock receipts for educational materials"
              }
            </p>
          </div>
        </div>

        <Alert className="border-amber-200 bg-amber-50">
          <AlertDescription className={`text-amber-800 ${isMobile ? 'text-sm' : ''}`}>
            Access Denied: You do not have permission to create stock receipts.
            Only Super Administrators and National Warehouse Managers can create
            stock receipts.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'space-y-4' : 'space-y-6'} ${isMobile ? 'px-4' : ''}`}>
      {/* Header with Back Button */}
      <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center gap-4'}`}>
        <Button
          variant="outline"
          onClick={handleBack}
          className={`flex items-center gap-2 hover:bg-gray-50 ${isMobile ? 'w-full h-12' : ''}`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Receipts
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className={`${isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900`}>
            {isMobile ? "Create Receipt" : "Create Stock Receipt"}
          </h1>
          <p className={`mt-2 ${isMobile ? 'text-sm' : 'text-sm'} text-gray-600`}>
            {isMobile 
              ? "Record new receipts from suppliers"
              : "Record new stock receipts for educational materials from suppliers"
            }
          </p>
        </div>
      </div>

      {/* Instructions Card */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 text-green-800 ${isMobile ? 'text-base' : ''}`}>
            <Package className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
            {isMobile ? "Receipt Process" : "Stock Receipt Process"}
          </CardTitle>
          <CardDescription className={`text-green-700 ${isMobile ? 'text-sm' : ''}`}>
            {isMobile 
              ? "Entry point for educational materials"
              : "This is the entry point for all educational materials into the LoMEMIS system"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className={`text-green-700 ${isMobile ? 'p-3' : ''}`}>
          <div className="space-y-2">
            <p className={`font-medium ${isMobile ? 'text-sm' : ''}`}>
              {isMobile ? "Steps:" : "Follow these steps to create a stock receipt:"}
            </p>
            <ol className={`list-decimal list-inside space-y-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <li>{isMobile ? "Select warehouse and date" : "Select the receiving warehouse and receipt date"}</li>
              <li>{isMobile ? "Enter supplier info" : "Enter supplier information (name, type, contact details)"}</li>
              <li>
                {isMobile 
                  ? "Add items with quantities"
                  : "Add items being received with quantities and quality checks"
                }
              </li>
              <li>{isMobile ? "Review and submit" : "Review and submit the receipt for processing"}</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Stock Receipt Form */}
      <StockReceiptForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}
