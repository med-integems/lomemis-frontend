"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package, Calendar } from "lucide-react";
import { useResponsive } from "@/hooks/useResponsive";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { stockReceiptApi, itemsApi, warehousesApi } from "@/lib/api";
import {
  CreateStockReceiptRequest,
  CreateStockReceiptItemRequest,
  Item,
  Warehouse,
} from "@/types";
import SupplierInformationForm, { SupplierInformation } from "@/components/warehouse/SupplierInformationForm";
import ReceiptItemsTable, { ReceiptItem } from "@/components/warehouse/ReceiptItemsTable";

interface StockReceiptFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function StockReceiptForm({
  onSuccess,
  onCancel,
}: StockReceiptFormProps) {
  const { deviceType, isMobile, isTouchDevice } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState<number>(0);
  const [receiptDate, setReceiptDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState<string>("");
  const [supplierInfo, setSupplierInfo] = useState<SupplierInformation>({});
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([
    {
      itemId: 0,
      quantityReceived: 0,
      unitCost: 0,
      expiryDate: "",
      batchNumber: "",
      notes: "",
      conditionStatus: 'NEW',
      qualityChecked: false,
      inspectorNotes: ""
    }
  ]);

  useEffect(() => {
    loadItems();
    loadWarehouses();
  }, []);

  const loadItems = async () => {
    try {
      const response = await itemsApi.getItems(1, 1000, { isActive: true });
      if (response.success && response.data?.items) {
        setItems(response.data.items);
      }
    } catch (error) {
      console.error("Failed to load items:", error);
      toast.error("Failed to load items");
    }
  };

  const loadWarehouses = async () => {
    try {
      const response = await warehousesApi.getWarehouses(1, 100, {
        isActive: true,
      });
      if (response.success && response.data?.warehouses) {
        setWarehouses(response.data.warehouses);
      }
    } catch (error) {
      console.error("Failed to load warehouses:", error);
      toast.error("Failed to load warehouses");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!warehouseId) {
      toast.error("Please select a warehouse");
      return;
    }

    if (!receiptDate) {
      toast.error("Please select a receipt date");
      return;
    }

    const validItems = receiptItems.filter(
      (item) => item.itemId > 0 && item.quantityReceived > 0
    );

    if (validItems.length === 0) {
      toast.error("Please add at least one item with valid quantity");
      return;
    }

    // Build the request with enhanced supplier information
    const requestData: CreateStockReceiptRequest = {
      warehouseId,
      receiptDate: new Date(receiptDate),
      notes,
      // Enhanced supplier fields
      supplierName: supplierInfo.supplierName,
      supplierContact: supplierInfo.supplierContact,
      supplierType: supplierInfo.supplierType,
      supplierOrganization: supplierInfo.supplierOrganization,
      supplierAddress: supplierInfo.supplierAddress,
      supplierEmail: supplierInfo.supplierEmail,
      supplierPhone: supplierInfo.supplierPhone,
      deliveryReference: supplierInfo.deliveryReference,
      supplierNotes: supplierInfo.supplierNotes,
      // Enhanced items with quality fields
      items: validItems.map(item => ({
        itemId: item.itemId,
        quantityReceived: item.quantityReceived,
        unitCost: item.unitCost,
        expiryDate: item.expiryDate,
        batchNumber: item.batchNumber,
        notes: item.notes,
        conditionStatus: item.conditionStatus,
        qualityChecked: item.qualityChecked,
        inspectorNotes: item.inspectorNotes
      }))
    };

    setLoading(true);
    try {
      const response = await stockReceiptApi.createStockReceipt(requestData);

      if (response.success) {
        toast.success("Stock receipt created successfully");
        onSuccess?.();
      } else {
        toast.error(
          response.error?.message || "Failed to create stock receipt"
        );
      }
    } catch (error) {
      console.error("Failed to create stock receipt:", error);
      toast.error("Failed to create stock receipt");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className={cn(
      "space-y-6",
      deviceType === "mobile" && "space-y-4"
    )}>
      <Card>
        <CardHeader className={cn(
          deviceType === "mobile" && "px-4 py-4"
        )}>
          <CardTitle className={cn(
            "flex items-center gap-2",
            deviceType === "mobile" ? "text-lg" : "text-xl"
          )}>
            <Package className={cn(
              deviceType === "mobile" ? "h-4 w-4" : "h-5 w-5"
            )} />
            {deviceType === "mobile" ? "Stock Receipt" : "Create Stock Receipt"}
          </CardTitle>
          <p className={cn(
            "text-muted-foreground",
            deviceType === "mobile" ? "text-sm" : "text-sm"
          )}>
            {deviceType === "mobile" 
              ? "Record receipt of materials into the system."
              : "Record the receipt of educational materials at the warehouse. This is the entry point for all materials into the LoMEMIS system."
            }
          </p>
        </CardHeader>
        <CardContent className={cn(
          deviceType === "mobile" && "px-4 pb-4"
        )}>
          <form onSubmit={handleSubmit} className={cn(
            "space-y-6",
            deviceType === "mobile" && "space-y-4"
          )}>
            {/* Basic Receipt Information */}
            <Card>
              <CardHeader className={cn(
                deviceType === "mobile" && "px-4 py-3"
              )}>
                <CardTitle className={cn(
                  "flex items-center gap-2",
                  deviceType === "mobile" ? "text-base" : "text-lg"
                )}>
                  <Calendar className="h-4 w-4" />
                  {deviceType === "mobile" ? "Details" : "Receipt Details"}
                </CardTitle>
              </CardHeader>
              <CardContent className={cn(
                deviceType === "mobile" && "px-4 pb-4"
              )}>
                <div className={cn(
                  "grid gap-4",
                  deviceType === "mobile" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
                )}>
                  <div>
                    <Label htmlFor="warehouse" className="block mb-2">Warehouse *</Label>
                    <select
                      id="warehouse"
                      className={cn(
                        "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007A33]",
                        isTouchDevice && "min-h-[44px]"
                      )}
                      value={warehouseId}
                      onChange={(e) => setWarehouseId(parseInt(e.target.value))}
                      required
                    >
                      <option value={0}>Select Warehouse</option>
                      {Array.isArray(warehouses) && warehouses.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="receiptDate" className="block mb-2">Receipt Date *</Label>
                    <Input
                      id="receiptDate"
                      type="date"
                      value={receiptDate}
                      onChange={(e) => setReceiptDate(e.target.value)}
                      required
                      className={cn(
                        isTouchDevice && "min-h-[44px]"
                      )}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="notes" className="block mb-2">Receipt Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={deviceType === "mobile" 
                      ? "Additional notes (optional)"
                      : "Additional notes about this receipt (optional)"
                    }
                    rows={deviceType === "mobile" ? 2 : 3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Supplier Information */}
            <div className={cn(
              deviceType === "mobile" && "[&>div]:border-0 [&>div]:shadow-none [&>div]:bg-transparent"
            )}>
              <SupplierInformationForm
                value={supplierInfo}
                onChange={setSupplierInfo}
              />
            </div>

            {/* Items Section */}
            <div className={cn(
              deviceType === "mobile" && "[&>div]:border-0 [&>div]:shadow-none [&>div]:bg-transparent"
            )}>
              <ReceiptItemsTable
                items={receiptItems}
                availableItems={items}
                onChange={setReceiptItems}
              />
            </div>

            {/* Actions */}
            <div className={cn(
              "flex pt-6",
              deviceType === "mobile" 
                ? "flex-col space-y-3" 
                : "justify-end space-x-4"
            )}>
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  className={cn(
                    deviceType === "mobile" && "w-full",
                    isTouchDevice && "min-h-[44px]"
                  )}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={loading}
                className={cn(
                  "bg-[#007A33] hover:bg-[#005A25]",
                  deviceType === "mobile" && "w-full",
                  isTouchDevice && "min-h-[44px]"
                )}
              >
                {loading 
                  ? (deviceType === "mobile" ? "Creating..." : "Creating Receipt...") 
                  : (deviceType === "mobile" ? "Create Receipt" : "Create Stock Receipt")
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
