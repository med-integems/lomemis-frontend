"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Package, 
  Truck, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  MapPin,
  FileText,
  User,
  TrendingUp
} from "lucide-react";
import { ShipmentConfirmationTable } from "./shipment-confirmation-table";
import { ShipmentConfirmationForm } from "./shipment-confirmation-form";
import { shipmentsApi } from "@/lib/api";
import { 
  ShipmentWithDetails, 
  ShipmentFilters,
  PaginatedResponse
} from "@/types";
import { useResponsive } from "@/hooks/useResponsive";
import { toast } from "sonner";

interface CouncilShipmentManagementProps {
  className?: string;
}

interface ShipmentKPIs {
  totalShipments: number;
  pendingShipments: number;
  confirmedShipments: number;
  itemsReceived: number;
  averageProcessingTime: number;
  discrepancyRate: number;
  lastShipmentDate: Date | null;
}

export function CouncilShipmentManagement({
  className,
}: CouncilShipmentManagementProps) {
  const { isMobile, isTablet } = useResponsive();
  const [activeTab, setActiveTab] = useState("overview");
  const [shipments, setShipments] = useState<ShipmentWithDetails[]>([]);
  const [kpis, setKPIs] = useState<ShipmentKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentWithDetails | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [filters, setFilters] = useState<ShipmentFilters>({});

  // Fetch shipment KPIs
  const fetchKPIs = async () => {
    try {
      // This would typically be a separate API endpoint for LC shipment stats
      const response = await shipmentsApi.getShipments(1, 1000, { 
        status: undefined,
        destinationType: "local_council" 
      });
      
      if (response.success && response.data) {
        const allShipments = response.data.shipments || [];
        
        // Calculate KPIs from shipment data
        const pending = allShipments.filter(s => s.status === 'pending' || s.status === 'in_transit').length;
        const confirmed = allShipments.filter(s => s.status === 'delivered').length;
        const totalItems = allShipments.reduce((sum, s) => sum + (s.totalItems || 0), 0);
        
        // Calculate average processing time (mock calculation)
        const avgProcessing = allShipments.length > 0 ? 
          Math.round(allShipments.reduce((sum, s) => {
            const created = new Date(s.createdAt).getTime();
            const updated = new Date(s.updatedAt).getTime();
            return sum + (updated - created) / (1000 * 60 * 60 * 24); // days
          }, 0) / allShipments.length) : 0;

        const discrepancies = allShipments.filter(s => s.hasDiscrepancies).length;
        const discrepancyRate = allShipments.length > 0 ? (discrepancies / allShipments.length) * 100 : 0;
        
        const lastShipment = allShipments.length > 0 ? 
          new Date(Math.max(...allShipments.map(s => new Date(s.createdAt).getTime()))) : null;

        setKPIs({
          totalShipments: allShipments.length,
          pendingShipments: pending,
          confirmedShipments: confirmed,
          itemsReceived: totalItems,
          averageProcessingTime: avgProcessing,
          discrepancyRate: Math.round(discrepancyRate * 10) / 10,
          lastShipmentDate: lastShipment,
        });
      }
    } catch (error) {
      console.error("Error fetching shipment KPIs:", error);
    }
  };

  // Fetch shipments
  const fetchShipments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await shipmentsApi.getShipments(currentPage, pageSize, {
        ...filters,
        destinationType: "local_council"
      });

      if (response.success && response.data) {
        setShipments(response.data.shipments || []);
      } else {
        setError(response.error?.message || "Failed to fetch shipments");
      }
    } catch (error) {
      console.error("Error fetching shipments:", error);
      setError("Failed to fetch shipments");
    } finally {
      setLoading(false);
    }
  };

  // Handle shipment confirmation
  const handleConfirmShipment = async (shipmentId: number, confirmationData: any) => {
    try {
      const response = await shipmentsApi.confirmShipmentReceipt(shipmentId, confirmationData);
      
      if (response.success) {
        toast.success("Shipment confirmed successfully");
        setSelectedShipment(null);
        fetchShipments();
        fetchKPIs();
      } else {
        toast.error(response.error?.message || "Failed to confirm shipment");
      }
    } catch (error) {
      console.error("Error confirming shipment:", error);
      toast.error("Failed to confirm shipment");
    }
  };

  useEffect(() => {
    fetchShipments();
    fetchKPIs();
  }, [currentPage, filters]);

  const KPICard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend,
    trendValue 
  }: { 
    title: string; 
    value: string | number; 
    subtitle: string; 
    icon: any; 
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          {trend && trendValue && (
            <div className={`flex items-center text-xs ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              <TrendingUp className="h-3 w-3 mr-1" />
              {trendValue}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
            {isMobile ? "Shipments" : "Shipment Management"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isMobile 
              ? "Confirm and manage shipments"
              : "Confirm and manage shipments received from warehouses"
            }
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-1 h-auto gap-2' : 'grid-cols-3'}`}>
          {isMobile ? (
            <>
              <TabsTrigger value="overview" className="w-full py-3">
                <Package className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="pending" className="w-full py-3">
                <Clock className="h-4 w-4 mr-2" />
                Pending ({kpis?.pendingShipments || 0})
              </TabsTrigger>
              <TabsTrigger value="history" className="w-full py-3">
                <FileText className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pending">Pending Confirmations</TabsTrigger>
              <TabsTrigger value="history">Shipment History</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {kpis ? (
              <>
                <KPICard
                  title="Total Shipments"
                  value={kpis.totalShipments}
                  subtitle="All time"
                  icon={Package}
                />
                <KPICard
                  title="Pending Confirmations"
                  value={kpis.pendingShipments}
                  subtitle="Awaiting confirmation"
                  icon={Clock}
                />
                <KPICard
                  title="Items Received"
                  value={kpis.itemsReceived.toLocaleString()}
                  subtitle="Total items processed"
                  icon={CheckCircle}
                />
                <KPICard
                  title="Discrepancy Rate"
                  value={`${kpis.discrepancyRate}%`}
                  subtitle="Items with discrepancies"
                  icon={AlertTriangle}
                />
              </>
            ) : (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-[100px]" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-[60px]" />
                    <Skeleton className="h-3 w-[120px] mt-2" />
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Recent Shipments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : error ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : (
                <ShipmentConfirmationTable
                  shipments={shipments.slice(0, 5)}
                  onConfirm={(shipment) => setSelectedShipment(shipment)}
                  showActions={false}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Shipment Confirmations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : error ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : (
                <ShipmentConfirmationTable
                  shipments={shipments.filter(s => 
                    s.status === 'pending' || s.status === 'in_transit'
                  )}
                  onConfirm={(shipment) => setSelectedShipment(shipment)}
                  showActions={true}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Shipment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : error ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : (
                <ShipmentConfirmationTable
                  shipments={shipments}
                  onConfirm={(shipment) => setSelectedShipment(shipment)}
                  showActions={false}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Shipment Confirmation Dialog */}
      {selectedShipment && (
        <ShipmentConfirmationForm
          shipment={selectedShipment}
          onConfirm={handleConfirmShipment}
          onCancel={() => setSelectedShipment(null)}
        />
      )}
    </div>
  );
}