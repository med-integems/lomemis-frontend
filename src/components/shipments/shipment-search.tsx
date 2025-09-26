"use client";

import { useState, useEffect } from "react";
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
import { Search, Filter, X } from "lucide-react";
import { localCouncilsApi, warehousesApi } from "@/lib/api";
import { ShipmentFilters, LocalCouncil, Warehouse } from "@/types";

interface ShipmentSearchProps {
  onFiltersChange: (filters: ShipmentFilters) => void;
  initialFilters?: ShipmentFilters;
  className?: string;
}

export function ShipmentSearch({
  onFiltersChange,
  initialFilters = {},
  className,
}: ShipmentSearchProps) {
  const [filters, setFilters] = useState<ShipmentFilters>(initialFilters);
  const [councils, setCouncils] = useState<LocalCouncil[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch councils and warehouses for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [councilsResponse, warehousesResponse] = await Promise.all([
          localCouncilsApi.getLocalCouncils(1, 100),
          warehousesApi.getWarehouses(1, 100),
        ]);

        if (councilsResponse.success && councilsResponse.data?.councils) {
          setCouncils(councilsResponse.data.councils);
        }

        if (warehousesResponse.success && warehousesResponse.data?.warehouses) {
          setWarehouses(warehousesResponse.data.warehouses);
        }
      } catch (error) {
        console.error("Error fetching search data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFilterChange = (key: keyof ShipmentFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const handleSearch = () => {
    // Remove empty values
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(
        ([_, value]) => value !== undefined && value !== "" && value !== null
      )
    );
    onFiltersChange(cleanFilters);
  };

  const handleClearFilters = () => {
    const emptyFilters = {};
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters = Object.keys(filters).some(
    (key) =>
      filters[key as keyof ShipmentFilters] !== undefined &&
      filters[key as keyof ShipmentFilters] !== ""
  );

  const statusOptions = [
    { value: "DRAFT", label: "Draft" },
    { value: "IN_TRANSIT", label: "In Transit" },
    { value: "RECEIVED", label: "Received" },
    { value: "DISCREPANCY", label: "Discrepancy" },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Search & Filter Shipments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search" className="field-label">Search Shipments</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by shipment number..."
                value={filters.search || ""}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status" className="field-label">Status</Label>
            <Select
              value={filters.status || "ALL"}
              onValueChange={(value) =>
                handleFilterChange("status", value === "ALL" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Origin Warehouse Selection */}
          <div className="space-y-2">
            <Label htmlFor="originWarehouse" className="field-label">Origin Warehouse</Label>
            <Select
              value={filters.originWarehouseId?.toString() || "ALL"}
              onValueChange={(value) =>
                handleFilterChange(
                  "originWarehouseId",
                  value === "ALL" ? undefined : parseInt(value)
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All warehouses..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Warehouses</SelectItem>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                    {warehouse.name}
                    {warehouse.location && ` - ${warehouse.location}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Destination Council Selection */}
          <div className="space-y-2">
            <Label htmlFor="destinationCouncil" className="field-label">Destination Council</Label>
            <Select
              value={filters.destinationCouncilId?.toString() || "ALL"}
              onValueChange={(value) =>
                handleFilterChange(
                  "destinationCouncilId",
                  value === "ALL" ? undefined : parseInt(value)
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All councils..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Councils</SelectItem>
                {councils.map((council) => (
                  <SelectItem key={council.id} value={council.id.toString()}>
                    {council.name} ({council.region})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate" className="field-label">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate || ""}
              onChange={(e) =>
                handleFilterChange("startDate", e.target.value || undefined)
              }
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="endDate" className="field-label">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate || ""}
              onChange={(e) =>
                handleFilterChange("endDate", e.target.value || undefined)
              }
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSearch}
            className="bg-[#007A33] hover:bg-[#005A25]"
            disabled={loading}
          >
            <Search className="h-4 w-4 mr-2" />
            Search Shipments
          </Button>

          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="border-t pt-4">
            <div className="text-sm font-medium text-foreground mb-2">
              Active Filters:
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <div className="bg-muted px-2 py-1 rounded text-sm">
                  Search: "{filters.search}"
                </div>
              )}
              {filters.status && (
                <div className="bg-muted px-2 py-1 rounded text-sm">
                  Status: {statusOptions.find(s => s.value === filters.status)?.label}
                </div>
              )}
              {filters.originWarehouseId && (
                <div className="bg-muted px-2 py-1 rounded text-sm">
                  Origin: {warehouses.find((w) => w.id === filters.originWarehouseId)?.name}
                </div>
              )}
              {filters.destinationCouncilId && (
                <div className="bg-muted px-2 py-1 rounded text-sm">
                  Destination: {councils.find((c) => c.id === filters.destinationCouncilId)?.name}
                </div>
              )}
              {filters.startDate && (
                <div className="bg-muted px-2 py-1 rounded text-sm">
                  From: {filters.startDate}
                </div>
              )}
              {filters.endDate && (
                <div className="bg-muted px-2 py-1 rounded text-sm">
                  To: {filters.endDate}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}