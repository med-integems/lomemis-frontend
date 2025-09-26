import React, { useState } from "react";
import {
  useApiQuery,
  useApiMutation,
  usePaginatedApiQuery,
  useOptimisticMutation,
  useBatchMutation,
  useRealtimeApiQuery,
  useSynchronizedMutation,
  useConditionalApiQuery,
  useAdvancedCacheManagement,
} from "@/hooks/useApi";
import { queryKeys } from "@/lib/query-client";
import { nationalInventoryApi, itemsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Example component demonstrating the enhanced React Query hooks
 * This shows how to use the standardized hooks with consistent error handling,
 * optimistic updates, and proper cache invalidation
 */
export const EnhancedApiHooksExample: React.FC = () => {
  const [selectedItemId, setSelectedItemId] = useState<number | undefined>();
  const [page, setPage] = useState(1);

  // 1. Basic API Query with consistent error handling
  const {
    data: inventoryData,
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useApiQuery(
    queryKeys.inventory.nationalList({ page, limit: 10 }),
    () => nationalInventoryApi.getNationalInventory(page, 10),
    {
      // Custom options can still be passed
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );

  // 2. Paginated Query with consistent handling
  const {
    data: itemsData,
    isLoading: itemsLoading,
    error: itemsError,
  } = usePaginatedApiQuery(
    queryKeys.items.lists(),
    (page, limit, filters) => itemsApi.getItems(page, limit, filters),
    page,
    10,
    { category: "books" } // filters
  );

  // 3. Conditional Query (only runs when itemId is selected)
  const { data: itemDetailsData, isLoading: itemDetailsLoading } =
    useConditionalApiQuery(
      queryKeys.items.detail(selectedItemId!),
      () => itemsApi.getItems(1, 1, { itemId: selectedItemId }),
      {
        dependencies: [selectedItemId],
        enabled: !!selectedItemId,
      }
    );

  // 4. Real-time Query with data change detection
  const {
    data: realtimeInventory,
    isRealtime,
    pollingInterval,
  } = useRealtimeApiQuery(
    queryKeys.inventory.national(),
    () => nationalInventoryApi.getNationalInventorySummary(),
    {
      pollingInterval: 30000, // 30 seconds
      enableRealtime: true,
      onDataChange: (newData, oldData) => {
        console.log("Inventory data changed:", { newData, oldData });
        // Could show a toast notification here
      },
      compareData: (newData, oldData) => {
        // Custom comparison logic
        return JSON.stringify(newData) !== JSON.stringify(oldData);
      },
    }
  );

  // 5. Basic Mutation with success/error handling
  const stockAdjustmentMutation = useApiMutation(
    nationalInventoryApi.performStockAdjustment,
    {
      meta: {
        successMessage: "Stock adjustment completed successfully!",
        invalidateQueries: [queryKeys.inventory.all, queryKeys.dashboard.kpi()],
      },
    }
  );

  // 6. Optimistic Mutation with rollback capability
  const optimisticStockMutation = useOptimisticMutation(
    nationalInventoryApi.performStockAdjustment,
    queryKeys.inventory.national(),
    (oldData, variables) => {
      // Optimistic update function
      if (!oldData?.data) return oldData;

      return {
        ...oldData,
        data: oldData.data.map((item: any) =>
          item.itemId === variables.itemId
            ? { ...item, currentStock: item.currentStock + variables.quantity }
            : item
        ),
      };
    },
    {
      meta: {
        successMessage: "Stock updated successfully!",
      },
    }
  );

  // 7. Synchronized Mutation with multiple cache updates
  const synchronizedMutation = useSynchronizedMutation(
    nationalInventoryApi.performStockTransfer,
    {
      relatedQueries: [
        queryKeys.inventory.all,
        queryKeys.dashboard.kpi(),
        queryKeys.warehouses.all,
      ],
      optimisticUpdates: [
        {
          queryKey: queryKeys.inventory.national(),
          updateFn: (oldData, variables) => {
            // Update inventory optimistically
            return oldData; // Simplified for example
          },
        },
      ],
      onSuccessInvalidations: [
        queryKeys.inventory.all,
        queryKeys.dashboard.all,
      ],
      rollbackOnError: true,
    },
    {
      meta: {
        successMessage: "Stock transfer completed!",
      },
    }
  );

  // 8. Batch Mutation for multiple operations
  const batchMutation = useBatchMutation(
    nationalInventoryApi.performStockAdjustment,
    {
      meta: {
        successMessage: "Batch operations completed!",
      },
    }
  );

  // 9. Advanced Cache Management
  const cacheManager = useAdvancedCacheManagement();

  // Example handlers
  const handleStockAdjustment = () => {
    if (!selectedItemId) return;

    stockAdjustmentMutation.mutate({
      itemId: selectedItemId,
      warehouseId: 1,
      adjustmentType: "INCREASE",
      quantity: 10,
      reason: "Manual adjustment",
      notes: "Example adjustment",
    });
  };

  const handleOptimisticUpdate = () => {
    if (!selectedItemId) return;

    optimisticStockMutation.mutate({
      itemId: selectedItemId,
      warehouseId: 1,
      adjustmentType: "INCREASE",
      quantity: 5,
      reason: "Optimistic update example",
    });
  };

  const handleBatchOperations = () => {
    // Add multiple operations to batch
    batchMutation.addToBatch({
      itemId: 1,
      warehouseId: 1,
      adjustmentType: "INCREASE",
      quantity: 5,
      reason: "Batch operation 1",
    });

    batchMutation.addToBatch({
      itemId: 2,
      warehouseId: 1,
      adjustmentType: "DECREASE",
      quantity: 3,
      reason: "Batch operation 2",
    });

    // Process all batched operations
    batchMutation.processBatch();
  };

  const handleCacheOptimization = () => {
    const metrics = cacheManager.getCacheMetrics();
    console.log("Cache metrics:", metrics);

    const optimizationResult = cacheManager.optimizeCache();
    console.log("Cache optimization result:", optimizationResult);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Enhanced React Query Hooks Example</h1>

      {/* Basic Query Example */}
      <Card>
        <CardHeader>
          <CardTitle>1. Basic API Query with Error Handling</CardTitle>
        </CardHeader>
        <CardContent>
          {inventoryLoading && <p>Loading inventory...</p>}
          {inventoryError && (
            <p className="text-red-500">Error loading inventory</p>
          )}
          {inventoryData?.success && (
            <p>Loaded {inventoryData.data?.total || 0} inventory items</p>
          )}
        </CardContent>
      </Card>

      {/* Paginated Query Example */}
      <Card>
        <CardHeader>
          <CardTitle>2. Paginated Query</CardTitle>
        </CardHeader>
        <CardContent>
          {itemsLoading && <p>Loading items...</p>}
          {itemsData?.success && (
            <div>
              <p>
                Items on page {page}: {itemsData.data?.items?.length || 0}
              </p>
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!itemsData.data?.items?.length}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conditional Query Example */}
      <Card>
        <CardHeader>
          <CardTitle>3. Conditional Query</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <input
              type="number"
              placeholder="Enter item ID"
              value={selectedItemId || ""}
              onChange={(e) =>
                setSelectedItemId(Number(e.target.value) || undefined)
              }
              className="border p-2 rounded"
            />
            {itemDetailsLoading && <p>Loading item details...</p>}
            {itemDetailsData?.success && (
              <p>Item details loaded for ID: {selectedItemId}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Real-time Query Example */}
      <Card>
        <CardHeader>
          <CardTitle>4. Real-time Query</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>Real-time updates: {isRealtime ? "Enabled" : "Disabled"}</p>
            <p>Polling interval: {pollingInterval}ms</p>
            {realtimeInventory?.success && (
              <p>
                Real-time inventory items: {realtimeInventory.data?.length || 0}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mutation Examples */}
      <Card>
        <CardHeader>
          <CardTitle>5. Mutation Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Button
                onClick={handleStockAdjustment}
                disabled={!selectedItemId || stockAdjustmentMutation.isLoading}
              >
                {stockAdjustmentMutation.isLoading
                  ? "Adjusting..."
                  : "Stock Adjustment"}
              </Button>
              {stockAdjustmentMutation.isError && (
                <p className="text-red-500 text-sm mt-1">Adjustment failed</p>
              )}
            </div>

            <div>
              <Button
                onClick={handleOptimisticUpdate}
                disabled={!selectedItemId || optimisticStockMutation.isLoading}
              >
                {optimisticStockMutation.isLoading
                  ? "Updating..."
                  : "Optimistic Update"}
              </Button>
            </div>

            <div>
              <Button
                onClick={handleBatchOperations}
                disabled={batchMutation.isProcessing}
              >
                {batchMutation.isProcessing
                  ? "Processing..."
                  : `Batch Operations (${batchMutation.batchSize})`}
              </Button>
              {batchMutation.hasResults && (
                <p className="text-sm mt-1">
                  Results: {batchMutation.batchResults.results.length} success,{" "}
                  {batchMutation.batchResults.errors.length} errors
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cache Management Example */}
      <Card>
        <CardHeader>
          <CardTitle>6. Advanced Cache Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button onClick={handleCacheOptimization}>Optimize Cache</Button>
            <Button
              onClick={() => cacheManager.invalidateByPattern("inventory")}
            >
              Invalidate Inventory Queries
            </Button>
            <Button onClick={() => cacheManager.invalidateAll()}>
              Clear All Cache
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedApiHooksExample;
