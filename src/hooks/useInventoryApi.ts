import {
  useApiQuery,
  useApiMutation,
  usePaginatedApiQuery,
  useOptimisticMutation,
} from "./useApi";
import { nationalInventoryApi } from "@/lib/api";
import { queryKeys, cacheUtils } from "@/lib/query-client";
import { NationalInventoryFilters, InventoryMovementFilters } from "@/types";

// Hook for national inventory with pagination
export const useNationalInventory = (
  page: number = 1,
  limit: number = 50,
  filters: NationalInventoryFilters = {}
) => {
  return usePaginatedApiQuery(
    queryKeys.inventory.nationalList(filters),
    nationalInventoryApi.getNationalInventory,
    page,
    limit,
    filters,
    {
      staleTime: 2 * 60 * 1000, // 2 minutes for inventory data
    }
  );
};

// Hook for inventory summary
export const useNationalInventorySummary = (
  page: number = 1,
  limit: number = 50,
  filters: NationalInventoryFilters = {}
) => {
  return usePaginatedApiQuery(
    ["inventory", "summary", filters],
    nationalInventoryApi.getNationalInventorySummary,
    page,
    limit,
    filters
  );
};

// Hook for inventory movements
export const useInventoryMovements = (
  page: number = 1,
  limit: number = 50,
  filters: InventoryMovementFilters = {}
) => {
  return usePaginatedApiQuery(
    ["inventory", "movements", filters],
    nationalInventoryApi.getInventoryMovements,
    page,
    limit,
    filters
  );
};

// Hook for low stock items
export const useLowStockItems = (page: number = 1, limit: number = 50) => {
  return usePaginatedApiQuery(
    ["inventory", "low-stock"],
    nationalInventoryApi.getLowStockItems,
    page,
    limit
  );
};

// Hook for inventory statistics
export const useInventoryStatistics = () => {
  return useApiQuery(
    ["inventory", "statistics"],
    nationalInventoryApi.getInventoryStatistics,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes for statistics
    }
  );
};

// Hook for stock adjustment with optimistic updates
export const useStockAdjustment = () => {
  return useOptimisticMutation(
    nationalInventoryApi.performStockAdjustment,
    queryKeys.inventory.all,
    (oldData: any, variables: any) => {
      // Optimistically update the inventory data
      if (oldData?.data?.items) {
        return {
          ...oldData,
          data: {
            ...oldData.data,
            items: oldData.data.items.map((item: any) => {
              if (
                item.itemId === variables.itemId &&
                item.warehouseId === variables.warehouseId
              ) {
                const adjustment =
                  variables.adjustmentType === "INCREASE"
                    ? variables.quantity
                    : variables.adjustmentType === "DECREASE"
                    ? -variables.quantity
                    : variables.quantity - item.availableQuantity;

                return {
                  ...item,
                  availableQuantity: Math.max(
                    0,
                    item.availableQuantity + adjustment
                  ),
                  quantityOnHand: Math.max(0, item.quantityOnHand + adjustment),
                };
              }
              return item;
            }),
          },
        };
      }
      return oldData;
    },
    {
      meta: {
        successMessage: "Stock adjustment completed successfully",
        invalidateQueries: [queryKeys.inventory.all, queryKeys.dashboard.all],
      },
    }
  );
};

// Hook for stock transfer
export const useStockTransfer = () => {
  return useApiMutation(nationalInventoryApi.performStockTransfer, {
    meta: {
      successMessage: "Stock transfer completed successfully",
      invalidateQueries: [queryKeys.inventory.all, queryKeys.dashboard.all],
    },
  });
};

// Hook for updating minimum stock level
export const useUpdateMinimumStockLevel = () => {
  return useApiMutation(nationalInventoryApi.updateMinimumStockLevel, {
    meta: {
      successMessage: "Minimum stock level updated successfully",
      invalidateQueries: [queryKeys.inventory.all],
    },
  });
};

// Hook for inventory audit
export const useInventoryAudit = () => {
  return useApiMutation(nationalInventoryApi.performInventoryAudit, {
    meta: {
      successMessage: "Inventory audit completed successfully",
      invalidateQueries: [queryKeys.inventory.all, queryKeys.dashboard.all],
    },
  });
};

// Hook for prefetching related inventory data
export const usePrefetchInventoryData = () => {
  return {
    prefetchLowStock: () =>
      cacheUtils.prefetchQuery(["inventory", "low-stock"], () =>
        nationalInventoryApi.getLowStockItems(1, 50)
      ),
    prefetchStatistics: () =>
      cacheUtils.prefetchQuery(
        ["inventory", "statistics"],
        nationalInventoryApi.getInventoryStatistics
      ),
    prefetchMovements: (filters: InventoryMovementFilters = {}) =>
      cacheUtils.prefetchQuery(["inventory", "movements", filters], () =>
        nationalInventoryApi.getInventoryMovements(1, 50, filters)
      ),
  };
};
