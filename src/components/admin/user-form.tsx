"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
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
import { User, UserRole } from "@/types";
import { useCreateUser, useUpdateUser } from "@/hooks/useUsers";
import { useLocalCouncils, useWarehouses, useSchools } from "@/hooks/useAdmin";
import { useResponsive } from "@/hooks/useResponsive";
import { usePermissions } from "@/hooks/usePermissions";
import { DistrictSelector } from "@/components/ui/district-selector";

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum([
    "super_admin",
    "system_admin",
    "national_manager",
    "lc_officer",
    "district_officer",
    "school_rep",
    "view_only",
  ]),
  councilId: z.number().optional().nullable(),
  warehouseId: z.number().optional().nullable(),
  schoolId: z.number().optional().nullable(),
  district: z.string().optional().nullable(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const editUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum([
    "super_admin",
    "system_admin",
    "national_manager",
    "lc_officer",
    "district_officer",
    "school_rep",
    "view_only",
  ]),
  councilId: z.number().optional().nullable(),
  warehouseId: z.number().optional().nullable(),
  schoolId: z.number().optional().nullable(),
  district: z.string().optional().nullable(),
});

// Role IDs match actual database values from roles table
const ROLE_ID_MAP: Record<UserRole, number> = {
  super_admin: 1,
  national_manager: 2,
  lc_officer: 3,
  school_rep: 4,
  view_only: 5,
  system_admin: 16,
  district_officer: 17,
};

const mapRoleToRoleId = (role: UserRole): number => {
  return ROLE_ID_MAP[role] ?? ROLE_ID_MAP.view_only;
};

type CreateUserFormData = z.infer<typeof createUserSchema>;
type EditUserFormData = z.infer<typeof editUserSchema>;
type UserFormData = CreateUserFormData | EditUserFormData;

interface UserFormProps {
  user?: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

const roleOptions = [
  { value: "super_admin", label: "Super Administrator" },
  { value: "system_admin", label: "System Administrator" },
  { value: "national_manager", label: "National Warehouse Manager" },
  { value: "lc_officer", label: "Local Council M&E Officer" },
  { value: "district_officer", label: "District Education Officer" },
  { value: "school_rep", label: "School Representative" },
  { value: "view_only", label: "View-Only User" },
];

export function UserForm({ user, onClose, onSuccess }: UserFormProps) {
  const isEditing = !!user;
  const [selectedRole, setSelectedRole] = useState<UserRole | "">(
    user?.role || ""
  );
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const { canManageSuperAdmin } = usePermissions();

  // Filter role options based on user permissions
  const availableRoleOptions = roleOptions.filter(option => {
    // Hide Super Admin option if user cannot manage Super Admins
    if (option.value === "super_admin" && !canManageSuperAdmin()) {
      return false;
    }
    return true;
  });

  // Fetch councils, warehouses, and schools for assignment
  const { data: councilsResponse } = useLocalCouncils(1, 100);
  const { data: warehousesResponse } = useWarehouses(1, 100);
  const { data: schoolsResponse } = useSchools(1, 100);

  // Safely extract councils, warehouses, and schools with fallback
  let councils: any[] = [];
  let warehouses: any[] = [];
  let schools: any[] = [];

  if (councilsResponse?.success && councilsResponse?.data) {
    councils = Array.isArray(councilsResponse.data.councils)
      ? councilsResponse.data.councils
      : Array.isArray(councilsResponse.data)
      ? councilsResponse.data
      : [];
  }

  if (warehousesResponse?.success && warehousesResponse?.data) {
    warehouses = Array.isArray(warehousesResponse.data.warehouses)
      ? warehousesResponse.data.warehouses
      : Array.isArray(warehousesResponse.data)
      ? warehousesResponse.data
      : [];
  }

  if (schoolsResponse?.success && schoolsResponse?.data) {
    schools = Array.isArray(schoolsResponse.data.schools)
      ? schoolsResponse.data.schools
      : Array.isArray(schoolsResponse.data)
      ? schoolsResponse.data
      : [];
  }

  const form = useForm<UserFormData>({
    resolver: zodResolver(isEditing ? editUserSchema : createUserSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      role: user?.role || "view_only",
      councilId: user?.localCouncilId || null,
      warehouseId: user?.warehouseId || null,
      schoolId: user?.schoolId || null,
      district: user?.district || null,
      ...(isEditing ? {} : { password: "" }), // Only include password for new users
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user && mounted) {
      form.reset({
        name: user.name,
        email: user.email,
        role: user.role,
        councilId: user.localCouncilId || null,
        warehouseId: user.warehouseId || null,
        schoolId: user.schoolId || null,
        district: user.district || null,
        password: "",
      });
      setSelectedRole(user.role);
    }
  }, [user, form, mounted]);

  const onSubmit = async (data: UserFormData) => {
    try {
      // Build clean data object with only necessary fields
      const cleanedData: any = {
        name: data.name,
        email: data.email,
        roleId: mapRoleToRoleId(data.role),
      };

      // Add password only if provided (for new users)
      if ('password' in data && data.password && data.password.trim()) {
        cleanedData.password = data.password;
      }

      // Add role-specific assignments only when relevant
      if (data.role === "lc_officer" && data.councilId) {
        cleanedData.localCouncilId = data.councilId;
      }
      if (data.role === "national_manager" && data.warehouseId) {
        cleanedData.warehouseId = data.warehouseId;
      }
      if (data.role === "school_rep" && data.schoolId) {
        cleanedData.schoolId = data.schoolId;
      }
      if (data.role === "district_officer" && data.district) {
        cleanedData.district = data.district;
      }

      // Remove null values to avoid type conflicts
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === null) {
          delete cleanedData[key];
        }
      });

      if (isEditing && user) {
        // For editing, password field is not included in the form
        const updateData = { ...cleanedData };
        // Remove password property if it exists (TypeScript safety)
        if ('password' in updateData) {
          delete (updateData as any).password;
        }

        await updateUserMutation.mutateAsync({
          id: user.id,
          userData: updateData,
        });
      } else {
        // Password is required for new users - properly type the create data
        if (!cleanedData.password) {
          form.setError("password", {
            message: "Password is required for new users",
          });
          return;
        }

        // Convert null values to undefined for proper typing
        const createData = {
          ...cleanedData,
          warehouseId: cleanedData.warehouseId || undefined,
          localCouncilId: cleanedData.localCouncilId || undefined,
          schoolId: cleanedData.schoolId || undefined,
          district: cleanedData.district || undefined,
        };

        await createUserMutation.mutateAsync(createData);
      }

      // Clear form and call success callback
      form.reset();
      setSelectedRole("");
      onSuccess();
    } catch (error) {
      // Error is handled by the mutation hooks
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    form.setValue("role", role);

    // Clear inappropriate assignments when role changes
    if (role !== "lc_officer") {
      form.setValue("councilId", null);
    }
    if (role !== "national_manager") {
      form.setValue("warehouseId", null);
    }
    if (role !== "school_rep") {
      form.setValue("schoolId", null);
    }
  };

  const showCouncilSelection = selectedRole === "lc_officer";
  const showWarehouseSelection = selectedRole === "national_manager";
  const showSchoolSelection = selectedRole === "school_rep";
  const showDistrictSelection = selectedRole === "district_officer";

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit User" : "Create User"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit User" : "Create User"}</CardTitle>
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
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Role *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value: UserRole) => {
                        field.onChange(value);
                        handleRoleChange(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableRoleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isEditing && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter password"
                            {...field}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="sr-only">
                              {showPassword ? "Hide password" : "Show password"}
                            </span>
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Conditional fields based on role */}
            {(showCouncilSelection ||
              showWarehouseSelection ||
              showSchoolSelection ||
              showDistrictSelection) && (
              <div className="grid grid-cols-2 gap-4">
                {showCouncilSelection && (
                  <FormField
                    control={form.control}
                    name="councilId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Local Council{" "}
                          {selectedRole === "lc_officer" ? "*" : ""}
                        </FormLabel>
                        <Select
                          value={field.value?.toString() || undefined}
                          onValueChange={(value) =>
                            field.onChange(value ? parseInt(value) : null)
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select local council" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(councils) &&
                              councils.map((council) => (
                                <SelectItem
                                  key={council.id}
                                  value={council.id.toString()}
                                >
                                  {council.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {showWarehouseSelection && (
                  <FormField
                    control={form.control}
                    name="warehouseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warehouse Assignment</FormLabel>
                        <Select
                          value={field.value?.toString() || undefined}
                          onValueChange={(value) =>
                            field.onChange(value ? parseInt(value) : null)
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select warehouse" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {warehouses.map((warehouse) => (
                              <SelectItem
                                key={warehouse.id}
                                value={warehouse.id.toString()}
                              >
                                {warehouse.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {showSchoolSelection && (
                  <FormField
                    control={form.control}
                    name="schoolId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School Assignment *</FormLabel>
                        <Select
                          value={field.value?.toString() || undefined}
                          onValueChange={(value) =>
                            field.onChange(value ? parseInt(value) : null)
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select school" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {schools.map((school) => (
                              <SelectItem
                                key={school.id}
                                value={school.id.toString()}
                              >
                                {school.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {showDistrictSelection && (
                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>District Assignment *</FormLabel>
                        <FormControl>
                          <DistrictSelector
                            value={field.value || undefined}
                            onValueChange={field.onChange}
                            placeholder="Select district"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {!showCouncilSelection &&
                  !showWarehouseSelection &&
                  !showSchoolSelection &&
                  !showDistrictSelection && <div />}
              </div>
            )}

            {/* Role-specific information */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Role Permissions:</h4>
              <div className="text-sm text-muted-foreground">
                {selectedRole === "super_admin" && (
                  <p>
                    Full system access with all administrative privileges
                    including user management, system configuration, and audit
                    access.
                  </p>
                )}
                {selectedRole === "system_admin" && (
                  <p>
                    Full non-destructive system access. Can manage all data and
                    configurations but cannot delete records or manage Super
                    Administrator accounts.
                  </p>
                )}
                {selectedRole === "national_manager" && (
                  <p>
                    Manages national warehouse inventory and shipments. Can
                    create, read, and update inventory and shipment records.
                  </p>
                )}
                {selectedRole === "lc_officer" && (
                  <p>
                    Manages local council inventory and distributions. Can
                    create distributions and view shipment details.
                  </p>
                )}
                {selectedRole === "district_officer" && (
                  <p>
                    Oversees educational materials management across all councils
                    within assigned district. District-wide monitoring and
                    reporting access.
                  </p>
                )}
                {selectedRole === "school_rep" && (
                  <p>
                    Confirms receipt of distributions for assigned school. Can
                    read and update distribution records.
                  </p>
                )}
                {selectedRole === "view_only" && (
                  <p>
                    Read-only access to dashboards and reports. Cannot make any
                    changes to the system.
                  </p>
                )}
                {!selectedRole && (
                  <p>Select a role to see permission details.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createUserMutation.isPending || updateUserMutation.isPending
                }
                className="bg-green-600 hover:bg-green-700"
              >
                {createUserMutation.isPending || updateUserMutation.isPending
                  ? "Saving..."
                  : isEditing
                  ? "Update User"
                  : "Create User"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

