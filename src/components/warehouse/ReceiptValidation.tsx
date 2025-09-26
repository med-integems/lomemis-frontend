"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QualityCheckPhotoUpload } from "./QualityCheckPhotoUpload";
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  FileCheck, 
  Eye,
  Star,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export type ReceiptStatus = 'DRAFT' | 'RECEIVED' | 'VALIDATED' | 'DISCREPANCY';
export type QualityStatus = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED';

export interface QualityCheck {
  id: number;
  receiptId: number;
  itemId: number;
  quantityChecked: number;
  qualityStatus: QualityStatus;
  conditionNotes?: string;
  inspectorId: number;
  inspectionDate: Date;
  photosCount?: number;
  correctiveAction?: string;
  itemName: string;
  itemCode: string;
  inspectorName: string;
}

export interface StockReceiptDetails {
  id: number;
  receiptNumber: string;
  status?: ReceiptStatus;
  validationDate?: Date;
  validatedBy?: number;
  validatedByName?: string;
  discrepancyNotes?: string;
  items: Array<{
    id: number;
    itemId: number;
    itemName: string;
    itemCode: string;
    quantityReceived: number;
    conditionStatus?: string;
    qualityChecked?: boolean;
    inspectorNotes?: string;
  }>;
}

interface ReceiptValidationProps {
  receipt: StockReceiptDetails;
  qualityChecks: QualityCheck[];
  onValidate: (status: ReceiptStatus, discrepancyNotes?: string) => Promise<void>;
  onCreateQualityCheck: (check: {
    receiptId: number;
    itemId: number;
    quantityChecked: number;
    qualityStatus: QualityStatus;
    conditionNotes?: string;
    correctiveAction?: string;
  }, photos?: File[]) => Promise<void>;
  loading?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<ReceiptStatus, { 
  label: string; 
  color: string; 
  icon: any; 
  description: string;
}> = {
  DRAFT: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-800',
    icon: Clock,
    description: 'Receipt created but not yet processed'
  },
  RECEIVED: {
    label: 'Received',
    color: 'bg-blue-100 text-blue-800',
    icon: FileCheck,
    description: 'Items received and recorded'
  },
  VALIDATED: {
    label: 'Validated',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    description: 'Receipt validated and approved'
  },
  DISCREPANCY: {
    label: 'Discrepancy',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
    description: 'Issues found requiring attention'
  }
};

const QUALITY_STATUS_CONFIG: Record<QualityStatus, {
  label: string;
  color: string;
  icon: any;
  description: string;
}> = {
  EXCELLENT: {
    label: 'Excellent',
    color: 'bg-green-100 text-green-800',
    icon: Star,
    description: 'Perfect condition, exceeds expectations'
  },
  GOOD: {
    label: 'Good',
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle,
    description: 'Good condition, meets standards'
  },
  FAIR: {
    label: 'Fair',
    color: 'bg-yellow-100 text-yellow-800',
    icon: AlertTriangle,
    description: 'Acceptable condition with minor issues'
  },
  POOR: {
    label: 'Poor',
    color: 'bg-orange-100 text-orange-800',
    icon: AlertCircle,
    description: 'Poor condition, significant issues'
  },
  DAMAGED: {
    label: 'Damaged',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
    description: 'Damaged or unusable condition'
  }
};

export function ReceiptValidation({
  receipt,
  qualityChecks,
  onValidate,
  onCreateQualityCheck,
  loading = false,
  className = ""
}: ReceiptValidationProps) {
  // Default to a sensible next action: Discrepancy if none selected yet
  const [selectedStatus, setSelectedStatus] = useState<ReceiptStatus>(
    ((): ReceiptStatus => {
      if (receipt.status) return receipt.status;
      return 'DISCREPANCY';
    })()
  );
  const [discrepancyNotes, setDiscrepancyNotes] = useState(receipt.discrepancyNotes || '');
  const [selectedItem, setSelectedItem] = useState<number>(0);
  const [newQualityCheck, setNewQualityCheck] = useState({
    quantityChecked: 0,
    qualityStatus: 'GOOD' as QualityStatus,
    conditionNotes: '',
    correctiveAction: ''
  });
  const [photos, setPhotos] = useState<File[]>([]);

  const currentStatusConfig = STATUS_CONFIG[receipt.status || 'DRAFT'];
  const StatusIcon = currentStatusConfig.icon;

  const handleValidate = async () => {
    // Validate business rules before updating status
    const validation = validateStatusUpdate(selectedStatus);
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }

    try {
      await onValidate(selectedStatus, discrepancyNotes);
      toast.success(`Receipt ${selectedStatus.toLowerCase()} successfully`);
    } catch (error) {
      toast.error('Failed to update receipt status');
    }
  };

  const handleCreateQualityCheck = async () => {
    if (!selectedItem) {
      toast.error('Please select an item');
      return;
    }

    if (newQualityCheck.quantityChecked <= 0) {
      toast.error('Please enter quantity checked');
      return;
    }

    try {
      await onCreateQualityCheck({
        receiptId: receipt.id,
        itemId: selectedItem,
        ...newQualityCheck
      }, photos);
      
      // Reset form
      setSelectedItem(0);
      setNewQualityCheck({
        quantityChecked: 0,
        qualityStatus: 'GOOD',
        conditionNotes: '',
        correctiveAction: ''
      });
      setPhotos([]);
      
      toast.success('Quality check created successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create quality check';
      toast.error(errorMessage);
    }
  };

  const getItemQualityChecks = (itemId: number) => {
    return qualityChecks.filter(qc => qc.itemId === itemId);
  };

  const getOverallQualityStatus = () => {
    if (qualityChecks.length === 0) return null;
    
    const statusCounts = qualityChecks.reduce((acc, qc) => {
      acc[qc.qualityStatus] = (acc[qc.qualityStatus] || 0) + 1;
      return acc;
    }, {} as Record<QualityStatus, number>);

    // Return the most frequent status
    return Object.entries(statusCounts).reduce((a, b) => 
      statusCounts[a[0] as QualityStatus] > statusCounts[b[0] as QualityStatus] ? a : b
    )[0] as QualityStatus;
  };

  const overallQuality = getOverallQualityStatus();
  const qualityCheckedItems = new Set(qualityChecks.map(qc => qc.itemId));
  const totalItems = receipt.items.length;
  const checkedItems = qualityCheckedItems.size;

  // Business logic validation functions
  const areAllItemsQualityChecked = () => {
    return receipt.items.every(item => qualityCheckedItems.has(item.itemId));
  };

  const getValidNextStatuses = (currentStatus: ReceiptStatus): ReceiptStatus[] => {
    switch (currentStatus) {
      case 'DRAFT': {
        const next: ReceiptStatus[] = ['DISCREPANCY'];
        if (areAllItemsQualityChecked()) next.unshift('VALIDATED');
        return next;
      }
      case 'DISCREPANCY': {
        // From discrepancy, allow move to validated once checks are complete
        return areAllItemsQualityChecked() ? ['VALIDATED'] : [];
      }
      case 'VALIDATED':
        // Allow moving validated back to discrepancy if needed
        return ['DISCREPANCY'];
      default:
        return [];
    }
  };

  const validateStatusUpdate = (newStatus: ReceiptStatus): { isValid: boolean; message: string } => {
    const currentStatus = receipt.status || 'DRAFT';
    const validNextStatuses = getValidNextStatuses(currentStatus);

    if (!validNextStatuses.includes(newStatus)) {
      if (newStatus === 'VALIDATED' && !areAllItemsQualityChecked()) {
        return {
          isValid: false,
          message: `All items must have quality checks before marking as validated. ${checkedItems}/${totalItems} items checked.`
        };
      }
      return {
        isValid: false,
        message: `Cannot change status from ${currentStatus.toLowerCase()} to ${newStatus.toLowerCase()}.`
      };
    }

    if (newStatus === 'DISCREPANCY' && !discrepancyNotes.trim()) {
      return {
        isValid: false,
        message: 'Discrepancy notes are required when marking as discrepancy.'
      };
    }

    return { isValid: true, message: '' };
  };

  const getStatusUpdateMessage = () => {
    const currentStatus = receipt.status || 'DRAFT';
    const validNextStatuses = getValidNextStatuses(currentStatus);

    if (validNextStatuses.length === 0) {
      if ((currentStatus === 'DRAFT' || currentStatus === 'DISCREPANCY') && !areAllItemsQualityChecked()) {
        return `Complete quality checks for all items (${checkedItems}/${totalItems}) to enable Validation, or provide notes to mark as Discrepancy.`;
      }
      return 'No status updates available.';
    }

    if ((currentStatus === 'DRAFT' || currentStatus === 'DISCREPANCY') && !areAllItemsQualityChecked()) {
      return `You can mark as Discrepancy now, or complete quality checks (${checkedItems}/${totalItems}) to enable Validation.`;
    }

    return `Available next statuses: ${validNextStatuses.join(', ')}`;
  };

  // Update selectedStatus when receipt status changes or quality checks change
  React.useEffect(() => {
    const currentStatus = receipt.status || 'DRAFT';
    const validNextStatuses = getValidNextStatuses(currentStatus);
    if (validNextStatuses.length > 0 && !validNextStatuses.includes(selectedStatus)) {
      setSelectedStatus(validNextStatuses[0]);
    }
  }, [receipt.status, qualityChecks.length]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className="h-5 w-5" />
            Receipt Validation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Badge className={currentStatusConfig.color} variant="secondary">
              {currentStatusConfig.label}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {currentStatusConfig.description}
            </span>
          </div>

          {receipt.validationDate && receipt.validatedByName && (
            <div className="text-sm text-muted-foreground">
              Validated on {new Date(receipt.validationDate).toLocaleDateString()} by {receipt.validatedByName}
            </div>
          )}

          {receipt.discrepancyNotes && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Discrepancy Notes:</strong> {receipt.discrepancyNotes}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Quality Check Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Quality Inspection Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold flex items-center justify-center gap-2">
                {checkedItems}/{totalItems}
                {areAllItemsQualityChecked() && (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                )}
              </div>
              <div className="text-sm text-muted-foreground">Items Inspected</div>
              {!areAllItemsQualityChecked() && (
                <div className="text-xs text-yellow-600 mt-1">
                  {totalItems - checkedItems} remaining
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{qualityChecks.length}</div>
              <div className="text-sm text-muted-foreground">Quality Checks</div>
            </div>
            <div className="text-center">
              {overallQuality ? (
                <>
                  <Badge className={QUALITY_STATUS_CONFIG[overallQuality].color} variant="secondary">
                    {QUALITY_STATUS_CONFIG[overallQuality].label}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">Overall Quality</div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-gray-400">-</div>
                  <div className="text-sm text-muted-foreground">No checks yet</div>
                </>
              )}
            </div>
          </div>

          {/* Items Quality Status */}
          <div className="space-y-2">
            {receipt.items.map((item) => {
              const itemChecks = getItemQualityChecks(item.itemId);
              const hasChecks = itemChecks.length > 0;
              const latestCheck = itemChecks[itemChecks.length - 1];

              return (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.itemName}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.itemCode} • Qty: {item.quantityReceived.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasChecks ? (
                      <>
                        <Badge className={QUALITY_STATUS_CONFIG[latestCheck.qualityStatus].color} variant="secondary">
                          {QUALITY_STATUS_CONFIG[latestCheck.qualityStatus].label}
                        </Badge>
                        <Badge variant="outline">
                          {itemChecks.length} check{itemChecks.length > 1 ? 's' : ''}
                        </Badge>
                      </>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">
                        Not Inspected
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Create Quality Check */}
      <Card>
        <CardHeader>
          <CardTitle>Create Quality Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Select Item</Label>
              <Select
                value={selectedItem.toString()}
                onValueChange={(value) => setSelectedItem(parseInt(value))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select item to inspect" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Select Item</SelectItem>
                  {receipt.items.map((item) => {
                    const hasQualityCheck = qualityCheckedItems.has(item.itemId);
                    return (
                      <SelectItem 
                        key={item.itemId} 
                        value={item.itemId.toString()}
                        disabled={hasQualityCheck}
                      >
                        {item.itemName} ({item.itemCode})
                        {hasQualityCheck && <span className="text-green-600 ml-2">✓ Checked</span>}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Quantity Checked</Label>
              <input
                type="number"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007A33] mt-1"
                value={newQualityCheck.quantityChecked || ""}
                onChange={(e) => setNewQualityCheck({
                  ...newQualityCheck,
                  quantityChecked: parseInt(e.target.value) || 0
                })}
                placeholder="Quantity inspected"
              />
            </div>

            <div>
              <Label>Quality Status</Label>
              <Select
                value={newQualityCheck.qualityStatus}
                onValueChange={(value) => setNewQualityCheck({
                  ...newQualityCheck,
                  qualityStatus: value as QualityStatus
                })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(QUALITY_STATUS_CONFIG).map(([value, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Replaced legacy photos count with actual photo upload */}
          </div>

          <div>
            <Label>Condition Notes</Label>
            <Textarea
              value={newQualityCheck.conditionNotes}
              onChange={(e) => setNewQualityCheck({
                ...newQualityCheck,
                conditionNotes: e.target.value
              })}
              placeholder="Detailed notes about the condition"
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <QualityCheckPhotoUpload value={photos} onPhotosChange={setPhotos} />
          </div>

          <div>
            <Label>Corrective Action</Label>
            <Textarea
              value={newQualityCheck.correctiveAction}
              onChange={(e) => setNewQualityCheck({
                ...newQualityCheck,
                correctiveAction: e.target.value
              })}
              placeholder="Actions to be taken if issues found"
              rows={2}
              className="mt-1"
            />
          </div>

          <Button
            onClick={handleCreateQualityCheck}
            disabled={loading || !selectedItem}
            className="bg-[#007A33] hover:bg-[#005A25]"
          >
            Create Quality Check
          </Button>
        </CardContent>
      </Card>

      {/* Update Status */}
      <Card>
        <CardHeader>
          <CardTitle>Update Receipt Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Update Instructions */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {getStatusUpdateMessage()}
            </AlertDescription>
          </Alert>

          <div>
            <Label>New Status</Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value as ReceiptStatus)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getValidNextStatuses(receipt.status || 'DRAFT').map((statusValue) => {
                  const config = STATUS_CONFIG[statusValue];
                  const Icon = config.icon;
                  return (
                    <SelectItem key={statusValue} value={statusValue}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Show discrepancy notes field only when selecting DISCREPANCY */}
          {(selectedStatus === 'DISCREPANCY' || receipt.discrepancyNotes) && (
            <div>
              <Label>
                Discrepancy Notes
                {selectedStatus === 'DISCREPANCY' && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Textarea
                value={discrepancyNotes}
                onChange={(e) => setDiscrepancyNotes(e.target.value)}
                placeholder="Required: Describe the discrepancies or issues found"
                rows={3}
                className={`mt-1 ${selectedStatus === 'DISCREPANCY' && !discrepancyNotes.trim() ? 'border-red-300' : ''}`}
              />
            </div>
          )}

          {/* Quality Check Progress Indicator */}
          {receipt.status !== 'VALIDATED' && !areAllItemsQualityChecked() && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Quality checks required: {checkedItems}/{totalItems} items completed. 
                Complete all quality checks to enable final status updates.
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleValidate}
            disabled={
              loading ||
              getValidNextStatuses(receipt.status || 'DRAFT').length === 0 ||
              (selectedStatus === 'DISCREPANCY' && !discrepancyNotes.trim()) ||
              (selectedStatus === 'VALIDATED' && !areAllItemsQualityChecked())
            }
            className="bg-[#007A33] hover:bg-[#005A25] disabled:bg-gray-400"
          >
            {loading
              ? 'Updating...'
              : selectedStatus === 'DISCREPANCY'
              ? 'Mark as Discrepancy'
              : selectedStatus === 'VALIDATED'
              ? 'Mark as Validated'
              : 'Update Status'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default ReceiptValidation;
