"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LocalCouncil } from "@/types";
import { useCreateLocalCouncil, useUpdateLocalCouncil } from "@/hooks/useAdmin";

// Sierra Leone Regions (5 regions)
const sierraLeoneRegions = [
  { value: "Eastern", label: "Eastern Province" },
  { value: "Northern", label: "Northern Province" },
  { value: "North Western", label: "North Western Province" },
  { value: "Southern", label: "Southern Province" },
  { value: "Western Area", label: "Western Area" },
];

// Sierra Leone Districts (16 districts)
const sierraLeoneDistricts = [
  { value: "Bo", label: "Bo District", region: "Southern" },
  { value: "Bombali", label: "Bombali District", region: "Northern" },
  { value: "Bonthe", label: "Bonthe District", region: "Southern" },
  { value: "Falaba", label: "Falaba District", region: "Northern" },
  { value: "Kailahun", label: "Kailahun District", region: "Eastern" },
  { value: "Kambia", label: "Kambia District", region: "North Western" },
  { value: "Karene", label: "Karene District", region: "North Western" },
  { value: "Kenema", label: "Kenema District", region: "Eastern" },
  { value: "Koinadugu", label: "Koinadugu District", region: "Northern" },
  { value: "Kono", label: "Kono District", region: "Eastern" },
  { value: "Moyamba", label: "Moyamba District", region: "Southern" },
  { value: "Port Loko", label: "Port Loko District", region: "North Western" },
  { value: "Pujehun", label: "Pujehun District", region: "Southern" },
  { value: "Tonkolili", label: "Tonkolili District", region: "Northern" },
  { value: "Western Area Rural", label: "Western Area Rural District", region: "Western Area" },
  { value: "Western Area Urban", label: "Western Area Urban District", region: "Western Area" },
];

const councilSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
  isActive: z.boolean(),
});

type CouncilFormData = z.infer<typeof councilSchema>;

interface LocalCouncilFormProps {
  council?: LocalCouncil | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function LocalCouncilForm({ council, onClose, onSuccess }: LocalCouncilFormProps) {
  const isEditing = !!council;
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  
  const createCouncilMutation = useCreateLocalCouncil();
  const updateCouncilMutation = useUpdateLocalCouncil();

  // Filter districts based on selected region
  const availableDistricts = selectedRegion 
    ? sierraLeoneDistricts.filter(district => district.region === selectedRegion)
    : sierraLeoneDistricts;

  const form = useForm<CouncilFormData>({
    resolver: zodResolver(councilSchema),
    defaultValues: {
      name: "",
      code: "",
      region: "",
      district: "",
      address: "",
      contactPerson: "",
      contactPhone: "",
      contactEmail: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (council) {
      const formData = {
        name: council.name,
        code: council.code || "",
        region: council.region || "",
        district: council.district || "",
        address: council.address || "",
        contactPerson: council.contactPerson || "",
        contactPhone: council.contactPhone || "",
        contactEmail: council.contactEmail || "",
        isActive: council.isActive,
      };
      
      // Set selected region first
      setSelectedRegion(council.region || "");
      
      // Small delay to ensure DOM is ready and selectedRegion state is updated
      setTimeout(() => {
        form.reset(formData);
      }, 50);
    }
  }, [council, form]);

  const onSubmit = async (data: CouncilFormData) => {
    try {
      // Clean up the data - convert empty strings to null for optional fields
      // Important: send empty strings instead of null to satisfy Joi schemas
      const councilData = {
        name: data.name.trim(),
        code: data.code?.trim() || "",
        region: data.region?.trim() || "",
        district: data.district?.trim() || "",
        address: data.address?.trim() || "",
        contactPerson: data.contactPerson?.trim() || "",
        contactPhone: data.contactPhone?.trim() || "",
        contactEmail: data.contactEmail?.trim() || "",
        isActive: data.isActive,
      };


      if (isEditing && council) {
        await updateCouncilMutation.mutateAsync({
          id: council.id,
          councilData,
        });
      } else {
        await createCouncilMutation.mutateAsync(councilData);
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
            {isEditing ? "Edit Local Council" : "Add New Local Council"}
          </h2>
          <p className="text-muted-foreground">
            {isEditing ? "Update council information" : "Create a new local council"}
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Back to List
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Council Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Council Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter council name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Council Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter council code" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedRegion(value);
                          // Clear district when region changes
                          form.setValue("district", "");
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sierraLeoneRegions.map((region) => (
                            <SelectItem key={region.value} value={region.value}>
                              {region.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>District</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={selectedRegion ? "Select district" : "Select region first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableDistricts.map((district) => (
                            <SelectItem key={district.value} value={district.value}>
                              {district.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        placeholder="Enter council address..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter contact person name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                        Council is available for operations in the system
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
                  disabled={createCouncilMutation.isPending || updateCouncilMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createCouncilMutation.isPending || updateCouncilMutation.isPending
                    ? "Saving..."
                    : isEditing
                    ? "Update Council"
                    : "Create Council"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
