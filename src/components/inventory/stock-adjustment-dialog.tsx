"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { nationalInventoryApi } from "@/lib/api";
import { toast } from "sonner";
import { NationalInventoryItem } from "@/types";
import { useResponsive } from "@/hooks/useResponsive";

interface StockAdjustmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItem: NationalInventoryItem | null;
  onSuccess: () => void;
}

export function StockAdjustmentDialog({
  isOpen,
  onClose,
  inventoryItem,
  onSuccess,
}: StockAdjustmentDialogProps) {
  const [adjustmentType, setAdjustmentType] = useState<'INCREASE' | 'DECREASE' | 'SET'>('INCREASE');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isMobile } = useResponsive();

  const handleSubmit = async () => {
    
    if (!inventoryItem || !quantity || !reason) {
      toast.error("Please fill in all required fields");
      return;
    }

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum < 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (adjustmentType === 'DECREASE' && quantityNum > inventoryItem.quantityOnHand) {
      toast.error("Cannot decrease by more than current stock");
      return;
    }

    setIsSubmitting(true);

    try {
      await nationalInventoryApi.performStockAdjustment({
        itemId: inventoryItem.itemId,
        warehouseId: inventoryItem.warehouseId,
        adjustmentType,
        quantity: quantityNum,
        reason,
        notes: notes || undefined,
      });

      toast.success("Stock adjustment completed successfully");
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Stock adjustment failed:", error);
      toast.error("Failed to perform stock adjustment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setAdjustmentType('INCREASE');
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

  const calculateNewQuantity = () => {
    const quantityNum = parseInt(quantity) || 0;
    switch (adjustmentType) {
      case 'INCREASE':
        return inventoryItem.quantityOnHand + quantityNum;
      case 'DECREASE':
        return Math.max(0, inventoryItem.quantityOnHand - quantityNum);
      case 'SET':
        return quantityNum;
      default:
        return inventoryItem.quantityOnHand;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      {/* Modal can only be closed via Cancel/Submit buttons */}
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col" onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Stock Adjustment</DialogTitle>
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
              <div>
                <Label className="text-gray-600">Warehouse</Label>
                <p className="font-medium">{inventoryItem.warehouseName}</p>
              </div>
              <div>
                <Label className="text-gray-600">Current Status</Label>
                <p className={`font-medium ${inventoryItem.isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                  {inventoryItem.isLowStock ? 'Low Stock' : 'Normal'}
                </p>
              </div>
            </div>
          </div>

          {/* Stock Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-3">Stock Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-blue-600">Current On Hand</Label>
                <p className="font-bold text-lg">{inventoryItem.quantityOnHand.toLocaleString()} {inventoryItem.unitOfMeasure}</p>
              </div>
              <div>
                <Label className="text-blue-600">Available</Label>
                <p className="font-medium">{inventoryItem.availableQuantity.toLocaleString()} {inventoryItem.unitOfMeasure}</p>
              </div>
              <div>
                <Label className="text-blue-600">Reserved</Label>
                <p className="font-medium">{inventoryItem.reservedQuantity.toLocaleString()} {inventoryItem.unitOfMeasure}</p>
              </div>
              <div>
                <Label className="text-blue-600">Minimum Level</Label>
                <p className="font-medium">{inventoryItem.minimumStockLevel.toLocaleString()} {inventoryItem.unitOfMeasure}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-green-600">New Stock After Adjustment</Label>
                <p className="font-bold text-lg text-[#007A33]">
                  {calculateNewQuantity().toLocaleString()} {inventoryItem.unitOfMeasure}
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="adjustmentType" className="block mb-2">Adjustment Type *</Label>
            <Select
              value={adjustmentType}
              onValueChange={(value: 'INCREASE' | 'DECREASE' | 'SET') => setAdjustmentType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCREASE">Increase Stock</SelectItem>
                <SelectItem value="DECREASE">Decrease Stock</SelectItem>
                <SelectItem value="SET">Set Exact Quantity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity" className="block mb-2">
              {adjustmentType === 'SET' ? 'New Quantity' : 'Adjustment Quantity'} *
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={adjustmentType === 'SET' ? 'Enter new quantity' : 'Enter adjustment amount'}
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <Label htmlFor="reason" className="block mb-2">Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Damaged goods">Damaged goods</SelectItem>
                <SelectItem value="Expired items">Expired items</SelectItem>
                <SelectItem value="Lost items">Lost items</SelectItem>
                <SelectItem value="Found items">Found items</SelectItem>
                <SelectItem value="Correction">Correction</SelectItem>
                <SelectItem value="Manual recount">Manual recount</SelectItem>
                <SelectItem value="System error">System error</SelectItem>
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
            disabled={isSubmitting}
            className="bg-[#007A33] hover:bg-[#005A26]"
          >
            {isSubmitting ? "Processing..." : "Confirm Adjustment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}