import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Default query options (typed loosely to avoid strict inference issues)
const defaultQueryFn: any = async ({ queryKey }: { queryKey: any[] }) => {
  throw new Error(`No query function found for ${queryKey?.[0]}`);
};

// Create the query client with global configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 429 (rate limit)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return error?.response?.status === 429 && failureCount < 2;
        }
        // Retry up to 3 times for network errors and 5xx errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
      onError: (error: any) => {
        // Global error handling for mutations
        const errorMessage =
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "An unexpected error occurred";

        // Don't show error toast for certain status codes (handled elsewhere)
        const silentErrors = [400, 401, 403, 409, 422];
        if (!silentErrors.includes(error?.response?.status)) {
          toast.error(errorMessage);
        }
      },
    },
  },
});

// Query keys factory for better organization
export const queryKeys = {
  // Users
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.users.details(), id] as const,
    profile: () => [...queryKeys.users.all, "profile"] as const,
  },

  // Items
  items: {
    all: ["items"] as const,
    lists: () => [...queryKeys.items.all, "list"] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.items.lists(), filters] as const,
    details: () => [...queryKeys.items.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.items.details(), id] as const,
    stats: (id: number) => [...queryKeys.items.all, "stats", id] as const,
  },

  // Schools
  schools: {
    all: ["schools"] as const,
    lists: () => [...queryKeys.schools.all, "list"] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.schools.lists(), filters] as const,
    details: () => [...queryKeys.schools.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.schools.details(), id] as const,
    byCouncil: (councilId: number) =>
      [...queryKeys.schools.all, "council", councilId] as const,
    stats: (id: number) => [...queryKeys.schools.all, "stats", id] as const,
    distributionSummary: (councilId?: number) =>
      [...queryKeys.schools.all, "distributionSummary", councilId] as const,
  },

  // Local Councils
  localCouncils: {
    all: ["localCouncils"] as const,
    lists: () => [...queryKeys.localCouncils.all, "list"] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.localCouncils.lists(), filters] as const,
    details: () => [...queryKeys.localCouncils.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.localCouncils.details(), id] as const,
    stats: (id: number) =>
      [...queryKeys.localCouncils.all, "stats", id] as const,
    districtsByRegion: (region: string) =>
      [...queryKeys.localCouncils.all, "districtsByRegion", region] as const,
  },

  // Warehouses
  warehouses: {
    all: ["warehouses"] as const,
    lists: () => [...queryKeys.warehouses.all, "list"] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.warehouses.lists(), filters] as const,
    details: () => [...queryKeys.warehouses.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.warehouses.details(), id] as const,
    stats: (id: number) => [...queryKeys.warehouses.all, "stats", id] as const,
    inventorySummary: () =>
      [...queryKeys.warehouses.all, "inventorySummary"] as const,
  },

  // Inventory
  inventory: {
    all: ["inventory"] as const,
    national: () => [...queryKeys.inventory.all, "national"] as const,
    nationalList: (filters: Record<string, any>) =>
      [...queryKeys.inventory.national(), filters] as const,
    council: () => [...queryKeys.inventory.all, "council"] as const,
    councilList: (councilId: number, filters: Record<string, any>) =>
      [...queryKeys.inventory.council(), councilId, filters] as const,
  },

  // Shipments
  shipments: {
    all: ["shipments"] as const,
    lists: () => [...queryKeys.shipments.all, "list"] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.shipments.lists(), filters] as const,
    details: () => [...queryKeys.shipments.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.shipments.details(), id] as const,
  },

  // Distributions
  distributions: {
    all: ["distributions"] as const,
    lists: () => [...queryKeys.distributions.all, "list"] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.distributions.lists(), filters] as const,
    details: () => [...queryKeys.distributions.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.distributions.details(), id] as const,
    byCouncil: (councilId: number, filters: Record<string, any>) =>
      [...queryKeys.distributions.all, "council", councilId, filters] as const,
    bySchool: (schoolId: number, filters: Record<string, any>) =>
      [...queryKeys.distributions.all, "school", schoolId, filters] as const,
  },

  // Dashboard
  dashboard: {
    all: ["dashboard"] as const,
    kpi: () => [...queryKeys.dashboard.all, "kpi"] as const,
    inventoryCharts: () =>
      [...queryKeys.dashboard.all, "inventoryCharts"] as const,
    recentActivity: (limit: number) =>
      [...queryKeys.dashboard.all, "recentActivity", limit] as const,
  },

  // Admin Statistics
  admin: {
    all: ["admin"] as const,
    statistics: () => [...queryKeys.admin.all, "statistics"] as const,
    systemStatistics: () => 
      [...queryKeys.admin.statistics(), "system"] as const,
    userStatistics: () => 
      [...queryKeys.admin.statistics(), "users"] as const,
    schoolStatistics: () => 
      [...queryKeys.admin.statistics(), "schools"] as const,
    localCouncilStatistics: () => 
      [...queryKeys.admin.statistics(), "councils"] as const,
    itemStatistics: () => 
      [...queryKeys.admin.statistics(), "items"] as const,
  },
} as const;

// Enhanced utility functions for cache management
export const invalidateQueries = {
  users: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  items: () => queryClient.invalidateQueries({ queryKey: queryKeys.items.all }),
  schools: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.schools.all }),
  localCouncils: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.localCouncils.all }),
  warehouses: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.all }),
  inventory: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all }),
  shipments: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all }),
  distributions: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.distributions.all }),
  dashboard: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
  all: () => queryClient.invalidateQueries(),
};

// Enhanced cache utilities for better data synchronization
export const cacheUtils = {
  // Prefetch data for better UX
  prefetchQuery: async (queryKey: any[], queryFn: () => Promise<any>) => {
    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },

  // Set query data directly (useful for optimistic updates)
  setQueryData: <T>(queryKey: any[], data: T) => {
    queryClient.setQueryData(queryKey, data);
  },

  // Get cached query data
  getQueryData: <T>(queryKey: any[]): T | undefined => {
    return queryClient.getQueryData(queryKey);
  },

  // Remove specific queries from cache
  removeQueries: (queryKey: any[]) => {
    queryClient.removeQueries({ queryKey });
  },

  // Cancel ongoing queries (useful for cleanup)
  cancelQueries: async (queryKey: any[]) => {
    await queryClient.cancelQueries({ queryKey });
  },

  // Reset queries to initial state
  resetQueries: (queryKey: any[]) => {
    queryClient.resetQueries({ queryKey });
  },

  // Batch invalidation for related data
  invalidateRelated: (entityType: string, entityId?: number) => {
    switch (entityType) {
      case "inventory":
        invalidateQueries.inventory();
        invalidateQueries.dashboard();
        break;
      case "shipment":
        invalidateQueries.shipments();
        invalidateQueries.inventory();
        invalidateQueries.dashboard();
        break;
      case "distribution":
        invalidateQueries.distributions();
        invalidateQueries.inventory();
        invalidateQueries.dashboard();
        break;
      case "user":
        invalidateQueries.users();
        break;
      case "school":
        invalidateQueries.schools();
        if (entityId) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.distributions.bySchool(entityId, {}),
          });
        }
        break;
      case "warehouse":
        invalidateQueries.warehouses();
        invalidateQueries.inventory();
        break;
      default:
        invalidateQueries.all();
    }
  },

  // Clear all cache (useful for logout)
  clearAll: () => {
    queryClient.clear();
  },

  // Get cache statistics for debugging
  getCacheStats: () => {
    const cache = queryClient.getQueryCache();
    return {
      totalQueries: cache.getAll().length,
      activeQueries: cache
        .getAll()
        .filter((query) => query.getObserversCount() > 0).length,
      staleQueries: cache.getAll().filter((query) => query.isStale()).length,
    };
  },
};
