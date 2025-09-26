import {
  useApiQuery,
  useApiMutation,
  usePaginatedApiQuery,
  useOptimisticMutation,
  useDependentApiQuery,
} from "./useApi";
import { shipmentsApi } from "@/lib/api";
import { queryKeys, cacheUtils } from "@/lib/query-client";
import { ShipmentFilters } from "@/types";

// Hook for shipments list with pagination
export const useShipments = (
  page: number = 1,
  limit: number = 50,
  filters: ShipmentFilters = {}
) => {
  return usePaginatedApiQuery(
    queryKeys.shipments.list(filters) as any,
    shipmentsApi.getShipments,
    page,
    limit,
    filters
  );
};

// Hook for single shipment details
export const useShipment = (id: number, enabled: boolean = true) => {
  return useDependentApiQuery(
    queryKeys.shipments.detail(id) as any,
    () => shipmentsApi.getShipmentById(id),
    enabled && !!id
  );
};

// Hook for creating shipments with optimistic updates
export const useCreateShipment = () => {
  return useOptimisticMutation(
    shipmentsApi.createShipment,
    queryKeys.shipments.all as any,
    (oldData: any, variables: any) => {
      // Optimistically add the new shipment to the list
      if (oldData?.data?.shipments) {
        const optimisticShipment = {
          id: Date.now(), // Temporary ID
          shipmentNumber: `TEMP-${Date.now()}`,
          status: "DRAFT",
          ...variables,
          createdAt: new Date().toISOString(),
        };

        return {
          ...oldData,
          data: {
            ...oldData.data,
            shipments: [optimisticShipment, ...oldData.data.shipments],
            total: oldData.data.total + 1,
          },
        };
      }
      return oldData;
    },
    {
      meta: {
        successMessage: "Shipment created successfully",
        invalidateQueries: [
          queryKeys.shipments.all as any,
          queryKeys.inventory.all as any,
          queryKeys.dashboard.all as any,
        ],
      },
    }
  );
};

// Hook for dispatching shipments
export const useDispatchShipment = () => {
  return useOptimisticMutation(
    (id: number) => shipmentsApi.dispatchShipment(id),
    queryKeys.shipments.all as any,
    (oldData: any, id: number) => {
      // Optimistically update shipment status
      if (oldData?.data?.shipments) {
        return {
          ...oldData,
          data: {
            ...oldData.data,
            shipments: oldData.data.shipments.map((shipment: any) =>
              shipment.id === id
                ? {
                    ...shipment,
                    status: "IN_TRANSIT",
                    dispatchDate: new Date().toISOString(),
                  }
                : shipment
            ),
          },
        };
      }
      return oldData;
    },
    {
      meta: {
        successMessage: "Shipment dispatched successfully",
        invalidateQueries: [queryKeys.shipments.all as any, queryKeys.dashboard.all as any],
      },
    }
  );
};

// Hook for confirming shipment receipt
export const useConfirmShipmentReceipt = () => {
  return useApiMutation(
    ({ id, receiptData }: { id: number; receiptData: any }) =>
      shipmentsApi.confirmShipmentReceipt(id, receiptData),
    {
      meta: {
        successMessage: "Shipment receipt confirmed successfully",
        invalidateQueries: [
          queryKeys.shipments.all,
          queryKeys.inventory.all,
          queryKeys.dashboard.all,
        ],
      },
    }
  );
};

// Hook for updating shipment status
export const useUpdateShipmentStatus = () => {
  return useOptimisticMutation(
    ({ id, statusData }: { id: number; statusData: any }) =>
      shipmentsApi.updateShipmentStatus(id, statusData),
    queryKeys.shipments.all,
    (oldData: any, { id, statusData }: { id: number; statusData: any }) => {
      // Optimistically update shipment status
      if (oldData?.data?.shipments) {
        return {
          ...oldData,
          data: {
            ...oldData.data,
            shipments: oldData.data.shipments.map((shipment: any) =>
              shipment.id === id
                ? {
                    ...shipment,
                    ...statusData,
                    updatedAt: new Date().toISOString(),
                  }
                : shipment
            ),
          },
        };
      }
      return oldData;
    },
    {
      meta: {
        successMessage: "Shipment status updated successfully",
        invalidateQueries: [queryKeys.shipments.all, queryKeys.dashboard.all],
      },
    }
  );
};

// Hook for bulk shipment operations
export const useBulkShipmentOperations = () => {
  const dispatchMutation = useDispatchShipment();

  const dispatchMultiple = async (shipmentIds: number[]) => {
    const results = [];
    const errors = [];

    for (const id of shipmentIds) {
      try {
        const result = await dispatchMutation.mutateAsync(id);
        results.push(result);
      } catch (error) {
        errors.push({ id, error });
      }
    }

    // Invalidate queries after bulk operation
    cacheUtils.invalidateRelated("shipment");

    return { results, errors };
  };

  return {
    dispatchMultiple,
    isLoading: dispatchMutation.isPending,
  };
};

// Hook for shipment analytics and prefetching
export const useShipmentAnalytics = () => {
  return {
    prefetchShipmentDetails: (id: number) =>
      cacheUtils.prefetchQuery(queryKeys.shipments.detail(id) as any, () =>
        shipmentsApi.getShipmentById(id)
      ),

    prefetchShipmentsByStatus: (status: string) =>
      cacheUtils.prefetchQuery(queryKeys.shipments.list({ status }) as any, () =>
        shipmentsApi.getShipments(1, 50, { status })
      ),

    getShipmentCacheStats: () => {
      const stats = cacheUtils.getCacheStats();
      const shipmentQueries = cacheUtils.getQueryData(queryKeys.shipments.all as any);

      return {
        ...stats,
        cachedShipments: shipmentQueries
          ? Object.keys(shipmentQueries).length
          : 0,
      };
    },
  };
};
