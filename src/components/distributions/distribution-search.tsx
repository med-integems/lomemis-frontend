"use client";

import { useState, useEffect } from "react";
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
import { Search, RotateCcw, Filter } from "lucide-react";
import { schoolsApi, localCouncilsApi } from "@/lib/api";
import { School, LocalCouncil, DistributionFilters, UserRole } from "@/types";
import { toast } from "sonner";
import { useResponsive } from "@/hooks/useResponsive";

interface DistributionSearchProps {
  onFiltersChange: (filters: DistributionFilters) => void;
  initialFilters: DistributionFilters;
  userRole?: UserRole;
  councilId?: number;
  schoolId?: number;
  className?: string;
}

export function DistributionSearch({
  onFiltersChange,
  initialFilters,
  userRole = "view_only",
  councilId,
  schoolId,
  className,
}: DistributionSearchProps) {
  const { isMobile } = useResponsive();
  const [schools, setSchools] = useState<School[]>([]);
  const [localCouncils, setLocalCouncils] = useState<LocalCouncil[]>([]);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, reset } = useForm<DistributionFilters>({
    defaultValues: initialFilters,
  });

  useEffect(() => {
    if (userRole) {
      fetchData();
    }
  }, [councilId, userRole]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Don't fetch data for school reps as they have fixed context
      if (userRole === "school_rep") {
        setSchools([]);
        setLocalCouncils([]);
        return;
      }
      
      // Fetch schools based on user role
      if (userRole === "lc_officer" && councilId) {
        try {
          const schoolsResponse = await schoolsApi.getSchoolsByCouncil(councilId);
          if (schoolsResponse.success && schoolsResponse.data) {
            // Handle paginated response
            const schoolsData = Array.isArray(schoolsResponse.data) 
              ? schoolsResponse.data 
              : schoolsResponse.data.schools || schoolsResponse.data.data || [];
            setSchools(schoolsData);
          } else {
            setSchools([]);
          }
        } catch (err) {
          console.warn("Failed to fetch schools for council:", err);
          setSchools([]);
        }
      } else if (userRole === "super_admin" || userRole === "view_only") {
        try {
          const schoolsResponse = await schoolsApi.getSchools(1, 100);
          if (schoolsResponse.success && schoolsResponse.data) {
            // Handle paginated response  
            const schoolsData = Array.isArray(schoolsResponse.data)
              ? schoolsResponse.data
              : schoolsResponse.data.schools || schoolsResponse.data.data || [];
            setSchools(schoolsData);
          } else {
            setSchools([]);
          }
        } catch (err) {
          console.warn("Failed to fetch schools:", err);
          setSchools([]);
        }
      } else {
        setSchools([]);
      }

      // Fetch local councils for super admin and view-only users
      if (userRole === "super_admin" || userRole === "view_only") {
        try {
          const councilsResponse = await localCouncilsApi.getLocalCouncils(1, 100);
          if (councilsResponse.success && councilsResponse.data) {
            // Handle paginated response
            const councilsData = Array.isArray(councilsResponse.data)
              ? councilsResponse.data
              : councilsResponse.data.localCouncils || councilsResponse.data.data || [];
            setLocalCouncils(councilsData);
          } else {
            setLocalCouncils([]);
          }
        } catch (err) {
          console.warn("Failed to fetch local councils:", err);
          setLocalCouncils([]);
        }
      } else {
        setLocalCouncils([]);
      }
    } catch (error) {
      console.error("Error fetching search data:", error);
      // Don't show toast for school reps as they don't need this data
      if (userRole !== "school_rep") {
        toast.error("Failed to load search options");
      }
      // Set empty arrays on error to prevent map errors
      setSchools([]);
      setLocalCouncils([]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data: DistributionFilters) => {
    const filters: DistributionFilters = {};
    
    // Only include non-empty values
    if (data.search && data.search.trim()) filters.search = data.search.trim();
    if (data.status) filters.status = data.status as "CREATED" | "CONFIRMED" | "DISCREPANCY";
    if (data.localCouncilId) filters.localCouncilId = parseInt(data.localCouncilId.toString());
    if (data.schoolId) filters.schoolId = parseInt(data.schoolId.toString());
    if (data.schoolType) filters.schoolType = data.schoolType as "PRIMARY" | "SECONDARY" | "COMBINED";
    if (data.startDate) filters.startDate = data.startDate;
    if (data.endDate) filters.endDate = data.endDate;

    // Apply role-based filtering
    if (userRole === "lc_officer" && councilId) {
      filters.localCouncilId = councilId;
    } else if (userRole === "school_rep" && schoolId) {
      filters.schoolId = schoolId;
    }

    onFiltersChange(filters);
  };

  const handleReset = () => {
    reset({});
    onFiltersChange({});
  };

  const canFilterByCouncil = userRole === "super_admin" || userRole === "view_only";
  const canFilterBySchool = userRole !== "school_rep";

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          {isMobile ? 'Filter Distributions' : 'Search & Filter Distributions'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Distribution number, school name..."
                {...register("search")}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch("status") || "ALL"}
                onValueChange={(value) => setValue("status", value === "ALL" ? undefined : value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="CREATED">Created</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="DISCREPANCY">Discrepancy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Local Council - only for super admin and view-only users */}
            {canFilterByCouncil && (
              <div className="space-y-2">
                <Label htmlFor="localCouncilId">Local Council</Label>
                <Select
                  value={watch("localCouncilId")?.toString() || "ALL"}
                  onValueChange={(value) => 
                    setValue("localCouncilId", value === "ALL" ? undefined : parseInt(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All councils" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Councils</SelectItem>
                    {Array.isArray(localCouncils) && localCouncils.map((council) => (
                      <SelectItem key={council.id} value={council.id.toString()}>
                        {council.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* School - not for school representatives */}
            {canFilterBySchool && (
              <div className="space-y-2">
                <Label htmlFor="schoolId">School</Label>
                <Select
                  value={watch("schoolId")?.toString() || "ALL"}
                  onValueChange={(value) => 
                    setValue("schoolId", value === "ALL" ? undefined : parseInt(value))
                  }
                  disabled={loading || schools.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All schools" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Schools</SelectItem>
                    {Array.isArray(schools) && schools.map((school) => (
                      <SelectItem key={school.id} value={school.id.toString()}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* School Type */}
            <div className="space-y-2">
              <Label htmlFor="schoolType">School Type</Label>
              <Select
                value={watch("schoolType") || "ALL"}
                onValueChange={(value) => setValue("schoolType", value === "ALL" ? undefined : value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="PRIMARY">Primary</SelectItem>
                  <SelectItem value="SECONDARY">Secondary</SelectItem>
                  <SelectItem value="COMBINED">Combined</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                {...register("endDate")}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none">
              <Search className="h-4 w-4 mr-2" />
              {isMobile ? 'Apply Filters' : 'Search'}
            </Button>
            <Button type="button" variant="outline" onClick={handleReset} className="flex-1 sm:flex-none">
              <RotateCcw className="h-4 w-4 mr-2" />
              {isMobile ? 'Clear All' : 'Reset'}
            </Button>
          </div>
        </form>

        {/* Current Filters Display */}
        {Object.keys(initialFilters).length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Active Filters:</p>
            <div className="flex flex-wrap gap-2">
              {initialFilters.search && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  Search: {initialFilters.search}
                </span>
              )}
              {initialFilters.status && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  Status: {initialFilters.status}
                </span>
              )}
              {initialFilters.schoolType && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                  Type: {initialFilters.schoolType}
                </span>
              )}
              {initialFilters.localCouncilId && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                  Council: {Array.isArray(localCouncils) ? localCouncils.find(c => c.id === initialFilters.localCouncilId)?.name || initialFilters.localCouncilId : initialFilters.localCouncilId}
                </span>
              )}
              {initialFilters.schoolId && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                  School: {Array.isArray(schools) ? schools.find(s => s.id === initialFilters.schoolId)?.name || initialFilters.schoolId : initialFilters.schoolId}
                </span>
              )}
              {initialFilters.startDate && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                  From: {initialFilters.startDate}
                </span>
              )}
              {initialFilters.endDate && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                  To: {initialFilters.endDate}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}