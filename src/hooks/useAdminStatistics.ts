import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-client";

// Get all system statistics at once (most efficient for admin dashboard)
export function useSystemStatistics() {
  return useQuery({
    queryKey: queryKeys.admin.systemStatistics(),
    queryFn: () => adminApi.getSystemStatistics(),
    staleTime: 5 * 60 * 1000, // 5 minutes - statistics don't change frequently
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Individual statistics hooks for specific use cases
export function useUserStatistics() {
  return useQuery({
    queryKey: queryKeys.admin.userStatistics(),
    queryFn: () => adminApi.getUserStatistics(),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
}

export function useSchoolStatistics() {
  return useQuery({
    queryKey: queryKeys.admin.schoolStatistics(),
    queryFn: () => adminApi.getSchoolStatistics(),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
}

export function useLocalCouncilStatistics() {
  return useQuery({
    queryKey: queryKeys.admin.localCouncilStatistics(),
    queryFn: () => adminApi.getLocalCouncilStatistics(),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
}

export function useItemStatistics() {
  return useQuery({
    queryKey: queryKeys.admin.itemStatistics(),
    queryFn: () => adminApi.getItemStatistics(),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
}