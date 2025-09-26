"use client";

import { useState } from "react";
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
  AlertTriangle,
  CheckCircle,
  Package,
  Loader2,
} from "lucide-react";
import { shipmentsApi } from "@/lib/api";
import { toast } from "sonner";

const resolutionSchema = z.object({
  resolutionNotes: z
    .string()
    .min(10, "Resolution notes must be at least 10 characters"),
});

type ResolutionFormData = z.infer<typeof resolutionSchema>;

interface DiscrepancyResolutionDialogProps {
  shipment: any;
  isOpen: boolean;
  onClose: () => void;
  onResolved: () => void;
}

export function DiscrepancyResolutionDialog({
  shipment,
  isOpen,
  onClose,
  onResolved,
}: DiscrepancyResolutionDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ResolutionFormData>({
    resolver: zodResolver(resolutionSchema),
    defaultValues: {
      resolutionNotes: "",
    },
  });

  // Get items with discrepancies
  const discrepancyItems =
    shipment?.items?.filter((item: any) => item.discrepancyQuantity !== 0) ||
    [];


  const onSubmit = async (data: ResolutionFormData) => {
    try {
      setSubmitting(true);
      setError(null);

      const response = await shipmentsApi.resolveShipmentDiscrepancy(
        shipment.id,
        {
          resolutionNotes: data.resolutionNotes,
        }
      );

      if (response.success) {
        toast.success("Shipment discrepancy resolved successfully");
        onResolved();
        onClose();
      } else {
        setError(response.error?.message || "Failed to resolve discrepancy");
      }
    } catch (err) {
      console.error("Error resolving discrepancy:", err);
      setError("Failed to resolve discrepancy");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Resolve Shipment Discrepancy
          </DialogTitle>
          <DialogDescription>
            Document the resolution notes for shipment {shipment?.shipmentNumber} discrepancies.
            To send additional items, create a new shipment.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Discrepancy Summary */}
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
          <h3 className="font-semibold text-orange-800 mb-3">
            Discrepancy Summary
          </h3>
          <div className="space-y-2">
            {discrepancyItems.map((item: any) => (
              <div
                key={item.itemId}
                className="flex items-center justify-between"
              >
                <div>
                  <span className="font-medium">{item.itemName}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({item.itemCode})
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    Shipped: {item.quantityShipped} | Received:{" "}
                    {item.quantityReceived}
                  </div>
                  <Badge
                    variant={
                      item.discrepancyQuantity > 0 ? "default" : "destructive"
                    }
                  >
                    {item.discrepancyQuantity > 0 ? "+" : ""}
                    {item.discrepancyQuantity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Resolution Notes */}
            <FormField
              control={form.control}
              name="resolutionNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resolution Notes *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain how the discrepancy was resolved, what caused it, and any actions taken..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide detailed notes about the resolution process and any
                    corrective actions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Resolution Instructions */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This will add resolution notes to document the discrepancy. The shipment status will remain as "Discrepancy" for audit purposes. 
                To send additional items to resolve shortages, create a new shipment to the same destination.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Resolution Notes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
