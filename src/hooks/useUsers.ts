import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-client";
import { toast } from "sonner";
import { User } from "@/types";

// User list hook
export function useUsers(page: number = 1, limit: number = 50, filters: any = {}) {
  return useQuery({
    queryKey: queryKeys.users.list({ page, limit, ...filters }),
    queryFn: () => usersApi.getUsers(page, limit, filters),
  });
}

// Single user hook
export function useUser(id: number) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => usersApi.getUserById(id),
    enabled: !!id,
  });
}

// Current user profile hook
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.users.profile(),
    queryFn: () => usersApi.getCurrentUser(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Create user mutation
export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: Partial<User> & { password: string }) => 
      usersApi.createUser(userData),
    onSuccess: () => {
      // Invalidate all user-related queries to refresh the list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success("User created successfully");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 
                     error?.response?.data?.message || 
                     "Failed to create user";
      toast.error(message);
    },
  });
}

// Update user mutation
export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (variables: { id: number; userData: Partial<User> }) =>
      usersApi.updateUser(variables.id, variables.userData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.id) });
      toast.success("User updated successfully");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 
                     error?.response?.data?.message || 
                     "Failed to update user";
      toast.error(message);
    },
  });
}

// Activate user mutation
export function useActivateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => usersApi.activateUser(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
      toast.success("User activated successfully");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 
                     error?.response?.data?.message || 
                     "Failed to activate user";
      toast.error(message);
    },
  });
}

// Deactivate user mutation
export function useDeactivateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => usersApi.deactivateUser(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
      toast.success("User deactivated successfully");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 
                     error?.response?.data?.message || 
                     "Failed to deactivate user";
      toast.error(message);
    },
  });
}

// Hard delete user (Super Admin only)
export function useHardDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => usersApi.hardDeleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success("User deleted permanently");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to delete user";
      toast.error(message);
    },
  });
}

// Update current user profile mutation
export function useUpdateCurrentUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: Partial<User>) => usersApi.updateCurrentUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile() });
      toast.success("Profile updated successfully");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 
                     error?.response?.data?.message || 
                     "Failed to update profile";
      toast.error(message);
    },
  });
}

// Change password mutation
export function useChangePassword() {
  return useMutation({
    mutationFn: (passwordData: { currentPassword: string; newPassword: string }) =>
      usersApi.changePassword(passwordData),
    onSuccess: () => {
      toast.success("Password changed successfully");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 
                     error?.response?.data?.message || 
                     "Failed to change password";
      toast.error(message);
    },
  });
}
