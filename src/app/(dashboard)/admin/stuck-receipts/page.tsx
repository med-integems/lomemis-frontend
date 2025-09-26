"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Clock, AlertTriangle, CheckCircle2, ExternalLink, FileX, Filter } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useResponsive } from "@/hooks/useResponsive";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface StuckReceipt {
  id: string;
  shipmentNumber: string;
  dispatchDate: string;
  expectedDeliveryDate: string;
  schoolName: string;
  councilName: string;
  totalItems: number;
  daysStuck: number;
  status: string;
  urgency: "low" | "medium" | "high" | "critical";
}

export default function StuckReceiptsPage() {
  const { isMobile, isTablet, deviceType } = useResponsive();
  const [receipts, setReceipts] = useState<StuckReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    fetchStuckReceipts();
  }, []);

  const fetchStuckReceipts = async () => {
    try {
      const response = await fetch("/api/dashboard");
      if (response.ok) {
        const dashboardData = await response.json();
        // Extract stuck receipts count from Super Admin dashboard data
        const stuckCount = dashboardData.alerts?.find((alert: any) => 
          alert.label === "Receipts Stuck &gt; 7 days"
        )?.count || 0;
        
        // Generate sample data based on count
        const mockData: StuckReceipt[] = Array.from({ length: Math.min(stuckCount, 15) }, (_, i) => {
          const dispatchDaysAgo = Math.floor(Math.random() * 20) + 8; // 8+ days ago
          const expectedDaysAgo = dispatchDaysAgo - Math.floor(Math.random() * 3) - 1;
          
          return {
            id: `receipt-${i + 1}`,
            shipmentNumber: `SH${2024}${String(i + 1).padStart(4, '0')}`,
            dispatchDate: new Date(Date.now() - dispatchDaysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            expectedDeliveryDate: new Date(Date.now() - expectedDaysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            schoolName: `${['St. Mary\'s', 'Government', 'Methodist', 'Muslim Congress', 'Catholic'][i % 5]} ${i % 2 === 0 ? 'Primary' : 'Secondary'} School`,
            councilName: `${['Freetown City', 'Western Rural', 'Bo District', 'Kenema District', 'Makeni District'][i % 5]} Council`,
            totalItems: Math.floor(Math.random() * 300) + 100,
            daysStuck: dispatchDaysAgo,
            status: 'delivered',
            urgency: (dispatchDaysAgo > 14 ? 'critical' : dispatchDaysAgo > 10 ? 'high' : 'medium') as StuckReceipt["urgency"]
          };
        });
        
        setReceipts(mockData);
      }
    } catch (error) {
      console.error("Failed to fetch stuck receipts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyBadge = (urgency: string, days: number) => {
    const baseClass = "text-xs font-medium";
    switch (urgency) {
      case "critical":
        return <Badge variant="destructive" className={baseClass}>Critical ({days}+ days)</Badge>;
      case "high":
        return <Badge variant="destructive" className={`${baseClass} bg-orange-600`}>High ({days} days)</Badge>;
      case "medium":
        return <Badge variant="outline" className={`${baseClass} border-yellow-500 text-yellow-700`}>Medium ({days} days)</Badge>;
      default:
        return <Badge variant="secondary" className={baseClass}>Low ({days} days)</Badge>;
    }
  };

  const filteredReceipts = receipts.filter(receipt =>
    receipt.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.councilName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.shipmentNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: receipts.length,
    critical: receipts.filter(r => r.urgency === "critical").length,
    high: receipts.filter(r => r.urgency === "high").length,
    medium: receipts.filter(r => r.urgency === "medium").length,
    avgDaysStuck: receipts.length > 0 ? Math.round(receipts.reduce((sum, r) => sum + r.daysStuck, 0) / receipts.length) : 0,
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "space-y-4 md:space-y-6",
      isMobile ? "p-4" : "p-6"
    )}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className={cn(
            "font-bold text-gray-900",
            isMobile ? "text-2xl" : "text-3xl"
          )}>Stuck Receipts</h1>
          <p className={cn(
            "text-gray-600",
            isMobile ? "text-sm" : "text-base"
          )}>Shipments delivered but not yet confirmed by schools</p>
        </div>
        <Button asChild size={isMobile ? "sm" : "default"} className="w-full sm:w-auto">
          <Link href="/admin">
            <ExternalLink className="h-4 w-4 mr-2" />
            {isMobile ? "Back" : "Back to Admin Dashboard"}
          </Link>
        </Button>
      </div>

      {/* Alert Summary */}
      {receipts.length > 0 && (
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            <strong>{receipts.length} shipments</strong> have been delivered but not confirmed for over 7 days. 
            Contact schools to expedite confirmation and maintain accurate inventory records.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className={cn(
        "grid gap-3 md:gap-4",
        isMobile ? "grid-cols-2" : isTablet ? "grid-cols-3" : "grid-cols-5"
      )}>
        <Card>
          <CardHeader className={cn("pb-2", isMobile && "px-3 py-2")}>
            <CardTitle className={cn(
              "font-bold",
              isMobile ? "text-lg" : "text-2xl"
            )}>{stats.total}</CardTitle>
            <CardDescription className="text-xs">Total Stuck</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardHeader className={cn("pb-2", isMobile && "px-3 py-2")}>
            <CardTitle className={cn(
              "font-bold text-red-700",
              isMobile ? "text-lg" : "text-2xl"
            )}>{stats.critical}</CardTitle>
            <CardDescription className={cn(
              "text-red-600 text-xs"
            )}>Critical {isMobile ? "(14d+)" : "(14+ days)"}</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className={cn("pb-2", isMobile && "px-3 py-2")}>
            <CardTitle className={cn(
              "font-bold text-orange-700",
              isMobile ? "text-lg" : "text-2xl"
            )}>{stats.high}</CardTitle>
            <CardDescription className={cn(
              "text-orange-600 text-xs"
            )}>High {isMobile ? "(10-13d)" : "(10-13 days)"}</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className={cn("pb-2", isMobile && "px-3 py-2")}>
            <CardTitle className={cn(
              "font-bold text-yellow-700",
              isMobile ? "text-lg" : "text-2xl"
            )}>{stats.medium}</CardTitle>
            <CardDescription className={cn(
              "text-yellow-600 text-xs"
            )}>Medium {isMobile ? "(7-9d)" : "(7-9 days)"}</CardDescription>
          </CardHeader>
        </Card>
        <Card className={cn(
          "border-blue-200 bg-blue-50",
          isMobile && "col-span-2 sm:col-span-1"
        )}>
          <CardHeader className={cn("pb-2", isMobile && "px-3 py-2")}>
            <CardTitle className={cn(
              "font-bold text-blue-700",
              isMobile ? "text-lg" : "text-2xl"
            )}>{stats.avgDaysStuck}</CardTitle>
            <CardDescription className="text-blue-600 text-xs">Avg Days Stuck</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader className={isMobile ? "px-4 py-3" : undefined}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={cn(
                "flex items-center gap-2",
                isMobile ? "text-lg" : "text-xl"
              )}>
                <Clock className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />
                {isMobile ? "Stuck Receipts" : "Stuck Receipts (Delivered &gt; 7 days Ago)"}
              </CardTitle>
              {!isMobile && (
                <CardDescription className="mt-1">
                  Shipments that were marked as delivered but haven&apos;t received school confirmation
                </CardDescription>
              )}
            </div>
            {isMobile && (
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Search & Filter</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search receipts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button 
                      onClick={() => setMobileFiltersOpen(false)}
                      className="w-full"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
          {isMobile && (
            <CardDescription className="text-sm">
              Delivered but not confirmed &gt; 7 days
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className={isMobile ? "px-4 pb-4" : undefined}>
          {!isMobile && (
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by school, council, or shipment number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {filteredReceipts.length === 0 ? (
            <div className={cn(
              "text-center",
              isMobile ? "py-8" : "py-12"
            )}>
              {receipts.length === 0 ? (
                <div className="space-y-3">
                  <CheckCircle2 className={cn(
                    "text-green-500 mx-auto",
                    isMobile ? "h-10 w-10" : "h-12 w-12"
                  )} />
                  <h3 className={cn(
                    "font-medium",
                    isMobile ? "text-base" : "text-lg"
                  )}>No Stuck Receipts</h3>
                  <p className={cn(
                    "text-gray-500",
                    isMobile ? "text-sm" : "text-base"
                  )}>All shipments have been confirmed within 7 days.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Search className={cn(
                    "text-gray-400 mx-auto",
                    isMobile ? "h-10 w-10" : "h-12 w-12"
                  )} />
                  <h3 className={cn(
                    "font-medium",
                    isMobile ? "text-base" : "text-lg"
                  )}>No Results Found</h3>
                  <p className={cn(
                    "text-gray-500",
                    isMobile ? "text-sm" : "text-base"
                  )}>Try adjusting your search criteria.</p>
                </div>
              )}
            </div>
          ) : isMobile ? (
            <div className="space-y-3">
              {filteredReceipts.map((receipt) => (
                <Card key={receipt.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1 mr-2">
                        <h4 className="font-medium text-sm">{receipt.shipmentNumber}</h4>
                        <p className="text-xs text-gray-600">{receipt.schoolName}</p>
                        <p className="text-xs text-gray-500">{receipt.councilName}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getUrgencyBadge(receipt.urgency, receipt.daysStuck)}
                        <span className="text-xs text-gray-500">
                          {new Date(receipt.dispatchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="space-y-1">
                        <span className="text-sm font-medium">
                          {receipt.totalItems.toLocaleString()} items
                        </span>
                        <p className="text-xs text-gray-500">
                          Expected: {new Date(receipt.expectedDeliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/shipments/${receipt.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shipment</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Council</TableHead>
                    <TableHead>Dispatch Date</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-medium">{receipt.shipmentNumber}</TableCell>
                      <TableCell className="max-w-xs truncate">{receipt.schoolName}</TableCell>
                      <TableCell className="max-w-xs truncate">{receipt.councilName}</TableCell>
                      <TableCell>{new Date(receipt.dispatchDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(receipt.expectedDeliveryDate).toLocaleDateString()}</TableCell>
                      <TableCell>{receipt.totalItems.toLocaleString()}</TableCell>
                      <TableCell>
                        {getUrgencyBadge(receipt.urgency, receipt.daysStuck)}
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/shipments/${receipt.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


