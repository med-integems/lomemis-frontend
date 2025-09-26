"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Truck,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Package,
  Search,
  Building2,
  Clock,
  FileText,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { usePermissions } from "@/hooks/usePermissions";
import { shipmentsApi } from "@/lib/api";
import { ReceiptConfirmationDialog } from "@/components/shipments/receipt-confirmation-dialog";
import { formatDate } from "@/lib/utils";
import { useFilteredExport, ExportButton, ExportStatus } from "@/components/export";

interface PendingShipment {
  id: number;
  shipmentNumber: string;
  originWarehouseName: string;
  dispatchDate: string;
  expectedArrivalDate?: string;
  status: string;
  totalItems: number;
  totalValue?: number;
  priorityLevel: string;
  createdAt: string;
  items?: any[];
}

export default function ConfirmReceiptsPage() {
  const { user } = useUser();
  const { canViewSection, canUpdate, getRestrictedMessage, isViewOnly } =
    usePermissions();
  const [shipments, setShipments] = useState<PendingShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShipment, setSelectedShipment] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("pending");

  // Incoming shipments tab state
  const [incoming, setIncoming] = useState<PendingShipment[]>([]);
  const [incomingLoading, setIncomingLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [incomingPage, setIncomingPage] = useState<number>(1);
  const [incomingLimit, setIncomingLimit] = useState<number>(10);
  const [incomingTotal, setIncomingTotal] = useState<number>(0);

  // Export for incoming tab
  const { exportData: exportIncoming, isExporting: isExportingIncoming } = useFilteredExport({
    apiCall: async (params) => {
      const baseFilters: any = {
        ...(user?.role === "lc_officer" && user?.localCouncilId
          ? { destinationCouncilId: user.localCouncilId }
          : {}),
      };
      const status = statusFilter === "ALL" ? undefined : statusFilter;
      const response = await shipmentsApi.getShipments(1, params?.maxRecords || 1000, {
        ...baseFilters,
        ...(status ? { status } : {}),
      });
      if (response.success && response.data) {
        return { success: true, data: response.data.shipments || [] } as any;
      }
      throw new Error(response.error?.message || "Failed to fetch incoming shipments for export");
    },
    getCurrentFilters: () => ({ searchTerm, statusFilter }),
    applyFilters: (data, current) => {
      const term = (current.searchTerm || '').toLowerCase();
      return data.filter((s: any) =>
        (s.shipmentNumber || '').toLowerCase().includes(term) ||
        (s.originWarehouseName || '').toLowerCase().includes(term)
      );
    },
    headers: [
      "Shipment Number",
      "Warehouse",
      "Status",
      "Dispatched",
      "Expected",
      "Actual",
      "Items"
    ],
    dataTransform: (rows) => rows.map((s: any) => [
      s.shipmentNumber || '',
      s.originWarehouseName || '',
      s.status || '',
      s.dispatchDate ? new Date(s.dispatchDate).toLocaleDateString() : '',
      s.expectedArrivalDate ? new Date(s.expectedArrivalDate).toLocaleDateString() : '',
      s.actualArrivalDate ? new Date(s.actualArrivalDate).toLocaleDateString() : '',
      String(s.totalItems ?? 0)
    ]),
    filename: `incoming-shipments-${new Date().toISOString().split('T')[0]}.csv`,
    maxRecords: 1000,
  });

  // Council receipts export functionality
  const { exportData, isExporting, error: exportError, lastExportCount, reset: resetExport } = useFilteredExport({
    apiCall: async (params) => {
      const filters = {
        status: "IN_TRANSIT",
        ...(user?.role === "lc_officer" && user?.localCouncilId
          ? { councilId: user.localCouncilId }
          : {}),
      };
      
      const response = await shipmentsApi.getShipments(
        1,
        params?.maxRecords || 1000,
        { ...filters, ...params?.filters }
      );
      
      if (response.success && response.data) {
        // The backend returns the data in { shipments: [...], total, page, limit } structure
        const shipments = response.data.shipments || [];
        return {
          success: true,
          data: shipments
        } as any;
      } else {
        throw new Error(response.error?.message || "Failed to fetch pending receipts for export");
      }
    },
    getCurrentFilters: () => ({ searchTerm }),
    applyFilters: (data, currentFilters) => {
      if (!currentFilters.searchTerm) return data;
      
      return data.filter((shipment: any) =>
        (shipment.shipmentNumber || "").toLowerCase().includes(currentFilters.searchTerm?.toLowerCase() || "") ||
        (shipment.originWarehouseName || "").toLowerCase().includes(currentFilters.searchTerm?.toLowerCase() || "")
      );
    },
    headers: [
      "Shipment Number",
      "Origin Warehouse",
      "Destination Council",
      "Status",
      "Dispatch Date",
      "Expected Arrival",
      "Total Items",
      "Created Date",
      "Is Overdue"
    ],
    dataTransform: (shipments) => shipments.map((shipment: any) => [
      shipment.shipmentNumber || '',
      shipment.originWarehouseName || '',
      shipment.destinationCouncilName || '',
      shipment.status || '',
      shipment.dispatchDate ? new Date(shipment.dispatchDate).toLocaleDateString() : '',
      shipment.expectedArrivalDate ? new Date(shipment.expectedArrivalDate).toLocaleDateString() : '',
      shipment.totalItems?.toString() || '0',
      shipment.createdAt ? new Date(shipment.createdAt).toLocaleDateString() : '',
      (shipment.expectedArrivalDate && new Date(shipment.expectedArrivalDate) < new Date()) ? 'Yes' : 'No'
    ]),
    filename: `council-receipts-${user?.localCouncilId ? `council-${user.localCouncilId}-` : ''}${new Date().toISOString().split('T')[0]}.csv`,
    maxRecords: 1000
  });

  const fetchPendingShipments = async () => {
    try {
      setLoading(true);

      // Fetch shipments that are IN_TRANSIT and need confirmation
      const filters = {
        status: "IN_TRANSIT",
        ...(user?.role === "lc_officer" && user?.localCouncilId
          ? { destinationCouncilId: user.localCouncilId }
          : {}),
      };

      const response = await shipmentsApi.getShipments(1, 50, filters);

      if (response.success && response.data) {
        setShipments(response.data.shipments || []);
      } else {
        toast.error("Failed to load pending shipments");
      }
    } catch (error) {
      console.error("Error fetching shipments:", error);
      toast.error("Failed to load pending shipments");
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomingShipments = async () => {
    try {
      setIncomingLoading(true);
      const baseFilters: any = {
        ...(user?.role === "lc_officer" && user?.localCouncilId
          ? { destinationCouncilId: user.localCouncilId }
          : {}),
      };

      const status = statusFilter === "ALL" ? undefined : statusFilter;
      const response = await shipmentsApi.getShipments(incomingPage, incomingLimit, {
        ...baseFilters,
        ...(status ? { status } : {}),
      });
      if (response.success && response.data) {
        setIncoming(response.data.shipments || []);
        if (typeof response.data.total === 'number') setIncomingTotal(response.data.total);
      } else {
        toast.error("Failed to load incoming shipments");
      }
    } catch (e) {
      toast.error("Failed to load incoming shipments");
    } finally {
      setIncomingLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingShipments();
    fetchIncomingShipments();
  }, [user]);

  useEffect(() => {
    if (activeTab === "incoming") {
      fetchIncomingShipments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, statusFilter, incomingPage, incomingLimit]);

  const handleConfirmReceipt = (shipmentId: number) => {
    if (!canUpdate(["lc_officer", "super_admin"])) {
      toast.error(getRestrictedMessage());
      return;
    }
    setSelectedShipment(shipmentId);
    setShowConfirmDialog(true);
  };

  const handleReceiptConfirmed = () => {
    setShowConfirmDialog(false);
    setSelectedShipment(null);
    // Refresh the list
    fetchPendingShipments();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "IN_TRANSIT":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Truck className="h-3 w-3 mr-1" />
            In Transit
          </Badge>
        );
      case "RECEIVED":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Received
          </Badge>
        );
      case "DISCREPANCY":
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Discrepancy
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    if (!priority) return <Badge variant="outline">Normal</Badge>;

    switch (priority.toLowerCase()) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case "normal":
        return <Badge variant="secondary">Normal</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const filteredShipments = shipments.filter(
    (shipment) =>
      (shipment.shipmentNumber || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (shipment.originWarehouseName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const pendingCount = filteredShipments.length;
  const overdueCount = filteredShipments.filter((s) => {
    if (!s.expectedArrivalDate) return false;
    return new Date(s.expectedArrivalDate) < new Date();
  }).length;

  // Only show page for users who can view this section
  if (!canViewSection(["lc_officer", "super_admin"])) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Access Restricted
          </h3>
          <p className="text-muted-foreground">
            This page is only available to Local Council M&E Officers and
            Administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6 px-4 lg:px-0">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex items-center space-x-3 lg:space-x-4">
          <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg">
            <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Confirm Receipts
            </h1>
            <p className="text-muted-foreground text-sm lg:text-base">
              Confirm receipt of shipments from national warehouses to your
              local council
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
          <ExportButton 
            onExport={exportData}
            isExporting={isExporting}
            disabled={!canViewSection(["lc_officer", "super_admin"]) || isViewOnly}
            tooltip={isViewOnly ? "Export not available in view-only mode" :
                    !canViewSection(["lc_officer", "super_admin"]) ? "Export not available for your role" :
                    `Export pending receipts${searchTerm ? ' (with current search)' : ''}`}
            showProgress={true}
          />
          <Button
            onClick={fetchPendingShipments}
            variant="outline"
            disabled={loading}
            className="min-h-[48px] lg:min-h-[40px]"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Export Status */}
      <ExportStatus 
        isExporting={isExporting}
        error={exportError}
        lastExportCount={lastExportCount}
        onRetry={exportData}
        onReset={resetExport}
        compact={true}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">
                  Pending Receipts
                </p>
                <p className="text-lg lg:text-2xl font-bold text-blue-600">
                  {pendingCount}
                </p>
              </div>
              <Clock className="w-6 h-6 lg:w-8 lg:h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">
                  Overdue Arrivals
                </p>
                <p className="text-lg lg:text-2xl font-bold text-orange-600">
                  {overdueCount}
                </p>
              </div>
              <AlertTriangle className="w-6 h-6 lg:w-8 lg:h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">
                  Your Council
                </p>
                <p className="text-sm lg:text-lg font-semibold">
                  {user?.role === "lc_officer"
                    ? user?.localCouncilName || "Assigned Council"
                    : "All Councils"}
                </p>
              </div>
              <Building2 className="w-6 h-6 lg:w-8 lg:h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Pending vs Incoming */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending Receipts</TabsTrigger>
          <TabsTrigger value="incoming">Incoming & Receipts</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {/* Search and Filter (pending) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                  <Search className="h-5 w-5" />
                  Search Shipments
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm font-medium">
                  Search by shipment number or warehouse
                </Label>
                <Input
                  id="search"
                  placeholder="Enter shipment number or warehouse name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="min-h-[48px] lg:min-h-[40px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pending Shipments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                <Package className="h-5 w-5" />
                Pending Shipment Confirmations ({filteredShipments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading shipments...</span>
                </div>
              ) : filteredShipments.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">All Caught Up!</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? "No shipments match your search criteria" : "There are no pending shipment receipts to confirm"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredShipments.map((shipment) => {
                    const isOverdue = shipment.expectedArrivalDate && new Date(shipment.expectedArrivalDate) < new Date();
                    return (
                      <div key={shipment.id} className={`border rounded-lg p-4 transition-colors ${isOverdue ? "border-orange-200 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{shipment.shipmentNumber}</h3>
                              {getStatusBadge(shipment.status)}
                              {getPriorityBadge(shipment.priorityLevel)}
                              {isOverdue && (
                                <Badge variant="destructive">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Overdue
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 text-sm">
                              <div>
                                <div className="flex items-center gap-2 text-muted-foreground mb-1"><Building2 className="h-4 w-4" />From Warehouse</div>
                                <div className="font-medium">{shipment.originWarehouseName}</div>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 text-muted-foreground mb-1"><Calendar className="h-4 w-4" />Dispatched</div>
                                <div className="font-medium">{formatDate(shipment.dispatchDate)}</div>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 text-muted-foreground mb-1"><Package className="h-4 w-4" />Items</div>
                                <div className="font-medium">{shipment.totalItems} items</div>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 text-muted-foreground mb-1"><Clock className="h-4 w-4" />Expected</div>
                                <div className="font-medium">{shipment.expectedArrivalDate ? formatDate(shipment.expectedArrivalDate) : "Not set"}</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-4 lg:mt-0 lg:ml-4">
                            {canUpdate(["lc_officer", "super_admin"]) ? (
                              <Button onClick={() => handleConfirmReceipt(shipment.id)} className="bg-green-600 hover:bg-green-700 min-h-[48px] lg:min-h-[40px] w-full lg:w-auto">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Confirm Receipt
                              </Button>
                            ) : (
                              <Button disabled variant="outline" className="opacity-50 cursor-not-allowed min-h-[48px] lg:min-h-[40px] w-full lg:w-auto">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                View Only
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Help Card (Pending Tab) */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800 mb-1">How to Confirm Receipts</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Click &quot;Confirm Receipt&quot; on any pending shipment</li>
                    <li>• Verify the actual arrival date</li>
                    <li>• Check each item&apos;s received quantity against what was shipped</li>
                    <li>• Report any discrepancies with detailed notes</li>
                    <li>• Upload supporting documents or photos of the shipment being received</li>
                    <li>• Submit the confirmation to update the shipment status</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                <Package className="h-5 w-5" />
                Incoming Shipments & Receipts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-3 md:items-end">
                <div className="flex-1">
                  <Label htmlFor="incoming-search" className="text-xs">Search</Label>
                  <Input id="incoming-search" placeholder="Search by shipment number or warehouse..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="min-w-[180px]">
                  <Label htmlFor="status-filter" className="text-xs">Status</Label>
                  <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
                    <SelectTrigger id="status-filter" className="h-10">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                      <SelectItem value="RECEIVED">Received</SelectItem>
                      <SelectItem value="DISCREPANCY">Discrepancy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:ml-auto">
                  <ExportButton onExport={exportIncoming} isExporting={isExportingIncoming} />
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                {incomingLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2 px-2">Shipment #</th>
                        <th className="py-2 px-2">Warehouse</th>
                        <th className="py-2 px-2">Status</th>
                        <th className="py-2 px-2 hidden sm:table-cell">Dispatched</th>
                        <th className="py-2 px-2 hidden md:table-cell">Expected</th>
                        <th className="py-2 px-2 hidden lg:table-cell">Actual</th>
                        <th className="py-2 px-2 hidden md:table-cell">Items</th>
                        <th className="py-2 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incoming
                        .filter(s => (s.shipmentNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) || (s.originWarehouseName || "").toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(s => (
                          <tr key={s.id} className="border-b hover:bg-muted/30">
                            <td className="py-2 px-2 font-medium">{s.shipmentNumber}</td>
                            <td className="py-2 px-2">{s.originWarehouseName}</td>
                            <td className="py-2 px-2">{getStatusBadge(s.status)}</td>
                            <td className="py-2 px-2 hidden sm:table-cell">{s.dispatchDate ? formatDate(s.dispatchDate) : '-'}</td>
                            <td className="py-2 px-2 hidden md:table-cell">{s.expectedArrivalDate ? formatDate(s.expectedArrivalDate) : '-'}</td>
                            <td className="py-2 px-2 hidden lg:table-cell">{(s as any).actualArrivalDate ? formatDate((s as any).actualArrivalDate) : '-'}</td>
                            <td className="py-2 px-2 hidden md:table-cell">{s.totalItems}</td>
                            <td className="py-2 px-2">
                              <Link href={`/councils/receipts/${s.id}`} className="inline-block">
                                <Button variant="outline" size="sm" className="w-full sm:w-auto">View Details</Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      {incoming.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-6 text-muted-foreground">No records</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  {incomingTotal > 0 ? (
                    <>
                      Showing {Math.min((incomingPage - 1) * incomingLimit + 1, incomingTotal)}–{Math.min(incomingPage * incomingLimit, incomingTotal)} of {incomingTotal}
                    </>
                  ) : (
                    <>No results</>
                  )}
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="min-w-[140px]">
                    <Select
                      value={String(incomingLimit)}
                      onValueChange={(val) => { setIncomingPage(1); setIncomingLimit(parseInt(val)); }}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 / page</SelectItem>
                        <SelectItem value="20">20 / page</SelectItem>
                        <SelectItem value="50">50 / page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="w-24 sm:w-auto" disabled={incomingPage <= 1} onClick={() => setIncomingPage((p) => Math.max(1, p - 1))}>Previous</Button>
                    <Button variant="outline" size="sm" className="w-24 sm:w-auto" disabled={incomingPage * incomingLimit >= incomingTotal} onClick={() => setIncomingPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Only Notice */}
      {isViewOnly && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800">Read-Only Access</h3>
                <p className="text-sm text-amber-700">
                  You have view-only access to this page. You can view shipment
                  information and export data, but cannot confirm receipts.
                  Contact your administrator for write permissions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Receipt Confirmation Dialog */}
      {showConfirmDialog && selectedShipment && (
        <ReceiptConfirmationDialog
          shipmentId={selectedShipment}
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          onConfirmed={handleReceiptConfirmed}
        />
      )}
    </div>
  );
}
