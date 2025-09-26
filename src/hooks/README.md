# Enhanced React Query Hooks

This document describes the standardized React Query hooks that provide consistent error handling, optimistic updates, and proper cache invalidation across the application.

## Overview

The enhanced hooks build upon React Query's foundation to provide:

- **Consistent Error Handling**: Standardized error messages and toast notifications
- **Optimistic Updates**: Immediate UI updates with automatic rollback on failure
- **Smart Cache Invalidation**: Automatic and selective cache management
- **Real-time Data Synchronization**: Polling and WebSocket integration
- **Batch Operations**: Efficient handling of multiple API calls
- **Advanced Cache Management**: Performance optimization and debugging tools

## Core Hooks

### `useApiQuery`

Enhanced version of `useQuery` with consistent error handling and retry logic.

```typescript
const { data, isLoading, error } = useApiQuery(queryKey, queryFn, options);
```

**Features:**

- Automatic error toast notifications (configurable)
- Smart retry logic (no retry on 4xx errors except 429)
- Exponential backoff for retries
- Standardized response format handling

**Example:**

```typescript
const { data, isLoading, error } = useApiQuery(
  ["inventory", "national"],
  () => nationalInventoryApi.getNationalInventory(),
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error) => {
      // Custom error handling
      console.error("Inventory fetch failed:", error);
    },
  }
);
```

### `useApiMutation`

Enhanced version of `useMutation` with optimistic updates and cache invalidation.

```typescript
const mutation = useApiMutation(mutationFn, options);
```

**Features:**

- Automatic success/error toast notifications
- Smart cache invalidation
- Custom invalidation patterns
- Error handling with context

**Example:**

```typescript
const createItemMutation = useApiMutation(itemsApi.createItem, {
  meta: {
    successMessage: "Item created successfully!",
    invalidateQueries: [["items"], ["inventory", "national"]],
  },
  onSuccess: (data) => {
    // Custom success handling
    router.push(`/items/${data.data.id}`);
  },
});
```

### `usePaginatedApiQuery`

Specialized hook for paginated data with consistent handling.

```typescript
const { data, isLoading, error } = usePaginatedApiQuery(
  queryKey,
  queryFn,
  page,
  limit,
  filters,
  options
);
```

**Features:**

- Automatic pagination parameter handling
- Previous data preservation during page changes
- Filter integration
- Consistent query key generation

**Example:**

```typescript
const { data, isLoading } = usePaginatedApiQuery(
  ["items", "list"],
  (page, limit, filters) => itemsApi.getItems(page, limit, filters),
  currentPage,
  20,
  { category: "books", search: searchTerm }
);
```

### `useOptimisticMutation`

Mutation hook with optimistic updates and automatic rollback.

```typescript
const mutation = useOptimisticMutation(
  mutationFn,
  queryKey,
  optimisticUpdateFn,
  options
);
```

**Features:**

- Immediate UI updates
- Automatic rollback on error
- Context preservation for rollback
- Success confirmation

**Example:**

```typescript
const updateItemMutation = useOptimisticMutation(
  itemsApi.updateItem,
  ["items", itemId],
  (oldData, variables) => ({
    ...oldData,
    data: { ...oldData.data, ...variables },
  }),
  {
    meta: {
      successMessage: "Item updated!",
    },
  }
);
```

## Advanced Hooks

### `useBatchMutation`

Handle multiple operations efficiently with batch processing.

```typescript
const {
  addToBatch,
  processBatch,
  clearBatch,
  batchQueue,
  isProcessing,
  batchResults,
} = useBatchMutation(mutationFn, options);
```

**Features:**

- Queue management
- Parallel processing with concurrency limits
- Batch result tracking
- Error aggregation

**Example:**

```typescript
const batchUpdate = useBatchMutation(itemsApi.updateItem);

// Add operations to batch
batchUpdate.addToBatch({ id: 1, name: "Updated Item 1" });
batchUpdate.addToBatch({ id: 2, name: "Updated Item 2" });

// Process all at once
await batchUpdate.processBatch();
```

### `useRealtimeApiQuery`

Query hook with real-time updates and change detection.

```typescript
const { data, isRealtime, pollingInterval, toggleRealtime } =
  useRealtimeApiQuery(queryKey, queryFn, {
    pollingInterval: 30000,
    enableRealtime: true,
    onDataChange: (newData, oldData) => {
      // Handle data changes
    },
    compareData: (newData, oldData) => {
      // Custom comparison logic
      return JSON.stringify(newData) !== JSON.stringify(oldData);
    },
  });
```

**Features:**

- Configurable polling intervals
- Data change detection
- Custom comparison functions
- Real-time toggle capability

### `useSynchronizedMutation`

Mutation hook with synchronized cache updates across multiple entities.

```typescript
const mutation = useSynchronizedMutation(
  mutationFn,
  {
    relatedQueries: [["inventory"], ["dashboard"]],
    optimisticUpdates: [
      {
        queryKey: ["inventory"],
        updateFn: (oldData, variables) => {
          // Optimistic update logic
        },
      },
    ],
    onSuccessInvalidations: [["inventory"], ["dashboard"]],
    rollbackOnError: true,
  },
  options
);
```

**Features:**

- Multi-query synchronization
- Coordinated optimistic updates
- Selective invalidation
- Error rollback across queries

### `useConditionalApiQuery`

Query hook with dependency-based conditional execution.

```typescript
const { data, isLoading } = useConditionalApiQuery(
  queryKey,
  queryFn,
  {
    enabled: true,
    dependencies: [userId, projectId],
    skipOnError: false,
    refetchOnDependencyChange: true,
  },
  options
);
```

**Features:**

- Dependency tracking
- Automatic enable/disable logic
- Error state management
- Dependency change detection

### `useAdvancedCacheManagement`

Utility hook for advanced cache operations and optimization.

```typescript
const {
  invalidateByPattern,
  prefetchRelatedData,
  optimizeCache,
  getCacheMetrics,
} = useAdvancedCacheManagement();
```

**Features:**

- Pattern-based invalidation
- Related data prefetching
- Cache optimization
- Performance metrics

**Example:**

```typescript
// Invalidate all inventory-related queries
const invalidatedCount = invalidateByPattern("inventory");

// Prefetch related data
await prefetchRelatedData([
  {
    queryKey: ["items"],
    queryFn: () => itemsApi.getItems(),
  },
  {
    queryKey: ["warehouses"],
    queryFn: () => warehousesApi.getWarehouses(),
  },
]);

// Get cache statistics
const metrics = getCacheMetrics();
console.log(`Cache contains ${metrics.totalQueries} queries`);
```

## Best Practices

### 1. Query Key Management

Use the centralized query keys factory:

```typescript
import { queryKeys } from "@/lib/query-client";

// Good
const { data } = useApiQuery(queryKeys.items.detail(itemId), () =>
  itemsApi.getItem(itemId)
);

// Avoid
const { data } = useApiQuery(["items", "detail", itemId], () =>
  itemsApi.getItem(itemId)
);
```

### 2. Error Handling

Let the hooks handle standard errors, customize only when needed:

```typescript
// Standard error handling (automatic toast)
const mutation = useApiMutation(api.createItem);

// Custom error handling
const mutation = useApiMutation(api.createItem, {
  meta: { showErrorToast: false },
  onError: (error) => {
    // Custom error handling
    showCustomErrorDialog(error);
  },
});
```

### 3. Cache Invalidation

Use specific invalidation patterns:

```typescript
// Good - specific invalidation
const mutation = useApiMutation(api.updateItem, {
  meta: {
    invalidateQueries: [
      queryKeys.items.detail(itemId),
      queryKeys.items.lists(),
    ],
  },
});

// Avoid - invalidating everything
const mutation = useApiMutation(api.updateItem, {
  onSuccess: () => {
    queryClient.invalidateQueries();
  },
});
```

### 4. Optimistic Updates

Use optimistic updates for better UX:

```typescript
const mutation = useOptimisticMutation(
  api.toggleItemStatus,
  queryKeys.items.detail(itemId),
  (oldData, variables) => ({
    ...oldData,
    data: {
      ...oldData.data,
      isActive: variables.isActive,
    },
  })
);
```

### 5. Real-time Data

Use real-time queries for frequently changing data:

```typescript
const { data } = useRealtimeApiQuery(
  queryKeys.dashboard.kpi(),
  () => dashboardApi.getKPIData(),
  {
    pollingInterval: 30000, // 30 seconds
    onDataChange: (newData, oldData) => {
      // Show notification for significant changes
      if (newData.criticalAlerts > oldData?.criticalAlerts) {
        showAlert("New critical alert!");
      }
    },
  }
);
```

## Testing

The hooks are designed to be easily testable:

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useApiQuery } from "@/hooks/useApi";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

test("should handle successful query", async () => {
  const mockFn = jest.fn().mockResolvedValue({ success: true, data: "test" });

  const { result } = renderHook(() => useApiQuery(["test"], mockFn), {
    wrapper: createWrapper(),
  });

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });

  expect(result.current.data).toEqual({ success: true, data: "test" });
});
```

## Migration Guide

### From Standard React Query

1. Replace `useQuery` with `useApiQuery`
2. Replace `useMutation` with `useApiMutation`
3. Add proper query keys using the factory
4. Configure success/error messages via `meta`
5. Use specific cache invalidation patterns

### Example Migration

**Before:**

```typescript
const { data, isLoading } = useQuery(
  ["items", page],
  () => api.getItems(page),
  {
    onError: (error) => {
      toast.error(error.message);
    },
  }
);

const mutation = useMutation(api.createItem, {
  onSuccess: () => {
    toast.success("Item created!");
    queryClient.invalidateQueries(["items"]);
  },
  onError: (error) => {
    toast.error(error.message);
  },
});
```

**After:**

```typescript
const { data, isLoading } = usePaginatedApiQuery(
  queryKeys.items.lists(),
  (page, limit) => api.getItems(page, limit),
  page,
  10
);

const mutation = useApiMutation(api.createItem, {
  meta: {
    successMessage: "Item created!",
    invalidateQueries: [queryKeys.items.all],
  },
});
```

## Performance Considerations

1. **Stale Time**: Set appropriate stale times to reduce unnecessary requests
2. **Cache Time**: Configure cache times based on data volatility
3. **Selective Invalidation**: Use specific query key patterns
4. **Batch Operations**: Use batch mutations for multiple operations
5. **Cache Optimization**: Regularly clean up stale cache entries

## Troubleshooting

### Common Issues

1. **Infinite Refetches**: Check query key stability
2. **Cache Not Updating**: Verify invalidation patterns
3. **Optimistic Updates Not Working**: Check update function logic
4. **Performance Issues**: Use cache metrics to identify problems

### Debug Tools

```typescript
// Get cache metrics
const cacheManager = useAdvancedCacheManagement();
const metrics = cacheManager.getCacheMetrics();
console.log("Cache metrics:", metrics);

// Enable React Query DevTools in development
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// In your app
{
  process.env.NODE_ENV === "development" && (
    <ReactQueryDevtools initialIsOpen={false} />
  );
}
```
