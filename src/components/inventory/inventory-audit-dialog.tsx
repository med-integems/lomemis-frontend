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
import { AlertTriangle, TrendingUp, TrendingDown, Equal } from "lucide-react";

interface InventoryAuditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItem: NationalInventoryItem | null;
  onSuccess: () => void;
}

export function InventoryAuditDialog({
  isOpen,
  onClose,
  inventoryItem,
  onSuccess,
}: InventoryAuditDialogProps) {
  const [actualQuantity, setActualQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    
    if (!inventoryItem || actualQuantity === '' || !reason) {
      toast.error("Please fill in all required fields");
      return;
    }

    const actualQuantityNum = parseInt(actualQuantity);
    if (isNaN(actualQuantityNum) || actualQuantityNum < 0) {
      toast.error("Please enter a valid actual quantity");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await nationalInventoryApi.performInventoryAudit({
        itemId: inventoryItem.itemId,
        warehouseId: inventoryItem.warehouseId,
        systemQuantity: inventoryItem.quantityOnHand,
        actualQuantity: actualQuantityNum,
        reason,
        notes: notes || undefined,
      });

      if (result.success) {
        const variance = result.data.variance;
        if (variance === 0) {
          toast.success("Inventory audit completed - no variance found");
        } else {
          toast.success(`Inventory audit completed - variance: ${variance > 0 ? '+' : ''}${variance}`);
        }
      }

      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Inventory audit failed:", error);
      toast.error("Failed to perform inventory audit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setActualQuantity('');
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

  const actualQuantityNum = parseInt(actualQuantity) || 0;
  const variance = actualQuantityNum - inventoryItem.quantityOnHand;
  const hasVariance = actualQuantity !== '' && variance !== 0;

  const getVarianceIcon = () => {
    if (variance > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (variance < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Equal className="h-4 w-4 text-gray-600" />;
  };

  const getVarianceColor = () => {
    if (variance > 0) return "text-green-600";
    if (variance < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      {/* Modal can only be closed via Cancel/Submit buttons */}
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col" onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Inventory Audit
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
                <Label className="text-gray-600">Last Updated</Label>
                <p className="font-medium">{new Date(inventoryItem.lastUpdated).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Audit Summary */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h3 className="font-semibold text-orange-800 mb-3">Audit Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-orange-600">System Quantity</Label>
                <p className="font-bold text-lg">
                  {inventoryItem.quantityOnHand.toLocaleString()} {inventoryItem.unitOfMeasure}
                </p>
                <div className="text-xs text-orange-600 mt-1">
                  Available: {inventoryItem.availableQuantity.toLocaleString()}
                </div>
              </div>
              <div>
                <Label className="text-orange-600">Actual Quantity</Label>
                <p className="font-bold text-lg text-[#007A33]">
                  {actualQuantity ? `${actualQuantityNum.toLocaleString()} ${inventoryItem.unitOfMeasure}` : "Not entered"}
                </p>
                {actualQuantity && (
                  <div className="text-xs text-orange-600 mt-1">
                    Physical count result
                  </div>
                )}
              </div>
            </div>
          </div>

          {hasVariance && (
            <div className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                {getVarianceIcon()}
                <Label className="text-sm font-medium">Variance Detected</Label>
              </div>
              <p className={`text-lg font-bold ${getVarianceColor()}`}>
                {variance > 0 ? '+' : ''}{variance.toLocaleString()} {inventoryItem.unitOfMeasure}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {variance > 0 ? "Stock increase found" : "Stock shortage detected"}
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="actualQuantity" className="block mb-2">Actual Quantity Found *</Label>
            <Input
              id="actualQuantity"
              type="number"
              min="0"
              value={actualQuantity}
              onChange={(e) => setActualQuantity(e.target.value)}
              placeholder="Enter actual quantity counted"
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <Label htmlFor="reason" className="block mb-2">Audit Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select audit reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Routine cycle count">Routine cycle count</SelectItem>
                <SelectItem value="Physical inventory">Physical inventory</SelectItem>
                <SelectItem value="Discrepancy investigation">Discrepancy investigation</SelectItem>
                <SelectItem value="System reconciliation">System reconciliation</SelectItem>
                <SelectItem value="Damage assessment">Damage assessment</SelectItem>
                <SelectItem value="Loss investigation">Loss investigation</SelectItem>
                <SelectItem value="Annual audit">Annual audit</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes" className="block mb-2">Audit Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter audit findings, conditions, or other relevant notes..."
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          {hasVariance && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-orange-800">Variance will be automatically adjusted</p>
                  <p className="text-orange-600 mt-1">
                    The system quantity will be updated to match your actual count after confirmation.
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
            {isSubmitting ? "Processing..." : "Confirm Audit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}