import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useApiQuery,
  useApiMutation,
  usePaginatedApiQuery,
  useOptimisticMutation,
  useCacheInvalidation,
  useBatchMutation,
  useRealtimeApiQuery,
  useSynchronizedMutation,
  useConditionalApiQuery,
  useAdvancedCacheManagement,
} from "../useApi";
import { ApiResponse } from "@/types";

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock API response
const mockApiResponse: ApiResponse<any> = {
  success: true,
  data: { id: 1, name: "Test Item" },
  meta: {
    requestId: "test-request-id",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  },
};

const mockErrorResponse = {
  response: {
    status: 500,
    data: {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    },
  },
};

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

describe("useApiQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle successful API query", async () => {
    const mockQueryFn = jest.fn().mockResolvedValue(mockApiResponse);

    const { result } = renderHook(() => useApiQuery(["test"], mockQueryFn), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockApiResponse);
    expect(mockQueryFn).toHaveBeenCalledTimes(1);
  });

  it("should handle API query errors", async () => {
    const mockQueryFn = jest.fn().mockRejectedValue(mockErrorResponse);

    const { result } = renderHook(() => useApiQuery(["test"], mockQueryFn), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith("Internal server error");
  });

  it("should not show toast for silent errors", async () => {
    const silentError = {
      response: {
        status: 401,
        data: {
          error: {
            message: "Unauthorized",
          },
        },
      },
    };

    const mockQueryFn = jest.fn().mockRejectedValue(silentError);

    const { result } = renderHook(() => useApiQuery(["test"], mockQueryFn), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).not.toHaveBeenCalled();
  });

  it("should retry on 5xx errors", async () => {
    const mockQueryFn = jest
      .fn()
      .mockRejectedValueOnce(mockErrorResponse)
      .mockResolvedValue(mockApiResponse);

    const { result } = renderHook(
      () => useApiQuery(["test"], mockQueryFn, { retry: 1 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockQueryFn).toHaveBeenCalledTimes(2);
  });
});

describe("useApiMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle successful mutation", async () => {
    const mockMutationFn = jest.fn().mockResolvedValue(mockApiResponse);

    const { result } = renderHook(
      () =>
        useApiMutation(mockMutationFn, {
          meta: { successMessage: "Success!" },
        }),
      { wrapper: createWrapper() }
    );

    result.current.mutate({ test: "data" });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(toast.success).toHaveBeenCalledWith("Success!");
    expect(mockMutationFn).toHaveBeenCalledWith({ test: "data" });
  });

  it("should handle mutation errors", async () => {
    const mockMutationFn = jest.fn().mockRejectedValue(mockErrorResponse);

    const { result } = renderHook(() => useApiMutation(mockMutationFn), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ test: "data" });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith("Internal server error");
  });

  it("should not show error toast when disabled", async () => {
    const mockMutationFn = jest.fn().mockRejectedValue(mockErrorResponse);

    const { result } = renderHook(
      () =>
        useApiMutation(mockMutationFn, {
          meta: { showErrorToast: false },
        }),
      { wrapper: createWrapper() }
    );

    result.current.mutate({ test: "data" });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).not.toHaveBeenCalled();
  });

  it("should invalidate specific queries", async () => {
    const mockMutationFn = jest.fn().mockResolvedValue(mockApiResponse);
    const queryClient = new QueryClient();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useApiMutation(mockMutationFn, {
          meta: { invalidateQueries: [["test"], ["other"]] },
        }),
      { wrapper }
    );

    result.current.mutate({ test: "data" });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(2);
  });
});

describe("usePaginatedApiQuery", () => {
  it("should handle paginated queries", async () => {
    const mockPaginatedResponse: ApiResponse<any> = {
      success: true,
      data: {
        items: [{ id: 1, name: "Item 1" }],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      },
    };

    const mockQueryFn = jest.fn().mockResolvedValue(mockPaginatedResponse);

    const { result } = renderHook(
      () =>
        usePaginatedApiQuery(["test"], mockQueryFn, 1, 10, { filter: "test" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockQueryFn).toHaveBeenCalledWith(1, 10, { filter: "test" });
    expect(result.current.data).toEqual(mockPaginatedResponse);
  });
});

describe("useOptimisticMutation", () => {
  it("should perform optimistic updates", async () => {
    const mockMutationFn = jest.fn().mockResolvedValue(mockApiResponse);
    const mockOptimisticUpdate = jest.fn((oldData, variables) => ({
      ...oldData,
      ...variables,
    }));

    const queryClient = new QueryClient();
    queryClient.setQueryData(["test"], { id: 1, name: "Old Name" });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useOptimisticMutation(mockMutationFn, ["test"], mockOptimisticUpdate),
      { wrapper }
    );

    result.current.mutate({ name: "New Name" });

    // Check that optimistic update was applied
    expect(mockOptimisticUpdate).toHaveBeenCalledWith(
      { id: 1, name: "Old Name" },
      { name: "New Name" }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("should rollback on error", async () => {
    const mockMutationFn = jest.fn().mockRejectedValue(mockErrorResponse);
    const mockOptimisticUpdate = jest.fn((oldData, variables) => ({
      ...oldData,
      ...variables,
    }));

    const queryClient = new QueryClient();
    const originalData = { id: 1, name: "Old Name" };
    queryClient.setQueryData(["test"], originalData);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useOptimisticMutation(mockMutationFn, ["test"], mockOptimisticUpdate),
      { wrapper }
    );

    result.current.mutate({ name: "New Name" });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Check that data was rolled back
    expect(queryClient.getQueryData(["test"])).toEqual(originalData);
  });
});

describe("useCacheInvalidation", () => {
  it("should provide cache invalidation utilities", () => {
    const queryClient = new QueryClient();
    const invalidateAllSpy = jest.spyOn(queryClient, "invalidateQueries");
    const removeQueriesSpy = jest.spyOn(queryClient, "removeQueries");
    const setQueryDataSpy = jest.spyOn(queryClient, "setQueryData");
    const getQueryDataSpy = jest.spyOn(queryClient, "getQueryData");

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCacheInvalidation(), { wrapper });

    // Test invalidateAll
    result.current.invalidateAll();
    expect(invalidateAllSpy).toHaveBeenCalled();

    // Test invalidateByKey
    result.current.invalidateByKey(["test"]);
    expect(invalidateAllSpy).toHaveBeenCalledWith({ queryKey: ["test"] });

    // Test removeQuery
    result.current.removeQuery(["test"]);
    expect(removeQueriesSpy).toHaveBeenCalledWith({ queryKey: ["test"] });

    // Test setQueryData
    result.current.setQueryData(["test"], { data: "test" });
    expect(setQueryDataSpy).toHaveBeenCalledWith(["test"], { data: "test" });

    // Test getQueryData
    result.current.getQueryData(["test"]);
    expect(getQueryDataSpy).toHaveBeenCalledWith(["test"]);
  });
});

describe("useBatchMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should handle batch operations", async () => {
    const mockMutationFn = jest.fn().mockResolvedValue(mockApiResponse);

    const { result } = renderHook(() => useBatchMutation(mockMutationFn), {
      wrapper: createWrapper(),
    });

    // Add items to batch
    act(() => {
      result.current.addToBatch({ id: 1 });
      result.current.addToBatch({ id: 2 });
    });

    expect(result.current.batchSize).toBe(2);

    // Process batch
    await act(async () => {
      await result.current.processBatch();
    });

    expect(mockMutationFn).toHaveBeenCalledTimes(2);
    expect(result.current.batchSize).toBe(0);
    expect(toast.success).toHaveBeenCalledWith(
      "Batch completed: 2 successful operations"
    );
  });

  it("should handle batch errors", async () => {
    const mockMutationFn = jest
      .fn()
      .mockResolvedValueOnce(mockApiResponse)
      .mockRejectedValueOnce(mockErrorResponse);

    const { result } = renderHook(() => useBatchMutation(mockMutationFn), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.addToBatch({ id: 1 });
      result.current.addToBatch({ id: 2 });
    });

    await act(async () => {
      await result.current.processBatch();
    });

    expect(result.current.batchResults.results).toHaveLength(1);
    expect(result.current.batchResults.errors).toHaveLength(1);
    expect(toast.error).toHaveBeenCalledWith("Batch completed with 1 errors");
  });

  it("should clear batch", () => {
    const mockMutationFn = jest.fn();

    const { result } = renderHook(() => useBatchMutation(mockMutationFn), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.addToBatch({ id: 1 });
      result.current.clearBatch();
    });

    expect(result.current.batchSize).toBe(0);
  });
});

describe("useRealtimeApiQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should handle real-time data updates", async () => {
    const mockQueryFn = jest.fn().mockResolvedValue(mockApiResponse);
    const mockOnDataChange = jest.fn();

    const { result } = renderHook(
      () =>
        useRealtimeApiQuery(["test"], mockQueryFn, {
          pollingInterval: 1000,
          onDataChange: mockOnDataChange,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Simulate data change
    const newResponse = {
      ...mockApiResponse,
      data: { id: 1, name: "Updated Item" },
    };
    mockQueryFn.mockResolvedValue(newResponse);

    // Fast-forward time to trigger refetch
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockOnDataChange).toHaveBeenCalled();
    });
  });
});

describe("useSynchronizedMutation", () => {
  it("should handle synchronized mutations with optimistic updates", async () => {
    const mockMutationFn = jest.fn().mockResolvedValue(mockApiResponse);
    const mockUpdateFn = jest.fn((oldData, variables) => ({
      ...oldData,
      ...variables,
    }));

    const queryClient = new QueryClient();
    queryClient.setQueryData(["test"], { id: 1, name: "Old Name" });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useSynchronizedMutation(mockMutationFn, {
          relatedQueries: [["test"]],
          optimisticUpdates: [
            {
              queryKey: ["test"],
              updateFn: mockUpdateFn,
            },
          ],
        }),
      { wrapper }
    );

    result.current.mutate({ name: "New Name" });

    // Check optimistic update was applied
    expect(mockUpdateFn).toHaveBeenCalledWith(
      { id: 1, name: "Old Name" },
      { name: "New Name" }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

describe("useConditionalApiQuery", () => {
  it("should conditionally enable queries based on dependencies", async () => {
    const mockQueryFn = jest.fn().mockResolvedValue(mockApiResponse);

    const { result, rerender } = renderHook(
      ({ userId }: { userId?: number }) =>
        useConditionalApiQuery(["user", userId], mockQueryFn, {
          dependencies: [userId],
        }),
      {
        wrapper: createWrapper(),
        initialProps: { userId: undefined },
      }
    );

    // Query should not be enabled when dependency is undefined
    expect(result.current.isLoading).toBe(false);
    expect(mockQueryFn).not.toHaveBeenCalled();

    // Enable query by providing dependency
    rerender({ userId: 1 });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockQueryFn).toHaveBeenCalled();
  });
});

describe("useAdvancedCacheManagement", () => {
  it("should provide advanced cache management utilities", () => {
    const queryClient = new QueryClient();

    // Set up some test data
    queryClient.setQueryData(["users", "list"], { data: "users" });
    queryClient.setQueryData(["items", "list"], { data: "items" });
    queryClient.setQueryData(["other", "data"], { data: "other" });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useAdvancedCacheManagement(), {
      wrapper,
    });

    // Test invalidateByPattern
    const invalidatedCount = result.current.invalidateByPattern("list");
    expect(invalidatedCount).toBe(2); // Should match "users,list" and "items,list"

    // Test getCacheMetrics
    const metrics = result.current.getCacheMetrics();
    expect(metrics.totalQueries).toBe(3);
    expect(typeof metrics.cacheSize).toBe("number");
  });
});
