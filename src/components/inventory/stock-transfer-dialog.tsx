"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { nationalInventoryApi, warehousesApi } from "@/lib/api";
import { toast } from "sonner";
import { NationalInventoryItem, Warehouse } from "@/types";

interface StockTransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItem: NationalInventoryItem | null;
  onSuccess: () => void;
}

export function StockTransferDialog({
  isOpen,
  onClose,
  inventoryItem,
  onSuccess,
}: StockTransferDialogProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadWarehouses();
    }
  }, [isOpen]);

  const loadWarehouses = async () => {
    setIsLoadingWarehouses(true);
    try {
      const response = await warehousesApi.getWarehouses(1, 100, { isActive: true });
      if (response.success && response.data?.warehouses) {
        // Filter out the current warehouse
        const filteredWarehouses = response.data.warehouses.filter(
          (w: Warehouse) => w.id !== inventoryItem?.warehouseId
        );
        setWarehouses(filteredWarehouses);
      }
    } catch (error) {
      console.error("Failed to load warehouses:", error);
      toast.error("Failed to load warehouse list");
    } finally {
      setIsLoadingWarehouses(false);
    }
  };

  const handleSubmit = async () => {
    
    if (!inventoryItem || !toWarehouseId || !quantity || !reason) {
      toast.error("Please fill in all required fields");
      return;
    }

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (quantityNum > inventoryItem.availableQuantity) {
      toast.error("Cannot transfer more than available quantity");
      return;
    }

    setIsSubmitting(true);

    try {
      await nationalInventoryApi.performStockTransfer({
        itemId: inventoryItem.itemId,
        fromWarehouseId: inventoryItem.warehouseId,
        toWarehouseId: parseInt(toWarehouseId),
        quantity: quantityNum,
        reason,
        notes: notes || undefined,
      });

      toast.success("Stock transfer completed successfully");
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Stock transfer failed:", error);
      toast.error("Failed to perform stock transfer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setToWarehouseId('');
    setQuantity('');
    setReason('');
    setNotes('');
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  if (!inventoryItem) return null;

  const selectedWarehouse = warehouses.find(w => w.id === parseInt(toWarehouseId));

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      {/* Modal can only be closed via Cancel/Submit buttons */}
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col" onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Stock Transfer</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4">
          {/* Enhanced Item Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Item Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <Label className="text-gray-600">Item Name</Label>
                <p className="font-medium">{inventoryItem.itemName}</p>
              </div>
              <div>
                <Label className="text-gray-600">Item Code</Label>
                <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{inventoryItem.itemCode}</p>
              </div>
              {inventoryItem.category && (
                <div>
                  <Label className="text-gray-600">Category</Label>
                  <p className="font-medium">{inventoryItem.category}</p>
                </div>
              )}
              <div>
                <Label className="text-gray-600">Unit of Measure</Label>
                <p className="font-medium">{inventoryItem.unitOfMeasure}</p>
              </div>
            </div>
          </div>

          {/* Transfer Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-3">Transfer Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-blue-600">From Warehouse</Label>
                <p className="font-medium">{inventoryItem.warehouseName}</p>
                <div className="mt-1 text-xs text-blue-600">
                  <span>Available: {inventoryItem.availableQuantity.toLocaleString()} {inventoryItem.unitOfMeasure}</span>
                </div>
              </div>
              <div>
                <Label className="text-blue-600">To Warehouse</Label>
                <p className={`font-medium ${selectedWarehouse ? 'text-[#007A33]' : 'text-gray-500'}`}>
                  {selectedWarehouse?.name || "Select destination warehouse"}
                </p>
                {selectedWarehouse && (
                  <div className="mt-1 text-xs text-blue-600">
                    Location: {selectedWarehouse.location}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="toWarehouseId" className="block mb-2">Destination Warehouse *</Label>
            <Select
              value={toWarehouseId}
              onValueChange={setToWarehouseId}
              disabled={isLoadingWarehouses}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingWarehouses ? "Loading..." : "Select warehouse"} />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(warehouses) && warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                    {warehouse.name} - {warehouse.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity" className="block mb-2">Transfer Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={inventoryItem.availableQuantity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity to transfer"
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum: {inventoryItem.availableQuantity.toLocaleString()} {inventoryItem.unitOfMeasure}
            </p>
          </div>

          <div>
            <Label htmlFor="reason" className="block mb-2">Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Redistribution">Redistribution</SelectItem>
                <SelectItem value="Stock balancing">Stock balancing</SelectItem>
                <SelectItem value="Urgent requirement">Urgent requirement</SelectItem>
                <SelectItem value="Warehouse consolidation">Warehouse consolidation</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Operational efficiency">Operational efficiency</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes" className="block mb-2">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any additional notes..."
              disabled={isSubmitting}
              rows={3}
            />
          </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !toWarehouseId}
            className="bg-[#007A33] hover:bg-[#005A26]"
          >
            {isSubmitting ? "Processing..." : "Confirm Transfer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}