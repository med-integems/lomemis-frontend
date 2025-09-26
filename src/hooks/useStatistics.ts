import { useState, useEffect } from "react";
import { statisticsApi } from "@/lib/api";
import { useUser } from "./useUser";

export interface StatCard {
  label: string;
  value: string | number;
  icon: any;
  isLoading?: boolean;
}

export function useWarehouseStats() {
  const [stats, setStats] = useState<StatCard[]>([
    { label: "Total Items", value: "--", icon: null, isLoading: true },
    { label: "Active Shipments", value: "--", icon: null, isLoading: true },
    { label: "Pending Receipts", value: "--", icon: null, isLoading: true },
    { label: "Local Councils", value: "--", icon: null, isLoading: true },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch multiple statistics in parallel
        const [inventoryResponse, systemResponse, dashboardResponse] = await Promise.allSettled([
          statisticsApi.getInventoryStats(),
          statisticsApi.getWarehouseStats(),
          statisticsApi.getContextualStats(),
        ]);

        const updatedStats = [...stats];

        // Process inventory stats
        if (inventoryResponse.status === 'fulfilled' && inventoryResponse.value.success) {
          const data: any = inventoryResponse.value.data || {};
          updatedStats[0] = { 
            ...updatedStats[0], 
            value: data.totalItems || data.totalActiveItems || 0, 
            isLoading: false 
          };
        }

        // Process system stats
        if (systemResponse.status === 'fulfilled' && systemResponse.value.success) {
          const data: any = systemResponse.value.data || {};
          updatedStats[1] = { 
            ...updatedStats[1], 
            value: data.activeShipments || data.totalShipments || 0, 
            isLoading: false 
          };
          updatedStats[2] = { 
            ...updatedStats[2], 
            value: data.pendingReceipts || data.totalReceipts || 0, 
            isLoading: false 
          };
          updatedStats[3] = { 
            ...updatedStats[3], 
            value: data.localCouncils || data.totalCouncils || 0, 
            isLoading: false 
          };
        }

        // Process dashboard stats as fallback
        if (dashboardResponse.status === 'fulfilled' && dashboardResponse.value.success) {
          const data: any = dashboardResponse.value.data || {};
          // Use dashboard data as fallback for any missing stats
          if (updatedStats[0].isLoading) {
            updatedStats[0] = { 
              ...updatedStats[0], 
              value: data.totalItems || data.inventoryItems || 0, 
              isLoading: false 
            };
          }
          if (updatedStats[1].isLoading) {
            updatedStats[1] = { 
              ...updatedStats[1], 
              value: data.activeShipments || data.pendingShipments || 0, 
              isLoading: false 
            };
          }
        }

        // Mark any remaining loading stats as 0
        updatedStats.forEach(stat => {
          if (stat.isLoading) {
            stat.value = 0;
            stat.isLoading = false;
          }
        });

        setStats(updatedStats);
      } catch (err) {
        console.error("Error fetching warehouse stats:", err);
        setError("Failed to load statistics");
        // Set all stats to 0 on error
        setStats(prev => prev.map(stat => ({ ...stat, value: 0, isLoading: false })));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
}

export function useCouncilStats(selectedCouncilId?: number) {
  const { user } = useUser();
  const [stats, setStats] = useState<StatCard[]>([
    { label: "Total Schools", value: "--", icon: null, isLoading: true },
    { label: "Active Students", value: "--", icon: null, isLoading: true },
    { label: "Local Councils", value: "--", icon: null, isLoading: true },
    { label: "Distributions", value: "--", icon: null, isLoading: true },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Determine which council to fetch data for
        const councilId = selectedCouncilId || (user?.role !== 'super_admin' ? user?.councilId : undefined);
        
        const [dashboardResponse, inventoryResponse] = await Promise.allSettled([
          statisticsApi.getContextualStats(),
          // If specific council selected or user is LC officer, get council-specific data
          councilId ? statisticsApi.getCouncilStats() : statisticsApi.getCouncilStats(),
        ]);

        const updatedStats = [...stats];

        // Process dashboard stats (has the most comprehensive data)
        if (dashboardResponse.status === 'fulfilled' && dashboardResponse.value.success) {
          const data = dashboardResponse.value.data;
          
          if (user?.role === 'super_admin' && !selectedCouncilId) {
            // Super admin without filter - show total system stats
            updatedStats[0] = { 
              ...updatedStats[0], 
              value: data.totalSchools || data.schoolsCount || 0, 
              isLoading: false 
            };
            updatedStats[1] = { 
              ...updatedStats[1], 
              value: data.totalStudents || data.activeStudents || 0, 
              isLoading: false 
            };
            updatedStats[2] = { 
              ...updatedStats[2], 
              value: data.totalCouncils || data.localCouncils || 0, 
              isLoading: false 
            };
            updatedStats[3] = { 
              ...updatedStats[3], 
              value: data.totalDistributions || data.distributions || 0, 
              isLoading: false 
            };
          } else {
            // Council-specific stats for LC officers or filtered super admin view
            updatedStats[0] = { 
              ...updatedStats[0], 
              value: data.councilSchools || data.assignedSchools || data.totalSchools || 0, 
              isLoading: false 
            };
            updatedStats[1] = { 
              ...updatedStats[1], 
              value: data.councilStudents || data.activeStudents || 0, 
              isLoading: false 
            };
            updatedStats[2] = { 
              ...updatedStats[2], 
              value: 1, // Current council
              isLoading: false 
            };
            updatedStats[3] = { 
              ...updatedStats[3], 
              value: data.councilDistributions || data.distributions || 0, 
              isLoading: false 
            };
          }
        }

        // Use inventory response as additional data source
        if (inventoryResponse.status === 'fulfilled' && inventoryResponse.value.success) {
          const data = inventoryResponse.value.data;
          // Update any stats that are still loading
          if (updatedStats[3].isLoading) {
            updatedStats[3] = { 
              ...updatedStats[3], 
              value: data.totalDistributions || 0, 
              isLoading: false 
            };
          }
        }

        // Mark remaining as 0
        updatedStats.forEach(stat => {
          if (stat.isLoading) {
            stat.value = 0;
            stat.isLoading = false;
          }
        });

        setStats(updatedStats);
      } catch (err) {
        console.error("Error fetching council stats:", err);
        setError("Failed to load statistics");
        setStats(prev => prev.map(stat => ({ ...stat, value: 0, isLoading: false })));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, selectedCouncilId]);

  return { stats, loading, error };
}

export function useSchoolStats() {
  const { user } = useUser();
  const [stats, setStats] = useState<StatCard[]>([
    { label: "My School", value: "--", icon: null, isLoading: true },
    { label: "Inventory Items", value: "--", icon: null, isLoading: true },
    { label: "Pending Receipts", value: "--", icon: null, isLoading: true },
    { label: "Students", value: "--", icon: null, isLoading: true },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const promises: Promise<any>[] = [
          statisticsApi.getContextualStats(),
        ];

        // If we have a schoolId, fetch school inventory stats directly for accurate counts
        const schoolId = (user as any)?.schoolId;
        if (schoolId) {
          promises.push(statisticsApi.getSchoolInventoryStats(schoolId));
        } else {
          // Fallback to legacy school stats if schoolId is unavailable
          promises.push(statisticsApi.getSchoolStats());
        }

        const [dashboardResponse, schoolSpecificResponse] = await Promise.allSettled(promises);

        const updatedStats = [...stats];

        // Set school name from user data
        updatedStats[0] = { 
          ...updatedStats[0], 
          value: user?.schoolName || user?.assignedSchool || "Not assigned", 
          isLoading: false 
        };

        // Process school-specific stats: prefer school inventory stats if available
        if (schoolSpecificResponse.status === 'fulfilled' && schoolSpecificResponse.value?.success) {
          const data: any = schoolSpecificResponse.value.data || {};
          // If response looks like inventory stats (has pendingReceipts and totalItems), use those
          if (typeof data.pendingReceipts === 'number' || typeof data.totalItems === 'number') {
            updatedStats[1] = {
              ...updatedStats[1],
              value: data.totalItems ?? 0,
              isLoading: false,
            };
            updatedStats[2] = {
              ...updatedStats[2],
              value: data.pendingReceipts ?? 0,
              isLoading: false,
            };
          } else {
            // Legacy admin school stats shape
            updatedStats[1] = {
              ...updatedStats[1],
              value: data.inventoryItems || data.totalInventoryItems || 0,
              isLoading: false,
            };
            updatedStats[2] = {
              ...updatedStats[2],
              value: data.pendingReceipts || data.pendingDistributions || 0,
              isLoading: false,
            };
            updatedStats[3] = {
              ...updatedStats[3],
              value: data.students || data.totalStudents || 0,
              isLoading: false,
            };
          }
        }

        // Use dashboard data as fallback
        if (dashboardResponse.status === 'fulfilled' && dashboardResponse.value.success) {
          const data: any = dashboardResponse.value.data || {};
          if (updatedStats[1].isLoading) {
            updatedStats[1] = { 
              ...updatedStats[1], 
              value: data.inventoryItems || 0, 
              isLoading: false 
            };
          }
          if (updatedStats[2].isLoading) {
            updatedStats[2] = { 
              ...updatedStats[2], 
              value: data.pendingReceipts || 0, 
              isLoading: false 
            };
          }
        }

        // Mark remaining as 0
        updatedStats.forEach((stat, index) => {
          if (stat.isLoading && index !== 0) { // Don't change school name
            stat.value = 0;
            stat.isLoading = false;
          }
        });

        setStats(updatedStats);
      } catch (err) {
        console.error("Error fetching school stats:", err);
        setError("Failed to load statistics");
        setStats(prev => prev.map((stat, index) => ({ 
          ...stat, 
          value: index === 0 ? (user?.schoolName || "Not assigned") : 0, 
          isLoading: false 
        })));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  return { stats, loading, error };
}
