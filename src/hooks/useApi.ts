import { useState, useCallback, useRef, useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
  QueryKey,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  keepPreviousData,
} from "@tanstack/react-query";
import { ApiResponse } from "@/types";
import { toast } from "sonner";
import { queryKeys, cacheUtils } from "@/lib/query-client";

// Enhanced error handling for React Query
const handleQueryError = (error: any) => {
  const message =
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    "An unexpected error occurred";

  // Don't show error toast for certain status codes (handled elsewhere)
  const silentErrors = [400, 401, 403, 409, 422];
  if (!silentErrors.includes(error?.response?.status)) {
    toast.error(message);
  }
};

// Custom hook for API queries with consistent error handling
export const useApiQuery = <TData = unknown, TError = any>(
  queryKey: QueryKey,
  queryFn: () => Promise<ApiResponse<TData>>,
  options?: Omit<
    UseQueryOptions<ApiResponse<TData>, TError>,
    "queryKey" | "queryFn"
  >
) => {
  const result = useQuery({
    queryKey,
    queryFn,
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
    ...options,
  });

  // Handle errors using useEffect instead of deprecated onError callback
  useEffect(() => {
    if (result.isError && result.error) {
      handleQueryError(result.error);
    }
  }, [result.isError, result.error]);

  return result;
};

// Custom hook for API mutations with optimistic updates
export const useApiMutation = <
  TData = unknown,
  TVariables = unknown,
  TError = any
>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: UseMutationOptions<ApiResponse<TData>, TError, TVariables>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data, variables, context) => {
      // Show success message if provided
      if (data.success && options?.meta?.successMessage) {
        toast.success(options.meta.successMessage as string);
      }

      // Invalidate related queries based on mutation type
      if (options?.meta?.invalidateQueries) {
        const queries = options.meta.invalidateQueries as QueryKey[];
        queries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      } else {
        // Default: invalidate all queries (can be overridden)
        queryClient.invalidateQueries();
      }

      // Call custom onSuccess if provided
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error: any, variables, context) => {
      // Handle error with enhanced error extraction
      const message =
        (error as any)?.response?.data?.error?.message ||
        (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        "An unexpected error occurred";

      // Show error toast unless specifically disabled
      if (options?.meta?.showErrorToast !== false) {
        toast.error(message);
      }

      // Call custom onError if provided
      if (options?.onError) {
        options.onError(error, variables, context);
      }
    },
    retry: false, // Don't retry mutations by default
    ...options,
  });
};

// Hook for paginated queries with consistent handling
export const usePaginatedApiQuery = <TData = unknown, TError = any>(
  queryKey: QueryKey,
  queryFn: (
    page: number,
    limit: number,
    filters?: any
  ) => Promise<ApiResponse<TData>>,
  page: number = 1,
  limit: number = 10,
  filters?: any,
  options?: Omit<
    UseQueryOptions<ApiResponse<TData>, TError>,
    "queryKey" | "queryFn"
  >
) => {
  const fullQueryKey = [...queryKey, { page, limit, filters }];

  return useApiQuery(fullQueryKey, () => queryFn(page, limit, filters), {
    placeholderData: keepPreviousData, // Keep previous data while loading new page (React Query v5)
    ...options,
  });
};

// Hook for infinite queries (for infinite scrolling) - Fixed implementation
export const useInfiniteApiQuery = <TData = unknown, TError = any>(
  queryKey: QueryKey,
  queryFn: ({
    pageParam,
  }: {
    pageParam: number;
  }) => Promise<ApiResponse<TData>>,
  options?: Omit<
    UseInfiniteQueryOptions<ApiResponse<TData>, TError, ApiResponse<TData>, readonly unknown[], number>,
    "queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam"
  >
) => {
  const result = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }: { pageParam: number }) => queryFn({ pageParam }),
    initialPageParam: 1, // Required in React Query v5
    getNextPageParam: (lastPage: any) => {
      if (lastPage?.data?.pagination) {
        const { page, totalPages } = lastPage.data.pagination;
        return page < totalPages ? page + 1 : undefined;
      }
      return undefined;
    },
    getPreviousPageParam: (firstPage: any) => {
      if (firstPage?.data?.pagination) {
        const { page } = firstPage.data.pagination;
        return page > 1 ? page - 1 : undefined;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });

  // Handle errors using useEffect instead of deprecated onError callback
  useEffect(() => {
    if (result.isError && result.error) {
      handleQueryError(result.error);
    }
  }, [result.isError, result.error]);

  return result;
};

// Hook for optimistic updates with rollback capability
export const useOptimisticMutation = <
  TData = unknown,
  TVariables = unknown,
  TError = any
>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  queryKey: QueryKey,
  optimisticUpdateFn?: (oldData: any, variables: TVariables) => any,
  options?: UseMutationOptions<ApiResponse<TData>, TError, TVariables>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables: TVariables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update to the new value
      if (optimisticUpdateFn && previousData) {
        queryClient.setQueryData(
          queryKey,
          optimisticUpdateFn(previousData, variables)
        );
      }

      // Return a context object with the snapshotted value
      return { previousData };
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if ((context as any)?.previousData) {
        queryClient.setQueryData(queryKey, (context as any).previousData);
      }

      // Handle error
      const message =
        (error as any)?.response?.data?.error?.message ||
        (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        "An unexpected error occurred";

      if (options?.meta?.showErrorToast !== false) {
        toast.error(message);
      }

      if (options?.onError) {
        options.onError(error, variables, context);
      }
    },
    onSuccess: (data, variables, context) => {
      // Show success message if provided
      if (data.success && options?.meta?.successMessage) {
        toast.success(options.meta.successMessage as string);
      }

      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey });
    },
    ...options,
  });
};

// Hook for dependent queries (queries that depend on other query results)
export const useDependentApiQuery = <TData = unknown, TError = any>(
  queryKey: QueryKey,
  queryFn: () => Promise<ApiResponse<TData>>,
  enabled: boolean,
  options?: Omit<
    UseQueryOptions<ApiResponse<TData>, TError>,
    "queryKey" | "queryFn" | "enabled"
  >
) => {
  return useApiQuery(queryKey, queryFn, {
    enabled,
    ...options,
  });
};

// Hook for real-time data with polling
export const usePollingApiQuery = <TData = unknown, TError = any>(
  queryKey: QueryKey,
  queryFn: () => Promise<ApiResponse<TData>>,
  pollingInterval: number = 30000, // 30 seconds default
  options?: Omit<
    UseQueryOptions<ApiResponse<TData>, TError>,
    "queryKey" | "queryFn" | "refetchInterval"
  >
) => {
  return useApiQuery(queryKey, queryFn, {
    refetchInterval: pollingInterval,
    refetchIntervalInBackground: true,
    ...options,
  });
};

// Utility hook for cache invalidation
export const useCacheInvalidation = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries(),
    invalidateByKey: (queryKey: QueryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    invalidateByPrefix: (prefix: string) =>
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === prefix,
      }),
    removeQuery: (queryKey: QueryKey) =>
      queryClient.removeQueries({ queryKey }),
    setQueryData: <T>(queryKey: QueryKey, data: T) =>
      queryClient.setQueryData(queryKey, data),
    getQueryData: <T>(queryKey: QueryKey): T | undefined =>
      queryClient.getQueryData(queryKey),
  };
};

// Hook for batch operations with enhanced error handling
export const useBatchMutation = <
  TData = unknown,
  TVariables = unknown,
  TError = any
>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: UseMutationOptions<ApiResponse<TData>, TError, TVariables>
) => {
  const queryClient = useQueryClient();
  const [batchQueue, setBatchQueue] = useState<TVariables[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchResults, setBatchResults] = useState<{
    results: ApiResponse<TData>[];
    errors: any[];
  }>({ results: [], errors: [] });

  const mutation = useMutation({
    mutationFn,
    ...options,
  });

  const addToBatch = useCallback((variables: TVariables) => {
    setBatchQueue((prev) => [...prev, variables]);
  }, []);

  const processBatch = useCallback(async () => {
    if (batchQueue.length === 0 || isProcessing) return batchResults;

    setIsProcessing(true);
    const results: ApiResponse<TData>[] = [];
    const errors: any[] = [];

    try {
      // Process items in parallel with concurrency limit
      const concurrencyLimit = 5;
      const chunks = [];
      for (let i = 0; i < batchQueue.length; i += concurrencyLimit) {
        chunks.push(batchQueue.slice(i, i + concurrencyLimit));
      }

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (variables) => {
          try {
            const result = await mutationFn(variables);
            results.push(result);
            return result;
          } catch (error) {
            errors.push(error);
            throw error;
          }
        });

        await Promise.allSettled(chunkPromises);
      }
    } catch (error) {
      // Silent error handling for batch processing
    } finally {
      setBatchQueue([]);
      setIsProcessing(false);
      setBatchResults({ results, errors });

      // Invalidate queries after batch processing
      queryClient.invalidateQueries();

      // Show summary toast
      if (results.length > 0) {
        toast.success(
          `Batch completed: ${results.length} successful operations`
        );
      }
      if (errors.length > 0) {
        toast.error(`Batch completed with ${errors.length} errors`);
      }
    }

    return { results, errors };
  }, [batchQueue, isProcessing, mutationFn, queryClient, batchResults]);

  const clearBatch = useCallback(() => {
    setBatchQueue([]);
    setBatchResults({ results: [], errors: [] });
  }, []);

  const removeBatchItem = useCallback((index: number) => {
    setBatchQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return {
    addToBatch,
    processBatch,
    clearBatch,
    removeBatchItem,
    batchQueue,
    isProcessing,
    batchSize: batchQueue.length,
    batchResults,
    hasResults:
      batchResults.results.length > 0 || batchResults.errors.length > 0,
  };
};

// Enhanced hook for real-time data synchronization
export const useRealtimeApiQuery = <TData = unknown, TError = any>(
  queryKey: QueryKey,
  queryFn: () => Promise<ApiResponse<TData>>,
  options?: {
    pollingInterval?: number;
    enableRealtime?: boolean;
    onDataChange?: (newData: TData, oldData: TData | undefined) => void;
    compareData?: (newData: TData, oldData: TData | undefined) => boolean;
  } & Omit<UseQueryOptions<ApiResponse<TData>, TError>, "queryKey" | "queryFn">
) => {
  const {
    pollingInterval = 30000,
    enableRealtime = true,
    onDataChange,
    compareData,
    ...queryOptions
  } = options || {};

  const previousDataRef = useRef<TData | undefined>(undefined);

  const query = useApiQuery(queryKey, queryFn, {
    refetchInterval: enableRealtime ? pollingInterval : false,
    refetchIntervalInBackground: enableRealtime,
    ...queryOptions,
  });

  // Handle data changes using useEffect instead of deprecated onSuccess
  useEffect(() => {
    if (query.data?.success && query.data?.data) {
      const newData = query.data.data;
      const oldData = previousDataRef.current;

      // Check if data has actually changed
      const hasChanged = compareData
        ? compareData(newData, oldData)
        : JSON.stringify(newData) !== JSON.stringify(oldData);

      if (hasChanged && onDataChange) {
        onDataChange(newData, oldData);
      }

      previousDataRef.current = newData;
    }
  }, [query.data, onDataChange, compareData]);

  const toggleRealtime = useCallback(() => {
    // This would require updating the query options, which isn't directly supported
    // In a real implementation, you might need to use a state variable and recreate the query
    console.warn(
      "toggleRealtime not implemented - consider using a state variable"
    );
  }, []);

  return {
    ...query,
    isRealtime: enableRealtime,
    toggleRealtime,
    pollingInterval,
  };
};

// Hook for synchronized mutations across multiple entities
export const useSynchronizedMutation = <
  TData = unknown,
  TVariables = unknown,
  TError = any
>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  synchronizationConfig: {
    relatedQueries: QueryKey[];
    optimisticUpdates?: {
      queryKey: QueryKey;
      updateFn: (oldData: any, variables: TVariables) => any;
    }[];
    onSuccessInvalidations?: QueryKey[];
    rollbackOnError?: boolean;
  },
  options?: UseMutationOptions<ApiResponse<TData>, TError, TVariables>
) => {
  const queryClient = useQueryClient();
  const rollbackDataRef = useRef<Map<string, any>>(new Map());

  return useMutation({
    mutationFn,
    onMutate: async (variables: TVariables) => {
      // Cancel outgoing refetches for related queries
      await Promise.all(
        synchronizationConfig.relatedQueries.map((queryKey) =>
          queryClient.cancelQueries({ queryKey })
        )
      );

      // Store rollback data
      rollbackDataRef.current.clear();
      synchronizationConfig.relatedQueries.forEach((queryKey) => {
        const data = queryClient.getQueryData(queryKey);
        rollbackDataRef.current.set(JSON.stringify(queryKey), data);
      });

      // Apply optimistic updates
      if (synchronizationConfig.optimisticUpdates) {
        synchronizationConfig.optimisticUpdates.forEach(
          ({ queryKey, updateFn }) => {
            const oldData = queryClient.getQueryData(queryKey);
            if (oldData) {
              queryClient.setQueryData(queryKey, updateFn(oldData, variables));
            }
          }
        );
      }

      // Call original onMutate if provided
      if (options?.onMutate) {
        return options.onMutate(variables);
      }

      return { rollbackData: rollbackDataRef.current };
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates if enabled
      if (
        synchronizationConfig.rollbackOnError &&
        rollbackDataRef.current.size > 0
      ) {
        rollbackDataRef.current.forEach((data, queryKeyStr) => {
          const queryKey = JSON.parse(queryKeyStr);
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Handle error
      const message =
        (error as any)?.response?.data?.error?.message ||
        (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        "An unexpected error occurred";

      if (options?.meta?.showErrorToast !== false) {
        toast.error(message);
      }

      if (options?.onError) {
        options.onError(error, variables, context);
      }
    },
    onSuccess: (data, variables, context) => {
      // Show success message if provided
      if (data.success && options?.meta?.successMessage) {
        toast.success(options.meta.successMessage as string);
      }

      // Invalidate success queries
      if (synchronizationConfig.onSuccessInvalidations) {
        synchronizationConfig.onSuccessInvalidations.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      } else {
        // Default: invalidate related queries
        synchronizationConfig.relatedQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onSettled: (data, error, variables, context) => {
      // Always refetch related queries to ensure consistency
      synchronizationConfig.relatedQueries.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });

      if (options?.onSettled) {
        options.onSettled(data, error, variables, context);
      }
    },
    ...options,
  });
};

// Hook for managing query dependencies and conditional fetching
export const useConditionalApiQuery = <TData = unknown, TError = any>(
  queryKey: QueryKey,
  queryFn: () => Promise<ApiResponse<TData>>,
  conditions: {
    enabled?: boolean;
    dependencies?: any[];
    skipOnError?: boolean;
    refetchOnDependencyChange?: boolean;
  },
  options?: Omit<
    UseQueryOptions<ApiResponse<TData>, TError>,
    "queryKey" | "queryFn" | "enabled"
  >
) => {
  const {
    enabled = true,
    dependencies = [],
    skipOnError = false,
    refetchOnDependencyChange = true,
  } = conditions;

  const previousDependenciesRef = useRef(dependencies);
  const [hasError, setHasError] = useState(false);

  // Check if dependencies have changed
  const dependenciesChanged =
    JSON.stringify(dependencies) !==
    JSON.stringify(previousDependenciesRef.current);

  useEffect(() => {
    if (dependenciesChanged && refetchOnDependencyChange) {
      previousDependenciesRef.current = dependencies;
      setHasError(false); // Reset error state on dependency change
    }
  }, [dependenciesChanged, refetchOnDependencyChange, dependencies]);

  // Determine if query should be enabled
  const shouldEnable =
    enabled &&
    dependencies.every((dep) => dep !== undefined && dep !== null) &&
    (!skipOnError || !hasError);

  return useApiQuery(queryKey, queryFn, ({
    enabled: shouldEnable,
    ...options,
  } as any));
};

// Hook for advanced cache management with selective invalidation
export const useAdvancedCacheManagement = () => {
  const queryClient = useQueryClient();

  const invalidateByPattern = useCallback(
    (pattern: string | RegExp) => {
      const queries = queryClient.getQueryCache().getAll();
      const matchingQueries = queries.filter((query) => {
        const queryKeyStr = JSON.stringify(query.queryKey);
        if (typeof pattern === "string") {
          return queryKeyStr.includes(pattern);
        }
        return pattern.test(queryKeyStr);
      });

      matchingQueries.forEach((query) => {
        queryClient.invalidateQueries({ queryKey: query.queryKey });
      });

      return matchingQueries.length;
    },
    [queryClient]
  );

  const prefetchRelatedData = useCallback(
    async (
      prefetchConfigs: Array<{
        queryKey: QueryKey;
        queryFn: () => Promise<any>;
        staleTime?: number;
      }>
    ) => {
      const prefetchPromises = prefetchConfigs.map(
        ({ queryKey, queryFn, staleTime = 5 * 60 * 1000 }) =>
          queryClient.prefetchQuery({
            queryKey,
            queryFn,
            staleTime,
          })
      );

      await Promise.allSettled(prefetchPromises);
    },
    [queryClient]
  );

  const optimizeCache = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    // Remove stale queries that haven't been accessed recently
    const staleThreshold = 30 * 60 * 1000; // 30 minutes
    const now = Date.now();

    let removedCount = 0;
    queries.forEach((query) => {
      const lastAccessed =
        query.state.dataUpdatedAt || query.state.dataUpdatedAt;
      if (
        now - lastAccessed > staleThreshold &&
        query.getObserversCount() === 0
      ) {
        queryClient.removeQueries({ queryKey: query.queryKey });
        removedCount++;
      }
    });

    return {
      totalQueries: queries.length,
      removedQueries: removedCount,
      activeQueries: queries.filter((q) => q.getObserversCount() > 0).length,
    };
  }, [queryClient]);

  const getCacheMetrics = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    return {
      totalQueries: queries.length,
      activeQueries: queries.filter((q) => q.getObserversCount() > 0).length,
      staleQueries: queries.filter((q) => q.isStale()).length,
      errorQueries: queries.filter((q) => q.state.status === "error").length,
      loadingQueries: queries.filter((q) => q.state.status === "pending")
        .length,
      cacheSize: JSON.stringify(queries.map((q) => q.state.data)).length,
    };
  }, [queryClient]);

  return {
    invalidateByPattern,
    prefetchRelatedData,
    optimizeCache,
    getCacheMetrics,
    ...cacheUtils,
  };
};
