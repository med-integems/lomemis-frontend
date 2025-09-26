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
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Filter, X, AlertTriangle } from "lucide-react";
import { localCouncilsApi, itemsApi } from "@/lib/api";
import { CouncilInventoryFilters, LocalCouncil, Item } from "@/types";

interface CouncilInventorySearchProps {
  onFiltersChange: (filters: CouncilInventoryFilters) => void;
  initialFilters?: CouncilInventoryFilters;
  className?: string;
  hideCouncilSelect?: boolean;
  currentCouncilId?: number | null;
  restrictOptionsToCouncil?: boolean;
}

export function CouncilInventorySearch({
  onFiltersChange,
  initialFilters = {},
  className,
  hideCouncilSelect = false,
  currentCouncilId = undefined,
  restrictOptionsToCouncil = true,
}: CouncilInventorySearchProps) {
  const [filters, setFilters] =
    useState<CouncilInventoryFilters>(initialFilters);
  const [councils, setCouncils] = useState<LocalCouncil[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch councils and items for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch user profile to determine access level
        let userRole = null;
        let userCouncilId = null;
        
        try {
          const { usersApi } = await import('@/lib/api');
          const profileResponse = await usersApi.getCurrentUser();
          
          if (profileResponse.success && profileResponse.data) {
            const user = profileResponse.data;
            userRole = user.roleName;
            userCouncilId = user.localCouncilId;
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // Continue with default behavior for testing environment
        }

        // Fetch councils - show all councils for admins and managers
        try {
          const councilsResponse = await localCouncilsApi.getLocalCouncils(1, 100);
          if (councilsResponse.success && councilsResponse.data?.councils) {
            setCouncils(councilsResponse.data.councils);
            
            // For council officers, pre-select their council
            if (userRole === "Local Council M&E Officer" && userCouncilId) {
              setFilters(prev => ({ ...prev, councilId: userCouncilId }));
            }
          }
        } catch (error) {
          console.error("Error fetching councils:", error);
        }

        // Fetch items and categories
        try {
          let loadedFromInventory = false;
          const effectiveCouncilId = currentCouncilId ?? userCouncilId ?? undefined;

          if (restrictOptionsToCouncil) {
            try {
              const { councilInventoryApi } = await import('@/lib/api');
              const inventoryResponse = await councilInventoryApi.getCouncilInventory(1, 500, {
                councilId: effectiveCouncilId,
              });

              if (inventoryResponse.success && inventoryResponse.data) {
                const inv = inventoryResponse.data as any;
                const inventoryItems = Array.isArray(inv)
                  ? inv
                  : inv.inventory || inv.items || [];

                // Extract unique categories from inventory
                const uniqueCategories = Array.from(
                  new Set(
                    (inventoryItems as any[])
                      .map((item: any) => item.category || item.itemCategory)
                      .filter((category): category is string => Boolean(category))
                  )
                ).sort();
                setCategories(uniqueCategories);

                // Items from inventory
                const availableItems: Item[] = (inventoryItems as any[]).map((item: any) => ({
                  id: item.itemId,
                  name: item.itemName,
                  code: item.itemCode,
                  category: item.category || item.itemCategory,
                  unitOfMeasure: item.unitOfMeasure || 'units',
                  isActive: true,
                  createdAt: '',
                  updatedAt: ''
                }));
                setItems(availableItems);
                loadedFromInventory = availableItems.length > 0 || uniqueCategories.length > 0;
              }
            } catch (error) {
              console.error("Error fetching council inventory for search options:", error);
            }
          }

          // Fallback to all items if no council-restricted data was loaded
          if (!restrictOptionsToCouncil || !loadedFromInventory) {
            const itemsResponse = await itemsApi.getItems(1, 500);
            if (itemsResponse.success && itemsResponse.data?.items) {
              const itemsList = itemsResponse.data.items as Item[];
              setItems(itemsList);

              const uniqueCategories = Array.from(
                new Set(
                  itemsList
                    .map((item: Item) => item.category)
                    .filter((category): category is string => Boolean(category))
                )
              ).sort();
              setCategories(uniqueCategories);
            }
          }
        } catch (error) {
          console.error("Error fetching items:", error);
        }
      } catch (error) {
        console.error("Error fetching search data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentCouncilId, restrictOptionsToCouncil]);

  const handleFilterChange = (
    key: keyof CouncilInventoryFilters,
    value: any
  ) => {
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
      filters[key as keyof CouncilInventoryFilters] !== undefined &&
      filters[key as keyof CouncilInventoryFilters] !== ""
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Search & Filter Council Inventory
        </CardTitle>
        {hideCouncilSelect && (
          <div className="mt-1 text-xs text-muted-foreground">
            Using selected council from page
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Items</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by item name or code..."
                value={filters.search || ""}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Council Selection (hidden when controlled at page-level) */}
          {!hideCouncilSelect && (
            <div className="space-y-2">
              <Label htmlFor="council">Local Council</Label>
              <Select
                value={filters.councilId?.toString() || "ALL"}
                onValueChange={(value) =>
                  handleFilterChange(
                    "councilId",
                    value === "ALL" ? undefined : parseInt(value)
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select council..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Councils</SelectItem>
                  {Array.isArray(councils) && councils.map((council) => (
                    <SelectItem key={council.id} value={council.id.toString()}>
                      {council.name} ({council.region})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={filters.category || "ALL"}
              onValueChange={(value) =>
                handleFilterChange("category", value === "ALL" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {restrictOptionsToCouncil && (
              <div className="text-[10px] text-muted-foreground">Options limited to council inventory</div>
            )}
          </div>

          {/* Specific Item Selection */}
          <div className="space-y-2">
            <Label htmlFor="item">Specific Item</Label>
            <Select
              value={filters.itemId?.toString() || "ALL"}
              onValueChange={(value) =>
                handleFilterChange(
                  "itemId",
                  value === "ALL" ? undefined : parseInt(value)
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select item..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Items</SelectItem>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {item.name} ({item.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {restrictOptionsToCouncil && (
              <div className="text-[10px] text-muted-foreground">Options limited to council inventory</div>
            )}
          </div>

          {/* Stock Status Filter */}
          <div className="space-y-2">
            <Label>Stock Status</Label>
            <Select
              value={filters.hasStock === true ? "IN_STOCK" : filters.hasStock === false ? "OUT_OF_STOCK" : "ALL"}
              onValueChange={(value) => {
                if (value === "IN_STOCK") {
                  handleFilterChange("hasStock", true);
                } else if (value === "OUT_OF_STOCK") {
                  handleFilterChange("hasStock", false);
                } else {
                  handleFilterChange("hasStock", undefined);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stock status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Items</SelectItem>
                <SelectItem value="IN_STOCK">In Stock Only</SelectItem>
                <SelectItem value="OUT_OF_STOCK">Out of Stock Only</SelectItem>
              </SelectContent>
            </Select>
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
            Search Inventory
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
              {filters.councilId && (
                <div className="bg-muted px-2 py-1 rounded text-sm">
                  Council:{" "}
                  {councils.find((c) => c.id === filters.councilId)?.name}
                </div>
              )}
              {filters.category && (
                <div className="bg-muted px-2 py-1 rounded text-sm">
                  Category: {filters.category}
                </div>
              )}
              {filters.itemId && (
                <div className="bg-muted px-2 py-1 rounded text-sm">
                  Item: {items.find((i) => i.id === filters.itemId)?.name}
                </div>
              )}
              {filters.hasStock === true && (
                <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                  In Stock Only
                </div>
              )}
              {filters.hasStock === false && (
                <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                  Out of Stock Only
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
