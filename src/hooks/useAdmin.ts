import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminApi,
  itemsApi,
  schoolsApi,
  localCouncilsApi,
  warehousesApi,
  schoolImportApi,
} from "@/lib/api";
import { queryKeys } from "@/lib/query-client";
import { toast } from "sonner";
import { Item, School, LocalCouncil, Warehouse } from "@/types";

// Items hooks
export function useItems(
  page: number = 1,
  limit: number = 50,
  filters: any = {}
) {
  return useQuery({
    queryKey: queryKeys.items.list({ page, limit, ...filters }),
    queryFn: () => itemsApi.getItems(page, limit, filters),
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemData: Partial<Item>) => adminApi.createItem(itemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
      toast.success("Item created successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to create item";
      toast.error(message);
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: number; itemData: Partial<Item> }) =>
      adminApi.updateItem(variables.id, variables.itemData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.items.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      toast.success("Item updated successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to update item";
      toast.error(message);
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminApi.deleteItem(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.items.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      toast.success("Item deactivated successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to deactivate item";
      toast.error(message);
    },
  });
}

export function useHardDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminApi.hardDeleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
      toast.success("Item deleted permanently");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to delete item";
      toast.error(message);
    },
  });
}

export function useActivateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminApi.activateItem(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.items.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      toast.success("Item activated successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to activate item";
      toast.error(message);
    },
  });
}

export function useItemStats(id: number) {
  return useQuery({
    queryKey: queryKeys.items.stats(id),
    queryFn: () => adminApi.getItemStats(id),
    enabled: !!id,
  });
}

export function useBulkUpdateItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Array<{ id: number; data: any }>) =>
      adminApi.bulkUpdateItems(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      toast.success("Items updated successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to bulk update items";
      toast.error(message);
    },
  });
}

// Schools hooks
export function useSchools(
  page: number = 1,
  limit: number = 50,
  filters: any = {}
) {
  return useQuery({
    queryKey: queryKeys.schools.list({ page, limit, ...filters }),
    queryFn: () => schoolsApi.getSchools(page, limit, filters),
  });
}

export function useSchoolsByCouncil(councilId: number) {
  return useQuery({
    queryKey: queryKeys.schools.byCouncil(councilId),
    queryFn: () => schoolsApi.getSchoolsByCouncil(councilId),
    enabled: !!councilId,
  });
}

export function useCreateSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (schoolData: Partial<School>) =>
      adminApi.createSchool(schoolData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
      toast.success("School created successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to create school";
      toast.error(message);
    },
  });
}

export function useUpdateSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: number; schoolData: Partial<School> }) =>
      adminApi.updateSchool(variables.id, variables.schoolData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.schools.detail(variables.id),
      });
      toast.success("School updated successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to update school";
      toast.error(message);
    },
  });
}

export function useDeleteSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminApi.deleteSchool(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
      queryClient.removeQueries({ queryKey: queryKeys.schools.detail(id) });
      toast.success("School deactivated successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to deactivate school";
      toast.error(message);
    },
  });
}

export function useActivateSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminApi.activateSchool(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.detail(id) });
      toast.success("School activated successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to activate school";
      toast.error(message);
    },
  });
}

export function useSchoolStats(id: number) {
  return useQuery({
    queryKey: queryKeys.schools.stats(id),
    queryFn: () => adminApi.getSchoolStats(id),
    enabled: !!id,
  });
}

export function useSchoolsWithDistributionSummary(councilId?: number) {
  return useQuery({
    queryKey: queryKeys.schools.distributionSummary(councilId),
    queryFn: () => adminApi.getSchoolsWithDistributionSummary(councilId),
  });
}

export function useBulkUpdateSchoolCouncilAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      schoolIds,
      newCouncilId,
    }: {
      schoolIds: number[];
      newCouncilId: number;
    }) => adminApi.bulkUpdateSchoolCouncilAssignment(schoolIds, newCouncilId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
      toast.success("School council assignments updated successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to update school council assignments";
      toast.error(message);
    },
  });
}

// Local Councils hooks
export function useLocalCouncils(
  page: number = 1,
  limit: number = 50,
  filters: any = {}
) {
  return useQuery({
    queryKey: queryKeys.localCouncils.list({ page, limit, ...filters }),
    queryFn: () => localCouncilsApi.getLocalCouncils(page, limit, filters),
  });
}

export function useCreateLocalCouncil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (councilData: Partial<LocalCouncil>) =>
      adminApi.createLocalCouncil(councilData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.localCouncils.all });
      toast.success("Local council created successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to create local council";
      toast.error(message);
    },
  });
}

export function useUpdateLocalCouncil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      id: number;
      councilData: Partial<LocalCouncil>;
    }) => adminApi.updateLocalCouncil(variables.id, variables.councilData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.localCouncils.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.localCouncils.detail(variables.id),
      });
      toast.success("Local council updated successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to update local council";
      toast.error(message);
    },
  });
}

export function useDeleteLocalCouncil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminApi.deleteLocalCouncil(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.localCouncils.all });
      queryClient.removeQueries({
        queryKey: queryKeys.localCouncils.detail(id),
      });
      toast.success("Local council deactivated successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to deactivate local council";
      toast.error(message);
    },
  });
}

export function useHardDeleteLocalCouncil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminApi.hardDeleteLocalCouncil(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.localCouncils.all });
      toast.success("Local council deleted permanently");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to delete local council";
      toast.error(message);
    },
  });
}

export function useActivateLocalCouncil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminApi.activateLocalCouncil(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.localCouncils.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.localCouncils.detail(id),
      });
      toast.success("Local council activated successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to activate local council";
      toast.error(message);
    },
  });
}

export function useLocalCouncilStats(id: number) {
  return useQuery({
    queryKey: queryKeys.localCouncils.stats(id),
    queryFn: () => adminApi.getLocalCouncilStats(id),
    enabled: !!id,
  });
}

export function useDistrictsByRegion(region: string) {
  return useQuery({
    queryKey: queryKeys.localCouncils.districtsByRegion(region),
    queryFn: () => adminApi.getDistrictsByRegion(region),
    enabled: !!region,
  });
}

// Warehouses hooks
export function useWarehouses(
  page: number = 1,
  limit: number = 50,
  filters: any = {}
) {
  return useQuery({
    queryKey: queryKeys.warehouses.list({ page, limit, ...filters }),
    queryFn: () => warehousesApi.getWarehouses(page, limit, filters),
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (warehouseData: Partial<Warehouse>) =>
      adminApi.createWarehouse(warehouseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.all });
      toast.success("Warehouse created successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to create warehouse";
      toast.error(message);
    },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      id: number;
      warehouseData: Partial<Warehouse>;
    }) => adminApi.updateWarehouse(variables.id, variables.warehouseData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.warehouses.detail(variables.id),
      });
      toast.success("Warehouse updated successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to update warehouse";
      toast.error(message);
    },
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminApi.deleteWarehouse(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.all });
      queryClient.removeQueries({ queryKey: queryKeys.warehouses.detail(id) });
      toast.success("Warehouse deactivated successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to deactivate warehouse";
      toast.error(message);
    },
  });
}

export function useHardDeleteWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminApi.hardDeleteWarehouse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.all });
      toast.success("Warehouse deleted permanently");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to delete warehouse";
      toast.error(message);
    },
  });
}

export function useActivateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminApi.activateWarehouse(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.warehouses.detail(id),
      });
      toast.success("Warehouse activated successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to activate warehouse";
      toast.error(message);
    },
  });
}

export function useWarehouseStats(id: number) {
  return useQuery({
    queryKey: queryKeys.warehouses.stats(id),
    queryFn: () => adminApi.getWarehouseStats(id),
    enabled: !!id,
  });
}

export function useWarehousesWithInventory() {
  return useQuery({
    queryKey: queryKeys.warehouses.inventorySummary(),
    queryFn: () => adminApi.getWarehousesWithInventory(),
  });
}

// School Import Hooks
export function useSchoolImportUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      file: File;
      options?: { dryRun?: boolean; authoritative?: boolean };
    }) => schoolImportApi.uploadImport(variables.file, variables.options || {}),
    onSuccess: () => {
      toast.success("School import file uploaded successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to upload school import file";
      toast.error(message);
    },
  });
}

export function useImportStatus(importRunId: number | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ["schoolImport", "status", importRunId],
    queryFn: () => schoolImportApi.getImportStatus(importRunId!),
    enabled: !!importRunId && enabled,
    refetchInterval: (data) => {
      // Only auto-refresh if the import is still processing
      const status = data?.data?.importRun?.status;
      return status === "PROCESSING" || status === "UPLOADED" ? 2000 : false;
    },
  });
}

export function useImportRows(
  importRunId: number | null,
  page: number = 1,
  pageSize: number = 50,
  filters: any = {}
) {
  return useQuery({
    queryKey: ["schoolImport", "rows", importRunId, page, pageSize, filters],
    queryFn: () => schoolImportApi.getImportRows(importRunId!, page, pageSize, filters),
    enabled: !!importRunId,
  });
}

export function useResolveCouncil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      importRunId: number;
      resolveData: {
        stagingRowIds: number[];
        councilId: number;
        createAlias?: boolean;
        aliasName?: string;
      };
    }) => schoolImportApi.resolveCouncil(variables.importRunId, variables.resolveData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["schoolImport", "rows", variables.importRunId],
      });
      queryClient.invalidateQueries({
        queryKey: ["schoolImport", "status", variables.importRunId],
      });
      toast.success("Council mapping resolved successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to resolve council mapping";
      toast.error(message);
    },
  });
}

export function useCommitImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      importRunId: number;
      commitData?: { confirmOverwrites?: boolean };
    }) => schoolImportApi.commitImport(variables.importRunId, variables.commitData || {}),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["schoolImport", "status", variables.importRunId],
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
      toast.success("School import committed successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to commit school import";
      toast.error(message);
    },
  });
}

export function useCancelImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (importRunId: number) => schoolImportApi.cancelImport(importRunId),
    onSuccess: (data, importRunId) => {
      queryClient.invalidateQueries({
        queryKey: ["schoolImport", "status", importRunId],
      });
      toast.success("School import cancelled successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to cancel school import";
      toast.error(message);
    },
  });
}

export function useRollbackImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (importRunId: number) => schoolImportApi.rollbackImport(importRunId),
    onSuccess: (data, importRunId) => {
      queryClient.invalidateQueries({
        queryKey: ["schoolImport", "status", importRunId],
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
      toast.success("School import rolled back successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Failed to rollback school import";
      toast.error(message);
    },
  });
}

export function useCouncilHierarchy() {
  return useQuery({
    queryKey: ["schoolImport", "councilHierarchy"],
    queryFn: () => schoolImportApi.getCouncilHierarchy(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRecentImports(limit: number = 10) {
  return useQuery({
    queryKey: ["schoolImport", "recent", limit],
    queryFn: () => schoolImportApi.getRecentImports(limit),
    staleTime: 30 * 1000, // 30 seconds
  });
}
