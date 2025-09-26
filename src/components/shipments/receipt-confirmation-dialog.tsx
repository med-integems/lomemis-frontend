"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Package,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Truck,
  Loader2,
} from "lucide-react";
import { shipmentsApi, api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const receiptSchema = z.object({
  actualArrivalDate: z.string().min(1, "Arrival date is required"),
  items: z.array(
    z.object({
      itemId: z.number(),
      quantityReceived: z.number().min(0, "Quantity must be non-negative"),
      notes: z.string().optional(),
    })
  ),
  discrepancyNotes: z.string().optional(),
  attachmentFiles: z.instanceof(FileList).refine(
    (files) => files.length > 0,
    "At least one file (PDF or image) is required"
  ),
});

type ReceiptFormData = z.infer<typeof receiptSchema>;

interface ReceiptConfirmationDialogProps {
  shipmentId: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirmed: () => void;
}

export function ReceiptConfirmationDialog({
  shipmentId,
  isOpen,
  onClose,
  onConfirmed,
}: ReceiptConfirmationDialogProps) {
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      actualArrivalDate: new Date().toISOString().split("T")[0],
      items: [],
      discrepancyNotes: "",
      attachmentFiles: undefined,
    },
  });

  // Load shipment details
  useEffect(() => {
    if (isOpen && shipmentId) {
      const fetchShipment = async () => {
        try {
          setLoading(true);
          setError(null);

          const response = await shipmentsApi.getShipmentById(shipmentId);

          if (response.success && response.data) {
            setShipment(response.data);

            // Initialize form with shipment items
            const items =
              response.data.items?.map((item: any) => ({
                itemId: item.itemId,
                quantityReceived: item.quantityShipped, // Default to shipped quantity
                notes: "",
              })) || [];

            form.reset({
              actualArrivalDate: new Date().toISOString().split("T")[0],
              items,
              discrepancyNotes: "",
              attachmentFiles: undefined,
            });
          } else {
            setError(
              response.error?.message || "Failed to load shipment details"
            );
          }
        } catch (err) {
          console.error("Error fetching shipment:", err);
          setError("Failed to load shipment details");
        } finally {
          setLoading(false);
        }
      };

      fetchShipment();
    }
  }, [isOpen, shipmentId, form]);

  const watchedItems = form.watch("items");

  // Calculate discrepancies
  const hasDiscrepancies =
    shipment?.items?.some((item: any, index: number) => {
      const receivedItem = watchedItems[index];
      return (
        receivedItem && receivedItem.quantityReceived !== item.quantityShipped
      );
    }) || false;

  const onSubmit = async (data: ReceiptFormData) => {
    try {
      setSubmitting(true);
      setError(null);

      // Build multipart form data
      const formData = new FormData();
      formData.append('actualArrivalDate', data.actualArrivalDate);
      formData.append('items', JSON.stringify(data.items));
      if (data.discrepancyNotes) {
        formData.append('discrepancyNotes', data.discrepancyNotes);
      }

      if (data.attachmentFiles && data.attachmentFiles.length > 0) {
        Array.from(data.attachmentFiles).forEach((file) => {
          formData.append('files', file);
        });
      }

      // Use shared axios client so baseURL and auth are consistent
      const { data: result } = await api.put(`/shipments/${shipmentId}/receive`, formData);

      if (result?.success) {
        toast.success("Shipment receipt confirmed successfully");
        onConfirmed();
        onClose();
      } else {
        setError(result?.error?.message || "Failed to confirm receipt");
      }
    } catch (err: any) {
      console.error("Error confirming receipt:", err);
      const message = err?.response?.data?.error?.message || "Failed to confirm receipt";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>;
      case "IN_TRANSIT":
        return <Badge variant="default">In Transit</Badge>;
      case "RECEIVED":
        return <Badge variant="success">Received</Badge>;
      case "DISCREPANCY":
        return <Badge variant="destructive">Discrepancy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="max-w-2xl"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Loading Shipment Details</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading shipment details...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error && !shipment) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="max-w-2xl"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Confirm Shipment Receipt
          </DialogTitle>
          <DialogDescription>
            Confirm the receipt of shipment {shipment?.shipmentNumber}
            and report any discrepancies
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {shipment && (
          <>
            {/* Shipment Details */}
            <div className="bg-muted p-4 rounded-lg mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Truck className="h-4 w-4" />
                    From Warehouse
                  </div>
                  <div className="font-medium">
                    {shipment.originWarehouseName}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    Dispatched
                  </div>
                  <div className="font-medium">
                    {formatDate(shipment.dispatchDate || shipment.createdAt)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Package className="h-4 w-4" />
                    Items
                  </div>
                  <div className="font-medium">
                    {shipment.totalItems || 0} items
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Status</div>
                  <div>{getStatusBadge(shipment.status)}</div>
                </div>
              </div>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Basic Receipt Details */}
                <FormField
                  control={form.control}
                  name="actualArrivalDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actual Arrival Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* Items Verification */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Verify Items Received
                  </h3>

                  {hasDiscrepancies && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Discrepancies detected. Please provide notes explaining
                        the differences.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3">
                    {shipment.items?.map((item: any, index: number) => {
                      const receivedQuantity =
                        watchedItems[index]?.quantityReceived || 0;
                      const hasDiscrepancy =
                        receivedQuantity !== item.quantityShipped;

                      return (
                        <div
                          key={item.itemId}
                          className={`border rounded-lg p-4 ${
                            hasDiscrepancy
                              ? "border-orange-300 bg-orange-50"
                              : "border-gray-200"
                          }`}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div>
                              <div className="font-medium">{item.itemName}</div>
                              <div className="text-sm text-muted-foreground">
                                Code: {item.itemCode}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Shipped: {item.quantityShipped}{" "}
                                {item.unitOfMeasure}
                              </div>
                            </div>

                            <FormField
                              control={form.control}
                              name={`items.${index}.quantityReceived`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Quantity Received</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(
                                          parseInt(e.target.value) || 0
                                        )
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="flex items-center justify-center">
                              {hasDiscrepancy ? (
                                <Badge variant="destructive">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Discrepancy
                                </Badge>
                              ) : (
                                <Badge variant="success">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Match
                                </Badge>
                              )}
                            </div>

                            <FormField
                              control={form.control}
                              name={`items.${index}.notes`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Item Notes</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Condition, damage, etc."
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {hasDiscrepancies && (
                  <FormField
                    control={form.control}
                    name="discrepancyNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discrepancy Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Explain the reasons for discrepancies (damaged items, missing items, etc.)"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Required when there are discrepancies between shipped
                          and received quantities
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Separator />

                {/* File Upload Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Required Attachments
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="attachmentFiles"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <span className="text-red-500">*</span>
                          Upload Attachment Files
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept=".pdf,image/*"
                            multiple
                            onChange={(e) => onChange(e.target.files)}
                            {...field}
                            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                          />
                        </FormControl>
                        <FormDescription>
                          Upload PDF files (COC documents) and/or images (receipt photos). At least one file is required.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      "Confirm Receipt"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
