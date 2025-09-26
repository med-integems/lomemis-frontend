"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RotateCcw } from "lucide-react";
import { UserRole, LocalCouncil, Warehouse } from "@/types";
import { useLocalCouncils, useWarehouses } from "@/hooks/useAdmin";

interface UserFilters {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  councilId?: number;
  warehouseId?: number;
}

interface UserSearchProps {
  onSearch: (filters: UserFilters) => void;
  currentFilters: UserFilters;
}

const roleOptions = [
  { value: "super_admin", label: "Super Admin" },
  { value: "national_manager", label: "National Manager" },
  { value: "lc_officer", label: "LC Officer" },
  { value: "school_rep", label: "School Representative" },
  { value: "view_only", label: "View Only" },
];

export function UserSearch({ onSearch, currentFilters }: UserSearchProps) {
  const { register, handleSubmit, watch, setValue, reset } = useForm<UserFilters>({
    defaultValues: currentFilters,
  });

  // Fetch councils and warehouses for filtering
  const { data: councilsResponse } = useLocalCouncils(1, 100);
  const { data: warehousesResponse } = useWarehouses(1, 100);

  const councils = councilsResponse?.data?.councils || [];
  const warehouses = warehousesResponse?.data?.warehouses || [];

  const onSubmit = (data: UserFilters) => {
    const filters: UserFilters = {};
    
    // Only include non-empty values
    if (data.search && data.search.trim()) filters.search = data.search.trim();
    if (data.role) filters.role = data.role;
    if (data.isActive !== undefined) filters.isActive = data.isActive;
    if (data.councilId) filters.councilId = data.councilId;
    if (data.warehouseId) filters.warehouseId = data.warehouseId;

    onSearch(filters);
  };

  const handleReset = () => {
    reset({});
    onSearch({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search & Filter Users</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Name or email..."
                {...register("search")}
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={watch("role") || "all"}
                onValueChange={(value: UserRole | "all") => setValue("role", value === "all" ? undefined : value as UserRole)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="isActive">Status</Label>
              <Select
                value={
                  watch("isActive") === true 
                    ? "active" 
                    : watch("isActive") === false 
                    ? "inactive" 
                    : "all"
                }
                onValueChange={(value) => {
                  if (value === "active") setValue("isActive", true);
                  else if (value === "inactive") setValue("isActive", false);
                  else setValue("isActive", undefined);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Local Council */}
            <div className="space-y-2">
              <Label htmlFor="councilId">Local Council</Label>
              <Select
                value={watch("councilId")?.toString() || "all"}
                onValueChange={(value) => 
                  setValue("councilId", value === "all" ? undefined : parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All councils" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Councils</SelectItem>
                  {councils.map((council: LocalCouncil) => (
                    <SelectItem key={council.id} value={council.id.toString()}>
                      {council.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Warehouse */}
            <div className="space-y-2">
              <Label htmlFor="warehouseId">Warehouse</Label>
              <Select
                value={watch("warehouseId")?.toString() || "all"}
                onValueChange={(value) => 
                  setValue("warehouseId", value === "all" ? undefined : parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All warehouses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {warehouses.map((warehouse: Warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </form>

        {/* Current Filters Display */}
        {Object.keys(currentFilters).length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Active Filters:</p>
            <div className="flex flex-wrap gap-2">
              {currentFilters.search && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  Search: {currentFilters.search}
                </span>
              )}
              {currentFilters.role && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  Role: {roleOptions.find(r => r.value === currentFilters.role)?.label}
                </span>
              )}
              {currentFilters.isActive !== undefined && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                  Status: {currentFilters.isActive ? "Active" : "Inactive"}
                </span>
              )}
              {currentFilters.councilId && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                  Council: {councils.find((c: any) => c.id === currentFilters.councilId)?.name || currentFilters.councilId}
                </span>
              )}
              {currentFilters.warehouseId && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                  Warehouse: {warehouses.find((w: any) => w.id === currentFilters.warehouseId)?.name || currentFilters.warehouseId}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}