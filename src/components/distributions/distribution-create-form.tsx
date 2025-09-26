"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { schoolsApi, councilInventoryApi } from "@/lib/api";
import { 
  School, 
  CouncilInventoryItem, 
  CreateDistributionRequest,
  CreateDistributionItemRequest 
} from "@/types";
import { useResponsive } from "@/hooks/useResponsive";
import { toast } from "sonner";

const distributionItemSchema = z.object({
  itemId: z.number().min(1, "Item is required"),
  quantityDistributed: z.number().min(1, "Quantity must be at least 1"),
  notes: z.string().optional(),
});

const distributionSchema = z.object({
  schoolId: z.number().min(1, "School is required"),
  distributionDate: z.string().min(1, "Distribution date is required"),
  notes: z.string().optional(),
  items: z.array(distributionItemSchema).min(1, "At least one item is required"),
});

type DistributionForm = z.infer<typeof distributionSchema>;

interface DistributionCreateFormProps {
  onSubmit: (data: CreateDistributionRequest) => Promise<void>;
  councilId?: number;
  preSelectedSchool?: School;
}

export function DistributionCreateForm({ onSubmit, councilId, preSelectedSchool }: DistributionCreateFormProps) {
  const { isMobile, isTablet } = useResponsive();
  const [schools, setSchools] = useState<School[]>([]);
  const [councilInventory, setCouncilInventory] = useState<CouncilInventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(true);

  const form = useForm<DistributionForm>({
    resolver: zodResolver(distributionSchema),
    defaultValues: {
      schoolId: preSelectedSchool?.id || 0,
      distributionDate: new Date().toISOString().split('T')[0],
      notes: "",
      items: [{ itemId: 0, quantityDistributed: 1, notes: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    console.log("Distribution form initialized with councilId:", councilId);
    fetchSchools();
    fetchCouncilInventory();
  }, [councilId]);

  // Update form when preSelectedSchool changes
  useEffect(() => {
    if (preSelectedSchool) {
      console.log("Pre-selected school:", preSelectedSchool);
      form.setValue('schoolId', preSelectedSchool.id);
    }
  }, [preSelectedSchool, form]);

  // Debug council inventory state
  useEffect(() => {
    console.log("Council inventory updated:", councilInventory.length, "items");
  }, [councilInventory]);

  const fetchSchools = async () => {
    if (!councilId) return;
    
    try {
      setLoadingSchools(true);
      const response = await schoolsApi.getSchoolsByCouncil(councilId);
      // Handle different response structures
      const schoolsData = response.data?.schools || response.data?.data || response.data || [];
      setSchools(Array.isArray(schoolsData) ? schoolsData : []);
    } catch (error) {
      console.error("Error fetching schools:", error);
      toast.error("Failed to load schools");
      setSchools([]); // Ensure schools is always an array
    } finally {
      setLoadingSchools(false);
    }
  };

  const fetchCouncilInventory = async () => {
    if (!councilId) {
      console.warn("No councilId provided for fetching inventory");
      return;
    }
    
    try {
      setLoadingInventory(true);
      console.log("Fetching council inventory for councilId:", councilId);
      const response = await councilInventoryApi.getCouncilInventory(1, 100, { councilId });
      console.log("Council inventory response:", response);
      
      // Handle different response structures
      let inventoryData = [];
      if (response.success && response.data) {
        inventoryData = response.data.inventory || response.data || [];
      } else if ((response as any).inventory) {
        inventoryData = (response as any).inventory;
      } else if (Array.isArray(response)) {
        inventoryData = response;
      }
      
      console.log("Setting council inventory:", inventoryData);
      setCouncilInventory(Array.isArray(inventoryData) ? inventoryData : []);
      
      if (inventoryData.length === 0) {
        toast.info(`No inventory items found for this council`);
      }
    } catch (error) {
      console.error("Error fetching council inventory:", error);
      toast.error("Failed to load inventory");
      setCouncilInventory([]);
    } finally {
      setLoadingInventory(false);
    }
  };

  const getAvailableQuantity = (itemId: number): number => {
    const inventoryItem = councilInventory.find(item => item.itemId === itemId);
    return inventoryItem?.availableQuantity || 0;
  };

  const getTotalDistributedQuantity = (itemId: number): number => {
    return form.getValues("items")
      .filter(item => item.itemId === itemId)
      .reduce((total, item) => {
        const qty = typeof item.quantityDistributed === 'string' ? parseInt(item.quantityDistributed) || 0 : item.quantityDistributed || 0;
        return total + qty;
      }, 0);
  };

  const validateItemQuantity = (itemId: number, quantity: number | string, currentIndex: number): boolean => {
    const availableQuantity = getAvailableQuantity(itemId);
    const totalDistributed = form.getValues("items")
      .filter((item, index) => item.itemId === itemId && index !== currentIndex)
      .reduce((total, item) => {
        const qty = typeof item.quantityDistributed === 'string' ? parseInt(item.quantityDistributed) || 0 : item.quantityDistributed || 0;
        return total + qty;
      }, 0);
    
    const currentQty = typeof quantity === 'string' ? parseInt(quantity) || 0 : quantity || 0;
    return (totalDistributed + currentQty) <= availableQuantity;
  };

  const handleSubmit = async (data: DistributionForm) => {
    if (!councilId) {
      toast.error("Council ID is required");
      return;
    }

    // Validate inventory availability
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (!validateItemQuantity(item.itemId, item.quantityDistributed, i)) {
        const inventoryItem = councilInventory.find(inv => inv.itemId === item.itemId);
        toast.error(`Insufficient inventory for ${inventoryItem?.itemName}. Available: ${getAvailableQuantity(item.itemId)}`);
        return;
      }
    }

    setLoading(true);
    try {
      const distributionData: CreateDistributionRequest = {
        localCouncilId: councilId,
        schoolId: data.schoolId,
        distributionDate: data.distributionDate,
        notes: data.notes,
        items: data.items.map((item): CreateDistributionItemRequest => ({
          itemId: item.itemId,
          quantityDistributed: item.quantityDistributed,
          notes: item.notes,
        })),
      };

      await onSubmit(distributionData);
      form.reset();
    } catch (error) {
      // Error is handled in parent component
    } finally {
      setLoading(false);
    }
  };

  if (!preSelectedSchool && !councilId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Please select a school first to create a distribution.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loadingSchools || loadingInventory) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Loading inventory for council ID: {councilId}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className={preSelectedSchool ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 sm:grid-cols-2 gap-4"}>
              {!preSelectedSchool && (
                <FormField
                  control={form.control}
                  name="schoolId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select school" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(schools) && schools.map((school) => (
                            <SelectItem key={school.id} value={school.id.toString()}>
                              {school.name} ({school.schoolType || (school as any).type || 'Unknown'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {preSelectedSchool && (
                <div className="mb-4">
                  <label className="text-sm font-medium">Selected School</label>
                  <div className="p-3 bg-muted rounded-md border mt-2">
                    <div className="font-medium">{preSelectedSchool.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {preSelectedSchool.schoolType || (preSelectedSchool as any).type || 'Unknown'} School • {preSelectedSchool.address}
                    </div>
                    <input type="hidden" name="schoolId" value={preSelectedSchool.id} />
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="distributionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Distribution Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this distribution..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Distribution Items</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ itemId: 0, quantityDistributed: 1, notes: "" })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {fields.map((field, index) => {
                const selectedItemId = form.watch(`items.${index}.itemId`);
                const quantity = form.watch(`items.${index}.quantityDistributed`);
                const availableQuantity = getAvailableQuantity(selectedItemId);
                const isQuantityValid = selectedItemId ? validateItemQuantity(selectedItemId, quantity, index) : true;

                return (
                  <Card key={field.id} className="p-4">
                    <div className={`grid gap-4 items-start ${isMobile ? 'grid-cols-1' : 'grid-cols-12'}`}>
                      <div className={isMobile ? 'w-full' : 'col-span-4'}>
                        <FormField
                          control={form.control}
                          name={`items.${index}.itemId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Item *</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                value={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select item" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {councilInventory.length === 0 ? (
                                    <div className="p-2 text-muted-foreground text-sm">
                                      {loadingInventory ? "Loading items..." : "No items available in council inventory"}
                                    </div>
                                  ) : (
                                    councilInventory.map((item) => (
                                      <SelectItem key={item.itemId} value={item.itemId.toString()}>
                                        {item.itemName} ({item.itemCode}) - Available: {item.availableQuantity}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className={isMobile ? 'w-full' : 'col-span-2'}>
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantityDistributed`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  max={availableQuantity}
                                  {...field}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === "") {
                                      field.onChange("");
                                    } else {
                                      field.onChange(parseInt(value) || "");
                                    }
                                  }}
                                  className={!isQuantityValid ? "border-red-500" : ""}
                                />
                              </FormControl>
                              {!isQuantityValid && (
                                <div className="flex items-center text-red-500 text-sm mt-1">
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                  Exceeds available quantity ({availableQuantity})
                                </div>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className={isMobile ? 'w-full' : 'col-span-4'}>
                        <FormField
                          control={form.control}
                          name={`items.${index}.notes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Item notes..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className={`${isMobile ? 'w-full flex justify-center' : 'col-span-2 flex items-end'}`}>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => remove(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {selectedItemId && availableQuantity > 0 && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        Available: {availableQuantity} {councilInventory.find(item => item.itemId === selectedItemId)?.unitOfMeasure}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            <div className={`flex gap-3 ${isMobile ? 'flex-col-reverse' : 'justify-end'}`}>
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={loading}
                className={isMobile ? 'w-full h-12' : ''}
                size={isMobile ? "lg" : "default"}
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className={`bg-green-600 hover:bg-green-700 ${isMobile ? 'w-full h-12' : ''}`}
                size={isMobile ? "lg" : "default"}
              >
                {loading ? "Creating..." : "Create Distribution"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}