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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  MapPin,
  User,
  Truck
} from "lucide-react";
import { ShipmentWithDetails } from "@/types";
import { formatDate } from "@/lib/utils";

const confirmationSchema = z.object({
  receivedDate: z.string().min(1, "Received date is required"),
  receivedBy: z.string().min(1, "Receiver name is required"),
  items: z.array(z.object({
    itemId: z.number(),
    itemName: z.string(),
    expectedQuantity: z.number(),
    receivedQuantity: z.number().min(0, "Quantity must be non-negative"),
    hasDiscrepancy: z.boolean(),
    discrepancyReason: z.string().optional(),
  })),
  overallCondition: z.enum(["excellent", "good", "fair", "poor"]),
  notes: z.string().optional(),
  hasDiscrepancies: z.boolean(),
  totalDiscrepancies: z.number().optional(),
});

type ConfirmationFormData = z.infer<typeof confirmationSchema>;

interface ShipmentConfirmationFormProps {
  shipment: ShipmentWithDetails;
  onConfirm: (shipmentId: number, data: any) => void;
  onCancel: () => void;
}

export function ShipmentConfirmationForm({
  shipment,
  onConfirm,
  onCancel,
}: ShipmentConfirmationFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<ConfirmationFormData>({
    resolver: zodResolver(confirmationSchema),
    defaultValues: {
      receivedDate: new Date().toISOString().split('T')[0],
      receivedBy: "",
      items: shipment.items?.map(item => ({
        itemId: item.itemId,
        itemName: item.itemName,
        expectedQuantity: item.quantity,
        receivedQuantity: item.quantity,
        hasDiscrepancy: false,
        discrepancyReason: "",
      })) || [],
      overallCondition: "good",
      notes: "",
      hasDiscrepancies: false,
      totalDiscrepancies: 0,
    },
  });

  const watchedItems = form.watch("items");

  // Calculate discrepancies whenever items change
  useEffect(() => {
    const discrepancies = watchedItems.filter(item => 
      item.receivedQuantity !== item.expectedQuantity
    );
    
    const hasDiscrepancies = discrepancies.length > 0;
    const totalDiscrepancies = discrepancies.reduce((sum, item) => 
      sum + Math.abs(item.expectedQuantity - item.receivedQuantity), 0
    );

    form.setValue("hasDiscrepancies", hasDiscrepancies);
    form.setValue("totalDiscrepancies", totalDiscrepancies);

    // Auto-mark items with discrepancies
    watchedItems.forEach((item, index) => {
      const hasItemDiscrepancy = item.receivedQuantity !== item.expectedQuantity;
      if (hasItemDiscrepancy !== item.hasDiscrepancy) {
        form.setValue(`items.${index}.hasDiscrepancy`, hasItemDiscrepancy);
      }
    });
  }, [watchedItems, form]);

  const onSubmit = async (data: ConfirmationFormData) => {
    setLoading(true);
    try {
      await onConfirm(shipment.id, {
        ...data,
        shipmentId: shipment.id,
        status: 'delivered',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'in_transit':
        return <Badge variant="default">In Transit</Badge>;
      case 'delivered':
        return <Badge variant="success">Delivered</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Confirm Shipment Receipt
          </DialogTitle>
          <DialogDescription>
            Confirm the receipt of shipment SH-{shipment.id.toString().padStart(6, '0')} 
            and report any discrepancies
          </DialogDescription>
        </DialogHeader>

        {/* Shipment Details */}
        <div className="bg-muted p-4 rounded-lg mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Truck className="h-4 w-4" />
                From Warehouse
              </div>
              <div className="font-medium">{shipment.originWarehouseName}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                Shipped
              </div>
              <div className="font-medium">
                {formatDate(shipment.shippedDate || shipment.createdAt)}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Package className="h-4 w-4" />
                Items
              </div>
              <div className="font-medium">{shipment.totalItems || 0} items</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Status</div>
              <div>{getStatusBadge(shipment.status)}</div>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Confirmation Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="receivedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Received</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="receivedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Received By</FormLabel>
                    <FormControl>
                      <Input placeholder="Name of person who received the shipment" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="overallCondition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overall Condition of Shipment</FormLabel>
                  <FormControl>
                    <select className="w-full px-3 py-2 border rounded-md" {...field}>
                      <option value="excellent">Excellent - No damage, all items intact</option>
                      <option value="good">Good - Minor packaging wear, items intact</option>
                      <option value="fair">Fair - Some packaging damage, most items intact</option>
                      <option value="poor">Poor - Significant damage, items may be affected</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Items Verification */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Verify Items Received</h3>
              
              {form.watch("hasDiscrepancies") && (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-800 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Discrepancies Detected</span>
                  </div>
                  <p className="text-sm text-orange-700">
                    Total discrepancy: {form.watch("totalDiscrepancies")} items
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {form.watch("items").map((item, index) => (
                  <div 
                    key={item.itemId} 
                    className={`border rounded-lg p-4 ${
                      item.hasDiscrepancy ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div>
                        <div className="font-medium">{item.itemName}</div>
                        <div className="text-sm text-muted-foreground">
                          Expected: {item.expectedQuantity}
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name={`items.${index}.receivedQuantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Received Quantity</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center justify-center">
                        {item.hasDiscrepancy ? (
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

                      {item.hasDiscrepancy && (
                        <FormField
                          control={form.control}
                          name={`items.${index}.discrepancyReason`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reason for Discrepancy</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., Damaged, Missing, Extra"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional observations or comments about the shipment..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include any relevant details about the condition, packaging, or delivery process
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Confirming..." : "Confirm Receipt"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}