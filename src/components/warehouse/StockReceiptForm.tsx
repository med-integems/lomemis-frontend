"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Package,
  Calendar,
  Building2,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useApiMutation, useApiQuery } from "@/hooks/useApi";
import { stockReceiptApi, itemsApi, warehousesApi } from "@/lib/api";
import {
  SupplierInformationForm,
  SupplierInformation,
} from "./SupplierInformationForm";
import { ReceiptItemsTable, ReceiptItem } from "./ReceiptItemsTable";
import type { CreateStockReceiptRequest } from "@/types";

interface StockReceiptFormProps {
  onSuccess?: (receipt: unknown) => void;
  onCancel?: () => void;
  className?: string;
}

interface FormData {
  warehouseId: number;
  receiptDate: string;
  notes: string;
  supplierInfo: SupplierInformation;
  items: ReceiptItem[];
}

const initialFormData: FormData = {
  warehouseId: 0,
  receiptDate: new Date().toISOString().split("T")[0],
  notes: "",
  supplierInfo: {},
  items: [
    {
      itemId: 0,
      quantityReceived: 0,
      unitCost: 0,
      expiryDate: "",
      batchNumber: "",
      notes: "",
      conditionStatus: "NEW",
      qualityChecked: false,
      inspectorNotes: "",
    },
  ],
};

export function StockReceiptForm({
  onSuccess,
  onCancel,
  className = "",
}: StockReceiptFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  // Auto-select warehouse for National Warehouse Managers
  useEffect(() => {
    if (user?.role === 'national_warehouse_manager' && user?.warehouseId) {
      setFormData(prev => ({
        ...prev,
        warehouseId: user.warehouseId
      }));
    }
  }, [user]);

  // Fetch available warehouses
  const { data: warehousesResponse, isLoading: warehousesLoading } =
    useApiQuery(["warehouses"], () => warehousesApi.getWarehouses(1, 100), {
      staleTime: 10 * 60 * 1000, // 10 minutes
    });

  // Fetch available items
  const { data: itemsResponse, isLoading: itemsLoading } = useApiQuery(
    ["items"],
    () => itemsApi.getItems(1, 1000),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // Create stock receipt mutation
  const createReceiptMutation = useApiMutation(
    (receiptData: CreateStockReceiptRequest) =>
      stockReceiptApi.createStockReceipt(receiptData),
    {
      onSuccess: (response) => {
        if (response.success) {
          const created = response.data as any;
          const doPostUpload = async () => {
            if (attachmentFile && created?.id) {
              try {
                // Client-side validation aligned with server limits
                const allowed = new Set([
                  'application/pdf',
                  'image/jpeg',
                  'image/jpg',
                  'image/png',
                  'image/webp',
                ]);
                const maxSize = 10 * 1024 * 1024; // 10MB
                if (!allowed.has(attachmentFile.type)) {
                  toast.warning('Attachment not uploaded: unsupported file type');
                  return;
                }
                if (attachmentFile.size > maxSize) {
                  toast.warning('Attachment not uploaded: file exceeds 10MB limit');
                  return;
                }

                const uploadRes = await stockReceiptApi.uploadReceiptAttachment(
                  created.id,
                  attachmentFile,
                  'DELIVERY_NOTE'
                );
                if (uploadRes.success) {
                  toast.success('Receipt created; attachment uploaded');
                } else {
                  const msg = (uploadRes as any)?.error?.message || 'Attachment failed to upload';
                  toast.warning(`Receipt created; ${msg}`);
                }
              } catch (e: any) {
                const apiMsg = e?.response?.data?.error?.message || e?.message || 'Attachment failed to upload';
                console.error('Attachment upload error:', e);
                toast.warning(`Receipt created; ${apiMsg}`);
              }
            } else {
              toast.success('Stock receipt created successfully!');
            }
          };

          doPostUpload().finally(() => {
            if (onSuccess) onSuccess(response.data);
            // Reset form
            setFormData(initialFormData);
            setValidationErrors([]);
            setAttachmentFile(null);
          });
        }
      },
      onError: (error: unknown) => {
        console.error("Error creating stock receipt:", error);
        const errorMessage =
          (
            error as {
              response?: { data?: { error?: { message?: string } } };
              message?: string;
            }
          )?.response?.data?.error?.message ||
          (error as { message?: string })?.message ||
          "Failed to create stock receipt";
        toast.error(errorMessage);
      },
    }
  );

  const warehouses = warehousesResponse?.success
    ? warehousesResponse.data?.warehouses || []
    : [];
  const items = itemsResponse?.success ? itemsResponse.data?.items || [] : [];

  const handleFieldChange = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleSupplierInfoChange = (supplierInfo: SupplierInformation) => {
    handleFieldChange("supplierInfo", supplierInfo);
  };

  const handleItemsChange = (items: ReceiptItem[]) => {
    handleFieldChange("items", items);
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    // Validate warehouse selection
    if (!formData.warehouseId || formData.warehouseId === 0) {
      errors.push("Please select a warehouse");
    }

    // Validate receipt date
    if (!formData.receiptDate) {
      errors.push("Receipt date is required");
    } else {
      const receiptDate = new Date(formData.receiptDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today

      if (receiptDate > today) {
        errors.push("Receipt date cannot be in the future");
      }
    }

    // Validate items
    if (!formData.items || formData.items.length === 0) {
      errors.push("At least one item is required");
    } else {
      let hasValidItem = false;
      const itemIds = new Set<number>();

      formData.items.forEach((item, index) => {
        if (item.itemId && item.itemId > 0) {
          if (itemIds.has(item.itemId)) {
            errors.push(`Duplicate item found at position ${index + 1}`);
          } else {
            itemIds.add(item.itemId);
          }

          if (!item.quantityReceived || item.quantityReceived <= 0) {
            errors.push(`Invalid quantity for item at position ${index + 1}`);
          } else {
            hasValidItem = true;
          }
        }
      });

      if (!hasValidItem) {
        errors.push("At least one item with valid quantity is required");
      }
    }

    // Validate delivery reference
    if (!formData.supplierInfo?.deliveryReference || !String(formData.supplierInfo.deliveryReference).trim()) {
      errors.push("Delivery reference is required");
    }

    // Validate required attachment
    if (!attachmentFile) {
      errors.push("Delivery note attachment is required");
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    // Prepare the request data
    const requestData: CreateStockReceiptRequest = {
      warehouseId: formData.warehouseId,
      receiptDate: new Date(formData.receiptDate),
      notes: formData.notes || undefined,
      // Supplier information
      supplierName: formData.supplierInfo.supplierName,
      supplierContact: formData.supplierInfo.supplierContact,
      supplierType: formData.supplierInfo.supplierType,
      supplierOrganization: formData.supplierInfo.supplierOrganization,
      supplierAddress: formData.supplierInfo.supplierAddress,
      supplierEmail: formData.supplierInfo.supplierEmail,
      supplierPhone: formData.supplierInfo.supplierPhone,
      deliveryReference: formData.supplierInfo.deliveryReference,
      supplierNotes: formData.supplierInfo.supplierNotes,
      // Items - only include valid items
      items: formData.items
        .filter((item) => item.itemId > 0 && item.quantityReceived > 0)
        .map((item) => ({
          itemId: item.itemId,
          quantityReceived: item.quantityReceived,
          unitCost: item.unitCost || undefined,
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
          batchNumber: item.batchNumber || undefined,
          notes: item.notes || undefined,
          conditionStatus: item.conditionStatus,
          qualityChecked: item.qualityChecked || false,
          inspectorNotes: item.inspectorNotes || undefined,
        })),
    };

    createReceiptMutation.mutate(requestData);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Reset form
      setFormData(initialFormData);
      setValidationErrors([]);
    }
  };

  const getSelectedWarehouse = () => {
    return warehouses.find((w) => w.id === formData.warehouseId);
  };

  const getTotalItems = () => {
    return formData.items.filter(
      (item) => item.itemId > 0 && item.quantityReceived > 0
    ).length;
  };

  const getTotalQuantity = () => {
    return formData.items
      .filter((item) => item.itemId > 0 && item.quantityReceived > 0)
      .reduce((total, item) => total + item.quantityReceived, 0);
  };

  const getTotalValue = () => {
    return formData.items
      .filter((item) => item.itemId > 0 && item.quantityReceived > 0)
      .reduce(
        (total, item) => total + item.quantityReceived * (item.unitCost || 0),
        0
      );
  };

  const isLoading = warehousesLoading || itemsLoading;
  const isSubmitting = createReceiptMutation.isPending;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading form data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            Create Stock Receipt
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Record the receipt of materials into the warehouse inventory system.
          </p>
        </CardHeader>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Please fix the following errors:</p>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Warehouse Selection */}
            <div>
              <Label htmlFor="warehouse" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Warehouse *
              </Label>
              {user?.role === 'national_warehouse_manager' && user?.warehouseId ? (
                // For National Warehouse Managers, show their warehouse as read-only
                <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {warehouses.find(w => w.id === user.warehouseId)?.name || 'Your Warehouse'}
                    </span>
                    {warehouses.find(w => w.id === user.warehouseId)?.location && (
                      <span className="text-xs text-muted-foreground">
                        {warehouses.find(w => w.id === user.warehouseId)?.location}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                // For Super Admins and others, show the dropdown
                <Select
                  value={formData.warehouseId.toString()}
                  onValueChange={(value) =>
                    handleFieldChange("warehouseId", parseInt(value))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Select Warehouse</SelectItem>
                    {warehouses.map((warehouse) => (
                      <SelectItem
                        key={warehouse.id}
                        value={warehouse.id.toString()}
                      >
                        <div className="flex flex-col">
                          <span>{warehouse.name}</span>
                          {warehouse.location && (
                            <span className="text-xs text-muted-foreground">
                              {warehouse.location}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Receipt Date */}
            <div>
              <Label htmlFor="receiptDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Receipt Date *
              </Label>
              <Input
                id="receiptDate"
                type="date"
                value={formData.receiptDate}
                onChange={(e) =>
                  handleFieldChange("receiptDate", e.target.value)
                }
                max={new Date().toISOString().split("T")[0]}
                className="mt-1"
              />
            </div>
          </div>

          {/* Receipt Notes */}
          <div>
            <Label htmlFor="notes">Receipt Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleFieldChange("notes", e.target.value)}
              placeholder="General notes about this receipt"
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Summary Information */}
          {formData.warehouseId > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Receipt Summary</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Warehouse:</span>
                  <p className="font-medium text-blue-900">
                    {getSelectedWarehouse()?.name || "Not selected"}
                  </p>
                </div>
                <div>
                  <span className="text-blue-700">Items:</span>
                  <p className="font-medium text-blue-900">{getTotalItems()}</p>
                </div>
                <div>
                  <span className="text-blue-700">Total Quantity:</span>
                  <p className="font-medium text-blue-900">
                    {getTotalQuantity().toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-blue-700">Total Value:</span>
                  <p className="font-medium text-blue-900">
                    Le {getTotalValue().toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supplier Information */}
      <SupplierInformationForm
        value={formData.supplierInfo}
        onChange={handleSupplierInfoChange}
        onAttachmentChange={setAttachmentFile}
        attachmentFileName={attachmentFile?.name}
        requireDeliveryReference
        requireAttachment
      />

      {/* Receipt Items */}
      <ReceiptItemsTable
        items={formData.items}
        availableItems={items}
        onChange={handleItemsChange}
      />

      {/* Form Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {getTotalItems()} items • {getTotalQuantity().toLocaleString()}{" "}
              total quantity • Le {getTotalValue().toLocaleString()} total value
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting || getTotalItems() === 0}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Receipt...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Create Stock Receipt
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

export default StockReceiptForm;
