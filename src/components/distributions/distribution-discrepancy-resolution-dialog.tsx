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
  Plus,
  Minus,
} from "lucide-react";
import { distributionsApi } from "@/lib/api";
import { toast } from "sonner";

const resolutionSchema = z.object({
  resolutionNotes: z
    .string()
    .min(10, "Resolution notes must be at least 10 characters"),
  adjustments: z
    .array(
      z.object({
        itemId: z.number(),
        adjustmentQuantity: z.number(),
        reason: z.string().min(1, "Reason is required"),
      })
    )
    .optional(),
});

type ResolutionFormData = z.infer<typeof resolutionSchema>;

interface DistributionDiscrepancyResolutionDialogProps {
  distribution: any;
  isOpen: boolean;
  onClose: () => void;
  onResolved: () => void;
}

export function DistributionDiscrepancyResolutionDialog({
  distribution,
  isOpen,
  onClose,
  onResolved,
}: DistributionDiscrepancyResolutionDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ResolutionFormData>({
    resolver: zodResolver(resolutionSchema),
    defaultValues: {
      resolutionNotes: "",
      adjustments: [],
    },
  });

  // Get items with discrepancies
  const discrepancyItems =
    distribution?.items?.filter(
      (item: any) => item.discrepancyQuantity !== 0
    ) || [];

  const addAdjustment = (
    itemId: number,
    itemName: string,
    discrepancy: number
  ) => {
    const currentAdjustments = form.getValues("adjustments") || [];
    const existingIndex = currentAdjustments.findIndex(
      (adj) => adj.itemId === itemId
    );

    if (existingIndex >= 0) {
      // Update existing adjustment
      form.setValue(
        `adjustments.${existingIndex}.adjustmentQuantity`,
        -discrepancy
      );
    } else {
      // Add new adjustment
      form.setValue("adjustments", [
        ...currentAdjustments,
        {
          itemId,
          adjustmentQuantity: -discrepancy, // Negative to correct the discrepancy
          reason: `Correct discrepancy for ${itemName}`,
        },
      ]);
    }
  };

  const removeAdjustment = (index: number) => {
    const currentAdjustments = form.getValues("adjustments") || [];
    form.setValue(
      "adjustments",
      currentAdjustments.filter((_, i) => i !== index)
    );
  };

  const onSubmit = async (data: ResolutionFormData) => {
    try {
      setSubmitting(true);
      setError(null);

      const response = await distributionsApi.resolveDistributionDiscrepancy(
        distribution.id,
        {
          resolutionNotes: data.resolutionNotes,
          adjustments: data.adjustments || [],
        }
      );

      if (response.success) {
        toast.success("Distribution discrepancy resolved successfully");
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

  const watchedAdjustments = form.watch("adjustments") || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Resolve Distribution Discrepancy
          </DialogTitle>
          <DialogDescription>
            Resolve discrepancies for distribution{" "}
            {distribution?.distributionNumber} and make any necessary inventory
            adjustments
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
                    Distributed: {item.quantityDistributed} | Confirmed:{" "}
                    {item.quantityConfirmed}
                  </div>
                  <Badge
                    variant={
                      item.discrepancyQuantity > 0 ? "default" : "destructive"
                    }
                  >
                    {item.discrepancyQuantity > 0 ? "+" : ""}
                    {item.discrepancyQuantity}
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      addAdjustment(
                        item.itemId,
                        item.itemName,
                        item.discrepancyQuantity
                      )
                    }
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Adjust
                  </Button>
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

            <Separator />

            {/* Inventory Adjustments */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Inventory Adjustments</h3>
                <div className="text-sm text-muted-foreground">
                  Optional: Make inventory adjustments to correct discrepancies
                </div>
              </div>

              {watchedAdjustments.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No adjustments added. Click &quot;Adjust&quot; next to items above to
                  add inventory corrections.
                </div>
              ) : (
                <div className="space-y-3">
                  {watchedAdjustments.map((adjustment, index) => {
                    const item = distribution.items.find(
                      (i: any) => i.itemId === adjustment.itemId
                    );
                    return (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                          <div>
                            <div className="font-medium">{item?.itemName}</div>
                            <div className="text-sm text-muted-foreground">
                              {item?.itemCode}
                            </div>
                          </div>

                          <FormField
                            control={form.control}
                            name={`adjustments.${index}.adjustmentQuantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Adjustment Quantity</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormDescription className="text-xs">
                                  Positive = Add to inventory, Negative = Remove
                                  from inventory
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`adjustments.${index}.reason`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Reason</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Reason for adjustment"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeAdjustment(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Minus className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resolving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolve Discrepancy
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
