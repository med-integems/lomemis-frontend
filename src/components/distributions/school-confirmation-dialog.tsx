"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { DistributionWithDetails, UpdateDistributionItemRequest } from "@/types";
import { formatDate } from "@/lib/utils";
import { useResponsive } from "@/hooks/useResponsive";
import { Card, CardContent } from "@/components/ui/card";

const confirmationItemSchema = z.object({
  itemId: z.number(),
  quantityConfirmed: z.number().min(0, "Quantity confirmed cannot be negative"),
  notes: z.string().optional(),
});

const confirmationSchema = z.object({
  confirmationDate: z.string().min(1, "Confirmation date is required"),
  discrepancyNotes: z.string().optional(),
  items: z.array(confirmationItemSchema),
});

type ConfirmationForm = z.infer<typeof confirmationSchema>;

interface SchoolConfirmationDialogProps {
  distribution: DistributionWithDetails;
  onConfirm: (data: {
    confirmationDate: string;
    discrepancyNotes?: string;
    items: UpdateDistributionItemRequest[];
  }) => Promise<void>;
  onClose: () => void;
}

export function SchoolConfirmationDialog({
  distribution,
  onConfirm,
  onClose,
}: SchoolConfirmationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [hasDiscrepancies, setHasDiscrepancies] = useState(false);
  const { isMobile, isTablet } = useResponsive();

  const form = useForm<ConfirmationForm>({
    resolver: zodResolver(confirmationSchema),
    defaultValues: {
      confirmationDate: new Date().toISOString().split('T')[0],
      discrepancyNotes: "",
      items: distribution.items.map(item => ({
        itemId: item.itemId,
        quantityConfirmed: item.quantityDistributed,
        notes: "",
      })),
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Watch for quantity changes to detect discrepancies
  const watchedItems = form.watch("items");
  
  // Check for discrepancies whenever quantities change
  const checkForDiscrepancies = () => {
    const hasAnyDiscrepancy = watchedItems.some((item, index) => {
      const originalItem = distribution.items[index];
      return item.quantityConfirmed !== originalItem.quantityDistributed;
    });
    
    if (hasAnyDiscrepancy !== hasDiscrepancies) {
      setHasDiscrepancies(hasAnyDiscrepancy);
    }
  };

  // Call checkForDiscrepancies when items change
  React.useEffect(() => {
    checkForDiscrepancies();
  }, [watchedItems]);

  const handleSubmit = async (data: ConfirmationForm) => {
    setLoading(true);
    try {
      const confirmationData = {
        confirmationDate: data.confirmationDate,
        discrepancyNotes: hasDiscrepancies ? data.discrepancyNotes : undefined,
        items: data.items.map((item): UpdateDistributionItemRequest => ({
          itemId: item.itemId,
          quantityConfirmed: item.quantityConfirmed,
          notes: item.notes,
        })),
      };

      await onConfirm(confirmationData);
    } catch (error) {
      // Error is handled in parent component
    } finally {
      setLoading(false);
    }
  };

  const renderDiscrepancyNotes = () => {
    if (!hasDiscrepancies) return null;
    return (
      <FormField
        control={form.control}
        name="discrepancyNotes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Discrepancy Notes *
              <span className="text-red-500 ml-1">
                (Required when quantities don't match)
              </span>
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="Please explain any discrepancies in the quantities received..."
                {...field}
                rows={3}
                required={hasDiscrepancies}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  const getDiscrepancyBadge = (originalQty: number, confirmedQty: number) => {
    const difference = confirmedQty - originalQty;
    if (difference === 0) {
      return <Badge variant="success" className="text-xs">Match</Badge>;
    } else if (difference > 0) {
      return <Badge variant="secondary" className="text-xs">+{difference}</Badge>;
    } else {
      return <Badge variant="destructive" className="text-xs">{difference}</Badge>;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className={`${
        isMobile 
          ? 'max-w-[95vw] w-full max-h-[95vh] p-4' 
          : isTablet 
          ? 'max-w-4xl max-h-[90vh]' 
          : 'max-w-6xl max-h-[90vh]'
      } overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className={`${isMobile ? 'text-lg' : ''}`}>
            Confirm Distribution Receipt
          </DialogTitle>
        </DialogHeader>

        <div className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
          {/* Distribution Information */}
          <div className={`grid gap-4 p-4 bg-muted rounded-lg ${
            isMobile ? 'grid-cols-1' : 'grid-cols-2'
          }`}>
            <div>
              <Label className={`font-medium text-muted-foreground ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}>Distribution Number</Label>
              <p className={`font-medium ${isMobile ? 'text-sm' : ''}`}>
                {distribution.distributionNumber}
              </p>
            </div>
            <div>
              <Label className={`font-medium text-muted-foreground ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}>Distribution Date</Label>
              <p className={`${isMobile ? 'text-sm' : ''}`}>
                {formatDate(distribution.distributionDate)}
              </p>
            </div>
            <div>
              <Label className={`font-medium text-muted-foreground ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}>Local Council</Label>
              <p className={`${isMobile ? 'text-sm' : ''}`}>
                {distribution.localCouncilName}
              </p>
            </div>
            <div>
              <Label className={`font-medium text-muted-foreground ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}>School</Label>
              <p className={`${isMobile ? 'text-sm' : ''}`}>
                {distribution.schoolName}
              </p>
            </div>
            {distribution.notes && (
              <div className={`${isMobile ? 'col-span-1' : 'col-span-2'}`}>
                <Label className={`font-medium text-muted-foreground ${
                  isMobile ? 'text-xs' : 'text-sm'
                }`}>Distribution Notes</Label>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {distribution.notes}
                </p>
              </div>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className={`grid gap-4 ${
                isMobile ? 'grid-cols-1' : 'grid-cols-2'
              }`}>
                <FormField
                  control={form.control}
                  name="confirmationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={`${isMobile ? 'text-sm' : ''}`}>
                        Confirmation Date *
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className={`${
                          isMobile ? 'h-12 text-sm' : ''
                        }`} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Items Confirmation Table */}
              <div className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
                <h3 className={`font-medium ${
                  isMobile ? 'text-base' : 'text-lg'
                }`}>Confirm Items Received</h3>
                
                {hasDiscrepancies && (
                  <div className={`flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg ${
                    isMobile ? 'space-x-2' : 'space-x-2'
                  }`}>
                    <AlertTriangle className={`text-yellow-600 ${
                      isMobile ? 'h-4 w-4' : 'h-5 w-5'
                    }`} />
                    <p className={`text-yellow-800 ${
                      isMobile ? 'text-xs' : 'text-sm'
                    }`}>
                      {isMobile 
                        ? "Discrepancies detected. Provide notes below."
                        : "Discrepancies detected. Please provide notes explaining the differences."
                      }
                    </p>
                  </div>
                )}

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Distributed</TableHead>
                        <TableHead>Received *</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itemRows}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Discrepancy Notes - only show if there are discrepancies */}
              {renderDiscrepancyNotes()}

              <DialogFooter className={`${isMobile ? 'flex-col space-y-2' : ''}`}>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose} 
                  disabled={loading}
                  className={`${isMobile ? 'w-full h-12' : ''}`}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || (hasDiscrepancies && !form.watch("discrepancyNotes")?.trim())}
                  className={`bg-green-600 hover:bg-green-700 ${isMobile ? 'w-full h-12' : ''}`}
                >
                  {loading ? "Confirming..." : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isMobile 
                        ? (hasDiscrepancies ? "Confirm w/ Discrepancies" : "Confirm Receipt")
                        : (hasDiscrepancies ? "Confirm with Discrepancies" : "Confirm Receipt")
                      }
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
