"use client";

import { useState, useEffect, type ComponentType, type SVGProps } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  School, 
  Search, 
  MapPin, 
  Users, 
  Package, 
  Truck,
  Plus,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  MoreHorizontal,
  Send
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { schoolsApi, localCouncilsApi, directShipmentsApi, warehousesApi } from "@/lib/api";
import { toast } from "sonner";
import { useResponsive } from "@/hooks/useResponsive";
import { useFilteredExport, ExportButton, ExportStatus } from "@/components/export";

interface SchoolWithStats {
  id: number;
  name: string;
  code?: string;
  localCouncilId: number;
  address?: string;
  schoolType: "PRIMARY" | "SECONDARY" | "COMBINED";
  enrollmentCount: number;
  isActive: boolean;
  localCouncilName?: string;
  councilName?: string;
  region?: string;
  lastShipmentDate?: string;
  pendingShipments?: number;
  totalShipments?: number;
}

interface DirectShipmentWithDetails {
  id: number;
  referenceNumber: string;
  warehouseId: number;
  warehouseName: string;
  schoolId: number;
  schoolName: string;
  schoolCode?: string;
  status: 'pending' | 'dispatched' | 'in_transit' | 'delivered' | 'confirmed' | 'cancelled';
  shipmentType: 'emergency' | 'special_program' | 'direct_allocation' | 'pilot_program' | 'disaster_relief';
  priorityLevel: 'low' | 'normal' | 'high' | 'urgent' | 'critical';
  totalItems: number;
  createdAt: string;
  expectedDeliveryDate?: string;
  authorizedByName: string;
}

type DirectStatus = DirectShipmentWithDetails['status'];
type PriorityLevel = DirectShipmentWithDetails['priorityLevel'];
type ShipmentType = DirectShipmentWithDetails['shipmentType'];
type IconType = ComponentType<SVGProps<SVGSVGElement>>;

const STATUS_CONFIG: Record<DirectStatus, { label: string; color: string; icon: IconType }> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  dispatched: {
    label: "Dispatched",
    color: "bg-blue-100 text-blue-800",
    icon: Truck,
  },
  in_transit: {
    label: "In Transit",
    color: "bg-purple-100 text-purple-800",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-green-200 text-green-900",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
};

const PRIORITY_CONFIG: Record<PriorityLevel, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-gray-100 text-gray-800" },
  normal: { label: "Normal", color: "bg-blue-100 text-blue-800" },
  high: { label: "High", color: "bg-yellow-100 text-yellow-800" },
  urgent: { label: "Urgent", color: "bg-orange-100 text-orange-800" },
  critical: { label: "Critical", color: "bg-red-100 text-red-800" },
};

const TYPE_CONFIG: Record<ShipmentType, { label: string; color: string; icon: IconType }> = {
  emergency: {
    label: "Emergency",
    color: "bg-red-100 text-red-800",
    icon: AlertTriangle,
  },
  special_program: {
    label: "Special Program",
    color: "bg-blue-100 text-blue-800",
    icon: Package,
  },
  direct_allocation: {
    label: "Direct Allocation",
    color: "bg-green-100 text-green-800",
    icon: School,
  },
  pilot_program: {
    label: "Pilot Program",
    color: "bg-purple-100 text-purple-800",
    icon: Package,
  },
  disaster_relief: {
    label: "Disaster Relief",
    color: "bg-orange-100 text-orange-800",
    icon: AlertTriangle,
  },
};

export function SchoolsForDirectShipments() {
  const { user } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const searchParams = useSearchParams();
  const [schools, setSchools] = useState<SchoolWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSchools, setTotalSchools] = useState(0);
  const [pageSize] = useState(12); // 12 cards per page

  // Direct shipments state  
  const [directShipments, setDirectShipments] = useState<DirectShipmentWithDetails[]>([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [shipmentsPage, setShipmentsPage] = useState(1);
  const [totalShipments, setTotalShipments] = useState(0);
  const [shipmentsPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState(() => {
    // Check URL parameter for initial tab
    const tabParam = searchParams.get("tab");
    return tabParam === "shipments" ? "shipments" : "schools";
  });
  
  // Shipment filters and actions
  const [shipmentFilters, setShipmentFilters] = useState<any>({});
  const [shipmentSearchTerm, setShipmentSearchTerm] = useState("");
  const [selectedShipments, setSelectedShipments] = useState<number[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [warehouses, setWarehouses] = useState<any[]>([]);

  // Load all shipments on mount for statistics calculation
  useEffect(() => {
    if (user) {
      // Load shipments data first to ensure statistics are available
      fetchDirectShipments();
    }
  }, [user]);

  // Fetch data when page, search, region changes
  useEffect(() => {
    fetchSchoolsData();
  }, [currentPage, searchTerm, selectedRegion]);

  // Memoize school statistics calculations
  const schoolsWithStats = useMemo(() => {
    if (schools.length === 0) return schools;
    
    return schools.map(school => {
      const schoolShipments = directShipments.filter(shipment => shipment.schoolId === school.id);
      const pendingShipments = schoolShipments.filter(s => s.status === 'pending' || s.status === 'dispatched' || s.status === 'in_transit').length;
      const completedShipments = schoolShipments.filter(s => s.status === 'delivered' || s.status === 'confirmed').length;
      const lastShipment = schoolShipments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      return {
        ...school,
        pendingShipments,
        totalShipments: completedShipments,
        lastShipmentDate: lastShipment?.createdAt
      };
    });
  }, [schools, directShipments]);

  // Memoize region filtering
  const filteredSchoolsWithStats = useMemo(() => {
    if (selectedRegion === "all") return schoolsWithStats;
    return schoolsWithStats.filter(school => school.region === selectedRegion);
  }, [schoolsWithStats, selectedRegion]);

  // Fetch shipments when tab changes or shipments page changes
  useEffect(() => {
    if (activeTab === "shipments" && user) {
      fetchDirectShipments();
      loadWarehouses();
    }
  }, [activeTab, shipmentsPage, user, shipmentFilters]);

  const fetchSchoolsData = async () => {
    setLoading(true);
    try {
      // Build filters for API call
      const filters = {
        isActive: true,
        search: searchTerm || undefined
      };

      // Fetch schools and councils in parallel
      const [schoolsResponse, councilsResponse] = await Promise.all([
        schoolsApi.getSchools(currentPage, pageSize, filters),
        localCouncilsApi.getLocalCouncils(1, 100, { isActive: true })
      ]);

      let schoolsData: SchoolWithStats[] = [];
      let councilsData: any[] = [];

      if (schoolsResponse.success && schoolsResponse.data?.schools) {
        schoolsData = schoolsResponse.data.schools;
        setTotalSchools(schoolsResponse.data.total || 0);
      }

      if (councilsResponse.success && councilsResponse.data?.councils) {
        councilsData = councilsResponse.data.councils;
      }

      // Enhance schools with council and region information
      const enhancedSchools = schoolsData.map(school => ({
        ...school,
        councilName: school.localCouncilName || councilsData.find(c => c.id === school.localCouncilId)?.name || 'Unknown Council',
        region: councilsData.find(c => c.id === school.localCouncilId)?.region || 'Unknown Region',
        pendingShipments: 0, // Will be calculated in memoized component
        totalShipments: 0,   // Will be calculated in memoized component
        lastShipmentDate: undefined // Will be calculated in memoized component
      }));

      // Filter by region on frontend if region filter is applied
      const filteredSchools = selectedRegion === "all" 
        ? enhancedSchools 
        : enhancedSchools.filter(school => school.region === selectedRegion);

      setSchools(filteredSchools);
    } catch (error) {
      console.error('Error fetching schools data:', error);
      toast.error('Failed to load schools data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDirectShipments = async () => {
    // Check if user is authenticated before making API call
    if (!user) {
      console.log('User not authenticated, skipping direct shipments fetch');
      setShipmentsLoading(false);
      return;
    }

    setShipmentsLoading(true);
    try {
      console.log('Fetching direct shipments for user:', user.role);
      const response = await directShipmentsApi.getDirectShipments(
        shipmentsPage,
        shipmentsPageSize,
        shipmentFilters
      );
      
      console.log('Direct shipments response:', response);
      
      if (response.success && response.data) {
        setDirectShipments(response.data);
        setTotalShipments(response.pagination?.total || 0);
      } else {
        console.error('Direct shipments API error:', response.error);
        toast.error(response.error?.message || "Failed to load direct shipments");
      }
    } catch (error: any) {
      console.error('Error fetching direct shipments:', error);
      
      // Handle different error types with more specific messages
      let errorMessage = "Failed to load direct shipments";
      
      if (error.response) {
        const status = error.response.status;
        const responseData = error.response.data;
        
        switch (status) {
          case 401:
            errorMessage = "Authentication failed. Please log in again.";
            break;
          case 403:
            errorMessage = "You don't have permission to view direct shipments.";
            break;
          case 404:
            errorMessage = "Direct shipments endpoint not found. Please contact support.";
            break;
          case 500:
            errorMessage = responseData?.error?.message || "Server error occurred. Please try again later.";
            console.error("Server error details:", responseData);
            break;
          default:
            errorMessage = responseData?.error?.message || `HTTP ${status}: Failed to fetch shipments`;
        }
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      
      // For debugging: log additional error details
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code,
        stack: error.stack
      });
    } finally {
      setShipmentsLoading(false);
    }
  };

  const loadWarehouses = async () => {
    try {
      const response = await warehousesApi.getWarehouses(1, 100);
      if (response.success && response.data?.warehouses) {
        setWarehouses(response.data.warehouses);
      }
    } catch (error) {
      console.error("Error loading warehouses:", error);
    }
  };

  // Search and filter handlers
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    setCurrentPage(1); // Reset to first page when changing region
  };

  // Get unique regions for filter dropdown
  const regions = ["all", ...Array.from(new Set(schoolsWithStats.map(s => s.region).filter(Boolean)))];

  // Shipment filter handlers
  const handleShipmentSearch = (value: string) => {
    setShipmentSearchTerm(value);
    setShipmentFilters((prev: any) => ({ ...prev, search: value || undefined }));
    setShipmentsPage(1);
  };

  const handleShipmentStatusFilter = (status: string) => {
    setShipmentFilters((prev: any) => ({
      ...prev,
      status: status === "all" ? undefined : status,
    }));
    setShipmentsPage(1);
  };

  const handleShipmentWarehouseFilter = (warehouseId: string) => {
    setShipmentFilters((prev: any) => ({
      ...prev,
      warehouseId: warehouseId === "all" ? undefined : parseInt(warehouseId),
    }));
    setShipmentsPage(1);
  };

  const handleShipmentTypeFilter = (type: string) => {
    setShipmentFilters((prev: any) => ({
      ...prev,
      shipmentType: type === "all" ? undefined : type,
    }));
    setShipmentsPage(1);
  };

  const handleShipmentPriorityFilter = (priority: string) => {
    setShipmentFilters((prev: any) => ({
      ...prev,
      priorityLevel: priority === "all" ? undefined : priority,
    }));
    setShipmentsPage(1);
  };

  const handleShipmentDateRangeFilter = (from: string, to: string) => {
    setDateRange({ from, to });
    setShipmentFilters((prev: any) => ({
      ...prev,
      dateFrom: from || undefined,
      dateTo: to || undefined,
    }));
    setShipmentsPage(1);
  };

  const clearShipmentFilters = () => {
    setShipmentFilters({});
    setShipmentSearchTerm("");
    setDateRange({ from: "", to: "" });
    setShipmentsPage(1);
  };

  // Export: Direct school distributions (direct shipments)
  const {
    exportData: exportDirectShipments,
    isExporting: exportingDirectShipments,
    error: exportDirectError,
    lastExportCount: lastDirectExportCount,
    reset: resetDirectExport,
  } = useFilteredExport<DirectShipmentWithDetails>({
    includeFiltersInAPI: true,
    apiCall: async (params) => {
      const max = params?.maxRecords && params.maxRecords > 0 ? params.maxRecords : 1000;
      const pageSize = 100; // backend limit guard
      let page = 1;
      let collected: any[] = [];
      let total = Infinity;
      const filters = { ...shipmentFilters, ...(params?.filters || {}) } as any;

      while (collected.length < max && (page - 1) * pageSize < total) {
        const res = await directShipmentsApi.getDirectShipments(page, pageSize, filters);
        if (!res.success) throw new Error(res.error?.message || 'Failed to fetch direct shipments');
        // Accept either array or {items/pagination}
        const data = Array.isArray(res.data) ? res.data : (res.data?.items || res.data || []);
        const pageTotal = res.pagination?.total ?? (Array.isArray(res.data) ? res.data.length : data.length);
        total = typeof pageTotal === 'number' ? pageTotal : data.length;
        if (!Array.isArray(data) || data.length === 0) break;
        collected = collected.concat(data);
        if (data.length < pageSize) break;
        page += 1;
      }
      if (collected.length > max) collected = collected.slice(0, max);
      return { success: true, data: collected } as any;
    },
    getCurrentFilters: () => ({ ...shipmentFilters, search: shipmentSearchTerm, dateFrom: dateRange.from, dateTo: dateRange.to } as any),
    headers: [
      'Reference Number',
      'Warehouse',
      'School',
      'Status',
      'Type',
      'Priority',
      'Item Types',
      'Total Items',
      'Total Qty Shipped',
      'Total Qty Received',
      'Item Names',
      'Dispatch Date',
      'Created Date',
      'Expected Delivery',
      'Actual Delivery Date',
      'Days In Transit',
      'On-Time',
      'Authorized By'
      , 'Discrepancy Notes'
    ],
    dataTransform: (rows: any[]) => rows.map((s) => {
      const items = Array.isArray(s.items) ? s.items : [];
      const qtyShipped = items.reduce((sum: number, it: any) => sum + (Number(it.quantityShipped) || 0), 0);
      const qtyReceived = items.reduce((sum: number, it: any) => sum + (Number(it.quantityReceived) || 0), 0);
      const itemNames = items.map((it: any) => it.itemName).filter(Boolean).join('; ');
      const dispatch = s.dispatchDate ? new Date(s.dispatchDate) : null;
      const actual = s.actualDeliveryDate ? new Date(s.actualDeliveryDate) : null;
      const expected = s.expectedDeliveryDate ? new Date(s.expectedDeliveryDate) : null;
      const daysInTransit = dispatch && (actual || new Date())
        ? Math.max(0, Math.round(((actual || new Date()).getTime() - dispatch.getTime()) / (1000*60*60*24)))
        : '';
      const onTime = actual && expected ? (actual.getTime() <= expected.getTime() ? 'Yes' : 'No') : '';

      return [
        s.referenceNumber || '',
        s.warehouseName || '',
        s.schoolName || '',
        (s.status || '').toString().toUpperCase(),
        s.shipmentType || '',
        s.priorityLevel || '',
        items.length ? String(items.length) : String(s.totalItems ?? 0),
        String(s.totalItems ?? 0),
        String(qtyShipped),
        String(qtyReceived),
        itemNames,
        s.dispatchDate ? new Date(s.dispatchDate).toLocaleDateString() : '',
        s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '',
        s.expectedDeliveryDate ? new Date(s.expectedDeliveryDate).toLocaleDateString() : '',
        s.actualDeliveryDate ? new Date(s.actualDeliveryDate).toLocaleDateString() : '',
        String(daysInTransit),
        onTime,
        s.authorizedByName || '',
        (s.discrepancyNotes || s.notes || '')
      ];
    }),
    filename: `direct-school-distributions-${new Date().toISOString().split('T')[0]}.csv`,
    maxRecords: 2000,
  });

  const handleSelectAllShipments = (checked: boolean) => {
    if (checked) {
      setSelectedShipments(directShipments.map((s) => s.id));
    } else {
      setSelectedShipments([]);
    }
  };

  const handleSelectShipment = (shipmentId: number, checked: boolean) => {
    if (checked) {
      setSelectedShipments((prev) => [...prev, shipmentId]);
    } else {
      setSelectedShipments((prev) => prev.filter((id) => id !== shipmentId));
    }
  };

  const handleBulkShipmentAction = async (action: string, selectedIds: number[]) => {
    if (selectedIds.length === 0) {
      toast.error("Please select shipments to perform bulk action");
      return;
    }

    try {
      switch (action) {
        case "dispatch":
          for (const id of selectedIds) {
            await directShipmentsApi.dispatchDirectShipment(id);
          }
          toast.success(`${selectedIds.length} shipments dispatched successfully`);
          break;
        case "cancel":
          for (const id of selectedIds) {
            await directShipmentsApi.updateDirectShipmentStatus(id, {
              status: "cancelled",
            });
          }
          toast.success(`${selectedIds.length} shipments cancelled successfully`);
          break;
        default:
          toast.error("Unknown action");
          return;
      }
      fetchDirectShipments(); // Reload data
    } catch (error) {
      console.error("Bulk action error:", error);
      toast.error("Failed to perform bulk action");
    }
  };

  // Check permissions
  const canViewShipments = user?.role === "super_admin" || user?.role === "national_manager" || user?.role === "view_only";
  const canCreateShipments = user?.role === "super_admin" || user?.role === "national_manager";

  // Calculate pagination info
  const totalPages = Math.ceil(totalSchools / pageSize);
  const showingFrom = (currentPage - 1) * pageSize + 1;
  const showingTo = Math.min(currentPage * pageSize, totalSchools);

  // Shipments pagination
  const shipmentsTotalPages = Math.ceil(totalShipments / shipmentsPageSize);

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: DirectStatus) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: PriorityLevel) => {
    const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.normal;
    
    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: ShipmentType) => {
    const config = TYPE_CONFIG[type] || TYPE_CONFIG.direct_allocation;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4 lg:space-y-6 px-4 lg:px-0">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-0">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">
              {isMobile ? 'Schools - Shipments' : 'Schools - Direct Shipments'}
            </h1>
            <div className="flex items-center gap-2 text-sm lg:text-base text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading schools...</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6 px-4 lg:px-0">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            {isMobile ? 'Schools - Shipments' : 'Schools - Direct Shipments'}
          </h1>
          <p className="text-sm lg:text-base text-muted-foreground">
            {isMobile ? 'Manage schools and shipments' : 'Manage schools and view direct warehouse-to-school shipments'}
          </p>
        </div>
        <Link href="/warehouse/direct-shipments/create">
          <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            {isMobile ? 'Create Shipment' : 'Create Direct Shipment'}
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="schools" className="flex-1 text-xs lg:text-sm">
            Schools ({totalSchools})
          </TabsTrigger>
          <TabsTrigger value="shipments" className="flex-1 text-xs lg:text-sm">
            {isMobile ? 'Shipments' : 'Direct Shipments'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schools" className="space-y-6">

      {/* Filters */}
      <Card>
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={isMobile ? "Search schools..." : "Search schools by name, code, or council..."}
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full lg:w-48">
              <select
                value={selectedRegion}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Regions</option>
                {regions.slice(1).map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card>
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">
                  {isMobile ? 'Schools' : 'Total Schools'}
                </p>
                <p className="text-lg lg:text-2xl font-bold">{totalSchools}</p>
                <p className="text-xs text-muted-foreground">
                  {isMobile ? `${showingFrom}-${showingTo}` : `Showing ${showingFrom}-${showingTo}`}
                </p>
              </div>
              <School className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">
                  {isMobile ? 'Active' : 'Active Shipments'}
                </p>
                <p className="text-lg lg:text-2xl font-bold">
                  {directShipments.filter(s => s.status === 'pending' || s.status === 'dispatched' || s.status === 'in_transit').length}
                </p>
              </div>
              <Truck className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">
                  {isMobile ? 'Students' : 'Total Students'}
                </p>
                <p className="text-lg lg:text-2xl font-bold">
                  {(() => {
                    const total = filteredSchoolsWithStats.reduce((sum, school) => sum + school.enrollmentCount, 0);
                    return isMobile && total > 1000
                      ? `${(total / 1000).toFixed(1)}k`
                      : total.toLocaleString();
                  })()} 
                </p>
              </div>
              <Users className="h-6 w-6 lg:h-8 lg:w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">
                  {isMobile ? 'Completed' : 'Completed Shipments'}
                </p>
                <p className="text-lg lg:text-2xl font-bold">
                  {directShipments.filter(s => s.status === 'delivered' || s.status === 'confirmed').length}
                </p>
              </div>
              <Package className="h-6 w-6 lg:h-8 lg:w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schools Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {filteredSchoolsWithStats.map((school) => (
          <Card key={school.id} className="hover:shadow-md transition-shadow h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 lg:gap-3 min-w-0 flex-1">
                  <div className="p-2 bg-blue-100 rounded flex-shrink-0">
                    <School className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base lg:text-lg font-medium leading-5 break-words line-clamp-2">
                      {school.name}
                    </CardTitle>
                    <p className="text-xs lg:text-sm text-muted-foreground mt-1">{school.code}</p>
                  </div>
                </div>
                {school.pendingShipments && school.pendingShipments > 0 && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs flex-shrink-0 whitespace-nowrap">
                    {isMobile ? school.pendingShipments : `${school.pendingShipments} Pending`}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 lg:space-y-4 flex-1 flex flex-col">
              <div className="space-y-2 flex-1">
                <div className="flex items-start gap-2 text-xs lg:text-sm">
                  <MapPin className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="break-words line-clamp-2 text-xs lg:text-sm leading-4">
                    {school.councilName}, {school.region}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs lg:text-sm">
                  <Users className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground flex-shrink-0" />
                  <span>{school.enrollmentCount.toLocaleString()} students</span>
                </div>
                {school.lastShipmentDate && (
                  <div className="flex items-start gap-2 text-xs lg:text-sm">
                    <Truck className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="break-words leading-4">
                      {isMobile ? 'Last: ' : 'Last shipment: '}
                      {new Date(school.lastShipmentDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t mt-auto">
                <div className="text-xs lg:text-sm text-muted-foreground">
                  {school.totalShipments || 0} total shipments
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link href={`/warehouse/direct-shipments/create?schoolId=${school.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full text-xs">
                      {isMobile ? 'Create' : 'Create Shipment'}
                    </Button>
                  </Link>
                  <Link href={`/warehouse/direct-shipments?schoolId=${school.id}`} className="flex-1">
                    <Button size="sm" variant="ghost" className="w-full text-xs">
                      {isMobile ? 'History' : 'View History'}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSchoolsWithStats.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <School className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No schools found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or filters.
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setSelectedRegion("all");
              setCurrentPage(1);
            }} className="w-full sm:w-auto">
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {showingFrom} to {showingTo} of {totalSchools} schools
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="shipments" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span className="text-lg lg:text-xl">Filters</span>
                </div>
                <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-2">
                  <ExportButton
                    onExport={exportDirectShipments}
                    isExporting={exportingDirectShipments}
                    tooltip={`Export direct school distributions${(shipmentSearchTerm || Object.keys(shipmentFilters).length) ? ' (with current filters)' : ''}`}
                    showProgress={true}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-[44px] lg:min-h-[32px] text-sm"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    {showAdvancedFilters ? "Hide" : "Show"} Advanced
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="min-h-[44px] lg:min-h-[32px] text-sm"
                    onClick={clearShipmentFilters}
                  >
                    Clear All
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ExportStatus
                isExporting={exportingDirectShipments}
                error={exportDirectError}
                lastExportCount={lastDirectExportCount}
                onRetry={exportDirectShipments}
                onReset={resetDirectExport}
                compact={true}
              />
              <div className="space-y-4">
                {/* Basic Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search shipments..."
                      value={shipmentSearchTerm}
                      onChange={(e) => handleShipmentSearch(e.target.value)}
                      className="pl-10 min-h-[48px] lg:min-h-[40px]"
                    />
                  </div>

                  <Select
                    value={shipmentFilters.status || "all"}
                    onValueChange={handleShipmentStatusFilter}
                  >
                    <SelectTrigger className="min-h-[48px] lg:min-h-[40px]">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                        <SelectItem key={status} value={status}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={shipmentFilters.warehouseId?.toString() || "all"}
                    onValueChange={handleShipmentWarehouseFilter}
                  >
                    <SelectTrigger className="min-h-[48px] lg:min-h-[40px]">
                      <SelectValue placeholder="All Warehouses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Warehouses</SelectItem>
                      {warehouses.map((warehouse) => (
                        <SelectItem
                          key={warehouse.id}
                          value={warehouse.id.toString()}
                        >
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={shipmentFilters.shipmentType || "all"}
                    onValueChange={handleShipmentTypeFilter}
                  >
                    <SelectTrigger className="min-h-[48px] lg:min-h-[40px]">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.entries(TYPE_CONFIG).map(([type, config]) => (
                        <SelectItem key={type} value={type}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={shipmentFilters.priorityLevel || "all"}
                    onValueChange={handleShipmentPriorityFilter}
                  >
                    <SelectTrigger className="min-h-[48px] lg:min-h-[40px]">
                      <SelectValue placeholder="All Priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => (
                        <SelectItem key={priority} value={priority}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Advanced Filters */}
                {showAdvancedFilters && (
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="dateFrom">Created From</Label>
                        <Input
                          id="dateFrom"
                          type="date"
                          value={dateRange.from}
                          onChange={(e) =>
                            handleShipmentDateRangeFilter(e.target.value, dateRange.to)
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="dateTo">Created To</Label>
                        <Input
                          id="dateTo"
                          type="date"
                          value={dateRange.to}
                          onChange={(e) =>
                            handleShipmentDateRangeFilter(dateRange.from, e.target.value)
                          }
                        />
                      </div>
                      <div className="flex items-end">
                        <div className="flex space-x-2">
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700"
                          >
                            Emergency:{" "}
                            {
                              directShipments.filter(
                                (s) =>
                                  s.priorityLevel === "critical" ||
                                  s.shipmentType === "emergency"
                              ).length
                            }
                          </Badge>
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-700"
                          >
                            Urgent:{" "}
                            {
                              directShipments.filter((s) => s.priorityLevel === "urgent")
                                .length
                            }
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <Card>
              <CardContent className="p-3 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-muted-foreground">
                      Total Shipments
                    </p>
                    <p className="text-lg lg:text-2xl font-bold">{totalShipments}</p>
                  </div>
                  <Package className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-muted-foreground">
                      In Transit
                    </p>
                    <p className="text-lg lg:text-2xl font-bold">
                      {
                        directShipments.filter(
                          (s) =>
                            s.status === "dispatched" || s.status === "in_transit"
                        ).length
                      }
                    </p>
                  </div>
                  <Truck className="h-6 w-6 lg:h-8 lg:w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-muted-foreground">
                      Delivered
                    </p>
                    <p className="text-lg lg:text-2xl font-bold">
                      {
                        directShipments.filter(
                          (s) =>
                            s.status === "delivered" || s.status === "confirmed"
                        ).length
                      }
                    </p>
                  </div>
                  <CheckCircle className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-muted-foreground">
                      Pending
                    </p>
                    <p className="text-lg lg:text-2xl font-bold">
                      {directShipments.filter((s) => s.status === "pending").length}
                    </p>
                  </div>
                  <Clock className="h-6 w-6 lg:h-8 lg:w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Shipments Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg lg:text-xl">Direct Shipments ({totalShipments})</CardTitle>
            </CardHeader>
            <CardContent>
              {shipmentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <span className="ml-3">Loading shipments...</span>
                </div>
              ) : directShipments.length === 0 ? (
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No Direct Shipments
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {Object.keys(shipmentFilters).length > 0
                      ? "No shipments match your current filters."
                      : "No direct shipments have been created yet."}
                  </p>
                  {canCreateShipments && Object.keys(shipmentFilters).length === 0 && (
                    <Link href="/warehouse/direct-shipments/create">
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Direct Shipment
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  {/* Bulk Actions */}
                  {selectedShipments.length > 0 && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">
                            {selectedShipments.length} shipment
                            {selectedShipments.length > 1 ? "s" : ""} selected
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {canCreateShipments && (
                            <>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleBulkShipmentAction("dispatch", selectedShipments)
                                }
                                disabled={
                                  !selectedShipments.some((id) => {
                                    const shipment = directShipments.find(
                                      (s) => s.id === id
                                    );
                                    return shipment?.status === "pending";
                                  })
                                }
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Dispatch Selected
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleBulkShipmentAction("cancel", selectedShipments)
                                }
                                disabled={
                                  !selectedShipments.some((id) => {
                                    const shipment = directShipments.find(
                                      (s) => s.id === id
                                    );
                                    return shipment?.status === "pending";
                                  })
                                }
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancel Selected
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedShipments([])}
                          >
                            Clear Selection
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {isMobile || isTablet ? (
                    // Mobile Card Layout
                    <div className="space-y-4">
                      {selectedShipments.length === 0 && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium">Select all shipments</span>
                          <Checkbox
                            checked={selectedShipments.length === directShipments.length && directShipments.length > 0}
                            onCheckedChange={handleSelectAllShipments}
                          />
                        </div>
                      )}
                      {directShipments.map((shipment) => (
                        <Card key={shipment.id} className="relative">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Checkbox
                                    checked={selectedShipments.includes(shipment.id)}
                                    onCheckedChange={(checked) =>
                                      handleSelectShipment(shipment.id, checked as boolean)
                                    }
                                  />
                                  <h3 className="font-medium text-sm truncate">
                                    {shipment.referenceNumber}
                                  </h3>
                                </div>
                                <p className="text-xs text-muted-foreground">ID: {shipment.id}</p>
                              </div>
                              <div className="flex items-center space-x-1 ml-2">
                                {getStatusBadge(shipment.status)}
                                {(shipment.priorityLevel === "critical" ||
                                  shipment.priorityLevel === "urgent" ||
                                  shipment.shipmentType === "emergency") && (
                                  <Badge variant="outline" className="bg-red-50 text-red-700 text-xs">
                                    {shipment.priorityLevel === "critical" ||
                                    shipment.shipmentType === "emergency"
                                      ? "EMERGENCY"
                                      : "URGENT"}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground">From</p>
                                <p className="font-medium truncate">{shipment.warehouseName}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">To</p>
                                <p className="font-medium truncate">{shipment.schoolName}</p>
                                {shipment.schoolCode && (
                                  <p className="text-xs text-muted-foreground">{shipment.schoolCode}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                {getTypeBadge(shipment.shipmentType)}
                                {getPriorityBadge(shipment.priorityLevel)}
                              </div>
                              <div className="flex items-center space-x-1 text-sm">
                                <Package className="h-3 w-3" />
                                <span>{shipment.totalItems}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground mb-3">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>Created: {formatDate(shipment.createdAt)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>Delivery: {formatDate(shipment.expectedDeliveryDate)}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t">
                              <div className="flex items-center space-x-2">
                                {canCreateShipments && shipment.status === "pending" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleBulkShipmentAction("dispatch", [shipment.id])}
                                    className="h-8 px-2 text-xs"
                                  >
                                    <Send className="h-3 w-3 mr-1" />
                                    Dispatch
                                  </Button>
                                )}
                              </div>
                              <Link href={`/warehouse/direct-shipments/${shipment.id}`}>
                                <Button variant="ghost" size="sm" className="h-8 px-2">
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    // Desktop Table Layout
                    <div className="w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={
                                  selectedShipments.length === directShipments.length &&
                                  directShipments.length > 0
                                }
                                onCheckedChange={handleSelectAllShipments}
                              />
                            </TableHead>
                            <TableHead className="w-36">Reference</TableHead>
                            <TableHead className="w-44">From Warehouse</TableHead>
                            <TableHead className="w-52">To School</TableHead>
                            <TableHead className="w-28">Status</TableHead>
                            <TableHead className="w-16 text-center">Items</TableHead>
                            <TableHead className="w-36">Dates</TableHead>
                            <TableHead className="w-28 text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                        {directShipments.map((shipment) => (
                          <TableRow key={shipment.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedShipments.includes(shipment.id)}
                                onCheckedChange={(checked) =>
                                  handleSelectShipment(
                                    shipment.id,
                                    checked as boolean
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {shipment.referenceNumber}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ID: {shipment.id}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="font-medium truncate" title={shipment.warehouseName}>
                                {shipment.warehouseName}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="font-medium truncate" title={shipment.schoolName}>
                                {shipment.schoolName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {shipment.schoolCode}
                              </div>
                            </TableCell>

                            <TableCell>{getStatusBadge(shipment.status)}</TableCell>

                            <TableCell className="text-center">
                              <div className="inline-flex items-center space-x-1">
                                <Package className="h-3 w-3" />
                                <span className="font-medium">{shipment.totalItems}</span>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="text-xs space-y-1">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span className="text-muted-foreground">Created:</span>
                                </div>
                                <div className="font-medium">{formatDate(shipment.createdAt)}</div>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span className="text-muted-foreground">Due:</span>
                                </div>
                                <div className="font-medium">{formatDate(shipment.expectedDeliveryDate)}</div>
                              </div>
                            </TableCell>

                            <TableCell className="text-center">
                              <div className="flex items-center justify-center space-x-1">
                                {/* Emergency/Priority Indicator */}
                                {(shipment.priorityLevel === "critical" ||
                                  shipment.priorityLevel === "urgent" ||
                                  shipment.shipmentType === "emergency") && (
                                  <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" title="High Priority" />
                                )}

                                {/* Quick Action Button */}
                                {canCreateShipments &&
                                  shipment.status === "pending" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleBulkShipmentAction("dispatch", [shipment.id])
                                      }
                                      className="h-7 w-7 p-0 flex-shrink-0"
                                      title="Dispatch"
                                    >
                                      <Send className="h-3 w-3" />
                                    </Button>
                                  )}

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-7 w-7 p-0 flex-shrink-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link
                                        href={`/warehouse/direct-shipments/${shipment.id}`}
                                      >
                                        <Eye className="h-4 w-4 mr-2" />
                                        View Details
                                      </Link>
                                    </DropdownMenuItem>

                                    {canCreateShipments &&
                                      shipment.status === "pending" && (
                                        <>
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleBulkShipmentAction("dispatch", [
                                                shipment.id,
                                              ])
                                            }
                                          >
                                            <Send className="h-4 w-4 mr-2" />
                                            Dispatch Now
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleBulkShipmentAction("cancel", [
                                                shipment.id,
                                              ])
                                            }
                                            className="text-red-600"
                                          >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Cancel Shipment
                                          </DropdownMenuItem>
                                        </>
                                      )}

                                    {shipment.status === "dispatched" && (
                                      <DropdownMenuItem>
                                        <Truck className="h-4 w-4 mr-2" />
                                        Track Shipment
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      </Table>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalShipments > shipmentsPageSize && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {(shipmentsPage - 1) * shipmentsPageSize + 1} to{" "}
                    {Math.min(shipmentsPage * shipmentsPageSize, totalShipments)} of {totalShipments}{" "}
                    shipments
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setShipmentsPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={shipmentsPage === 1}
                    >
                      Previous
                    </Button>

                    <div className="flex items-center space-x-1">
                      {Array.from(
                        { length: Math.min(5, Math.ceil(totalShipments / shipmentsPageSize)) },
                        (_, i) => {
                          const pageNum = i + 1;
                          const totalPages = Math.ceil(totalShipments / shipmentsPageSize);

                          // Show first 2, current page +/- 1, and last 2 pages
                          if (
                            pageNum <= 2 ||
                            pageNum >= totalPages - 1 ||
                            (pageNum >= shipmentsPage - 1 &&
                              pageNum <= shipmentsPage + 1)
                          ) {
                            return (
                              <Button
                                key={pageNum}
                                variant={
                                  shipmentsPage === pageNum ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setShipmentsPage(pageNum)}
                                className="w-8 h-8 p-0"
                              >
                                {pageNum}
                              </Button>
                            );
                          } else if (pageNum === 3 && shipmentsPage > 4) {
                            return (
                              <span key={pageNum} className="px-2">
                                ...
                              </span>
                            );
                          } else if (
                            pageNum === totalPages - 2 &&
                            shipmentsPage < totalPages - 3
                          ) {
                            return (
                              <span key={pageNum} className="px-2">
                                ...
                              </span>
                            );
                          }
                          return null;
                        }
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setShipmentsPage((prev) =>
                          Math.min(Math.ceil(totalShipments / shipmentsPageSize), prev + 1)
                        )
                      }
                      disabled={shipmentsPage >= Math.ceil(totalShipments / shipmentsPageSize)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
