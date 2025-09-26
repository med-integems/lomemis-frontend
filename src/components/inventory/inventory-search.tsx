"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter } from "lucide-react";
import { useResponsive } from "@/hooks/useResponsive";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { nationalInventoryApi, warehousesApi, itemsApi } from "@/lib/api";
import {
  NationalInventoryItem,
  Warehouse,
  Item,
  NationalInventoryFilters,
} from "@/types";
import { toast } from "sonner";

interface InventorySearchProps {
  onResultsChange?: (results: NationalInventoryItem[]) => void;
}

export function InventorySearch({ onResultsChange }: InventorySearchProps) {
  const { deviceType, isMobile, isTouchDevice } = useResponsive();
  const [searchResults, setSearchResults] = useState<NationalInventoryItem[]>(
    []
  );
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<NationalInventoryFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    loadWarehouses();
    loadItems();
  }, []);

  const loadWarehouses = async () => {
    try {
      const response = await warehousesApi.getWarehouses(1, 100, {
        isActive: true,
      });
      if (response.success && response.data?.warehouses) {
        setWarehouses(response.data.warehouses);
      }
    } catch (error) {
      console.error("Failed to load warehouses:", error);
    }
  };

  const loadItems = async () => {
    try {
      const response = await itemsApi.getItems(1, 1000, { isActive: true });
      if (response.success && response.data?.items) {
        setItems(response.data.items);
      }
    } catch (error) {
      console.error("Failed to load items:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim() && Object.keys(filters).length === 0) {
      toast.error("Please enter a search term or apply filters");
      return;
    }

    setLoading(true);
    try {
      const searchFilters = {
        ...filters,
        ...(searchTerm.trim() && { search: searchTerm.trim() }),
      };

      const response = await nationalInventoryApi.getNationalInventory(
        1,
        100,
        searchFilters
      );

      if (response.success && response.data) {
        const results = response.data.items || [];
        setSearchResults(results);
        onResultsChange?.(results);

        if (results.length === 0) {
          toast.info("No items found matching your search criteria");
        } else {
          toast.success(`Found ${results.length} items`);
        }
      } else {
        toast.error("Failed to search inventory");
      }
    } catch (error) {
      console.error("Failed to search inventory:", error);
      toast.error("Failed to search inventory");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (
    key: keyof NationalInventoryFilters,
    value: any
  ) => {
    const newFilters = { ...filters };
    if (value === "" || value === undefined || value === 0) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    setFilters(newFilters);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setFilters({});
    setSearchResults([]);
    onResultsChange?.([]);
  };

  const getWarehouseName = (warehouseId: number) => {
    const warehouse = warehouses.find((w) => w.id === warehouseId);
    return warehouse?.name || `Warehouse ${warehouseId}`;
  };

  const getItemName = (itemId: number) => {
    const item = items.find((i) => i.id === itemId);
    return item?.name || `Item ${itemId}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Mobile Advanced Filters Sheet
  const MobileAdvancedFiltersSheet = () => (
    <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <Filter className="h-4 w-4 mr-2" />
          Advanced
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Advanced Filters</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Category
            </label>
            <Input
              placeholder="Filter by category"
              value={filters.category || ""}
              onChange={(e) => handleFilterChange("category", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Warehouse
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007A33]"
              value={filters.warehouseId || ""}
              onChange={(e) =>
                handleFilterChange(
                  "warehouseId",
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
            >
              <option value="">All Warehouses</option>
              {Array.isArray(warehouses) && warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Specific Item
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007A33]"
              value={filters.itemId || ""}
              onChange={(e) =>
                handleFilterChange(
                  "itemId",
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
            >
              <option value="">All Items</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.code})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="lowStockMobile"
              checked={filters.lowStockOnly || false}
              onChange={(e) =>
                handleFilterChange(
                  "lowStockOnly",
                  e.target.checked || undefined
                )
              }
              className="rounded"
            />
            <label htmlFor="lowStockMobile" className="text-sm font-medium">
              Low Stock Only
            </label>
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={() => {
              clearSearch();
              setMobileFiltersOpen(false);
            }} variant="outline" className="flex-1">
              Clear All
            </Button>
            <Button 
              onClick={() => setMobileFiltersOpen(false)} 
              className="flex-1 bg-[#007A33] hover:bg-[#005A25]"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  // Mobile Search Result Card
  const MobileSearchResultCard = ({ item }: { item: NationalInventoryItem }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Item Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">{item.itemName}</h3>
              <p className="text-sm text-muted-foreground">{item.itemCode}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {item.category && (
                  <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                )}
                {item.isLowStock && (
                  <Badge variant="destructive" className="text-xs">Low Stock</Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Item Description */}
          {item.itemDescription && (
            <p className="text-sm text-muted-foreground">
              {item.itemDescription}
            </p>
          )}

          {/* Stock Details */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Warehouse:</span>
              <div className="font-medium truncate">{item.warehouseName}</div>
            </div>
            <div>
              <span className="text-muted-foreground">On Hand:</span>
              <div className="font-medium">{item.quantityOnHand.toLocaleString()} {item.unitOfMeasure}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Available:</span>
              <div className="font-medium">{item.availableQuantity.toLocaleString()} {item.unitOfMeasure}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Updated:</span>
              <div className="font-medium text-xs">{formatDate(item.lastUpdated)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className={cn(
            deviceType === "mobile" ? "text-lg" : "text-xl"
          )}>
            {deviceType === "mobile" ? "Search Inventory" : "Search & Filter Inventory"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Input */}
            <div className={cn(
              "flex gap-2",
              deviceType === "mobile" && "flex-col space-y-2"
            )}>
              <Input
                placeholder={deviceType === "mobile" 
                  ? "Search items..." 
                  : "Search by item name, code, or description..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className={cn(
                  "flex-1",
                  isTouchDevice && "min-h-[44px]"
                )}
              />
              <div className={cn(
                "flex gap-2",
                deviceType === "mobile" && "w-full"
              )}>
                <Button 
                  onClick={handleSearch} 
                  disabled={loading}
                  className={cn(
                    deviceType === "mobile" && "flex-1",
                    isTouchDevice && "min-h-[44px]"
                  )}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? "Searching..." : "Search"}
                </Button>
                <Button 
                  onClick={clearSearch} 
                  variant="outline"
                  className={cn(
                    deviceType === "mobile" && "flex-1",
                    isTouchDevice && "min-h-[44px]"
                  )}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
            
            {/* Advanced Filters Toggle */}
            {deviceType !== "mobile" && (
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="text-sm"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showAdvancedFilters ? "Hide" : "Show"} Advanced Filters
                </Button>
              </div>
            )}
            
            {/* Mobile Advanced Filters Button */}
            {deviceType === "mobile" && (
              <div className="flex justify-center">
                <MobileAdvancedFiltersSheet />
              </div>
            )}

            {/* Desktop Advanced Filters */}
            {showAdvancedFilters && deviceType !== "mobile" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category
                  </label>
                  <Input
                    placeholder="Filter by category"
                    value={filters.category || ""}
                    onChange={(e) =>
                      handleFilterChange("category", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Warehouse
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007A33]"
                    value={filters.warehouseId || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        "warehouseId",
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                  >
                    <option value="">All Warehouses</option>
                    {Array.isArray(warehouses) && warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Specific Item
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007A33]"
                    value={filters.itemId || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        "itemId",
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                  >
                    <option value="">All Items</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.lowStockOnly || false}
                      onChange={(e) =>
                        handleFilterChange(
                          "lowStockOnly",
                          e.target.checked || undefined
                        )
                      }
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">Low Stock Only</span>
                  </label>
                </div>
              </div>
            )}

            {/* Active Filters Display */}
            {(searchTerm || Object.keys(filters).length > 0) && (
              <div className={cn(
                "flex flex-wrap gap-2",
                deviceType === "mobile" && "text-sm"
              )}>
                <span className="text-sm font-medium">Active filters:</span>
                {searchTerm && (
                  <Badge variant="secondary" className={deviceType === "mobile" ? "text-xs" : ""}>
                    Search: "{searchTerm.length > 20 && deviceType === "mobile" 
                      ? `${searchTerm.substring(0, 20)}...` 
                      : searchTerm}"
                  </Badge>
                )}
                {filters.category && (
                  <Badge variant="secondary" className={deviceType === "mobile" ? "text-xs" : ""}>
                    Category: {filters.category}
                  </Badge>
                )}
                {filters.warehouseId && (
                  <Badge variant="secondary" className={deviceType === "mobile" ? "text-xs" : ""}>
                    Warehouse: {getWarehouseName(filters.warehouseId)}
                  </Badge>
                )}
                {filters.itemId && (
                  <Badge variant="secondary" className={deviceType === "mobile" ? "text-xs" : ""}>
                    Item: {getItemName(filters.itemId)}
                  </Badge>
                )}
                {filters.lowStockOnly && (
                  <Badge variant="secondary" className={deviceType === "mobile" ? "text-xs" : ""}>
                    Low Stock Only
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className={cn(
              deviceType === "mobile" ? "text-lg" : "text-xl"
            )}>
              {deviceType === "mobile" 
                ? `Results (${searchResults.length})` 
                : `Search Results (${searchResults.length} items)`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deviceType === "mobile" ? (
              /* Mobile Card View */
              <div className="space-y-4">
                {searchResults.map((item) => (
                  <MobileSearchResultCard 
                    key={`${item.itemId}-${item.warehouseId}`} 
                    item={item} 
                  />
                ))}
              </div>
            ) : (
              /* Desktop Card View */
              <div className="space-y-4">
                {searchResults.map((item) => (
                  <div
                    key={`${item.itemId}-${item.warehouseId}`}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{item.itemName}</h3>
                          <Badge variant="outline">{item.itemCode}</Badge>
                          {item.category && (
                            <Badge variant="secondary">{item.category}</Badge>
                          )}
                          {item.isLowStock && (
                            <Badge variant="destructive">Low Stock</Badge>
                          )}
                        </div>

                        {item.itemDescription && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {item.itemDescription}
                          </p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-muted-foreground">Warehouse:</span>
                            <div className="font-medium">{item.warehouseName}</div>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">On Hand:</span>
                            <div className="font-medium">
                              {item.quantityOnHand.toLocaleString()}{" "}
                              {item.unitOfMeasure}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Available:</span>
                            <div className="font-medium">
                              {item.availableQuantity.toLocaleString()}{" "}
                              {item.unitOfMeasure}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Last Updated:</span>
                            <div className="font-medium">
                              {formatDate(item.lastUpdated)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* No Results Message */}
      {!loading && searchResults.length === 0 && (searchTerm || Object.keys(filters).length > 0) && (
        <Card>
          <CardContent className={cn(
            "p-6 text-center",
            deviceType === "mobile" && "p-4"
          )}>
            <div className="space-y-2">
              <p className="text-muted-foreground">
                {deviceType === "mobile" 
                  ? "No items found" 
                  : "No items found matching your search criteria"}
              </p>
              <Button onClick={clearSearch} variant="outline" size="sm">
                Clear Search
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
