"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  AlertTriangle, 
  Package, 
  Calendar, 
  Truck,
  Building2,
  FileText,
  Save,
  X
} from "lucide-react";
import { toast } from "sonner";

interface ReceiptItem {
  id: number;
  itemId: number;
  itemName: string;
  itemCode: string;
  quantityExpected: number;
  quantityReceived: number;
  quantityDamaged: number;
  conditionOnArrival: 'NEW' | 'GOOD' | 'FAIR' | 'DAMAGED';
  batchNumber: string | null;
  expiryDate: string | null;
  unitCost: number | null;
  itemNotes: string | null;
}

interface PendingReceipt {
  id: number;
  schoolId: number;
  schoolName: string;
  sourceType: 'DISTRIBUTION' | 'DIRECT_SHIPMENT';
  sourceId: number;
  receiptNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'DISCREPANCY';
  expectedArrivalDate: string | null;
  totalItemsExpected: number;
  sourceReference: string;
  sourceName: string;
  createdAt: string;
  items?: ReceiptItem[];
}

interface ReceiptConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: PendingReceipt | null;
  onConfirm: (receiptId: number, confirmationData: any) => Promise<void>;
  isReadOnly?: boolean;
}

export function ReceiptConfirmationDialog({ 
  isOpen, 
  onClose, 
  receipt, 
  onConfirm,
  isReadOnly = false
}: ReceiptConfirmationDialogProps) {
  const [actualArrivalDate, setActualArrivalDate] = useState("");
  const [confirmationNotes, setConfirmationNotes] = useState("");
  const [discrepancyNotes, setDiscrepancyNotes] = useState("");
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize items when receipt changes
  useEffect(() => {
    if (receipt?.items) {
      setItems(receipt.items.map(item => ({
        ...item,
        quantityReceived: item.quantityReceived || item.quantityExpected,
        quantityDamaged: item.quantityDamaged || 0,
        conditionOnArrival: item.conditionOnArrival || 'NEW'
      })));
    } else {
      setItems([]);
    }
    
    // Set default arrival date to today if not set
    if (!actualArrivalDate && isOpen) {
      setActualArrivalDate(new Date().toISOString().split('T')[0]);
    }
  }, [receipt, isOpen]);

  const updateItem = (itemId: number, field: string, value: any) => {
    setItems(prev => prev.map(item => 
      item.itemId === itemId ? { ...item, [field]: value } : item
    ));
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'NEW': return 'bg-green-100 text-green-800';
      case 'GOOD': return 'bg-blue-100 text-blue-800';
      case 'FAIR': return 'bg-yellow-100 text-yellow-800';
      case 'DAMAGED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceIcon = (sourceType: string) => {
    return sourceType === 'DISTRIBUTION' ? Building2 : Truck;
  };

  const hasDiscrepancies = items.some(item => 
    item.quantityReceived !== item.quantityExpected || item.quantityDamaged > 0
  );

  const handleSubmit = async () => {
    if (!receipt || isReadOnly) return;

    // Validation
    if (!actualArrivalDate) {
      toast.error("Please provide the actual arrival date");
      return;
    }

    if (items.some(item => item.quantityReceived < 0 || item.quantityDamaged < 0)) {
      toast.error("Quantities cannot be negative");
      return;
    }

    if (items.some(item => item.quantityReceived + item.quantityDamaged > item.quantityExpected)) {
      toast.error("Total received and damaged cannot exceed expected quantity");
      return;
    }

    if (hasDiscrepancies && !discrepancyNotes.trim()) {
      toast.error("Please provide discrepancy notes when quantities don't match");
      return;
    }

    try {
      setIsSubmitting(true);

      const confirmationData = {
        actualArrivalDate,
        confirmationNotes: confirmationNotes.trim() || undefined,
        discrepancyNotes: hasDiscrepancies ? discrepancyNotes.trim() : undefined,
        items: items.map(item => ({
          itemId: item.itemId,
          quantityReceived: item.quantityReceived,
          quantityDamaged: item.quantityDamaged,
          conditionOnArrival: item.conditionOnArrival,
          batchNumber: item.batchNumber || undefined,
          expiryDate: item.expiryDate || undefined,
          itemNotes: item.itemNotes || undefined
        }))
      };

      await onConfirm(receipt.id, confirmationData);
      
      toast.success(hasDiscrepancies 
        ? "Receipt confirmed with discrepancies noted" 
        : "Receipt confirmed successfully"
      );
      
      onClose();
      
    } catch (error) {
      console.error("Error confirming receipt:", error);
      toast.error("Failed to confirm receipt");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset form
      setActualArrivalDate("");
      setConfirmationNotes("");
      setDiscrepancyNotes("");
      setItems([]);
      onClose();
    }
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setActualArrivalDate("");
      setConfirmationNotes("");
      setDiscrepancyNotes("");
      setItems([]);
    }
  }, [isOpen]);

  if (!receipt) return null;

  const SourceIcon = getSourceIcon(receipt.sourceType);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {isReadOnly ? 'View Receipt Details' : 'Confirm Receipt'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Receipt Header */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <SourceIcon className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Receipt #{receipt.receiptNumber}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {receipt.sourceType === 'DISTRIBUTION' ? 'Distribution from' : 'Direct shipment from'} {receipt.sourceName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Reference: {receipt.sourceReference}
                </p>
              </div>
              
              <div className="text-right">
                <div className="flex items-center justify-end gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    Expected: {receipt.expectedArrivalDate ? new Date(receipt.expectedArrivalDate).toLocaleDateString() : 'Not specified'}
                  </span>
                </div>
                <p className="text-sm">
                  <span className="font-medium">{receipt.totalItemsExpected}</span> items expected
                </p>
              </div>
            </div>
          </div>

          {/* Arrival Date */}
          {!isReadOnly && (
            <div>
              <Label htmlFor="arrivalDate">Actual Arrival Date *</Label>
              <Input
                id="arrivalDate"
                type="date"
                value={actualArrivalDate}
                onChange={(e) => setActualArrivalDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="mt-1"
                required
              />
            </div>
          )}

          {/* Items */}
          <div>
            <h3 className="text-lg font-medium mb-3">Items to Confirm</h3>
            <div className="space-y-4">
              {items.map((item) => {
                const hasItemDiscrepancy = item.quantityReceived !== item.quantityExpected || item.quantityDamaged > 0;
                
                return (
                  <div 
                    key={item.itemId} 
                    className={`border rounded-lg p-4 ${hasItemDiscrepancy ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{item.itemName}</h4>
                        <p className="text-sm text-muted-foreground">Code: {item.itemCode}</p>
                      </div>
                      {hasItemDiscrepancy && (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Discrepancy
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Expected Quantity */}
                      <div>
                        <Label className="text-xs">Expected Quantity</Label>
                        <div className="text-lg font-medium text-blue-600">
                          {item.quantityExpected}
                        </div>
                      </div>

                      {/* Received Quantity */}
                      <div>
                        <Label htmlFor={`received-${item.itemId}`} className="text-xs">
                          Quantity Received {!isReadOnly && '*'}
                        </Label>
                        <Input
                          id={`received-${item.itemId}`}
                          type="number"
                          min="0"
                          max={item.quantityExpected}
                          value={item.quantityReceived}
                          onChange={(e) => updateItem(item.itemId, 'quantityReceived', parseInt(e.target.value) || 0)}
                          className="mt-1"
                          disabled={isReadOnly}
                        />
                      </div>

                      {/* Damaged Quantity */}
                      <div>
                        <Label htmlFor={`damaged-${item.itemId}`} className="text-xs">Quantity Damaged</Label>
                        <Input
                          id={`damaged-${item.itemId}`}
                          type="number"
                          min="0"
                          max={item.quantityReceived}
                          value={item.quantityDamaged}
                          onChange={(e) => updateItem(item.itemId, 'quantityDamaged', parseInt(e.target.value) || 0)}
                          className="mt-1"
                          disabled={isReadOnly}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {/* Condition */}
                      <div>
                        <Label htmlFor={`condition-${item.itemId}`} className="text-xs">Condition on Arrival</Label>
                        <select
                          id={`condition-${item.itemId}`}
                          value={item.conditionOnArrival}
                          onChange={(e) => updateItem(item.itemId, 'conditionOnArrival', e.target.value)}
                          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          disabled={isReadOnly}
                        >
                          <option value="NEW">New</option>
                          <option value="GOOD">Good</option>
                          <option value="FAIR">Fair</option>
                          <option value="DAMAGED">Damaged</option>
                        </select>
                        <div className="mt-1">
                          <Badge className={getConditionColor(item.conditionOnArrival)}>
                            {item.conditionOnArrival}
                          </Badge>
                        </div>
                      </div>

                      {/* Batch Number */}
                      <div>
                        <Label htmlFor={`batch-${item.itemId}`} className="text-xs">Batch Number</Label>
                        <Input
                          id={`batch-${item.itemId}`}
                          value={item.batchNumber || ''}
                          onChange={(e) => updateItem(item.itemId, 'batchNumber', e.target.value)}
                          placeholder="Optional"
                          className="mt-1"
                          disabled={isReadOnly}
                        />
                      </div>
                    </div>

                    {/* Item Notes */}
                    {!isReadOnly && (
                      <div className="mt-4">
                        <Label htmlFor={`notes-${item.itemId}`} className="text-xs">Item Notes</Label>
                        <Textarea
                          id={`notes-${item.itemId}`}
                          value={item.itemNotes || ''}
                          onChange={(e) => updateItem(item.itemId, 'itemNotes', e.target.value)}
                          placeholder="Any specific notes about this item..."
                          className="mt-1"
                          rows={2}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          {!isReadOnly && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="confirmationNotes">Confirmation Notes</Label>
                <Textarea
                  id="confirmationNotes"
                  value={confirmationNotes}
                  onChange={(e) => setConfirmationNotes(e.target.value)}
                  placeholder="General notes about this receipt confirmation..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              {hasDiscrepancies && (
                <div>
                  <Label htmlFor="discrepancyNotes">Discrepancy Notes *</Label>
                  <Textarea
                    id="discrepancyNotes"
                    value={discrepancyNotes}
                    onChange={(e) => setDiscrepancyNotes(e.target.value)}
                    placeholder="Explain any discrepancies in quantities or condition..."
                    className="mt-1 border-orange-300"
                    rows={3}
                    required
                  />
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          {hasDiscrepancies && (
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-800">Discrepancies Detected</span>
              </div>
              <p className="text-sm text-orange-700">
                This receipt will be marked as having discrepancies. Please ensure all discrepancy notes are completed.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            
            {!isReadOnly && (
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Receipt
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
