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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { School, LocalCouncil } from "@/types";
import { useCreateSchool, useUpdateSchool, useLocalCouncils } from "@/hooks/useAdmin";

const schoolSchema = z.object({
  name: z.string().min(2, "School name must be at least 2 characters"),
  code: z.string().optional(),
  localCouncilId: z.number().min(1, "Please select a local council"),
  schoolType: z.enum(["PRIMARY", "SECONDARY", "COMBINED"]),
  address: z.string().optional(),
  principalName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
  enrollmentCount: z.number().optional(),
  isActive: z.boolean(),
});

type SchoolFormData = z.infer<typeof schoolSchema>;

interface SchoolFormProps {
  school?: School | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function SchoolForm({ school, onClose, onSuccess }: SchoolFormProps) {
  const isEditing = !!school;
  
  const createSchoolMutation = useCreateSchool();
  const updateSchoolMutation = useUpdateSchool();
  const { data: councilsResponse } = useLocalCouncils(1, 100); // Get all councils for dropdown

  const councils = councilsResponse?.data?.councils || [];

  const form = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: "",
      code: "",
      localCouncilId: 0,
      schoolType: "PRIMARY" as const,
      address: "",
      principalName: "",
      contactPhone: "",
      contactEmail: "",
      enrollmentCount: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (school && councils.length > 0) {
      const formData = {
        name: school.name,
        code: school.code || "",
        localCouncilId: school.localCouncilId,
        schoolType: school.schoolType,
        address: school.address || "",
        principalName: school.principalName || "",
        contactPhone: school.contactPhone || "",
        contactEmail: school.contactEmail || "",
        enrollmentCount: school.enrollmentCount || 0,
        isActive: school.isActive,
      };
      
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        form.reset(formData);
      }, 50);
    }
  }, [school, councils, form]);

  const onSubmit = async (data: SchoolFormData) => {
    try {
      const schoolData = {
        ...data,
        code: data.code || undefined,
        address: data.address || undefined,
        principalName: data.principalName || undefined,
        contactPhone: data.contactPhone || undefined,
        contactEmail: data.contactEmail || undefined,
        enrollmentCount: data.enrollmentCount || undefined,
      };

      if (isEditing && school) {
        await updateSchoolMutation.mutateAsync({
          id: school.id,
          schoolData,
        });
      } else {
        await createSchoolMutation.mutateAsync(schoolData);
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
            {isEditing ? "Edit School" : "Add New School"}
          </h2>
          <p className="text-muted-foreground">
            {isEditing ? "Update school information" : "Create a new school"}
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Back to List
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>School Information</CardTitle>
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
                      <FormLabel>School Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter school name" {...field} />
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
                      <FormLabel>School Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter school code" 
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
                  name="localCouncilId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local Council *</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value && field.value > 0 ? field.value.toString() : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select local council" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {councils.map((council: LocalCouncil) => (
                            <SelectItem key={council.id} value={council.id.toString()}>
                              {council.name}
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
                  name="schoolType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select school type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PRIMARY">Primary</SelectItem>
                          <SelectItem value="SECONDARY">Secondary</SelectItem>
                          <SelectItem value="COMBINED">Combined</SelectItem>
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
                        placeholder="Enter school address..."
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
                  name="principalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Principal Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter principal name" {...field} />
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
                      <FormLabel>Principal Phone</FormLabel>
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
                      <FormLabel>Principal Email</FormLabel>
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
                name="enrollmentCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enrollment Count</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter current enrollment count"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            field.onChange("");
                          } else {
                            field.onChange(parseInt(value) || "");
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        School is available for operations in the system
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
                  disabled={createSchoolMutation.isPending || updateSchoolMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createSchoolMutation.isPending || updateSchoolMutation.isPending
                    ? "Saving..."
                    : isEditing
                    ? "Update School"
                    : "Create School"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}