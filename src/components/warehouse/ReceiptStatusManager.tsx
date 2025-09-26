"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Settings,
  CheckCircle,
  AlertTriangle,
  Clock,
  Package,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useApiMutation } from "@/hooks/useApi";
import { stockReceiptApi } from "@/lib/api";

interface Receipt {
  id: number;
  receiptNumber: string;
  supplierName?: string;
  status: string;
  totalItems: number;
  receiptDate: string;
  warehouseName: string;
}

interface ReceiptStatusManagerProps {
  receipts: Receipt[];
  onStatusUpdate?: () => void;
  className?: string;
}

type ReceiptStatus = "DRAFT" | "RECEIVED" | "VALIDATED" | "DISCREPANCY";

export function ReceiptStatusManager({
  receipts,
  onStatusUpdate,
  className = "",
}: ReceiptStatusManagerProps) {
  const [selectedReceipts, setSelectedReceipts] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState<ReceiptStatus | "">("");
  const [bulkNotes, setBulkNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Mutation for bulk status updates
  const bulkUpdateMutation = useApiMutation(
    async (data: {
      receiptIds: number[];
      status: ReceiptStatus;
      notes?: string;
    }) => {
      // Process each receipt individually since there's no bulk endpoint
      const results = await Promise.allSettled(
        data.receiptIds.map((id) =>
          stockReceiptApi.validateReceipt(id, {
            status: data.status,
            discrepancyNotes: data.notes,
          })
        )
      );

      const successful = results.filter(
        (result) => result.status === "fulfilled"
      ).length;
      const failed = results.length - successful;

      return {
        success: true,
        data: { successful, failed, total: results.length },
      };
    },
    {
      onSuccess: (response) => {
        if (response.success) {
          const { successful, failed, total } = response.data;
          if (failed === 0) {
            toast.success(`Successfully updated ${successful} receipts`);
          } else {
            toast.warning(`Updated ${successful} receipts, ${failed} failed`);
          }
          setSelectedReceipts([]);
          setBulkStatus("");
          setBulkNotes("");
          setIsDialogOpen(false);
          onStatusUpdate?.();
        }
      },
      onError: () => {
        toast.error("Failed to update receipt statuses");
      },
    }
  );

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReceipts(receipts.map((r) => r.id));
    } else {
      setSelectedReceipts([]);
    }
  };

  const handleSelectReceipt = (receiptId: number, checked: boolean) => {
    if (checked) {
      setSelectedReceipts((prev) => [...prev, receiptId]);
    } else {
      setSelectedReceipts((prev) => prev.filter((id) => id !== receiptId));
    }
  };

  const handleBulkUpdate = () => {
    if (selectedReceipts.length === 0) {
      toast.error("Please select at least one receipt");
      return;
    }

    if (!bulkStatus) {
      toast.error("Please select a status");
      return;
    }

    bulkUpdateMutation.mutate({
      receiptIds: selectedReceipts,
      status: bulkStatus,
      notes: bulkNotes || undefined,
    });
  };

  const canUpdateStatus = (currentStatus: string, newStatus: string) => {
    // Define allowed status transitions
    const transitions: Record<string, string[]> = {
      DRAFT: ["RECEIVED", "DISCREPANCY"],
      RECEIVED: ["VALIDATED", "DISCREPANCY"],
      VALIDATED: ["DISCREPANCY"], // Can only mark as discrepancy after validation
      DISCREPANCY: ["RECEIVED", "VALIDATED"], // Can fix discrepancies
    };

    return transitions[currentStatus]?.includes(newStatus) || false;
  };

  const getValidStatusOptions = () => {
    if (selectedReceipts.length === 0) return [];

    const selectedReceiptStatuses = receipts
      .filter((r) => selectedReceipts.includes(r.id))
      .map((r) => r.status);

    // Find common valid transitions for all selected receipts
    const allStatuses: ReceiptStatus[] = [
      "DRAFT",
      "RECEIVED",
      "VALIDATED",
      "DISCREPANCY",
    ];
    return allStatuses.filter((status) =>
      selectedReceiptStatuses.every((currentStatus) =>
        canUpdateStatus(currentStatus, status)
      )
    );
  };

  const selectedReceiptDetails = receipts.filter((r) =>
    selectedReceipts.includes(r.id)
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Receipt Status Management
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Select receipts to update their status in bulk
        </p>
      </CardHeader>
      <CardContent>
        {receipts.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No receipts available
            </h3>
            <p className="text-gray-500">
              No receipts are available for status management.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selection Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={
                    selectedReceipts.length === receipts.length &&
                    receipts.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="text-sm font-medium">
                  Select All ({receipts.length})
                </Label>
              </div>
              <div className="text-sm text-gray-600">
                {selectedReceipts.length} selected
              </div>
            </div>

            {/* Receipt List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {receipts.map((receipt) => {
                const statusConfig = getStatusBadge(receipt.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={receipt.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border ${
                      selectedReceipts.includes(receipt.id)
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <Checkbox
                      id={`receipt-${receipt.id}`}
                      checked={selectedReceipts.includes(receipt.id)}
                      onCheckedChange={(checked) =>
                        handleSelectReceipt(receipt.id, checked as boolean)
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {receipt.receiptNumber}
                        </span>
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {receipt.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600">
                        {receipt.supplierName} • {receipt.totalItems} items •{" "}
                        {new Date(receipt.receiptDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bulk Actions */}
            {selectedReceipts.length > 0 && (
              <div className="border-t pt-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bulk-status">New Status</Label>
                    <Select
                      value={bulkStatus}
                      onValueChange={(value) =>
                        setBulkStatus(value as ReceiptStatus)
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        {getValidStatusOptions().map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="bulk-notes">Notes (Optional)</Label>
                    <Textarea
                      id="bulk-notes"
                      value={bulkNotes}
                      onChange={(e) => setBulkNotes(e.target.value)}
                      placeholder="Add notes about this status change..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        disabled={!bulkStatus || selectedReceipts.length === 0}
                        className="w-full"
                      >
                        Update {selectedReceipts.length} Receipt
                        {selectedReceipts.length !== 1 ? "s" : ""}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm Bulk Status Update</DialogTitle>
                        <DialogDescription>
                          You are about to update the status of{" "}
                          {selectedReceipts.length} receipt
                          {selectedReceipts.length !== 1 ? "s" : ""} to{" "}
                          <strong>{bulkStatus?.replace("_", " ")}</strong>.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <Alert>
                          <AlertTriangle className="w-4 h-4" />
                          <AlertDescription>
                            This action cannot be undone. Please review the
                            selected receipts before proceeding.
                          </AlertDescription>
                        </Alert>

                        <div className="max-h-32 overflow-y-auto space-y-2">
                          {selectedReceiptDetails.map((receipt) => (
                            <div
                              key={receipt.id}
                              className="text-sm p-2 bg-gray-50 rounded"
                            >
                              <div className="font-medium">
                                {receipt.receiptNumber}
                              </div>
                              <div className="text-gray-600">
                                Current: {receipt.status} → New: {bulkStatus}
                              </div>
                            </div>
                          ))}
                        </div>

                        {bulkNotes && (
                          <div>
                            <Label>Notes:</Label>
                            <div className="text-sm p-2 bg-gray-50 rounded mt-1">
                              {bulkNotes}
                            </div>
                          </div>
                        )}
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          disabled={bulkUpdateMutation.isPending}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleBulkUpdate}
                          disabled={bulkUpdateMutation.isPending}
                        >
                          {bulkUpdateMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            "Confirm Update"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ReceiptStatusManager;
