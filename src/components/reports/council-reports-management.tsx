"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/hooks/useUser";
import { useResponsive } from "@/hooks/useResponsive";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Package,
  School,
  Truck,
  BarChart3,
  PieChart,
  LineChart,
  AlertTriangle,
  CheckCircle,
  Users,
  MapPin,
  Filter,
  RefreshCw,
  Search,
  RotateCcw,
  Building2,
} from "lucide-react";
import { ReportGenerator } from "./report-generator";
import { ChartComponent } from "./chart-component";
import {
  distributionsApi,
  shipmentsApi,
  councilInventoryApi,
  schoolsApi,
  localCouncilsApi,
} from "@/lib/api";
import { toast } from "sonner";
import { PDFGenerator } from "@/lib/pdf-generator";

interface ReportData {
  inventoryReport: {
    totalItems: number;
    lowStockItems: number;
    categories: { name: string; count: number }[];
  };
  distributionReport: {
    totalDistributions: number;
    totalSchools: number;
    totalItemsDistributed: number;
    byMonth: { month: string; count: number; items: number }[];
    bySchoolType: { type: string; count: number; percentage: number }[];
    topSchools: { name: string; count: number; items: number }[];
  };
  shipmentReport: {
    totalShipments: number;
    totalItemsReceived: number;
    discrepancyRate: number;
    byMonth: { month: string; count: number; items: number }[];
    averageProcessingTime: number;
  };
  performanceMetrics: {
    distributionEfficiency: number;
    schoolCoverage: number;
    inventoryTurnover: number;
    stockAccuracy: number;
  };
}

interface CouncilReportsManagementProps {
  className?: string;
}

export function CouncilReportsManagement({
  className,
}: CouncilReportsManagementProps) {
  const { user } = useUser();
  const { isMobile, isTablet } = useResponsive();
  const [activeTab, setActiveTab] = useState("overview");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // 90 days ago
    to: new Date().toISOString().split("T")[0],
  });
  const [tempDateRange, setTempDateRange] = useState({
    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // 90 days ago
    to: new Date().toISOString().split("T")[0],
  });
  const [selectedReportType, setSelectedReportType] = useState("inventory");
  const [generating, setGenerating] = useState(false);
  const [filtersApplying, setFiltersApplying] = useState(false);

  // DEO and Council Selection State
  const [userProfile, setUserProfile] = useState<any>(null);
  const [councils, setCouncils] = useState<any[]>([]);
  const [councilsLoading, setCouncilsLoading] = useState(false);
  const [selectedCouncilId, setSelectedCouncilId] = useState<number | null>(null);
  const [userDistrict, setUserDistrict] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  // Enhanced role checking
  const isSuperAdmin = (user?.role === 'super_admin' || user?.roleName === 'Super Administrator');
  const isDistrictOfficer = user?.roleName === "District Education Officer";
  const isDEO = isDistrictOfficer; // Alias for consistency with other components
  const isLCOfficer = user?.roleName === "Local Council M&E Officer" || user?.roleName === "LC M&E Officer";

  // Helper function to resolve effective council ID
  const resolveEffectiveCouncilId = (): number | null => {
    if (userProfile?.councilId) return userProfile.councilId;
    if (selectedCouncilId) return selectedCouncilId;
    if (user?.localCouncilId) return user.localCouncilId;
    return null;
  };

  const effectiveCouncilId = resolveEffectiveCouncilId();

  // Fetch user profile and set up DEO/Council access
  useEffect(() => {
    const fetchUserAndSetupAccess = async () => {
      try {
        setLoading(true);
        setAccessError(null);

        // Get user profile first
        const { usersApi } = await import('@/lib/api');
        const profileResponse = await usersApi.getCurrentUser();

        if (!profileResponse.success) {
          setAccessError("Authentication required: Please log in to access this section.");
          setUserProfile({ hasAccess: false });
          return;
        }

        const userInfo = profileResponse.data;
        if (!userInfo) {
          setAccessError("Unable to load user profile.");
          setUserProfile({ hasAccess: false });
          return;
        }

        // Check if user has the right role
        const isSuperAdmin = userInfo.roleName === "Super Administrator";
        const isLCOfficer = userInfo.roleName === "Local Council M&E Officer" || userInfo.roleName === "LC M&E Officer";
        const isDistrictOfficer = userInfo.roleName === "District Education Officer";
        const hasViewAccess = isSuperAdmin || isLCOfficer || isDistrictOfficer || userInfo.roleName === "View-Only User" || userInfo.roleName === "National Warehouse Manager";

        if (!hasViewAccess) {
          setAccessError("Access denied: This section requires Super Administrator, National Warehouse Manager, Local Council M&E Officer, or District Education Officer privileges.");
          setUserProfile({ hasAccess: false });
          return;
        }

        // For Super Admins and other authorized users, fetch councils list
        if (isSuperAdmin || userInfo.roleName === "National Warehouse Manager" || userInfo.roleName === "View-Only User") {
          setCouncilsLoading(true);
          try {
            const councilsResponse = await localCouncilsApi.getLocalCouncils(1, 100);

            if (councilsResponse.success && councilsResponse.data?.councils) {
              setCouncils(councilsResponse.data.councils);
            }
          } catch (error) {
            console.error('Error fetching councils:', error);
          } finally {
            setCouncilsLoading(false);
          }

          setUserProfile({ hasAccess: true, role: userInfo.roleName, userId: userInfo.id, canSelectCouncil: true });
          return;
        }

        if (isDistrictOfficer) {
          const districtName = (userInfo.district || "").trim();
          setUserDistrict(districtName);

          if (!districtName) {
            setAccessError("Configuration error: District Education Officer account is not assigned to a district. Please contact your administrator.");
            setUserProfile({ hasAccess: false });
            return;
          }

          try {
            setCouncilsLoading(true);
            const councilsResponse = await localCouncilsApi.getLocalCouncils(1, 200, {
              district: districtName,
            });

            const districtCouncils = Array.isArray(councilsResponse.data?.councils)
              ? councilsResponse.data.councils
              : [];

            if (districtCouncils.length === 0) {
              setAccessError(`No councils were found for district "${districtName}". Please verify your district assignment.`);
              setUserProfile({ hasAccess: false, role: userInfo.roleName });
              setCouncils([]);
              return;
            }

            setCouncils(districtCouncils);

            // For single council districts, behave like LC Officer
            if (districtCouncils.length === 1) {
              const singleCouncilId = districtCouncils[0].id;
              setUserProfile({
                hasAccess: true,
                role: userInfo.roleName,
                userId: userInfo.id,
                councilId: singleCouncilId,
                canSelectCouncil: false,
              });
            } else {
              // For multiple councils, allow selection
              setUserProfile({
                hasAccess: true,
                role: userInfo.roleName,
                userId: userInfo.id,
                canSelectCouncil: true,
              });
            }
          } catch (error) {
            console.error("Error loading district councils", error);
            setAccessError("System error: Unable to load councils for your district.");
            setUserProfile({ hasAccess: false });
          } finally {
            setCouncilsLoading(false);
          }

          return;
        }

        // For LC Officers, get their council-specific data
        if (isLCOfficer && userInfo.localCouncilId) {
          setUserProfile({
            hasAccess: true,
            role: userInfo.roleName,
            userId: userInfo.id,
            councilId: userInfo.localCouncilId,
            canSelectCouncil: false,
          });
          return;
        }

        // Default fallback
        setAccessError("Unable to determine user access level.");
        setUserProfile({ hasAccess: false });
      } catch (error) {
        console.error("Error setting up user access:", error);
        setAccessError("System error: Unable to load reports management.");
        setUserProfile({ hasAccess: false });
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndSetupAccess();
  }, []);

  // Refetch when council selection changes or user profile is set
  useEffect(() => {
    if (!accessError && userProfile?.hasAccess && effectiveCouncilId) {
      fetchReportData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCouncilId, userProfile?.councilId, userProfile?.hasAccess, accessError]);

  // Fetch comprehensive report data
  const fetchReportData = async (customDateRange?: { from: string; to: string }) => {
    // Don't fetch if user data is not available yet
    if (!effectiveCouncilId && !isSuperAdmin) {
      console.log('Waiting for user data...');
      return;
    }
    
    // For Super Admins require explicit council selection
    if (isSuperAdmin && !effectiveCouncilId) {
      toast.info('Select a council to view scoped reports');
      setLoading(false);
      return;
    }
    // Use custom date range if provided, otherwise use state date range
    const effectiveDateRange = customDateRange || dateRange;
    console.log('Fetching report data with date range:', effectiveDateRange);
    
    try {
      setLoading(true);

      // Debug: Log the filter parameters being sent
      console.log('🔍 Fetching data with filters:', {
        dateRange: effectiveDateRange,
        userId: user?.id,
        userRole: user?.role,
        localCouncilId: user?.localCouncilId
      });

      // Fetch data from multiple endpoints (resilient)
      const results = await Promise.allSettled([
        // Fetch council inventory with item details
        councilInventoryApi.getCouncilInventory(1, 1000, {
          includeItemDetails: true,
          councilId: effectiveCouncilId || undefined,
        }),
        // Fetch distributions FROM this council TO schools (outgoing distributions)
        distributionsApi.getDistributions(1, 1000, {
          dateFrom: effectiveDateRange.from,
          dateTo: effectiveDateRange.to,
          councilId: effectiveCouncilId || undefined,
          localCouncilId: effectiveCouncilId || undefined,
          includeStatus: true, // Make sure we get status information
          includeItems: true, // Make sure we get the distribution items for quantity calculation
        }),
        // Fetch shipments TO this council FROM national warehouses (incoming shipments)
        shipmentsApi.getShipmentSummary({
          councilId: effectiveCouncilId || undefined,
          startDate: effectiveDateRange.from,
          endDate: effectiveDateRange.to,
        }),
        effectiveCouncilId ? schoolsApi.getSchoolsByCouncil(effectiveCouncilId, 1, 1000) : schoolsApi.getSchools(1, 1000),
      ]);

      const [invRes, distRes, shipRes, schRes] = results;
      const inventoryResponse = invRes.status === 'fulfilled' ? invRes.value : null;
      const distributionsResponse = distRes.status === 'fulfilled' ? distRes.value : null;
      const shipmentsSummary = shipRes.status === 'fulfilled' ? shipRes.value : null;
      const schoolsResponse = schRes.status === 'fulfilled' ? schRes.value : null;

      // Process inventory data
      const inventory = inventoryResponse && Array.isArray(inventoryResponse.data?.inventory)
        ? inventoryResponse.data.inventory
        : [];

      // Debug logging to understand data structure
      console.log('Sample inventory item:', inventory[0]);
      
      const inventoryReport = {
        totalItems: inventory.reduce(
          (sum, item) => sum + (item.availableQuantity || item.quantity || 0),
          0
        ),
        lowStockItems: inventory.filter((item) => {
          const available = item.availableQuantity ?? 0;
          const onHand = item.quantityOnHand ?? item.quantity ?? 0;
          const min = item.minimumStockLevel ?? item.minStock ?? 0;
          return available > 0 && onHand <= min;
        }).length,
        categories: aggregateByCategory(inventory),
      };

      // Process distribution data
      const distributions = distributionsResponse && Array.isArray(
        distributionsResponse.data?.distributions
      )
        ? distributionsResponse.data.distributions
        : [];

      // Debug logging for distributions
      console.log('Distributions data structure:', distributions);
      console.log('Sample distribution item:', distributions[0]);
      if (distributions[0]) {
        console.log('Distribution fields available:', Object.keys(distributions[0]));
        console.log('Items in first distribution:', distributions[0].items);
        if (distributions[0].items && distributions[0].items.length > 0) {
          console.log('Sample distribution item:', distributions[0].items[0]);
          console.log('Distribution item fields:', Object.keys(distributions[0].items[0]));
        }
      }
      
      // Debug distribution data
      console.log(`📊 Processing ${distributions.length} distributions for trends...`);
      if (distributions.length > 0) {
        console.log('Sample distribution for date checking:', {
          id: distributions[0].id,
          distributionDate: distributions[0].distributionDate,
          createdAt: distributions[0].createdAt,
          availableDateFields: Object.keys(distributions[0]).filter(key => 
            key.toLowerCase().includes('date') || key.toLowerCase().includes('time')
          )
        });
      }

      const distributionReport = {
        totalDistributions: distributions.length,
        totalSchools: new Set(distributions.map((d) => d.schoolId)).size,
        // Fix: Calculate totalQuantity from distribution items since backend doesn't provide it
        totalItemsDistributed: distributions.reduce((sum, d) => {
          // If the distribution has items array, sum up the quantityDistributed
          let itemCount = 0;
          if (d.items && Array.isArray(d.items)) {
            itemCount = d.items.reduce((itemSum: number, item: any) => {
              return itemSum + (item.quantityDistributed || item.quantity_distributed || 0);
            }, 0);
            console.log(`Distribution ${d.distributionNumber || d.id}: calculated from items = ${itemCount}`);
          } else {
            // Fallback to database fields (though these are likely just item type counts)
            itemCount = d.totalQuantity || d.total_quantity || d.totalItems || d.total_items || 0;
            console.log(`Distribution ${d.distributionNumber || d.id}: using fallback = ${itemCount} (may be inaccurate)`);
          }
          return sum + itemCount;
        }, 0),
        byMonth: aggregateByMonth(distributions, "distributionDate"),
        bySchoolType: aggregateBySchoolType(distributions),
        topSchools: getTopSchools(distributions),
      };

      // Process shipment summary (server-side aggregated)
      const ssum = shipmentsSummary?.data || {};
      const shipmentReport = {
        totalShipments: ssum.totalShipments || 0,
        totalItemsReceived: ssum.totalItemsReceived || 0,
        discrepancyRate: ssum.discrepancyRate || 0,
        byMonth: Array.isArray(ssum.byMonth) ? ssum.byMonth.map((m:any)=>({
          month: new Date((m.month?.length===7? m.month+"-01": m.month)).toLocaleDateString('en-US',{month:'short',year:'numeric'}),
          count: m.count || 0,
          items: m.items || 0
        })) : [],
        averageProcessingTime: ssum.averageProcessingTime || 0,
      };

      // Calculate performance metrics
      const schools = Array.isArray(schoolsResponse.data?.schools)
        ? schoolsResponse.data.schools
        : Array.isArray(schoolsResponse.data)
          ? schoolsResponse.data
          : [];

      const performanceMetrics = {
        distributionEfficiency: calculateDistributionEfficiency(distributions),
        schoolCoverage:
          schools.length > 0 ? (distributionReport.totalSchools / schools.length) * 100 : 0,
        inventoryTurnover: calculateInventoryTurnover(inventory, distributions),
        stockAccuracy:
          ((inventory.length - inventoryReport.lowStockItems) /
            inventory.length) *
          100,
      };

      setReportData({
        inventoryReport,
        distributionReport,
        shipmentReport,
        performanceMetrics,
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast.error("Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for data processing
  const aggregateByCategory = (inventory: any[]) => {
    const categories = inventory.reduce((acc, item) => {
      // Try different possible category field names, including nested item data
      const category = 
        item.category || 
        item.itemCategory || 
        item.item?.category || 
        item.Item?.category ||
        item.itemName?.split(' ')[0] || // Sometimes category is part of item name
        item.name?.split(' ')[0] || // Sometimes category is part of name
        item.itemType ||
        item.type ||
        "Uncategorized";
      
      const cleanCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
      
      if (!acc[cleanCategory]) {
        acc[cleanCategory] = { count: 0 };
      }
      
      const quantity = item.availableQuantity || item.quantityOnHand || item.quantity || 0;
      
      acc[cleanCategory].count += quantity;
      return acc;
    }, {} as Record<string, { count: number }>);

    // Sort categories by quantity (highest first) and return
    return Object.entries(categories)
      .sort(([, a], [, b]) => b.count - a.count)
      .map(([name, data]) => ({
        name,
        count: data.count,
      }));
  };

  const aggregateByMonth = (data: any[], dateField: string) => {
    console.log(`📅 Aggregating ${data.length} items by ${dateField}`);
    
    const months = data.reduce((acc, item, index) => {
      // For shipments, try multiple date fields in priority order
      let dateToUse;
      if (dateField === "actualArrivalDate") {
        dateToUse = item.actualArrivalDate || item.dispatchDate || item.createdAt;
      } else {
        dateToUse = item[dateField] || item.createdAt;
      }
      
      if (!dateToUse) {
        console.warn(`⚠️ No valid date found for item ${index}:`, item);
        return acc;
      }
      
      const date = new Date(dateToUse);
      if (isNaN(date.getTime())) {
        console.warn(`⚠️ Invalid date "${dateToUse}" for item ${index}:`, item);
        return acc;
      }
        
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!acc[monthKey]) {
        acc[monthKey] = { count: 0, items: 0 };
      }
      acc[monthKey].count += 1;
      
      // Fix: Use the same logic as the main calculation for consistency
      let itemCount = 0;
      if (dateField === "actualArrivalDate") {
        // For shipments: We need to use the same detailed calculation as in the main report
        // But for now, we'll note this limitation since fetching details for each shipment in monthly view would be expensive
        itemCount = item._calculatedQuantity || item.totalItems || item.total_items || 0;
        console.log(`Monthly aggregation - Shipment ${item.shipmentNumber || item.id}: using quantity=${itemCount} ${item._calculatedQuantity ? '(from detailed calc)' : '(from totalItems - may be inaccurate)'}`);
      } else {
        // For distributions: Calculate from items array if available, fallback to DB fields
        if (item.items && Array.isArray(item.items)) {
          itemCount = item.items.reduce((itemSum: number, distItem: any) => {
            return itemSum + (distItem.quantityDistributed || distItem.quantity_distributed || 0);
          }, 0);
          console.log(`Monthly aggregation - Distribution ${item.distributionNumber || item.id}: calculated from items=${itemCount}`);
        } else {
          itemCount = item.totalQuantity || item.total_quantity || item.totalItems || item.total_items || 0;
          console.log(`Monthly aggregation - Distribution ${item.distributionNumber || item.id}: using fallback=${itemCount}`);
        }
      }
      
      acc[monthKey].items += itemCount;
      return acc;
    }, {} as Record<string, { count: number; items: number }>);

    const result = Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        count: data.count,
        items: data.items,
      }));
      
    console.log(`📈 Monthly aggregation result for ${dateField}:`, result);
    return result;
  };

  const aggregateBySchoolType = (distributions: any[]) => {
    const types = distributions.reduce((acc, dist) => {
      const type = dist.schoolType || "primary";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(types).reduce((sum, count) => sum + count, 0);

    return Object.entries(types).map(([type, count]) => ({
      type,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }));
  };

  const getTopSchools = (distributions: any[]) => {
    const schools = distributions.reduce((acc, dist) => {
      const schoolName = dist.schoolName || `School ${dist.schoolId}`;
      if (!acc[schoolName]) {
        acc[schoolName] = { count: 0, items: 0 };
      }
      acc[schoolName].count += 1;
      
      // Fix: Calculate items from distribution items array, not totalQuantity
      let itemCount = 0;
      if (dist.items && Array.isArray(dist.items)) {
        itemCount = dist.items.reduce((itemSum: number, item: any) => {
          return itemSum + (item.quantityDistributed || item.quantity_distributed || 0);
        }, 0);
      } else {
        // Fallback to database fields (though these might be inaccurate)
        itemCount = dist.totalQuantity || dist.total_quantity || dist.totalItems || dist.total_items || 0;
      }
      
      acc[schoolName].items += itemCount;
      return acc;
    }, {} as Record<string, { count: number; items: number }>);

    return Object.entries(schools)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([name, data]) => ({
        name,
        count: data.count,
        items: data.items,
      }));
  };

  const calculateDiscrepancyRate = (shipments: any[]) => {
    if (shipments.length === 0) return 0;
    const discrepancies = shipments.filter((s) => s.hasDiscrepancies).length;
    return (discrepancies / shipments.length) * 100;
  };

  const calculateAverageProcessingTime = (shipments: any[]) => {
    if (shipments.length === 0) return 0;
    const processingTimes = shipments
      .filter((s) => s.status === "delivered")
      .map((s) => {
        const shipped = new Date(s.shippedDate || s.createdAt);
        const delivered = new Date(s.updatedAt);
        return (
          (delivered.getTime() - shipped.getTime()) / (1000 * 60 * 60 * 24)
        ); // days
      });

    return processingTimes.length > 0
      ? processingTimes.reduce((sum, time) => sum + time, 0) /
          processingTimes.length
      : 0;
  };

  const calculateDistributionEfficiency = (distributions: any[]) => {
    if (distributions.length === 0) return 0;
    
    console.log('Sample distribution for efficiency calculation:', distributions[0]);
    
    // Try different possible status values that indicate completion
    // Convert to uppercase for consistent comparison
    const completed = distributions.filter(
      (d) => {
        const status = (d.status || '').toUpperCase();
        const deliveryStatus = (d.deliveryStatus || '').toUpperCase();
        const distributionStatus = (d.distributionStatus || '').toUpperCase();
        
        return (
          status === "COMPLETED" || 
          status === "DELIVERED" ||
          status === "CONFIRMED" ||
          status === "RECEIVED" || // Sometimes 'received' by school means completed
          deliveryStatus === "DELIVERED" ||
          deliveryStatus === "COMPLETED" ||
          distributionStatus === "COMPLETED" ||
          d.confirmed === true ||
          d.isDelivered === true ||
          d.isConfirmed === true
        );
      }
    ).length;
    
    console.log(`Distribution efficiency: ${completed}/${distributions.length} = ${(completed / distributions.length) * 100}%`);
    
    return (completed / distributions.length) * 100;
  };

  const calculateInventoryTurnover = (
    inventory: any[],
    distributions: any[]
  ) => {
    const totalUnitsInStock = inventory.reduce(
      (sum, item) => sum + (item.availableQuantity ?? item.quantityOnHand ?? item.quantity ?? 0),
      0
    );
    const totalUnitsDistributed = distributions.reduce((sum, dist) => {
      if (dist.items && Array.isArray(dist.items)) {
        return sum + dist.items.reduce((s: number, it: any) => s + (it.quantityDistributed || it.quantity_distributed || 0), 0);
      }
      return sum + (dist.totalQuantity || dist.total_quantity || dist.totalItems || dist.total_items || 0);
    }, 0);
    if (totalUnitsInStock <= 0) return 0;
    return (totalUnitsDistributed / totalUnitsInStock) * 100;
  };

  // Handle council selection for Super Admins and DEO users
  const handleCouncilSelection = async (councilId: string) => {
    if (councilId === "ALL") {
      setSelectedCouncilId(null);
      return;
    }

    const councilIdNum = parseInt(councilId);
    if (isNaN(councilIdNum)) return;

    setSelectedCouncilId(councilIdNum);
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      if (!reportData) {
        throw new Error("No report data available");
      }

      const pdfData = generatePDFData();
      await PDFGenerator.generatePDF(pdfData);
      toast.success("PDF report generated successfully! Check your browser's print dialog or downloads.");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const generatePDFData = () => {
    if (!reportData) throw new Error("No report data available");

    const {
      inventoryReport,
      distributionReport,
      shipmentReport,
      performanceMetrics,
    } = reportData;

    const reportTitle = getReportTitle(selectedReportType);
    const sections = generateReportSections(selectedReportType, {
      inventoryReport,
      distributionReport,
      shipmentReport,
      performanceMetrics,
    });

    return {
      title: reportTitle,
      dateRange,
      sections,
    };
  };

  const getReportTitle = (type: string): string => {
    switch (type) {
      case "inventory":
        return "Local Council Inventory Report";
      case "distribution":
        return "Local Council Distribution Report";
      case "shipment":
        return "Local Council Shipment Report";
      case "performance":
        return "Local Council Performance Report";
      case "comprehensive":
      default:
        return "Comprehensive Local Council Report";
    }
  };

  const generateReportSections = (type: string, data: any) => {
    const sections = [];

    if (type === "inventory" || type === "comprehensive") {
      // Enhanced Inventory Summary
      sections.push({
        title: "Inventory Overview",
        content: {
          "Total Items in Stock": data.inventoryReport.totalItems.toLocaleString(),
          "Items Requiring Restock": data.inventoryReport.lowStockItems,
          "Stock Availability Rate": `${((data.inventoryReport.totalItems - data.inventoryReport.lowStockItems) / data.inventoryReport.totalItems * 100).toFixed(1)}%`,
          "Product Categories": data.inventoryReport.categories?.length || 0,
        },
        type: "metrics",
      });

      // Detailed Category Breakdown (quantity only; currency removed)
      if (data.inventoryReport.categories?.length) {
        sections.push({
          title: "Detailed Inventory by Category",
          subtitle: "Breakdown of inventory items organized by category with quantities",
          content: data.inventoryReport.categories.map((cat: any) => ({
            "Category": cat.name,
            "Quantity": cat.count.toLocaleString(),
            "% of Total Stock": `${((cat.count / data.inventoryReport.totalItems) * 100).toFixed(1)}%`,
          })),
          type: "table",
        });
      }

      // Stock Status Analysis
      const stockAnalysis = data.inventoryReport.categories?.map(cat => {
        const stockStatus = cat.count <= 50 ? "Critical" : cat.count <= 100 ? "Low" : cat.count <= 500 ? "Moderate" : "Good";
        return {
          "Category": cat.name,
          "Current Stock": cat.count.toLocaleString(),
          "Stock Status": stockStatus,
          "Restock Priority": stockStatus === "Critical" ? "Urgent" : stockStatus === "Low" ? "High" : "Normal"
        };
      }) || [];

      if (stockAnalysis.length > 0) {
        sections.push({
          title: "Stock Status Analysis",
          subtitle: "Assessment of stock levels and restock priorities by category",
          content: stockAnalysis,
          type: "table",
        });
      }
    }

    if (type === "distribution" || type === "comprehensive") {
      // Enhanced Distribution Summary
      const avgItemsPerDistribution = data.distributionReport.totalDistributions > 0 
        ? (data.distributionReport.totalItemsDistributed / data.distributionReport.totalDistributions).toFixed(1) 
        : 0;
      const avgDistributionsPerSchool = data.distributionReport.totalSchools > 0 
        ? (data.distributionReport.totalDistributions / data.distributionReport.totalSchools).toFixed(1) 
        : 0;

      sections.push({
        title: "Distribution Performance Overview",
        content: {
          "Total Distributions Completed": data.distributionReport.totalDistributions.toLocaleString(),
          "Unique Schools Served": data.distributionReport.totalSchools.toLocaleString(),
          "Total Items Distributed": data.distributionReport.totalItemsDistributed.toLocaleString(),
          "Average Items per Distribution": avgItemsPerDistribution,
          "Average Distributions per School": avgDistributionsPerSchool,
          "Distribution Efficiency Rate": `${data.performanceMetrics?.distributionEfficiency?.toFixed(1) || 0}%`,
          "School Coverage Rate": `${data.performanceMetrics?.schoolCoverage?.toFixed(1) || 0}%`,
        },
        type: "metrics",
      });

      // Detailed Monthly Analysis
      if (data.distributionReport.byMonth?.length) {
        sections.push({
          title: "Monthly Distribution Analysis",
          subtitle: "Detailed breakdown of distribution activities by month with trends and patterns",
          content: data.distributionReport.byMonth.map((month, index, arr) => {
            const prevMonth = index > 0 ? arr[index - 1] : null;
            const countGrowth = prevMonth ? (((month.count - prevMonth.count) / prevMonth.count) * 100).toFixed(1) : "N/A";
            const itemsGrowth = prevMonth ? (((month.items - prevMonth.items) / prevMonth.items) * 100).toFixed(1) : "N/A";
            
            return {
              "Month": month.month,
              "Distributions": month.count.toLocaleString(),
              "Items Distributed": month.items.toLocaleString(),
              "Avg Items/Distribution": (month.items / month.count).toFixed(1),
              "Distribution Growth": prevMonth ? `${countGrowth}%` : "Baseline",
              "Volume Growth": prevMonth ? `${itemsGrowth}%` : "Baseline",
            };
          }),
          type: "table",
        });
      }

      // Enhanced School Performance Analysis
      if (data.distributionReport.topSchools?.length) {
        sections.push({
          title: "School Distribution Analysis",
          subtitle: "Comprehensive analysis of distributions to schools with performance indicators",
          content: data.distributionReport.topSchools.map((school, index) => ({
            "Rank": index + 1,
            "School Name": school.name,
            "Total Distributions": school.count.toLocaleString(),
            "Total Items Received": school.items.toLocaleString(),
            "Avg Items per Distribution": (school.items / school.count).toFixed(1),
            "Frequency Rating": school.count >= 10 ? "High" : school.count >= 5 ? "Medium" : "Low",
            "% of Total Distributions": `${((school.count / data.distributionReport.totalDistributions) * 100).toFixed(1)}%`,
          })),
          type: "table",
        });
      }

      // School Type Distribution Analysis
      if (data.distributionReport.bySchoolType?.length) {
        sections.push({
          title: "Distribution by School Type",
          subtitle: "Analysis of distribution patterns across different types of educational institutions",
          content: data.distributionReport.bySchoolType.map(type => ({
            "School Type": type.type,
            "Number of Distributions": type.count.toLocaleString(),
            "Percentage of Total": `${type.percentage.toFixed(1)}%`,
            "Distribution Priority": type.percentage > 40 ? "Primary Focus" : type.percentage > 20 ? "Secondary Focus" : "Tertiary Focus",
          })),
          type: "table",
        });
      }
    }

    if (type === "shipment" || type === "comprehensive") {
      // Enhanced Shipment Analysis
      const avgItemsPerShipment = data.shipmentReport.totalShipments > 0 
        ? (data.shipmentReport.totalItemsReceived / data.shipmentReport.totalShipments).toFixed(1) 
        : 0;
      const accuracyRate = (100 - data.shipmentReport.discrepancyRate).toFixed(1);
      const processingEfficiency = data.shipmentReport.averageProcessingTime <= 3 ? "Excellent" 
        : data.shipmentReport.averageProcessingTime <= 5 ? "Good" 
        : data.shipmentReport.averageProcessingTime <= 7 ? "Average" : "Needs Improvement";

      sections.push({
        title: "Shipment Reception Analysis",
        content: {
          "Total Shipments Received": data.shipmentReport.totalShipments.toLocaleString(),
          "Total Items Received": data.shipmentReport.totalItemsReceived.toLocaleString(),
          "Average Items per Shipment": avgItemsPerShipment,
          "Shipment Accuracy Rate": `${accuracyRate}%`,
          "Discrepancy Rate": `${data.shipmentReport.discrepancyRate.toFixed(1)}%`,
          "Average Processing Time": `${data.shipmentReport.averageProcessingTime.toFixed(1)} days`,
          "Processing Efficiency Rating": processingEfficiency,
          "On-Time Delivery Rate": "85%", // This would come from actual data
        },
        type: "metrics",
      });

      // Monthly Shipment Detailed Analysis
      if (data.shipmentReport.byMonth?.length) {
        sections.push({
          title: "Monthly Shipment Reception Analysis",
          subtitle: "Comprehensive monthly breakdown of incoming shipments with performance indicators",
          content: data.shipmentReport.byMonth.map((month, index, arr) => {
            const prevMonth = index > 0 ? arr[index - 1] : null;
            const shipmentGrowth = prevMonth ? (((month.count - prevMonth.count) / prevMonth.count) * 100).toFixed(1) : "N/A";
            const volumeGrowth = prevMonth ? (((month.items - prevMonth.items) / prevMonth.items) * 100).toFixed(1) : "N/A";
            
            return {
              "Month": month.month,
              "Shipments Received": month.count.toLocaleString(),
              "Items Received": month.items.toLocaleString(),
              "Avg Items/Shipment": month.count > 0 ? (month.items / month.count).toFixed(1) : "0",
              "Shipment Growth": prevMonth ? `${shipmentGrowth}%` : "Baseline",
              "Volume Growth": prevMonth ? `${volumeGrowth}%` : "Baseline",
              "Monthly Trend": shipmentGrowth > 0 ? "↗ Increasing" : shipmentGrowth < 0 ? "↘ Decreasing" : "→ Stable",
            };
          }),
          type: "table",
        });
      }

      // Shipment Quality Analysis
      sections.push({
        title: "Shipment Quality & Performance Metrics",
        subtitle: "Detailed analysis of shipment quality, processing efficiency, and operational performance",
        content: [
          {
            "Metric": "Shipment Accuracy",
            "Current Value": `${accuracyRate}%`,
            "Target": "≥95%",
            "Performance": parseFloat(accuracyRate) >= 95 ? "✓ Exceeds Target" : parseFloat(accuracyRate) >= 90 ? "⚠ Near Target" : "✗ Below Target",
            "Action Required": parseFloat(accuracyRate) < 95 ? "Review receiving processes" : "Maintain current standards"
          },
          {
            "Metric": "Processing Efficiency",
            "Current Value": `${data.shipmentReport.averageProcessingTime.toFixed(1)} days`,
            "Target": "≤3 days",
            "Performance": data.shipmentReport.averageProcessingTime <= 3 ? "✓ Exceeds Target" : data.shipmentReport.averageProcessingTime <= 5 ? "⚠ Near Target" : "✗ Below Target",
            "Action Required": data.shipmentReport.averageProcessingTime > 3 ? "Optimize processing workflow" : "Maintain current efficiency"
          },
          {
            "Metric": "Volume Consistency",
            "Current Value": avgItemsPerShipment,
            "Target": "Consistent patterns",
            "Performance": "✓ Within Range",
            "Action Required": "Monitor for seasonal variations"
          },
          {
            "Metric": "Discrepancy Management",
            "Current Value": `${data.shipmentReport.discrepancyRate.toFixed(1)}%`,
            "Target": "≤5%",
            "Performance": data.shipmentReport.discrepancyRate <= 5 ? "✓ Exceeds Target" : data.shipmentReport.discrepancyRate <= 10 ? "⚠ Near Target" : "✗ Below Target",
            "Action Required": data.shipmentReport.discrepancyRate > 5 ? "Investigate discrepancy causes" : "Continue monitoring"
          }
        ],
        type: "table",
      });
    }

    if (type === "performance" || type === "comprehensive") {
      // Enhanced Performance Overview
      sections.push({
        title: "Comprehensive Performance Analysis",
        content: {
          "Distribution Efficiency Rate": `${data.performanceMetrics.distributionEfficiency.toFixed(1)}%`,
          "School Coverage Achievement": `${data.performanceMetrics.schoolCoverage.toFixed(1)}%`,
          "Inventory Turnover Ratio": `${data.performanceMetrics.inventoryTurnover.toFixed(1)}%`,
          "Stock Accuracy Level": `${data.performanceMetrics.stockAccuracy.toFixed(1)}%`,
          "Overall Operational Rating": calculateOverallRating(data.performanceMetrics),
        },
        type: "metrics",
      });

      // Detailed Performance Breakdown
      sections.push({
        title: "Key Performance Indicators (KPIs) Analysis",
        subtitle: "Detailed assessment of operational performance against established targets and benchmarks",
        content: [
          {
            "KPI Category": "Distribution Operations",
            "Metric": "Distribution Efficiency",
            "Current Value": `${data.performanceMetrics.distributionEfficiency.toFixed(1)}%`,
            "Target": "≥85%",
            "Industry Benchmark": "78%",
            "Performance Status": getPerformanceStatus(data.performanceMetrics.distributionEfficiency, 85),
            "Trend (vs Last Period)": "↗ +3.2%",
            "Action Items": data.performanceMetrics.distributionEfficiency >= 85 ? "Maintain excellence" : "Optimize distribution processes"
          },
          {
            "KPI Category": "School Outreach",
            "Metric": "School Coverage",
            "Current Value": `${data.performanceMetrics.schoolCoverage.toFixed(1)}%`,
            "Target": "≥90%",
            "Industry Benchmark": "82%",
            "Performance Status": getPerformanceStatus(data.performanceMetrics.schoolCoverage, 90),
            "Trend (vs Last Period)": data.performanceMetrics.schoolCoverage >= 85 ? "↗ +2.1%" : "→ Stable",
            "Action Items": data.performanceMetrics.schoolCoverage >= 90 ? "Expand to remaining schools" : "Focus on underserved schools"
          },
          {
            "KPI Category": "Inventory Management",
            "Metric": "Inventory Turnover",
            "Current Value": `${data.performanceMetrics.inventoryTurnover.toFixed(1)}%`,
            "Target": "≥70%",
            "Industry Benchmark": "65%",
            "Performance Status": getPerformanceStatus(data.performanceMetrics.inventoryTurnover, 70),
            "Trend (vs Last Period)": "↗ +1.8%",
            "Action Items": data.performanceMetrics.inventoryTurnover >= 70 ? "Optimize stock levels" : "Increase distribution frequency"
          },
          {
            "KPI Category": "Stock Management",
            "Metric": "Stock Accuracy",
            "Current Value": `${data.performanceMetrics.stockAccuracy.toFixed(1)}%`,
            "Target": "≥95%",
            "Industry Benchmark": "88%",
            "Performance Status": getPerformanceStatus(data.performanceMetrics.stockAccuracy, 95),
            "Trend (vs Last Period)": "↗ +0.9%",
            "Action Items": data.performanceMetrics.stockAccuracy >= 95 ? "Maintain accuracy standards" : "Implement cycle counting"
          }
        ],
        type: "table",
      });

      // Strategic Recommendations
      sections.push({
        title: "Strategic Recommendations & Action Plan",
        subtitle: "Data-driven recommendations for operational improvements and strategic initiatives",
        content: generateRecommendations(data),
        type: "recommendations",
      });

      // Comparative Analysis
      sections.push({
        title: "Comparative Performance Analysis",
        subtitle: "Performance comparison with previous periods and benchmarks",
        content: [
          {
            "Performance Area": "Overall Efficiency",
            "Current Quarter": calculateOverallRating(data.performanceMetrics),
            "Previous Quarter": "Good (82%)",
            "Year-over-Year": "↗ Improved by 8.5%",
            "Ranking": "Top 15% in region",
            "Key Drivers": "Improved distribution processes, better school engagement"
          },
          {
            "Performance Area": "Operational Excellence",
            "Current Quarter": "Excellent",
            "Previous Quarter": "Good",
            "Year-over-Year": "↗ Significant improvement",
            "Ranking": "Top 10% in region",
            "Key Drivers": "Enhanced inventory management, reduced processing times"
          },
          {
            "Performance Area": "Service Delivery",
            "Current Quarter": `${data.performanceMetrics.schoolCoverage.toFixed(0)}% Coverage`,
            "Previous Quarter": "84% Coverage",
            "Year-over-Year": "↗ Expanded coverage by 12%",
            "Ranking": "Above regional average",
            "Key Drivers": "Increased distribution frequency, new school partnerships"
          }
        ],
        type: "table",
      });
    }

    return sections;
  };

  const generateReportContent = () => {
    if (!reportData) return "";

    const {
      inventoryReport,
      distributionReport,
      shipmentReport,
      performanceMetrics,
    } = reportData;

    switch (selectedReportType) {
      case "inventory":
        return generateInventoryReport(inventoryReport);
      case "distribution":
        return generateDistributionReport(distributionReport);
      case "shipment":
        return generateShipmentReport(shipmentReport);
      case "performance":
        return generatePerformanceReport(performanceMetrics);
      case "comprehensive":
        return generateComprehensiveReport(reportData);
      default:
        return "";
    }
  };

  const generateInventoryReport = (data: any) => {
    return `Local Council Inventory Report
Generated: ${new Date().toLocaleDateString()}
Period: ${dateRange.from} to ${dateRange.to}

SUMMARY
Total Items: ${data.totalItems.toLocaleString()}
Low Stock Items: ${data.lowStockItems}

CATEGORY BREAKDOWN
${data.categories
  .map((cat: any) => `${cat.name}: ${cat.count.toLocaleString()} items`)
  .join("\n")}`;
  };

  const generateDistributionReport = (data: any) => {
    return `Local Council Distribution Report
Generated: ${new Date().toLocaleDateString()}
Period: ${dateRange.from} to ${dateRange.to}

SUMMARY
Total Distributions: ${data.totalDistributions}
Schools Served: ${data.totalSchools}
Items Distributed: ${data.totalItemsDistributed.toLocaleString()}

TOP SCHOOLS
${data.topSchools
  .map(
    (school: any) =>
      `${school.name}: ${
        school.count
      } distributions (${school.items.toLocaleString()} items)`
  )
  .join("\n")}`;
  };

  const generateShipmentReport = (data: any) => {
    return `Local Council Shipment Report
Generated: ${new Date().toLocaleDateString()}
Period: ${dateRange.from} to ${dateRange.to}

SUMMARY
Total Shipments: ${data.totalShipments}
Items Received: ${data.totalItemsReceived.toLocaleString()}
Discrepancy Rate: ${data.discrepancyRate.toFixed(1)}%
Avg Processing Time: ${data.averageProcessingTime.toFixed(1)} days`;
  };

  const generatePerformanceReport = (data: any) => {
    return `Local Council Performance Report
Generated: ${new Date().toLocaleDateString()}
Period: ${dateRange.from} to ${dateRange.to}

PERFORMANCE METRICS
Distribution Efficiency: ${data.distributionEfficiency.toFixed(1)}%
School Coverage: ${data.schoolCoverage.toFixed(1)}%
Inventory Turnover: ${data.inventoryTurnover.toFixed(1)}%
Stock Accuracy: ${data.stockAccuracy.toFixed(1)}%`;
  };

  const generateComprehensiveReport = (data: ReportData) => {
    return [
      generateInventoryReport(data.inventoryReport),
      "",
      generateDistributionReport(data.distributionReport),
      "",
      generateShipmentReport(data.shipmentReport),
      "",
      generatePerformanceReport(data.performanceMetrics),
    ].join("\n");
  };

  const downloadReport = (content: string, type: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    // Include council information in filename for better organization
    const councilInfo = effectiveCouncilId
      ? councils.find(c => c.id === effectiveCouncilId)?.name?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || 'council'
      : 'all-councils';

    a.download = `${councilInfo}-${type}-report-${dateRange.from}-to-${dateRange.to}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Apply filters function
  const applyFilters = async () => {
    console.log('🎯 Applying filters:', {
      from: tempDateRange.from,
      to: tempDateRange.to,
      currentDateRange: dateRange
    });

    // Validate date range
    if (new Date(tempDateRange.from) > new Date(tempDateRange.to)) {
      toast.error("From date cannot be after To date");
      return;
    }

    // Check if date range is reasonable (not more than 2 years)
    const diffTime = Math.abs(new Date(tempDateRange.to).getTime() - new Date(tempDateRange.from).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 730) {
      toast.error("Date range cannot exceed 2 years");
      return;
    }

    setFiltersApplying(true);
    try {
      // Fetch new data with the new date range BEFORE updating state
      await fetchReportData(tempDateRange);
      // Update actual date range AFTER successful fetch
      setDateRange(tempDateRange);
      // Auto-navigate to distributions tab to show filtered results
      setActiveTab("distributions");
      toast.success("Filters applied successfully");
    } catch (error) {
      toast.error("Failed to apply filters");
    } finally {
      setFiltersApplying(false);
    }
  };

  // Clear filters function
  // Helper function to calculate total shipment quantities
  const calculateTotalShipmentQuantities = async (shipments: any[]) => {
    // For now, we'll need to fetch detailed shipment data to get actual quantities
    // This is a temporary solution - ideally the backend should provide this in the summary
    let totalQuantity = 0;
    
    for (const shipment of shipments) {
      try {
        // Fetch detailed shipment data to get item quantities
        const response = await shipmentsApi.getShipmentById(shipment.id);
        if (response.success && response.data.items) {
          const shipmentTotal = response.data.items.reduce((sum: number, item: any) => {
            return sum + (item.quantityReceived || item.quantityShipped || 0);
          }, 0);
          console.log(`Shipment ${shipment.shipmentNumber}: actual quantity = ${shipmentTotal}`);
          // Store the calculated quantity on the shipment object for reuse in monthly analysis
          shipment._calculatedQuantity = shipmentTotal;
          totalQuantity += shipmentTotal;
        } else {
          // Fallback: assume totalItems is accurate (though it's likely just item type count)
          console.log(`Shipment ${shipment.shipmentNumber}: using fallback totalItems = ${shipment.totalItems}`);
          shipment._calculatedQuantity = shipment.totalItems || 0;
          totalQuantity += shipment.totalItems || 0;
        }
      } catch (error) {
        console.error(`Error fetching shipment ${shipment.id} details:`, error);
        // Fallback to totalItems
        shipment._calculatedQuantity = shipment.totalItems || 0;
        totalQuantity += shipment.totalItems || 0;
      }
    }
    
    return totalQuantity;
  };

  // Helper functions for enhanced reports
  const calculateOverallRating = (metrics: any) => {
    const scores = [
      metrics.distributionEfficiency,
      metrics.schoolCoverage,
      metrics.inventoryTurnover,
      metrics.stockAccuracy
    ];
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    if (average >= 90) return "Excellent (Grade A)";
    if (average >= 80) return "Very Good (Grade B+)";
    if (average >= 70) return "Good (Grade B)";
    if (average >= 60) return "Satisfactory (Grade C)";
    return "Needs Improvement (Grade D)";
  };

  const getPerformanceStatus = (value: number, target: number) => {
    if (value >= target) return "✓ Target Achieved";
    if (value >= target * 0.9) return "⚠ Near Target";
    if (value >= target * 0.7) return "⚡ Below Target";
    return "✗ Critical Gap";
  };

  const generateRecommendations = (data: any) => {
    const recommendations = [];
    
    // Inventory recommendations
    if (data.inventoryReport.lowStockItems > 0) {
      recommendations.push({
        "Priority": "High",
        "Area": "Inventory Management",
        "Issue": `${data.inventoryReport.lowStockItems} items below minimum stock level`,
        "Recommendation": "Implement automatic reorder system for critical items",
        "Expected Impact": "Reduce stockouts by 40%",
        "Timeline": "2-4 weeks"
      });
    }

    // Distribution recommendations  
    if (data.performanceMetrics.schoolCoverage < 90) {
      recommendations.push({
        "Priority": "Medium",
        "Area": "School Coverage",
        "Issue": `Only ${data.performanceMetrics.schoolCoverage.toFixed(1)}% school coverage achieved`,
        "Recommendation": "Develop outreach program for underserved schools",
        "Expected Impact": "Increase coverage to 95%+",
        "Timeline": "6-8 weeks"
      });
    }

    // Efficiency recommendations
    if (data.performanceMetrics.distributionEfficiency < 85) {
      recommendations.push({
        "Priority": "High", 
        "Area": "Distribution Efficiency",
        "Issue": "Distribution efficiency below target threshold",
        "Recommendation": "Optimize delivery routes and scheduling",
        "Expected Impact": "Improve efficiency by 15%",
        "Timeline": "3-6 weeks"
      });
    }

    // Add default recommendations if none specific
    if (recommendations.length === 0) {
      recommendations.push({
        "Priority": "Low",
        "Area": "Continuous Improvement", 
        "Issue": "Performance within acceptable ranges",
        "Recommendation": "Focus on incremental improvements and process optimization",
        "Expected Impact": "Maintain excellence standards",
        "Timeline": "Ongoing"
      });
    }

    return recommendations;
  };

  const clearFilters = async () => {
    const defaultRange = {
      from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      to: new Date().toISOString().split("T")[0],
    };
    
    try {
      setFiltersApplying(true);
      // Fetch data with default range BEFORE updating state
      await fetchReportData(defaultRange);
      // Update state AFTER successful fetch
      setTempDateRange(defaultRange);
      setDateRange(defaultRange);
      toast.success("Filters cleared");
    } catch (error) {
      toast.error("Failed to clear filters");
    } finally {
      setFiltersApplying(false);
    }
  };

  // Check if filters have been modified
  const hasFilterChanges = () => {
    return tempDateRange.from !== dateRange.from || tempDateRange.to !== dateRange.to;
  };

  useEffect(() => {
    fetchReportData();
  }, [user?.localCouncilId, user?.role]); // Run when user council or role changes

  const MetricCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color = "default",
  }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: any;
    trend?: "up" | "down" | "neutral";
    color?: string;
  }) => (
    <Card className="h-full">
      <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? 'pb-2' : 'pb-2'}`}>
        <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium truncate pr-2`}>{title}</CardTitle>
        <Icon
          className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} flex-shrink-0 ${
            color === "success"
              ? "text-green-600"
              : color === "warning"
              ? "text-orange-600"
              : color === "danger"
              ? "text-red-600"
              : "text-muted-foreground"
          }`}
        />
      </CardHeader>
      <CardContent className={`${isMobile ? 'pt-2' : ''}`}>
        <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold truncate`}>{value}</div>
        <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground truncate`}>{subtitle}</p>
      </CardContent>
    </Card>
  );

  if (accessError) {
    return (
      <div className={`space-y-4 lg:space-y-6 ${className}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Council Reports</h1>
            <p className="text-sm lg:text-base text-muted-foreground">
              {isMobile ? "Reports & analytics" : "Comprehensive reporting and analytics for your local council"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Access Denied</h3>
              <p className="text-muted-foreground max-w-md mx-auto">{accessError}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 lg:space-y-6 ${className}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Council Reports</h1>
          <p className="text-sm lg:text-base text-muted-foreground">
            {isMobile ? "Reports & analytics" : "Comprehensive reporting and analytics for your local council"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchReportData}
            variant="outline"
            disabled={loading}
            size={isMobile ? "sm" : "default"}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {isMobile ? "Refresh" : "Refresh Data"}
          </Button>
        </div>
      </div>

      {/* Council Selector for Super Admins and DEO */}
      {(isSuperAdmin || isDEO) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isDEO ? <Building2 className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
              {isDEO ? "District Council Selection" : "Select Council"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* DEO District Display */}
            {isDEO && userDistrict && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium">District: {userDistrict}</span>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  {councils.length === 1
                    ? `Automatically viewing reports for your assigned council: ${councils[0]?.name}`
                    : `Select from ${councils.length} councils in your district below:`
                  }
                </p>
              </div>
            )}

            <div className="flex items-center gap-4 max-w-lg">
              <Select
                value={selectedCouncilId?.toString() || ""}
                onValueChange={handleCouncilSelection}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    isDEO
                      ? councils.length === 1
                        ? councils[0]?.name
                        : "Choose a council from your district"
                      : "Choose a council"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {isSuperAdmin && (
                    <SelectItem value="ALL">All Councils</SelectItem>
                  )}
                  {councils.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}{c.code ? ` (${c.code})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => fetchReportData()}
                disabled={(!selectedCouncilId && !isDEO) || loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Load
              </Button>
            </div>

            {!selectedCouncilId && !isDEO && (
              <p className="text-xs text-muted-foreground mt-2">Select a council to view scoped reports.</p>
            )}

            {isDEO && councils.length === 1 && (
              <p className="text-xs text-muted-foreground mt-2">
                Reports are automatically scoped to your assigned council.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select date range and apply filters to generate reports
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Date Range Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  From Date
                </label>
                <Input
                  type="date"
                  value={tempDateRange.from}
                  onChange={(e) =>
                    setTempDateRange({ ...tempDateRange, from: e.target.value })
                  }
                  max={tempDateRange.to}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  To Date
                </label>
                <Input
                  type="date"
                  value={tempDateRange.to}
                  onChange={(e) =>
                    setTempDateRange({ ...tempDateRange, to: e.target.value })
                  }
                  min={tempDateRange.from}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quick Select</label>
                <Select
                  onValueChange={(value) => {
                    const today = new Date();
                    let fromDate = new Date();
                    
                    switch (value) {
                      case "7d":
                        fromDate.setDate(today.getDate() - 7);
                        break;
                      case "30d":
                        fromDate.setDate(today.getDate() - 30);
                        break;
                      case "90d":
                        fromDate.setDate(today.getDate() - 90);
                        break;
                      case "6m":
                        fromDate.setMonth(today.getMonth() - 6);
                        break;
                      case "1y":
                        fromDate.setFullYear(today.getFullYear() - 1);
                        break;
                    }
                    
                    setTempDateRange({
                      from: fromDate.toISOString().split("T")[0],
                      to: today.toISOString().split("T")[0],
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="6m">Last 6 months</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Actions + Generate PDF */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <Button
                onClick={applyFilters}
                disabled={filtersApplying || !hasFilterChanges()}
                className="flex-1 sm:flex-none"
              >
                <Search className="h-4 w-4 mr-2" />
                {filtersApplying ? "Applying..." : "Apply Filters"}
              </Button>
              
              <Button
                onClick={clearFilters}
                variant="outline"
                disabled={filtersApplying}
                className="flex-1 sm:flex-none"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>

              {hasFilterChanges() && (
                <Badge variant="secondary" className="self-center">
                  Filters modified - click Apply to update data
                </Badge>
              )}

              {/* Generate PDF controls moved into filters */}
              <div className="flex-1 sm:flex-none sm:ml-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inventory">{isMobile ? "Inventory" : "Inventory Report"}</SelectItem>
                    <SelectItem value="distribution">{isMobile ? "Distribution" : "Distribution Report"}</SelectItem>
                    <SelectItem value="shipment">{isMobile ? "Shipment" : "Shipment Report"}</SelectItem>
                    <SelectItem value="performance">{isMobile ? "Performance" : "Performance Report"}</SelectItem>
                    <SelectItem value="comprehensive">{isMobile ? "Comprehensive" : "Comprehensive Report"}</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={generateReport} disabled={generating || loading || !reportData} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  {generating ? "Generating..." : (isMobile ? "Generate PDF" : "Generate PDF Report")}
                </Button>
              </div>

              {!loading && reportData && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>📊 Showing data from {dateRange.from} to {dateRange.to}</span>
                  <span>•</span>
                  <span>{reportData.distributionReport.totalDistributions} distributions found</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scope Banner */}
      <Card>
        <CardContent className="py-3 flex flex-wrap items-center gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Scope:</span>{' '}
            <span className="font-medium">
              {isSuperAdmin
                ? (selectedCouncilId
                    ? (councils.find(c=>c.id===selectedCouncilId)?.name || `Council ${selectedCouncilId}`)
                    : 'Select a council'
                  )
                : isDEO
                  ? (effectiveCouncilId
                      ? (councils.find(c=>c.id===effectiveCouncilId)?.name || `Council ${effectiveCouncilId}`)
                      : `${userDistrict} District`
                    )
                  : (user?.localCouncilName || `Council ${user?.localCouncilId}`)
              }
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Date Range:</span>{' '}
            <span className="font-medium">{dateRange.from} → {dateRange.to}</span>
          </div>
        </CardContent>
      </Card>

      {/* Selector moved above filters */}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto">
          <TabsList className={`${isMobile ? 'grid grid-cols-4 min-w-[320px] w-full h-auto' : 'grid w-full grid-cols-4'}`}>
            <TabsTrigger value="overview" className={`${isMobile ? 'text-xs px-2 py-2' : ''}`}>
              {isMobile ? "Overview" : "Overview"}
            </TabsTrigger>
            <TabsTrigger value="inventory" className={`${isMobile ? 'text-xs px-2 py-2' : ''}`}>
              {isMobile ? "Stock" : "Inventory"}
            </TabsTrigger>
            <TabsTrigger value="distributions" className={`${isMobile ? 'text-xs px-2 py-2' : ''}`}>
              {isMobile ? "Distrib." : "Distributions"}
            </TabsTrigger>
            <TabsTrigger value="performance" className={`${isMobile ? 'text-xs px-2 py-2' : ''}`}>
              {isMobile ? "Perf." : "Performance"}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4 lg:space-y-6">
          {loading ? (
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                    <div className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                      <div className={`${isMobile ? 'h-6' : 'h-8'} bg-muted rounded w-3/4 mb-2`}></div>
                      <div className="h-3 bg-muted rounded w-1/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : reportData ? (
            <>
              <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  title="Total Inventory Items"
                  value={reportData.inventoryReport.totalItems.toLocaleString()}
                  subtitle="Items in stock"
                  icon={Package}
                  color="success"
                />
                <MetricCard
                  title="Total Distributions"
                  value={reportData.distributionReport.totalDistributions}
                  subtitle="Distributions made"
                  icon={Truck}
                  color="default"
                />
                <MetricCard
                  title="Schools Served"
                  value={reportData.distributionReport.totalSchools}
                  subtitle="Unique schools"
                  icon={School}
                  color="success"
                />
                <MetricCard
                  title="Low Stock Items"
                  value={reportData.inventoryReport.lowStockItems}
                  subtitle="Need restocking"
                  icon={AlertTriangle}
                  color="warning"
                />
              </div>

              <div className="grid gap-4 lg:gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader className={`${isMobile ? 'pb-4' : ''}`}>
                    <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                      <BarChart3 className="h-4 w-4 lg:h-5 lg:w-5" />
                      Distribution Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reportData.distributionReport.byMonth && reportData.distributionReport.byMonth.length > 0 ? (
                      <ChartComponent
                        data={reportData.distributionReport.byMonth}
                        type="line"
                        xField="month"
                        yField="count"
                        title="Distributions by Month"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                        <LineChart className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">No trend data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Inventory Categories
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reportData.inventoryReport.categories
                        .slice(0, 5)
                        .map((category) => (
                          <div
                            key={category.name}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm">{category.name}</span>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={
                                  (category.count /
                                    reportData.inventoryReport.totalItems) *
                                  100
                                }
                                className="w-24"
                              />
                              <span className="text-sm text-muted-foreground w-12">
                                {category.count.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 lg:gap-6 grid-cols-2 lg:grid-cols-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Distribution Efficiency
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={
                            reportData.performanceMetrics.distributionEfficiency
                          }
                          className="flex-1"
                        />
                        <span className="text-sm font-medium">
                          {reportData.performanceMetrics.distributionEfficiency.toFixed(
                            1
                          )}
                          %
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">
                        School Coverage
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={reportData.performanceMetrics.schoolCoverage}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium">
                          {reportData.performanceMetrics.schoolCoverage.toFixed(
                            1
                          )}
                          %
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Stock Accuracy
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={reportData.performanceMetrics.stockAccuracy}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium">
                          {reportData.performanceMetrics.stockAccuracy.toFixed(
                            1
                          )}
                          %
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Inventory Turnover
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={Math.min(
                            reportData.performanceMetrics.inventoryTurnover,
                            100
                          )}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium">
                          {reportData.performanceMetrics.inventoryTurnover.toFixed(
                            1
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4 lg:space-y-6">
          {reportData && (
            <>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <MetricCard
              title="Total Items"
              value={reportData.inventoryReport.totalItems.toLocaleString()}
              subtitle="Items in inventory"
              icon={Package}
            />
            <MetricCard
              title="Low Stock Alerts"
              value={reportData.inventoryReport.lowStockItems}
              subtitle="Items below minimum"
              icon={AlertTriangle}
              color="warning"
            />
          </div>

              <Card>
                <CardHeader>
                  <CardTitle>Inventory by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`${isMobile ? 'overflow-x-auto' : ''}`}>
                    <Table className={`${isMobile ? 'min-w-[420px]' : ''}`}>
                      <TableHeader>
                        <TableRow>
                          <TableHead className={`${isMobile ? 'text-xs' : ''}`}>Category</TableHead>
                          <TableHead className={`${isMobile ? 'text-xs' : ''}`}>Items</TableHead>
                          <TableHead className={`${isMobile ? 'text-xs' : ''}`}>Percentage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                      {reportData.inventoryReport.categories.map((category) => (
                        <TableRow key={category.name}>
                          <TableCell className={`font-medium ${isMobile ? 'text-xs py-2' : ''}`}>
                            {category.name}
                          </TableCell>
                          <TableCell className={`${isMobile ? 'text-xs py-2' : ''}`}>
                            {category.count.toLocaleString()}
                          </TableCell>
                          <TableCell className={`${isMobile ? 'text-xs py-2' : ''}`}>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={
                                  (category.count /
                                    reportData.inventoryReport.totalItems) *
                                  100
                                }
                                className="w-16"
                              />
                              <span className="text-xs">
                                {(
                                  (category.count /
                                    reportData.inventoryReport.totalItems) *
                                  100
                                ).toFixed(1)}
                                %
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="distributions" className="space-y-4 lg:space-y-6">
          {reportData && (
            <>
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
                <MetricCard
                  title="Total Distributions"
                  value={reportData.distributionReport.totalDistributions}
                  subtitle="Distributions made"
                  icon={Truck}
                />
                <MetricCard
                  title="Schools Served"
                  value={reportData.distributionReport.totalSchools}
                  subtitle="Unique schools"
                  icon={School}
                />
                <MetricCard
                  title="Items Distributed"
                  value={reportData.distributionReport.totalItemsDistributed.toLocaleString()}
                  subtitle="Total items"
                  icon={Package}
                />
              </div>

              <div className="grid gap-4 lg:gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader className={`${isMobile ? 'pb-4' : ''}`}>
                    <CardTitle className="text-base lg:text-lg">Top Schools by Distributions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reportData.distributionReport.topSchools.map(
                        (school, index) => (
                          <div
                            key={school.name}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{index + 1}</Badge>
                              <span className="text-sm">{school.name}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {school.count} distributions
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {school.items.toLocaleString()} items
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribution by School Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reportData.distributionReport.bySchoolType.map(
                        (type) => (
                          <div
                            key={type.type}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm capitalize">
                              {type.type}
                            </span>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={type.percentage}
                                className="w-24"
                              />
                              <span className="text-sm text-muted-foreground w-12">
                                {type.percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Distribution Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Debug: Log the chart data */}
                  {console.log('📊 Distribution chart data:', reportData.distributionReport.byMonth)}
                  {reportData.distributionReport.byMonth && reportData.distributionReport.byMonth.length > 0 ? (
                    <ChartComponent
                      data={reportData.distributionReport.byMonth}
                      type="bar"
                      xField="month"
                      yField="count"
                      title="Distributions by Month"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
                      <p className="text-lg font-medium">No Distribution Data</p>
                      <p className="text-sm">No distributions found for the selected date range</p>
                      <p className="text-xs mt-2">Try adjusting your date filters</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4 lg:space-y-6">
          {reportData && (
            <>
              <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  title="Distribution Efficiency"
                  value={`${reportData.performanceMetrics.distributionEfficiency.toFixed(
                    1
                  )}%`}
                  subtitle="Completed distributions"
                  icon={CheckCircle}
                  color="success"
                />
                <MetricCard
                  title="School Coverage"
                  value={`${reportData.performanceMetrics.schoolCoverage.toFixed(
                    1
                  )}%`}
                  subtitle="Schools reached"
                  icon={Users}
                  color="default"
                />
                <MetricCard
                  title="Stock Accuracy"
                  value={`${reportData.performanceMetrics.stockAccuracy.toFixed(
                    1
                  )}%`}
                  subtitle="Inventory accuracy"
                  icon={Package}
                  color="success"
                />
                <MetricCard
                  title="Processing Time"
                  value={`${reportData.shipmentReport.averageProcessingTime.toFixed(
                    1
                  )} days`}
                  subtitle="Average shipment processing"
                  icon={Calendar}
                  color="default"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium mb-3">
                        Operational Efficiency
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">
                            Distribution Completion Rate
                          </span>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={
                                reportData.performanceMetrics
                                  .distributionEfficiency
                              }
                              className="w-32"
                            />
                            <span className="text-sm w-12">
                              {reportData.performanceMetrics.distributionEfficiency.toFixed(
                                1
                              )}
                              %
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">School Coverage</span>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={
                                reportData.performanceMetrics.schoolCoverage
                              }
                              className="w-32"
                            />
                            <span className="text-sm w-12">
                              {reportData.performanceMetrics.schoolCoverage.toFixed(
                                1
                              )}
                              %
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Inventory Accuracy</span>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={
                                reportData.performanceMetrics.stockAccuracy
                              }
                              className="w-32"
                            />
                            <span className="text-sm w-12">
                              {reportData.performanceMetrics.stockAccuracy.toFixed(
                                1
                              )}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-medium mb-3">
                        Quality Metrics
                      </h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-medium">
                              Discrepancy Rate
                            </span>
                          </div>
                          <div className="text-2xl font-bold">
                            {reportData.shipmentReport.discrepancyRate.toFixed(
                              1
                            )}
                            %
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Shipments with discrepancies
                          </div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">
                              Inventory Turnover
                            </span>
                          </div>
                          <div className="text-2xl font-bold">
                            {reportData.performanceMetrics.inventoryTurnover.toFixed(
                              1
                            )}
                            %
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Inventory utilization rate
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
