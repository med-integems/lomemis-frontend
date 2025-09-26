"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { nationalInventoryApi, councilInventoryApi } from "@/lib/api";
import { toast } from "sonner";
import { NationalInventoryItem } from "@/types";
import { AlertCircle, TrendingUp, TrendingDown, Equal } from "lucide-react";

interface MinimumStockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItem: NationalInventoryItem | null;
  onSuccess: () => void;
  // Optional: when provided, updates minimum stock for this council only
  councilId?: number | null;
}

export function MinimumStockDialog({
  isOpen,
  onClose,
  inventoryItem,
  onSuccess,
  councilId,
}: MinimumStockDialogProps) {
  const [minimumStockLevel, setMinimumStockLevel] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    
    if (!inventoryItem || minimumStockLevel === '') {
      toast.error("Please enter a minimum stock level");
      return;
    }

    const minimumStockLevelNum = parseInt(minimumStockLevel);
    if (isNaN(minimumStockLevelNum) || minimumStockLevelNum < 0) {
      toast.error("Please enter a valid minimum stock level");
      return;
    }

    setIsSubmitting(true);

    try {
      if (councilId) {
        await councilInventoryApi.updateCouncilMinimumStockLevel(councilId, {
          itemId: inventoryItem.itemId,
          minimumStockLevel: minimumStockLevelNum,
          notes: notes || undefined,
        });
      } else {
        await nationalInventoryApi.updateMinimumStockLevel({
          itemId: inventoryItem.itemId,
          minimumStockLevel: minimumStockLevelNum,
          notes: notes || undefined,
        });
      }

      toast.success("Minimum stock level updated successfully");
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Minimum stock level update failed:", error);
      toast.error("Failed to update minimum stock level");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setMinimumStockLevel('');
    setNotes('');
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  if (!inventoryItem) return null;

  const newMinimumStock = parseInt(minimumStockLevel) || 0;
  const currentMinimumStock = inventoryItem.minimumStockLevel ?? 0;
  const change = newMinimumStock - currentMinimumStock;
  const hasChange = minimumStockLevel !== '' && change !== 0;

  const getChangeIcon = () => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-blue-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-orange-600" />;
    return <Equal className="h-4 w-4 text-gray-600" />;
  };

  const getChangeColor = () => {
    if (change > 0) return "text-blue-600";
    if (change < 0) return "text-orange-600";
    return "text-gray-600";
  };

  const getStockStatus = (quantity: number, minimum: number) => {
    if (quantity <= minimum) return { status: "Low Stock", color: "text-red-600" };
    if (quantity <= minimum * 1.5) return { status: "Warning", color: "text-orange-600" };
    return { status: "Normal", color: "text-green-600" };
  };

  const currentStatus = getStockStatus(inventoryItem.quantityOnHand, currentMinimumStock);
  const newStatus = getStockStatus(inventoryItem.quantityOnHand, newMinimumStock);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      {/* Modal can only be closed via Cancel/Submit buttons */}
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col" onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            Update Minimum Stock Level
          </DialogTitle>
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
                <p className={`font-medium ${currentStatus.color}`}>
                  {currentStatus.status}
                </p>
              </div>
            </div>
          </div>

          {/* Stock Level Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-3">Stock Level Configuration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-blue-600">Current Stock On Hand</Label>
                <p className="font-bold text-lg">
                  {(inventoryItem.quantityOnHand ?? 0).toLocaleString()} {inventoryItem.unitOfMeasure}
                </p>
                <div className="text-xs text-blue-600 mt-1">
                  Available: {(inventoryItem.availableQuantity ?? 0).toLocaleString()}
                </div>
              </div>
              <div>
                <Label className="text-blue-600">Current Minimum Level</Label>
                <p className="font-bold text-lg">
                  {(currentMinimumStock ?? 0).toLocaleString()} {inventoryItem.unitOfMeasure}
                </p>
                <div className="text-xs text-blue-600 mt-1">
                  Currently configured threshold
                </div>
              </div>
              {minimumStockLevel && (
                <>
                  <div>
                    <Label className="text-green-600">New Minimum Level</Label>
                    <p className="font-bold text-lg text-[#007A33]">
                      {newMinimumStock.toLocaleString()} {inventoryItem.unitOfMeasure}
                    </p>
                  </div>
                  <div>
                    <Label className="text-green-600">New Status</Label>
                    <p className={`font-bold text-lg ${newStatus.color}`}>
                      {newStatus.status}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {hasChange && (
            <div className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                {getChangeIcon()}
                <Label className="text-sm font-medium">Minimum Stock Change</Label>
              </div>
              <p className={`text-lg font-bold ${getChangeColor()}`}>
                {change > 0 ? '+' : ''}{(change || 0).toLocaleString()} {inventoryItem.unitOfMeasure}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {change > 0 ? "Increasing minimum stock level" : "Decreasing minimum stock level"}
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="minimumStockLevel" className="block mb-2">New Minimum Stock Level *</Label>
            <Input
              id="minimumStockLevel"
              type="number"
              min="0"
              value={minimumStockLevel}
              onChange={(e) => setMinimumStockLevel(e.target.value)}
              placeholder={`Current: ${currentMinimumStock}`}
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Unit: {inventoryItem.unitOfMeasure}
            </p>
          </div>

          <div>
            <Label htmlFor="notes" className="block mb-2">Update Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter reason for minimum stock level change..."
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          {hasChange && newMinimumStock > inventoryItem.quantityOnHand && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-orange-800">Stock Level Warning</p>
                  <p className="text-orange-600 mt-1">
                    The new minimum stock level ({newMinimumStock.toLocaleString()}) is higher than current stock ({inventoryItem.quantityOnHand.toLocaleString()}). 
                    This item will be flagged as low stock.
                  </p>
                </div>
              </div>
            </div>
          )}
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
            {isSubmitting ? "Updating..." : "Update Minimum Level"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
