"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building2, Search, FileText, BarChart3, Package, AlertTriangle, TrendingUp, CheckCircle, RefreshCw, X } from "lucide-react";
import { CouncilInventoryTable } from "./council-inventory-table";
import { CouncilStockLedger } from "./council-stock-ledger";
import { CouncilInventorySearch } from "./council-inventory-search";
import { CouncilInventoryFilters, CouncilMovementFilters } from "@/types";
import { councilInventoryApi, itemsApi } from "@/lib/api";
import { useDataExport, ExportStatus, ExportButton } from "@/components/export";
import { formatCurrency } from "@/lib/utils";

interface CouncilInventoryManagementProps {
  className?: string;
}

export function CouncilInventoryManagement({
  className,
}: CouncilInventoryManagementProps) {
  const [activeTab, setActiveTab] = useState("inventory");
  const [inventoryFilters, setInventoryFilters] =
    useState<CouncilInventoryFilters>({});
  const [movementFilters, setMovementFilters] =
    useState<CouncilMovementFilters>({});
  
  // Simple KPI state
  const [kpiData, setKpiData] = useState<any>(null);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedCouncilId, setSelectedCouncilId] = useState<number | null>(null);
  const [councils, setCouncils] = useState<any[]>([]);
  const [councilsLoading, setCouncilsLoading] = useState(false);
  const [ledgerItems, setLedgerItems] = useState<any[]>([]);
  const [ledgerItemsLoading, setLedgerItemsLoading] = useState(false);
  const [userDistrict, setUserDistrict] = useState<string | null>(null);
  // Collapsible panels
  const [showFilters, setShowFilters] = useState(false);
  
  const effectiveCouncilId = userProfile?.councilId || selectedCouncilId || null;
  const [showLedgerFilters, setShowLedgerFilters] = useState(false);

  // Inventory export (tab-scoped, tied to filters)
  const { exportData: exportInventory, isExporting: isExportingInventory, error: exportInventoryError, lastExportCount: lastInventoryExportCount, reset: resetInventoryExport } = useDataExport({
    apiCall: async (params) => {
      const councilToExport = userProfile?.councilId || selectedCouncilId;
      return councilInventoryApi.getCouncilInventory(
        1,
        params?.maxRecords || 5000,
        {
          ...params?.filters,
          councilId: councilToExport
        }
      );
    },
    headers: [
      "Council Name",
      "Item Code",
      "Item Name", 
      "Category",
      "Available Quantity",
      "Unit of Measure",
      "Minimum Stock Level",
      "Last Updated",
      "Is Low Stock",
      "Item Description"
    ],
    dataTransform: (items) => items.map((item: any) => [
      item.councilName || 'Council',
      item.itemCode,
      item.itemName,
      item.category || '',
      item.availableQuantity?.toString() || '0',
      item.unitOfMeasure || '',
      item.minimumStockLevel?.toString() || '0',
      item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : '',
      item.isLowStock ? 'Yes' : 'No',
      item.itemDescription || ''
    ]),
    filename: () => {
      const councilName = selectedCouncilId 
        ? councils.find(c => c.id === selectedCouncilId)?.name || `Council-${selectedCouncilId}`
        : userProfile?.councilId 
          ? `Council-${userProfile.councilId}`
          : 'All-Councils';
      return `council-inventory-${councilName.replace(/\s+/g, '')}-${new Date().toISOString().split('T')[0]}.csv`;
    },
    maxRecords: 5000,
    filterContext: {
      ...inventoryFilters,
      councilId: userProfile?.councilId || selectedCouncilId || undefined
    }
  });

  // Stock ledger export (tab-scoped, tied to filters)
  const { exportData: exportLedger, isExporting: isExportingLedger, error: exportLedgerError, lastExportCount: lastLedgerExportCount, reset: resetLedgerExport } = useDataExport({
    apiCall: async (params) => {
      const councilToExport = userProfile?.councilId || selectedCouncilId;
      const resp = await councilInventoryApi.getCouncilStockMovements(
        1,
        params?.maxRecords || 5000,
        {
          ...params?.filters,
          councilId: councilToExport
        }
      );
      if (resp?.success && resp.data?.movements) {
        return resp.data.movements; // return array directly for exporter
      }
      return resp;
    },
    headers: [
      "Date",
      "Item Code",
      "Item Name",
      "Council",
      "Transaction Type",
      "Quantity",
      "Unit",
      "Reference Type",
      "Reference #",
      "User",
      "Notes"
    ],
    dataTransform: (movs) => movs.map((m: any) => [
      m.transactionDate ? new Date(m.transactionDate).toLocaleString() : '',
      m.itemCode || '',
      m.itemName || '',
      m.councilName || '',
      (m.transactionType || '').replace(/_/g, ' '),
      (m.quantity ?? 0).toString(),
      m.unitOfMeasure || 'units',
      m.referenceType || '',
      m.referenceNumber || '',
      m.userName || 'System',
      m.notes || ''
    ]),
    filename: () => {
      const councilName = selectedCouncilId 
        ? councils.find(c => c.id === selectedCouncilId)?.name || `Council-${selectedCouncilId}`
        : userProfile?.councilId 
          ? `Council-${userProfile.councilId}`
          : 'All-Councils';
      return `council-ledger-${councilName.replace(/\s+/g, '')}-${new Date().toISOString().split('T')[0]}.csv`;
    },
    maxRecords: 5000,
    filterContext: {
      ...movementFilters,
      councilId: userProfile?.councilId || selectedCouncilId || undefined
    }
  });

  // Fetch user profile and determine access
  useEffect(() => {
    const fetchUserAndKPIs = async () => {
      try {
        setKpiLoading(true);
        setAccessError(null);
        
        // Get user profile first using the configured API
        const { usersApi } = await import('@/lib/api');
        
        const profileResponse = await usersApi.getCurrentUser();
        
        if (!profileResponse.success) {
          setAccessError("Authentication required: Please log in to access this section.");
          setUserProfile({ hasAccess: false });
          return;
        }
        
        const user = profileResponse.data;
        
        if (!user) {
          setAccessError("Unable to load user profile.");
          setUserProfile({ hasAccess: false });
          return;
        }
        
        // Check if user has the right role
        const isSuperAdmin = user.roleName === "Super Administrator";
        const isLCOfficer = user.roleName === "Local Council M&E Officer" || user.roleName === "LC M&E Officer";
        const isDistrictOfficer = user.roleName === "District Education Officer";
        const hasViewAccess = isSuperAdmin || isLCOfficer || isDistrictOfficer || user.roleName === "View-Only User" || user.roleName === "National Warehouse Manager";
        
        if (!hasViewAccess) {
          setAccessError("Access denied: This section requires Super Administrator, National Warehouse Manager, Local Council M&E Officer, or District Education Officer privileges.");
          setUserProfile({ hasAccess: false });
          return;
        }
        
        // For Super Admins and other authorized users, fetch councils list
        if (isSuperAdmin || user.roleName === "National Warehouse Manager" || user.roleName === "View-Only User") {
          setCouncilsLoading(true);
          try {
            const { localCouncilsApi } = await import('@/lib/api');
            const councilsResponse = await localCouncilsApi.getLocalCouncils(1, 100);
            
            if (councilsResponse.success && councilsResponse.data?.councils) {
              setCouncils(councilsResponse.data.councils);
              
              // For Super Admins and other admins, don't auto-select any council (defaults to "ALL")
              // The selectedCouncilId remains null, which will show "ALL" in the dropdown
            }
          } catch (error) {
            console.error('Error fetching councils:', error);
          } finally {
            setCouncilsLoading(false);
          }
          
          // Load aggregate data by default for Super Admins
          try {
            const { dashboardApi } = await import('@/lib/api');
            const kpiResponse = await dashboardApi.getKPIData();
            
            if (kpiResponse.success) {
              const dashboardData = kpiResponse.data;
              setKpiData({
                totalItems: dashboardData.totalItems || 0,
                totalQuantity: dashboardData.totalQuantity || 0,
                lowStockItems: dashboardData.lowStockItems || 0,
                outOfStockItems: dashboardData.outOfStockItems || 0,
                totalInventoryValue: dashboardData.totalInventoryValue || 0,
                pendingShipments: dashboardData.pendingShipments || 0,
                activeDistributions: dashboardData.activeDistributions || 0,
                criticalAlerts: dashboardData.criticalAlerts || 0,
                lastUpdated: new Date(),
                message: "Showing aggregate data across all councils"
              });
            } else {
              setKpiData({
                totalItems: 0,
                totalQuantity: 0,
                lowStockItems: 0,
                outOfStockItems: 0,
                totalInventoryValue: 0,
                pendingShipments: 0,
                activeDistributions: 0,
                criticalAlerts: 0,
                lastUpdated: new Date(),
                message: "All Councils - Aggregate View (Unable to load data)"
              });
            }
          } catch (error) {
            setKpiData({
              totalItems: 0,
              totalQuantity: 0,
              lowStockItems: 0,
              outOfStockItems: 0,
              totalInventoryValue: 0,
              pendingShipments: 0,
              activeDistributions: 0,
              criticalAlerts: 0,
              lastUpdated: new Date(),
              message: "All Councils - Aggregate View"
            });
          }
          setUserProfile({ hasAccess: true, role: user.roleName, userId: user.id, canSelectCouncil: true });
          return;
        }
        
        if (isDistrictOfficer) {
          const districtName = (user.district || "").trim();
          setUserDistrict(districtName);

          if (!districtName) {
            setAccessError("Configuration error: District Education Officer account is not assigned to a district. Please contact your administrator.");
            setUserProfile({ hasAccess: false });
            return;
          }

          try {
            setCouncilsLoading(true);
            const { localCouncilsApi } = await import("@/lib/api");
            const councilsResponse = await localCouncilsApi.getLocalCouncils(1, 200, {
              district: districtName,
            });

            const districtCouncils = Array.isArray(councilsResponse.data?.councils)
              ? councilsResponse.data.councils
              : [];

            if (districtCouncils.length === 0) {
              setAccessError(`No councils were found for district "${districtName}". Please verify your district assignment.`);
              setUserProfile({ hasAccess: false, role: user.roleName });
              setCouncils([]);
              setKpiLoading(false);
              return;
            }

            setCouncils(districtCouncils);

            // For single council districts, behave like LC Officer
            if (districtCouncils.length === 1) {
              const singleCouncilId = districtCouncils[0].id;
              try {
                const kpiResponse = await councilInventoryApi.getDashboardKPIs(singleCouncilId);
                if (kpiResponse.success) {
                  const data = kpiResponse.data;
                  setKpiData({
                    ...data,
                    confirmedShipments: data.confirmedShipments || 0,
                    pendingShipments: data.pendingShipments || 0,
                    totalItems: data.totalItems || 0,
                    totalQuantity: data.totalQuantity || 0,
                    lowStockItems: data.lowStockItems || 0,
                    outOfStockItems: data.outOfStockItems || 0,
                    activeDistributions: data.activeDistributions || 0,
                    criticalAlerts: data.criticalAlerts || data.lowStockItems + data.outOfStockItems || 0,
                    lastUpdated: new Date(),
                    message: `${districtCouncils[0].name} council inventory`,
                  });
                }
              } catch (error) {
                console.error("Single council KPI load error", error);
              }

              setUserProfile({
                hasAccess: true,
                role: user.roleName,
                userId: user.id,
                councilId: singleCouncilId,
                canSelectCouncil: false,
              });
            } else {
              // For multiple councils, allow selection
              setUserProfile({
                hasAccess: true,
                role: user.roleName,
                userId: user.id,
                canSelectCouncil: true,
              });
            }
          } catch (error) {
            console.error("Error loading district councils", error);
            setAccessError("System error: Unable to load councils for your district.");
            setUserProfile({ hasAccess: false });
          } finally {
            setCouncilsLoading(false);
            setKpiLoading(false);
          }

          return;
        }

        // For LC Officers, get their council-specific KPIs
        if (isLCOfficer && user.localCouncilId) {
          try {
            console.log('LC Officer loading KPIs for council:', user.localCouncilId);
            const kpiResponse = await councilInventoryApi.getDashboardKPIs(user.localCouncilId);
            
            if (kpiResponse.success) {
              const data = kpiResponse.data;
              console.log('LC Officer KPI Response:', data);
              
              setKpiData({
                ...data,
                confirmedShipments: data.confirmedShipments || 0,
                pendingShipments: data.pendingShipments || 0,
                totalItems: data.totalItems || 0,
                totalQuantity: data.totalQuantity || 0,
                lowStockItems: data.lowStockItems || 0,
                outOfStockItems: data.outOfStockItems || 0,
                activeDistributions: data.activeDistributions || 0,
                criticalAlerts: data.criticalAlerts || data.lowStockItems + data.outOfStockItems || 0,
                lastUpdated: new Date(),
                message: "Your council's inventory data"
              });
              setUserProfile({ hasAccess: true, role: user.roleName, userId: user.id, councilId: user.localCouncilId });
            } else {
              console.error('LC Officer KPI Error:', kpiResponse.error);
              setAccessError(kpiResponse.error?.message || "Unable to access council inventory data");
              setUserProfile({ hasAccess: false });
            }
          } catch (error: any) {
            console.error('Error fetching LC Officer council KPIs:', error);
            if (error.response?.status === 403) {
              setAccessError("Access denied: Unable to access assigned council inventory.");
            } else {
              setAccessError("System error: Unable to connect to council inventory service.");
            }
            setUserProfile({ hasAccess: false });
          }
        } else if (isLCOfficer && !user.localCouncilId) {
          setAccessError("Configuration error: Local Council M&E Officer account is not assigned to a council. Please contact your administrator.");
          setUserProfile({ hasAccess: false });
        } else {
          // This shouldn't happen given our logic above, but just in case
          setUserProfile({ hasAccess: true, role: user.roleName, userId: user.id });
        }
        
      } catch (error) {
        console.error('Error in fetchUserAndKPIs:', error);
        setAccessError("System error: Unable to load user profile and council inventory data.");
        setUserProfile({ hasAccess: false });
      } finally {
        setKpiLoading(false);
      }
    };

    fetchUserAndKPIs();
  }, []);

  // Load item options for Movement Filters (restricted to selected/assigned council inventory where possible)
  useEffect(() => {
    const loadLedgerItems = async () => {
      try {
        setLedgerItemsLoading(true);
        const effectiveCouncilId = userProfile?.councilId || selectedCouncilId || undefined;

        // Try from council inventory first
        try {
          const invResp = await councilInventoryApi.getCouncilInventory(1, 500, { councilId: effectiveCouncilId });
          const invData = invResp?.data as any;
          const arr = Array.isArray(invData) ? invData : (invData?.inventory || invData?.items || []);
          if (Array.isArray(arr) && arr.length > 0) {
            const mapped = arr.map((it: any) => ({ id: it.itemId, name: it.itemName, code: it.itemCode }));
            setLedgerItems(mapped);
            return;
          }
        } catch (_) {
          // fall through
        }

        // Fallback to global items
        const itemsResp = await itemsApi.getItems(1, 500);
        if (itemsResp.success && itemsResp.data?.items) {
          const mapped = itemsResp.data.items.map((it: any) => ({ id: it.id, name: it.name, code: it.code }));
          setLedgerItems(mapped);
        }
      } finally {
        setLedgerItemsLoading(false);
      }
    };

    loadLedgerItems();
  }, [userProfile?.councilId, selectedCouncilId]);

  // Stock alerts panel removed per request

  // Handle council selection for Super Admins and other authorized users
  const handleCouncilSelection = async (councilId: string) => {
    if (councilId === "ALL") {
      setSelectedCouncilId(null);
      setKpiLoading(true);

      try {
        // For DEO role, fetch district-wide aggregate data
        if (userProfile?.role === "District Education Officer" && userDistrict) {
          // Calculate aggregate data from all district councils
          let aggregateData = {
            totalItems: 0,
            totalQuantity: 0,
            lowStockItems: 0,
            outOfStockItems: 0,
            totalInventoryValue: 0,
            pendingShipments: 0,
            activeDistributions: 0,
            criticalAlerts: 0
          };

          for (const council of councils) {
            try {
              const kpiResponse = await councilInventoryApi.getDashboardKPIs(council.id);
              if (kpiResponse.success) {
                const data = kpiResponse.data;
                aggregateData.totalItems += data.totalItems || 0;
                aggregateData.totalQuantity += data.totalQuantity || 0;
                aggregateData.lowStockItems += data.lowStockItems || 0;
                aggregateData.outOfStockItems += data.outOfStockItems || 0;
                aggregateData.totalInventoryValue += data.totalInventoryValue || 0;
                aggregateData.pendingShipments += data.pendingShipments || 0;
                aggregateData.activeDistributions += data.activeDistributions || 0;
              }
            } catch (error) {
              console.error(`Error fetching data for council ${council.id}:`, error);
            }
          }

          aggregateData.criticalAlerts = aggregateData.lowStockItems + aggregateData.outOfStockItems;

          setKpiData({
            ...aggregateData,
            lastUpdated: new Date(),
            message: `All District Councils - ${userDistrict} District`
          });
        } else {
          // For Super Admin, fetch global aggregate data
          const { dashboardApi } = await import('@/lib/api');
          const kpiResponse = await dashboardApi.getKPIData();

          if (kpiResponse.success) {
            const dashboardData = kpiResponse.data;
            setKpiData({
              totalItems: dashboardData.totalItems || 0,
              totalQuantity: dashboardData.totalQuantity || 0,
              lowStockItems: dashboardData.lowStockItems || 0,
              outOfStockItems: dashboardData.outOfStockItems || 0,
              totalInventoryValue: dashboardData.totalInventoryValue || 0,
              pendingShipments: dashboardData.pendingShipments || 0,
              activeDistributions: dashboardData.activeDistributions || 0,
              criticalAlerts: dashboardData.criticalAlerts || 0,
              lastUpdated: new Date(),
              message: "All Councils - Aggregate View"
            });
          } else {
            throw new Error("Unable to fetch aggregate data");
          }
        }
      } catch (error: any) {
        console.error('Error fetching aggregate KPIs:', error);
        setKpiData({
          totalItems: 0,
          totalQuantity: 0,
          lowStockItems: 0,
          outOfStockItems: 0,
          totalInventoryValue: 0,
          pendingShipments: 0,
          activeDistributions: 0,
          criticalAlerts: 0,
          lastUpdated: new Date(),
          message: userProfile?.role === "District Education Officer" ? `All District Councils - ${userDistrict} District` : "All Councils - Aggregate View"
        });
      } finally {
        setKpiLoading(false);
      }
      return;
    }

    const councilIdNum = parseInt(councilId);
    if (isNaN(councilIdNum)) return;
    
    setSelectedCouncilId(councilIdNum);
    setKpiLoading(true);

    try {
      const kpiResponse = await councilInventoryApi.getDashboardKPIs(councilIdNum);

      if (kpiResponse.success) {
        const data = kpiResponse.data;
        const selectedCouncil = councils.find(c => c.id === councilIdNum);

        setKpiData({
          ...data,
          confirmedShipments: data.confirmedShipments || 0,
          pendingShipments: data.pendingShipments || 0,
          totalItems: data.totalItems || 0,
          totalQuantity: data.totalQuantity || 0,
          lowStockItems: data.lowStockItems || 0,
          outOfStockItems: data.outOfStockItems || 0,
          activeDistributions: data.activeDistributions || 0,
          criticalAlerts: data.criticalAlerts || data.lowStockItems + data.outOfStockItems || 0,
          lastUpdated: new Date(),
          message: selectedCouncil ? `${selectedCouncil.name} council inventory` : "Council-specific data"
        });
      } else {
        console.error('KPI Error:', kpiResponse.error);
        setAccessError(kpiResponse.error?.message || "Unable to access council inventory data");
        // Reset to default state
        setKpiData({
          totalItems: 0,
          totalQuantity: 0,
          lowStockItems: 0,
          outOfStockItems: 0,
          totalInventoryValue: 0,
          pendingShipments: 0,
          activeDistributions: 0,
          criticalAlerts: 0,
          lastUpdated: new Date(),
          message: "Unable to load data for selected council"
        });
      }
    } catch (error: any) {
      console.error('Error fetching council KPIs:', error);
      setAccessError("System error: Unable to fetch council inventory data.");
    } finally {
      setKpiLoading(false);
    }
  };

  const handleInventoryFiltersChange = (filters: CouncilInventoryFilters) => {
    setInventoryFilters(filters);
    // Switch to inventory tab when filters are applied
    if (activeTab !== "inventory") {
      setActiveTab("inventory");
    }
  };

  const handleMovementFiltersChange = (filters: CouncilMovementFilters) => {
    setMovementFilters(filters);
    // Switch to ledger tab when movement filters are applied
    if (activeTab !== "ledger") {
      setActiveTab("ledger");
    }
  };

  const setQuickDateRange = (range: "7d" | "30d" | "thisMonth" | "ytd") => {
    const today = new Date();
    const toStr = (d: Date) => d.toISOString().split('T')[0];
    let start: string | undefined;
    let end: string | undefined = toStr(today);
    const d = new Date(today);

    if (range === "7d") {
      d.setDate(d.getDate() - 7);
      start = toStr(d);
    } else if (range === "30d") {
      d.setDate(d.getDate() - 30);
      start = toStr(d);
    } else if (range === "thisMonth") {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      start = toStr(first);
    } else if (range === "ytd") {
      const first = new Date(today.getFullYear(), 0, 1);
      start = toStr(first);
    }

    setMovementFilters(prev => ({ ...prev, startDate: start, endDate: end }));
  };

  const clearMovementFilters = () => {
    setMovementFilters({});
  };

  const invalidDateRange = Boolean(
    movementFilters.startDate &&
    movementFilters.endDate &&
    movementFilters.startDate > movementFilters.endDate
  );

  // Refresh KPI data for current selection/context
  const refreshKPIs = async () => {
    try {
      setKpiLoading(true);
      const ctxCouncilId: number | undefined = userProfile?.councilId ?? selectedCouncilId ?? undefined;
      if (ctxCouncilId) {
        const kpiResponse = await councilInventoryApi.getDashboardKPIs(ctxCouncilId);
        if (kpiResponse.success) {
          const data = kpiResponse.data;
          setKpiData({
            ...data,
            confirmedShipments: data.confirmedShipments || 0,
            pendingShipments: data.pendingShipments || 0,
            totalItems: data.totalItems || 0,
            totalQuantity: data.totalQuantity || 0,
            lowStockItems: data.lowStockItems || 0,
            outOfStockItems: data.outOfStockItems || 0,
            activeDistributions: data.activeDistributions || 0,
            criticalAlerts: data.criticalAlerts || data.lowStockItems + data.outOfStockItems || 0,
            lastUpdated: new Date(),
            message: "Your council's inventory data",
          });
        }
      } else {
        const { dashboardApi } = await import('@/lib/api');
        const kpiResponse = await dashboardApi.getKPIData();
        if (kpiResponse.success) {
          const d = kpiResponse.data;
          setKpiData({
            totalItems: d.totalItems || 0,
            totalQuantity: d.totalQuantity || 0,
            lowStockItems: d.lowStockItems || 0,
            outOfStockItems: d.outOfStockItems || 0,
            totalInventoryValue: d.totalInventoryValue || 0,
            pendingShipments: d.pendingShipments || 0,
            activeDistributions: d.activeDistributions || 0,
            criticalAlerts: d.criticalAlerts || 0,
            lastUpdated: new Date(),
            message: "All Councils - Aggregate View",
          });
        }
      }
    } catch (e) {
      console.error('KPI refresh error', e);
    } finally {
      setKpiLoading(false);
    }
  };

  // Helpers for inventory filters (chips and KPI/alert actions)
  const applyInventoryFilterPatch = (patch: Partial<CouncilInventoryFilters>) => {
    setInventoryFilters(prev => ({ ...prev, ...patch }));
    if (activeTab !== "inventory") setActiveTab("inventory");
  };

  const clearInventoryFilter = (key: keyof CouncilInventoryFilters) => {
    setInventoryFilters(prev => {
      const next = { ...prev } as any;
      delete next[key];
      return next;
    });
    if (activeTab !== "inventory") setActiveTab("inventory");
  };

  const clearAllInventoryFilters = () => {
    setInventoryFilters({});
    if (activeTab !== "inventory") setActiveTab("inventory");
  };

  // Quick actions for KPI buttons
  const viewLowItems = () => {
    setInventoryFilters(prev => {
      const next: any = { ...prev, lowStockOnly: true };
      // remove conflicting flag
      if (typeof (next as any).hasStock !== 'undefined') delete (next as any).hasStock;
      return next;
    });
    if (activeTab !== 'inventory') setActiveTab('inventory');
  };

  const viewEmptyItems = () => {
    setInventoryFilters(prev => {
      const next: any = { ...prev, hasStock: false };
      // remove conflicting flag
      if (typeof (next as any).lowStockOnly !== 'undefined') delete (next as any).lowStockOnly;
      return next;
    });
    if (activeTab !== 'inventory') setActiveTab('inventory');
  };

  return (
    <div className={className}>
      <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0 mb-4 lg:mb-6 px-4 lg:px-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Council Inventory Management
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            View and manage local council inventories with detailed stock
            tracking
          </p>
        </div>
        <div className="flex items-center" />
      </div>

      {/* Global toolbar: council selector (when allowed) + unified export actions */}
      <div className="px-4 lg:px-0">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-3">
          {/* Council selector for users who can select (e.g., Super Admin, Manager) */}
          <div className="flex items-center gap-3">
            {userDistrict && userProfile?.role === "District Education Officer" && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">District: {userDistrict}</span>
              </div>
            )}
            {!accessError && userProfile?.canSelectCouncil && (
              <div className="flex items-center gap-3">
                <div className="min-w-[260px]">
                  <Select
                    value={selectedCouncilId?.toString() || "ALL"}
                    onValueChange={handleCouncilSelection}
                    disabled={councilsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          councilsLoading
                            ? "Loading councils..."
                            : userProfile?.role === "District Education Officer"
                            ? "Select a district council"
                            : "Select a council"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">
                        <div className="flex flex-col">
                          <span>
                            {userProfile?.role === "District Education Officer"
                              ? "All District Councils"
                              : "All Councils"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {userProfile?.role === "District Education Officer"
                              ? "View district-wide data"
                              : "View aggregate data"}
                          </span>
                        </div>
                      </SelectItem>
                      {councils.map((council) => (
                        <SelectItem key={council.id} value={council.id.toString()}>
                          <div className="flex flex-col">
                            <span>{council.name}</span>
                            {council.code && (
                              <span className="text-xs text-muted-foreground">{council.code}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Export moved into each tab's filter card */}
          <div />
        </div>

        

        {/* Compact active inventory filters (chips) under toolbar */}
        {activeTab === "inventory" && (inventoryFilters.search || inventoryFilters.category || inventoryFilters.itemId || inventoryFilters.councilId || (inventoryFilters as any).hasStock !== undefined || inventoryFilters.lowStockOnly) && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs text-muted-foreground mr-1">Active filters:</span>
            {inventoryFilters.search && (
              <Button variant="outline" size="sm" className="h-6 px-2" onClick={() => clearInventoryFilter("search")}>Search: "{inventoryFilters.search}" <X className="ml-1 h-3 w-3" /></Button>
            )}
            {inventoryFilters.category && (
              <Button variant="outline" size="sm" className="h-6 px-2" onClick={() => clearInventoryFilter("category")}>Category: {inventoryFilters.category} <X className="ml-1 h-3 w-3" /></Button>
            )}
            {inventoryFilters.itemId && (
              <Button variant="outline" size="sm" className="h-6 px-2" onClick={() => clearInventoryFilter("itemId")}>Item #{inventoryFilters.itemId} <X className="ml-1 h-3 w-3" /></Button>
            )}
            {inventoryFilters.councilId && (
              <Button variant="outline" size="sm" className="h-6 px-2" onClick={() => clearInventoryFilter("councilId")}>
                {(() => {
                  const name = councils.find(c => c.id === inventoryFilters.councilId)?.name;
                  return `Council: ${name || inventoryFilters.councilId}`;
                })()} <X className="ml-1 h-3 w-3" />
              </Button>
            )}
            {(inventoryFilters as any).hasStock === true && (
              <Button variant="outline" size="sm" className="h-6 px-2" onClick={() => clearInventoryFilter("hasStock" as any)}>In Stock Only <X className="ml-1 h-3 w-3" /></Button>
            )}
            {(inventoryFilters as any).hasStock === false && (
              <Button variant="outline" size="sm" className="h-6 px-2" onClick={() => clearInventoryFilter("hasStock" as any)}>Out of Stock Only <X className="ml-1 h-3 w-3" /></Button>
            )}
            {inventoryFilters.lowStockOnly && (
              <Button variant="outline" size="sm" className="h-6 px-2" onClick={() => clearInventoryFilter("lowStockOnly")}>Alerting items <X className="ml-1 h-3 w-3" /></Button>
            )}
            <Button variant="ghost" size="sm" className="h-6 px-2 ml-2" onClick={clearAllInventoryFilters}>Clear all</Button>
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4 lg:space-y-6"
        >
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 h-auto md:h-10">
            <TabsTrigger value="inventory" className="flex items-center justify-center gap-2 min-h-[48px] md:min-h-[40px] text-sm">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Council Inventory</span>
              <span className="sm:hidden">Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="ledger" className="flex items-center justify-center gap-2 min-h-[48px] md:min-h-[40px] text-sm">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Stock Ledger</span>
              <span className="sm:hidden">Ledger</span>
            </TabsTrigger>
            
          </TabsList>

        <TabsContent value="inventory" className="space-y-6">

          {/* Inventory Filters (collapsible) */}
          {!accessError && (
            <Card className="mb-2">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search & Filters
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowFilters(v => !v)}>
                    {showFilters ? 'Hide' : 'Show'}
                  </Button>
                  <ExportButton
                    onExport={() => exportInventory({
                      filters: {
                        ...inventoryFilters,
                        councilId: userProfile?.councilId || selectedCouncilId || undefined,
                      },
                    })}
                    isExporting={isExportingInventory}
                    disabled={
                      !userProfile?.hasAccess ||
                      (!userProfile?.councilId &&
                        !selectedCouncilId &&
                        !['Super Administrator', 'District Education Officer'].includes(userProfile?.role || ''))
                    }
                    tooltip={
                      !userProfile?.hasAccess
                        ? "Access denied"
                        : (!userProfile?.councilId && !selectedCouncilId && !['Super Administrator', 'District Education Officer'].includes(userProfile?.role || ''))
                          ? "Select a council to export data"
                          : selectedCouncilId
                            ? `Export data for ${councils.find(c => c.id === selectedCouncilId)?.name || 'selected council'}`
                            : userProfile?.role === 'District Education Officer'
                            ? 'Select a district council or choose All District Councils'
                            : "Export filtered inventory"
                    }
                    error={exportInventoryError}
                    lastExportCount={lastInventoryExportCount}
                    onRetry={() => exportInventory({
                      filters: {
                        ...inventoryFilters,
                        councilId: userProfile?.councilId || selectedCouncilId || undefined,
                      },
                    })}
                    onReset={resetInventoryExport}
                    compact={true}
                  />
                </div>
              </CardHeader>
              {showFilters && (
                <CardContent>
                  <CouncilInventorySearch
                    onFiltersChange={handleInventoryFiltersChange}
                    initialFilters={inventoryFilters}
                    hideCouncilSelect={Boolean(userProfile?.canSelectCouncil)}
                    currentCouncilId={userProfile?.councilId || selectedCouncilId || null}
                    restrictOptionsToCouncil={true}
                    className="mb-2"
                  />
                </CardContent>
              )}
            </Card>
          )}

          {/* KPI Summary Section */}
          {kpiLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : accessError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {accessError}
              </AlertDescription>
            </Alert>
          ) : kpiData && (
            <div className="space-y-4">
              {kpiData.message && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 font-medium">
                    {kpiData.message}
                  </p>
                  {kpiData.lastUpdated && (
                    <p className="text-xs text-blue-600 mt-1">
                      Last updated: {new Date(kpiData.lastUpdated).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs lg:text-sm font-medium">Inventory Items</CardTitle>
                    <Package className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg lg:text-2xl font-bold text-blue-700">{(kpiData.totalItems || 0).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {(kpiData.totalQuantity || 0).toLocaleString()} total units
                    </p>
                    <div className="flex items-center mt-1">
                      <div className="text-xs text-blue-600">
                        {selectedCouncilId ? 'Council inventory' : 'All councils combined'}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`border-l-4 cursor-pointer ${
                  !effectiveCouncilId ? 'border-l-gray-300' : (
                    (kpiData.outOfStockItems || 0) > 0 ? 'border-l-red-500' : 
                    (kpiData.lowStockItems || 0) > 0 ? 'border-l-yellow-500' : 'border-l-green-500'
                  )
                }`} onClick={viewLowItems}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs lg:text-sm font-medium">Stock Alerts</CardTitle>
                    <AlertTriangle className={`h-4 w-4 ${
                      !effectiveCouncilId ? 'text-gray-500' : (
                        (kpiData.outOfStockItems || 0) > 0 ? 'text-red-600' : 
                        (kpiData.lowStockItems || 0) > 0 ? 'text-yellow-600' : 'text-green-600'
                      )
                    }`} />
                  </CardHeader>
                  <CardContent>
                    { !effectiveCouncilId ? (
                      <>
                        <div className="text-2xl font-bold text-gray-500">—</div>
                        <p className="text-xs text-muted-foreground">Select a council to view stock alerts</p>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-bold">
                          {(kpiData.outOfStockItems || 0) > 0 ? (
                            <span className="text-red-600">{kpiData.outOfStockItems}</span>
                          ) : (kpiData.lowStockItems || 0) > 0 ? (
                            <span className="text-yellow-600">{kpiData.lowStockItems}</span>
                          ) : (
                            <span className="text-green-600">0</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {(kpiData.outOfStockItems || 0) > 0 ? 'Items out of stock' : 
                           (kpiData.lowStockItems || 0) > 0 ? 'Items low on stock' : 'No stock issues'}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs">
                          {inventoryFilters.lowStockOnly && (
                            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={(e) => { e.stopPropagation(); clearInventoryFilter("lowStockOnly"); }}>Clear</Button>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-indigo-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Shipment Activity</CardTitle>
                    <TrendingUp className="h-4 w-4 text-indigo-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-indigo-700">
                      {(kpiData.confirmedShipments || 0) + (kpiData.pendingShipments || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total active shipments
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="text-green-600">{kpiData.confirmedShipments || 0} confirmed</span>
                      <span className="text-orange-600">{kpiData.pendingShipments || 0} pending</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Distributions</CardTitle>
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-700">
                      {kpiData.activeDistributions || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Active distributions
                    </p>
                    <div className="flex items-center mt-1">
                      <div className="text-xs text-purple-600">
                        To schools and beneficiaries
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Critical alert banner removed per request */}
            </div>
          )}

            {!accessError && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Council-Specific Inventory Display
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    View real-time inventory levels across all local councils with
                    detailed stock information, availability status, and
                    council-specific access controls.
                  </p>

                  {/* Alerts panel intentionally removed */}

                  <CouncilInventoryTable
                    filters={{
                      ...inventoryFilters,
                      councilId: userProfile?.councilId || selectedCouncilId || undefined
                    }}
                    className="mt-4"
                    councilId={userProfile?.councilId ?? selectedCouncilId ?? undefined}
                    onInventoryChanged={refreshKPIs}
                  />
                </CardContent>
              </Card>
            )}
        </TabsContent>

        <TabsContent value="ledger" className="space-y-6">
          {accessError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {accessError}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Ledger context: selected council display */}
              <div className="px-1 text-xs text-muted-foreground">
                Viewing ledger for: {(() => {
                  const id = userProfile?.councilId || selectedCouncilId;
                  if (!id) return 'All Councils (Aggregate)';
                  const name = councils.find(c => c.id === id)?.name;
                  return name ? `${name}` : `Council #${id}`;
                })()}
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Movement Filters
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowLedgerFilters(v => !v)}>
                      {showLedgerFilters ? 'Hide' : 'Show'}
                    </Button>
                    <ExportButton
                      onExport={() => exportLedger({
                        filters: {
                          ...movementFilters,
                          councilId: userProfile?.councilId || selectedCouncilId || undefined,
                        },
                      })}
                      isExporting={isExportingLedger}
                      disabled={
                        !userProfile?.hasAccess ||
                        (!userProfile?.councilId &&
                          !selectedCouncilId &&
                          !['Super Administrator', 'District Education Officer'].includes(userProfile?.role || ''))
                      }
                      tooltip={
                        !userProfile?.hasAccess
                          ? "Access denied"
                          : (!userProfile?.councilId && !selectedCouncilId && !['Super Administrator', 'District Education Officer'].includes(userProfile?.role || ''))
                            ? "Select a council to export data"
                            : selectedCouncilId
                              ? `Export ledger for ${councils.find(c => c.id === selectedCouncilId)?.name || 'selected council'}`
                              : userProfile?.role === 'District Education Officer'
                              ? 'Select a district council or choose All District Councils'
                              : "Export filtered ledger"
                      }
                    error={exportLedgerError}
                    lastExportCount={lastLedgerExportCount}
                    onRetry={() => exportLedger({
                      filters: {
                        ...movementFilters,
                        councilId: userProfile?.councilId || selectedCouncilId || undefined,
                      }
                    })}
                    onReset={resetLedgerExport}
                    compact={true}
                  />
                  </div>
                </CardHeader>
                {showLedgerFilters && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Filter movement history by date range, item, transaction and reference type.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Start Date */}
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={movementFilters.startDate || ""}
                        onChange={(e) => setMovementFilters((prev) => ({ ...prev, startDate: e.target.value || undefined }))}
                      />
                    </div>

                    {/* End Date */}
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={movementFilters.endDate || ""}
                        onChange={(e) => setMovementFilters((prev) => ({ ...prev, endDate: e.target.value || undefined }))}
                      />
                    </div>

                    {/* Item */}
                    <div className="space-y-2">
                      <Label htmlFor="ledger-item">Item</Label>
                      <Select
                        value={movementFilters.itemId?.toString() || "ALL"}
                        onValueChange={(value) => setMovementFilters((prev) => ({ ...prev, itemId: value === "ALL" ? undefined : parseInt(value) }))}
                        disabled={ledgerItemsLoading}
                      >
                        <SelectTrigger id="ledger-item">
                          <SelectValue placeholder={ledgerItemsLoading ? "Loading items..." : "All Items"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Items</SelectItem>
                          {ledgerItems.map((it) => (
                            <SelectItem key={it.id} value={it.id.toString()}>
                              {it.name} ({it.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                  {/* Transaction Type */}
                    <div className="space-y-2">
                      <Label htmlFor="transaction-type">Transaction Type</Label>
                      <Select
                        value={movementFilters.transactionType || "ALL"}
                        onValueChange={(value) => setMovementFilters((prev) => ({ ...prev, transactionType: value === "ALL" ? undefined : value }))}
                      >
                        <SelectTrigger id="transaction-type">
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Types</SelectItem>
                          <SelectItem value="SHIPMENT_RECEIVED">Shipment Received</SelectItem>
                          <SelectItem value="STOCK_RECEIPT">Stock Receipt</SelectItem>
                          <SelectItem value="DISTRIBUTION">Distributed</SelectItem>
                          <SelectItem value="SHIPMENT_OUTGOING">Shipped Out</SelectItem>
                          <SelectItem value="ADJUSTMENT_INCREASE">Adjustment (+)</SelectItem>
                          <SelectItem value="ADJUSTMENT_DECREASE">Adjustment (-)</SelectItem>
                          <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Reference Type */}
                    <div className="space-y-2">
                      <Label htmlFor="reference-type">Reference Type</Label>
                      <Select
                        value={movementFilters.referenceType || "ALL"}
                        onValueChange={(value) => setMovementFilters((prev) => ({ ...prev, referenceType: value === "ALL" ? undefined : value }))}
                      >
                        <SelectTrigger id="reference-type">
                          <SelectValue placeholder="All References" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All References</SelectItem>
                          <SelectItem value="SHIPMENT">Shipment</SelectItem>
                          <SelectItem value="DISTRIBUTION">Distribution</SelectItem>
                          <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                    {/* Quick ranges and actions */}
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      <span className="text-xs text-muted-foreground mr-2">Quick ranges:</span>
                      <Button variant="outline" size="sm" onClick={() => setQuickDateRange("7d")}>Last 7 days</Button>
                      <Button variant="outline" size="sm" onClick={() => setQuickDateRange("30d")}>Last 30 days</Button>
                      <Button variant="outline" size="sm" onClick={() => setQuickDateRange("thisMonth")}>This Month</Button>
                      <Button variant="outline" size="sm" onClick={() => setQuickDateRange("ytd")}>YTD</Button>
                      {invalidDateRange && (
                        <span className="text-xs text-red-600 ml-2">End date must be on or after start date</span>
                      )}
                      <div className="ml-auto flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={clearMovementFilters}>Clear</Button>
                        <Button
                          onClick={() => handleMovementFiltersChange(movementFilters)}
                          className="bg-[#007A33] hover:bg-[#005A25]"
                          size="sm"
                          disabled={invalidDateRange}
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Apply
                        </Button>
                      </div>
                    </div>

                  {/* Active filter chips */}
                  {(movementFilters.startDate || movementFilters.endDate || movementFilters.itemId || movementFilters.transactionType || movementFilters.referenceType) && (
                    <div className="mt-3 text-xs text-muted-foreground">
                      <span className="mr-2 font-medium text-foreground">Active:</span>
                      {movementFilters.startDate && <span className="bg-muted px-2 py-1 rounded mr-1">From {movementFilters.startDate}</span>}
                      {movementFilters.endDate && <span className="bg-muted px-2 py-1 rounded mr-1">To {movementFilters.endDate}</span>}
                      {movementFilters.itemId && <span className="bg-muted px-2 py-1 rounded mr-1">Item #{movementFilters.itemId}</span>}
                      {movementFilters.transactionType && <span className="bg-muted px-2 py-1 rounded mr-1">{movementFilters.transactionType.replace(/_/g, ' ')}</span>}
                      {movementFilters.referenceType && <span className="bg-muted px-2 py-1 rounded mr-1">{movementFilters.referenceType}</span>}
                    </div>
                  )}

                  {/* Export controls moved to global toolbar */}
                </CardContent>
                )}
              </Card>

              <CouncilStockLedger 
                filters={{
                  ...movementFilters,
                  councilId: userProfile?.councilId || selectedCouncilId || undefined
                }} 
                className="space-y-4" 
              />
            </>
          )}
        </TabsContent>

        
        </Tabs>
      </div>
    </div>
  );
}







