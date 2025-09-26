"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

interface FilterOption {
  value: string;
  label: string;
}

interface GlobalFilterBarProps {
  userRole: string;
  dateRange: string;
  onDateRangeChange: (dateRange: string) => void;
  schoolId?: string;
  councilId?: string;
  warehouseId?: string;
  onScopeChange?: (scope: {
    schoolId?: string;
    councilId?: string;
    warehouseId?: string;
  }) => void;
  schools?: FilterOption[];
  councils?: FilterOption[];
  warehouses?: FilterOption[];
  loading?: boolean;
  onRefresh?: () => void;
}

const DATE_RANGE_OPTIONS = [
  { value: "last7", label: "Last 7 days" },
  { value: "last30", label: "Last 30 days" },
  { value: "last90", label: "Last 90 days" },
];

export function GlobalFilterBar({
  userRole,
  dateRange,
  onDateRangeChange,
  schoolId,
  councilId,
  warehouseId,
  onScopeChange,
  schools = [],
  councils = [],
  warehouses = [],
  loading = false,
  onRefresh,
}: GlobalFilterBarProps) {
  const [localSchoolId, setLocalSchoolId] = useState(schoolId || "");
  const [localCouncilId, setLocalCouncilId] = useState(councilId || "");
  const [localWarehouseId, setLocalWarehouseId] = useState(warehouseId || "");

  // Determine which scope selectors to show based on role
  const showSchoolSelector =
    userRole === "super_admin" ||
    userRole === "Super Administrator" ||
    userRole === "view_only" ||
    userRole === "View Only";

  const showCouncilSelector =
    userRole === "super_admin" ||
    userRole === "Super Administrator" ||
    userRole === "view_only" ||
    userRole === "View Only";

  const showWarehouseSelector =
    userRole === "super_admin" ||
    userRole === "Super Administrator" ||
    userRole === "view_only" ||
    userRole === "View Only" ||
    userRole === "warehouse_manager" ||
    userRole === "National Warehouse Manager";

  // Update parent when local state changes
  useEffect(() => {
    if (onScopeChange) {
      onScopeChange({
        schoolId: localSchoolId || undefined,
        councilId: localCouncilId || undefined,
        warehouseId: localWarehouseId || undefined,
      });
    }
  }, [localSchoolId, localCouncilId, localWarehouseId, onScopeChange]);

  const hasFilters =
    showSchoolSelector || showCouncilSelector || showWarehouseSelector;

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
            {/* Date Range Filter */}
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-gray-500" />
              <Label
                htmlFor="dateRange"
                className="whitespace-nowrap text-sm font-medium"
              >
                Date Range:
              </Label>
              <Select value={dateRange} onValueChange={onDateRangeChange}>
                <SelectTrigger id="dateRange" className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Scope Selectors */}
            {hasFilters && (
              <>
                <div className="hidden sm:block h-6 w-px bg-gray-300" />

                <div className="flex flex-wrap gap-4 items-center">
                  {showSchoolSelector && schools.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="schoolFilter"
                        className="whitespace-nowrap text-sm font-medium"
                      >
                        School:
                      </Label>
                      <Select
                        value={localSchoolId}
                        onValueChange={setLocalSchoolId}
                      >
                        <SelectTrigger id="schoolFilter" className="w-[180px]">
                          <SelectValue placeholder="All schools" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All schools</SelectItem>
                          {schools.map((school) => (
                            <SelectItem key={school.value} value={school.value}>
                              {school.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {showCouncilSelector && councils.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="councilFilter"
                        className="whitespace-nowrap text-sm font-medium"
                      >
                        Council:
                      </Label>
                      <Select
                        value={localCouncilId}
                        onValueChange={setLocalCouncilId}
                      >
                        <SelectTrigger id="councilFilter" className="w-[180px]">
                          <SelectValue placeholder="All councils" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All councils</SelectItem>
                          {councils.map((council) => (
                            <SelectItem
                              key={council.value}
                              value={council.value}
                            >
                              {council.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {showWarehouseSelector && warehouses.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="warehouseFilter"
                        className="whitespace-nowrap text-sm font-medium"
                      >
                        Warehouse:
                      </Label>
                      <Select
                        value={localWarehouseId}
                        onValueChange={setLocalWarehouseId}
                      >
                        <SelectTrigger
                          id="warehouseFilter"
                          className="w-[180px]"
                        >
                          <SelectValue placeholder="All warehouses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All warehouses</SelectItem>
                          {warehouses.map((warehouse) => (
                            <SelectItem
                              key={warehouse.value}
                              value={warehouse.value}
                            >
                              {warehouse.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="shrink-0"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton for loading state
export function GlobalFilterBarSkeleton() {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-[140px] bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="hidden sm:block h-6 w-px bg-gray-300" />
            <div className="flex gap-4 items-center">
              <div className="h-10 w-[180px] bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-[180px] bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  );
}
