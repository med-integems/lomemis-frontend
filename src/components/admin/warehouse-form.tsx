"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Warehouse } from "@/types";
import { useCreateWarehouse, useUpdateWarehouse } from "@/hooks/useAdmin";

const warehouseSchema = z.object({
  name: z.string().min(2, "Warehouse name must be at least 2 characters"),
  location: z.string().optional(),
  address: z.string().optional(),
  managerName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
  isActive: z.boolean(),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;

interface WarehouseFormProps {
  warehouse?: Warehouse | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function WarehouseForm({ warehouse, onClose, onSuccess }: WarehouseFormProps) {
  const isEditing = !!warehouse;
  
  const createWarehouseMutation = useCreateWarehouse();
  const updateWarehouseMutation = useUpdateWarehouse();

  const form = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: "",
      location: "",
      address: "",
      managerName: "",
      contactPhone: "",
      contactEmail: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (warehouse) {
      form.reset({
        name: warehouse.name,
        location: warehouse.location || "",
        address: warehouse.address || "",
        managerName: warehouse.managerName || "",
        contactPhone: warehouse.contactPhone || "",
        contactEmail: warehouse.contactEmail || "",
        isActive: warehouse.isActive,
      });
    }
  }, [warehouse, form]);

  const onSubmit = async (data: WarehouseFormData) => {
    try {
      const warehouseData = {
        ...data,
        location: data.location || undefined,
        address: data.address || undefined,
        managerName: data.managerName || undefined,
        contactPhone: data.contactPhone || undefined,
        contactEmail: data.contactEmail || undefined,
      };

      if (isEditing && warehouse) {
        await updateWarehouseMutation.mutateAsync({
          id: warehouse.id,
          warehouseData,
        });
      } else {
        await createWarehouseMutation.mutateAsync(warehouseData);
      }
      onSuccess();
    } catch (error) {
      // Error is handled by the mutation hooks
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {isEditing ? "Edit Warehouse" : "Add New Warehouse"}
          </h2>
          <p className="text-muted-foreground">
            {isEditing ? "Update warehouse information" : "Create a new warehouse"}
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Back to List
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Warehouse Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warehouse Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter warehouse name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="City, Province" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="managerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manager Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter manager name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter full warehouse address..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter email address"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Warehouse is available for operations in the system
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createWarehouseMutation.isPending || updateWarehouseMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createWarehouseMutation.isPending || updateWarehouseMutation.isPending
                    ? "Saving..."
                    : isEditing
                    ? "Update Warehouse"
                    : "Create Warehouse"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}