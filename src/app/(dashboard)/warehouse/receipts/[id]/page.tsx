"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useResponsive } from "@/hooks/useResponsive";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
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
  Calendar,
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  FileText,
  Truck,
  Eye,
  Edit,
  CheckCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { ReceiptValidation } from "@/components/warehouse/ReceiptValidation";
import { ReceiptAttachmentsViewer } from "@/components/warehouse/ReceiptAttachmentsViewer";
import { stockReceiptApi } from "@/lib/api";
import { ReceiptAuditTrail } from "@/components/warehouse/ReceiptAuditTrail";
import type {
  StockReceiptDetails,
  QualityCheck,
  ReceiptStatus,
} from "@/components/warehouse/ReceiptValidation";

interface StockReceiptItem {
  id: number;
  itemId: number;
  itemName: string;
  itemCode: string;
  quantityReceived: number;
  unitCost: number;
  expiryDate?: string;
  batchNumber?: string;
  notes?: string;
  conditionStatus: string;
  qualityChecked: boolean;
  inspectorNotes?: string;
}

interface DetailedStockReceipt {
  id: number;
  receiptNumber: string;
  warehouseId: number;
  warehouseName: string;
  receiptDate: string;
  status: string;
  supplierName: string;
  supplierType: string;
  supplierOrganization?: string;
  supplierContact?: string;
  supplierAddress?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  deliveryReference?: string;
  supplierNotes?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  receivedBy: number;
  receivedByName: string;
  validationDate?: string;
  validatedBy?: number;
  validatedByName?: string;
  discrepancyNotes?: string;
  items: StockReceiptItem[];
}

export default function StockReceiptDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const receiptId = parseInt(params.id as string);

  const [receipt, setReceipt] = useState<DetailedStockReceipt | null>(null);
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [validationLoading, setValidationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditRefreshTrigger, setAuditRefreshTrigger] = useState(0);

  useEffect(() => {
    if (receiptId) {
      fetchReceiptDetails();
      fetchQualityChecks();
    }
  }, [receiptId]);

  const fetchReceiptDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/stock-receipts/${receiptId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch receipt details");
      }

      const data = await response.json();
      setReceipt(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchQualityChecks = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/stock-receipts/${receiptId}/quality-checks`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setQualityChecks(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch quality checks:", err);
    }
  };

  const handleValidate = async (
    status: ReceiptStatus,
    discrepancyNotes?: string
  ) => {
    try {
      setValidationLoading(true);
      const token = localStorage.getItem("auth_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      console.log("Updating receipt status:", { status, discrepancyNotes });

      const response = await fetch(
        `${apiUrl}/api/stock-receipts/${receiptId}/validate`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            discrepancyNotes,
          }),
        }
      );

      console.log("Status update response:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Status update error:", errorText);
        throw new Error(
          `Failed to update receipt status: ${response.status} ${errorText}`
        );
      }

      await fetchReceiptDetails();
      // Refresh audit trail after status change
      setAuditRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Receipt validation error:", error);
      throw error;
    } finally {
      setValidationLoading(false);
    }
  };

  const handleCreateQualityCheck = async (check: {
    receiptId: number;
    itemId: number;
    quantityChecked: number;
    qualityStatus: string;
    conditionNotes?: string;
    correctiveAction?: string;
  }, photos?: File[]) => {
    try {
      const token = localStorage.getItem("auth_token");
      console.log("Creating quality check:", check);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      console.log("API URL:", `${apiUrl}/api/stock-receipts/quality-checks`);

      const response = await fetch(
        `${apiUrl}/api/stock-receipts/quality-checks`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(check),
        }
      );

      console.log("Response status:", response.status);
      const responseText = await response.text();
      console.log("Response body:", responseText);

      if (!response.ok) {
        let errorMessage = `Failed to create quality check: ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        } catch (parseError) {
          // Use default error message if JSON parsing fails
          errorMessage = `Failed to create quality check: ${response.status} ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      // Parse created quality check to get its id
      let createdCheckId: number | null = null;
      try {
        const json = JSON.parse(responseText);
        createdCheckId = json?.data?.id || null;
      } catch {}

      // If photos selected, upload them
      if (createdCheckId && photos && photos.length > 0) {
        try {
          const uploadRes = await stockReceiptApi.uploadQualityCheckPhotos(createdCheckId, photos);
          if (!uploadRes.success) {
            console.warn('Photo upload failed');
          }
        } catch (e) {
          console.warn('Photo upload failed', e);
        }
      }

      await fetchQualityChecks();
      // Refresh audit trail after quality check
      setAuditRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Quality check creation error:", error);
      throw error;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfigs = {
      DRAFT: {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: Clock,
      },
      RECEIVED: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Package,
      },
      VALIDATED: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
      },
      DISCREPANCY: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: AlertTriangle,
      },
    };
    return (
      statusConfigs[status as keyof typeof statusConfigs] || {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: Package,
      }
    );
  };

  const getSupplierTypeBadge = (type: string) => {
    if (!type) return "bg-gray-100 text-gray-800 border-gray-200";
    const typeColors = {
      GOVERNMENT: "bg-emerald-100 text-emerald-800 border-emerald-200",
      NGO: "bg-blue-100 text-blue-800 border-blue-200",
      CHARITY: "bg-pink-100 text-pink-800 border-pink-200",
      INTERNATIONAL_DONOR: "bg-indigo-100 text-indigo-800 border-indigo-200",
      PRIVATE: "bg-orange-100 text-orange-800 border-orange-200",
      OTHER: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return (
      typeColors[type as keyof typeof typeColors] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  const handleBack = () => {
    router.push("/warehouse/receipts");
  };

  const canEdit = user?.role === "super_admin" || user?.role === "national_manager";
  const canDeleteAttachments = user?.role === "super_admin";

  if (loading) {
    return (
      <div className={`${isMobile ? 'space-y-4 px-4' : 'space-y-6'}`}>
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center gap-4'}`}>
          <Skeleton className={`h-10 ${isMobile ? 'w-full' : 'w-32'}`} />
          <div className="flex-1">
            <Skeleton className={`h-8 ${isMobile ? 'w-48' : 'w-64'}`} />
            <Skeleton className={`h-4 ${isMobile ? 'w-64' : 'w-96'} mt-2`} />
          </div>
        </div>
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className={`${isMobile ? 'space-y-4 px-4' : 'space-y-6'}`}>
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center gap-4'}`}>
          <Button variant="outline" onClick={handleBack} className={`${isMobile ? 'w-full h-12' : ''}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Receipts
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className={`${isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900`}>
              Receipt Details
            </h1>
            <p className={`mt-2 ${isMobile ? 'text-sm' : 'text-sm'} text-gray-600`}>
              View stock receipt information
            </p>
          </div>
        </div>

        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className={`text-red-800 ${isMobile ? 'text-sm' : ''}`}>
            {error || "Receipt not found"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const statusConfig = getStatusBadge(receipt.status);
  const StatusIcon = statusConfig.icon;

  // Convert receipt for validation component
  const receiptForValidation: StockReceiptDetails = {
    id: receipt.id,
    receiptNumber: receipt.receiptNumber,
    status: receipt.status.toUpperCase() as ReceiptStatus,
    validationDate: receipt.validationDate
      ? new Date(receipt.validationDate)
      : undefined,
    validatedBy: receipt.validatedBy,
    validatedByName: receipt.validatedByName,
    discrepancyNotes: receipt.discrepancyNotes,
    items: receipt.items.map((item) => ({
      id: item.id,
      itemId: item.itemId,
      itemName: item.itemName,
      itemCode: item.itemCode,
      quantityReceived: item.quantityReceived,
      conditionStatus: item.conditionStatus,
      qualityChecked: item.qualityChecked,
      inspectorNotes: item.inspectorNotes,
    })),
  };

  return (
    <div className={`${isMobile ? 'space-y-4 px-4' : 'space-y-6'}`}>
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center gap-4'}`}>
          <Button variant="outline" onClick={handleBack} className={`${isMobile ? 'w-full h-12' : ''}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Receipts
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className={`${isMobile ? 'text-lg' : isTablet ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 truncate`}>
              Receipt #{receipt.receiptNumber}
            </h1>
            <p className={`mt-2 ${isMobile ? 'text-sm' : 'text-sm'} text-gray-600`}>
              Created on {new Date(receipt.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className={`flex items-center ${isMobile ? 'w-full justify-between' : 'gap-2'}`}>
          <Badge className={statusConfig.color}>
            <StatusIcon className="w-4 h-4 mr-1" />
            {(receipt.status || "").replace("_", " ").toUpperCase()}
          </Badge>
          {canEdit && (
            <Button variant="outline" size={isMobile ? "default" : "sm"} className={`${isMobile ? 'h-12' : ''}`}>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Receipt Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Receipt Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 lg:grid-cols-3 gap-6'}`}>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                  <Truck className="w-4 h-4" />
                  Warehouse
                </div>
                <div className="font-medium">{receipt.warehouseName}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  Receipt Date
                </div>
                <div className="font-medium">
                  {new Date(receipt.receiptDate).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                  <User className="w-4 h-4" />
                  Received By
                </div>
                <div className="font-medium">{receipt.receivedByName}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">
                  Organization Short Name
                </div>
                <div className="font-medium">{receipt.supplierName}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">
                  Supplier Type
                </div>
                <Badge className={getSupplierTypeBadge(receipt.supplierType)}>
                  {(receipt.supplierType || "").replace("_", " ")}
                </Badge>
              </div>
              {receipt.supplierOrganization && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                    <Building className="w-4 h-4" />
                    Organization Full Name
                  </div>
                  <div className="font-medium">
                    {receipt.supplierOrganization}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {receipt.supplierContact && (
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">
                    Contact Person
                  </div>
                  <div className="font-medium">{receipt.supplierContact}</div>
                </div>
              )}
              {receipt.supplierPhone && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                    <Phone className="w-4 h-4" />
                    Phone
                  </div>
                  <div className="font-medium">{receipt.supplierPhone}</div>
                </div>
              )}
              {receipt.supplierEmail && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                  <div className="font-medium">{receipt.supplierEmail}</div>
                </div>
              )}
              {receipt.supplierAddress && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                    <MapPin className="w-4 h-4" />
                    Address
                  </div>
                  <div className="font-medium">{receipt.supplierAddress}</div>
                </div>
              )}
            </div>
          </div>

          {(receipt.notes ||
            receipt.supplierNotes ||
            receipt.deliveryReference) && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                {receipt.deliveryReference && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                      <FileText className="w-4 h-4" />
                      Delivery Reference
                    </div>
                    <div className="font-medium">
                      {receipt.deliveryReference}
                    </div>
                  </div>
                )}
                {receipt.notes && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-1">
                      Receipt Notes
                    </div>
                    <div className="text-sm bg-gray-50 p-3 rounded-md">
                      {receipt.notes}
                    </div>
                  </div>
                )}
                {receipt.supplierNotes && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-1">
                      Supplier Notes
                    </div>
                    <div className="text-sm bg-gray-50 p-3 rounded-md">
                      {receipt.supplierNotes}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Attachments */}
      <ReceiptAttachmentsViewer
        receiptId={receipt.id}
        readOnly={!canDeleteAttachments}
        onChanged={() => setAuditRefreshTrigger((v) => v + 1)}
      />

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Received Items ({receipt.items.length})</CardTitle>
          <CardDescription>
            Items received in this stock receipt
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isMobile ? (
            <div className="space-y-3">
              {receipt.items.map((item) => (
                <Card key={item.id} className="p-3">
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium text-sm">{item.itemName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.itemCode}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Quantity</p>
                        <p className="font-medium">{item.quantityReceived.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Unit Cost</p>
                        <p>Le {(Number(item.unitCost) || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Value</p>
                        <p className="font-medium">Le {(item.quantityReceived * (Number(item.unitCost) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Condition</p>
                        <Badge variant="outline" className="text-xs">{item.conditionStatus}</Badge>
                      </div>
                      {(item.batchNumber || item.expiryDate) && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Batch/Expiry</p>
                          <div className="text-xs">
                            {item.batchNumber && <div>Batch: {item.batchNumber}</div>}
                            {item.expiryDate && <div>Exp: {new Date(item.expiryDate).toLocaleDateString()}</div>}
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">Quality</p>
                        <Badge variant={item.qualityChecked ? "default" : "outline"} className={`text-xs ${
                          item.qualityChecked ? "bg-green-100 text-green-800" : ""
                        }`}>
                          {item.qualityChecked ? "Checked" : "Pending"}
                        </Badge>
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
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Batch/Expiry</TableHead>
                  <TableHead>Quality</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipt.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.itemName}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.itemCode}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantityReceived.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      Le {(Number(item.unitCost) || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      Le{" "}
                      {(
                        item.quantityReceived * (Number(item.unitCost) || 0)
                      ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {item.conditionStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.batchNumber && <div>Batch: {item.batchNumber}</div>}
                      {item.expiryDate && (
                        <div>
                          Exp: {new Date(item.expiryDate).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.qualityChecked ? "default" : "outline"}
                        className={
                          item.qualityChecked
                            ? "bg-green-100 text-green-800"
                            : ""
                        }
                      >
                        {item.qualityChecked ? "Checked" : "Pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </div>
          )}

          {/* Total Summary */}
          <div className={`mt-4 pt-4 border-t ${isMobile ? 'px-3' : ''}`}>
            <div className={`flex ${isMobile ? 'justify-center' : 'justify-end'}`}>
              <div className={`${isMobile ? 'text-center' : 'text-right'}`}>
                <div className={`${isMobile ? 'text-sm' : 'text-sm'} text-gray-600`}>Total Value</div>
                <div className={`${isMobile ? 'text-lg' : 'text-lg'} font-bold`}>
                  Le{" "}
                  {receipt.items
                    .reduce(
                      (sum, item) =>
                        sum + item.quantityReceived * (Number(item.unitCost) || 0),
                      0
                    )
                    .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Validation - Only show for authorized users */}
      {canEdit && (
        <ReceiptValidation
          receipt={receiptForValidation}
          qualityChecks={qualityChecks}
          onValidate={handleValidate}
          onCreateQualityCheck={handleCreateQualityCheck}
          loading={validationLoading}
        />
      )}

      {/* Audit Trail */}
      <ReceiptAuditTrail receiptId={receiptId} refreshTrigger={auditRefreshTrigger} />
    </div>
  );
}
