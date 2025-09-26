"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, AlertTriangle, FileX, Clock, CheckCircle2, ExternalLink, Filter, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useResponsive } from "@/hooks/useResponsive";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface DistributionWithoutReceipt {
  id: string;
  distributionDate: string;
  schoolName: string;
  councilName: string;
  itemName: string;
  quantityDistributed: number;
  daysPending: number;
  urgency: "low" | "medium" | "high" | "critical";
}

export default function DataQualityPage() {
  const { isMobile, isTablet, deviceType } = useResponsive();
  const [distributions, setDistributions] = useState<DistributionWithoutReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    fetchDistributionsWithoutReceipts();
  }, []);

  const fetchDistributionsWithoutReceipts = async () => {
    try {
      const response = await fetch("/api/dashboard");
      if (response.ok) {
        const dashboardData = await response.json();
        // Extract distributions without receipts from Super Admin dashboard data
        const distributionsCount = dashboardData.alerts?.find((alert: any) => 
          alert.label === "Distributions with No Linked Receipt"
        )?.count || 0;
        
        // Generate sample data based on count for now
        // In production, this would call a dedicated API endpoint
        const mockData: DistributionWithoutReceipt[] = Array.from({ length: Math.min(distributionsCount, 10) }, (_, i) => ({
          id: `dist-${i + 1}`,
          distributionDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          schoolName: `School ${String.fromCharCode(65 + i)} ${i % 3 === 0 ? 'Primary' : i % 3 === 1 ? 'Secondary' : 'Junior Secondary'}`,
          councilName: `${['Freetown', 'Bo', 'Kenema', 'Makeni', 'Koidu'][i % 5]} District Council`,
          itemName: `${['Mathematics', 'English', 'Science', 'Social Studies', 'Krio'][i % 5]} Textbooks Grade ${(i % 6) + 1}`,
          quantityDistributed: Math.floor(Math.random() * 200) + 50,
          daysPending: Math.floor(Math.random() * 20) + 1,
          urgency: (Math.random() > 0.7 ? 'critical' : Math.random() > 0.5 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low') as DistributionWithoutReceipt["urgency"]
        }));
        
        setDistributions(mockData);
      }
    } catch (error) {
      console.error("Failed to fetch distributions without receipts:", error);
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

  const filteredDistributions = distributions.filter(dist =>
    dist.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dist.councilName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dist.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: distributions.length,
    critical: distributions.filter(d => d.urgency === "critical").length,
    high: distributions.filter(d => d.urgency === "high").length,
    medium: distributions.filter(d => d.urgency === "medium").length,
    low: distributions.filter(d => d.urgency === "low").length,
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
          )}>Data Quality Issues</h1>
          <p className={cn(
            "text-gray-600",
            isMobile ? "text-sm" : "text-base"
          )}>Distributions awaiting receipt confirmation</p>
        </div>
        <Button asChild size={isMobile ? "sm" : "default"} className="w-full sm:w-auto">
          <Link href="/admin">
            <ExternalLink className="h-4 w-4 mr-2" />
            {isMobile ? "Back" : "Back to Admin Dashboard"}
          </Link>
        </Button>
      </div>

      {/* Alert Summary */}
      {distributions.length > 0 && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-yellow-800">
            <strong>{distributions.length} distributions</strong> are pending receipt confirmation. 
            Follow up with schools to ensure proper documentation.
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
            <CardDescription className={cn(
              isMobile ? "text-xs" : "text-xs"
            )}>Total Pending</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardHeader className={cn("pb-2", isMobile && "px-3 py-2")}>
            <CardTitle className={cn(
              "font-bold text-red-700",
              isMobile ? "text-lg" : "text-2xl"
            )}>{stats.critical}</CardTitle>
            <CardDescription className={cn(
              "text-red-600",
              isMobile ? "text-xs" : "text-xs"
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
              "text-orange-600",
              isMobile ? "text-xs" : "text-xs"
            )}>High {isMobile ? "(7-13d)" : "(7-13 days)"}</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className={cn("pb-2", isMobile && "px-3 py-2")}>
            <CardTitle className={cn(
              "font-bold text-yellow-700",
              isMobile ? "text-lg" : "text-2xl"
            )}>{stats.medium}</CardTitle>
            <CardDescription className={cn(
              "text-yellow-600",
              isMobile ? "text-xs" : "text-xs"
            )}>Medium {isMobile ? "(3-6d)" : "(3-6 days)"}</CardDescription>
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
            )}>{stats.low}</CardTitle>
            <CardDescription className={cn(
              "text-blue-600",
              isMobile ? "text-xs" : "text-xs"
            )}>Low {isMobile ? "(1-2d)" : "(1-2 days)"}</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader className={isMobile ? "px-4 py-3" : undefined}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={cn(
                "flex items-center gap-2",
                isMobile ? "text-lg" : "text-xl"
              )}>
                <FileX className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />
                {isMobile ? "Without Receipts" : "Distributions Without Receipts"}
              </CardTitle>
              {!isMobile && (
                <CardDescription className="mt-1">
                  Schools that have received distributions but haven&apos;t confirmed receipt
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
                        placeholder="Search distributions..."
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
              Distributions awaiting confirmation
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className={isMobile ? "px-4 pb-4" : undefined}>
          {!isMobile && (
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by school, council, or item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {filteredDistributions.length === 0 ? (
            <div className={cn(
              "text-center",
              isMobile ? "py-8" : "py-12"
            )}>
              {distributions.length === 0 ? (
                <div className="space-y-3">
                  <CheckCircle2 className={cn(
                    "text-green-500 mx-auto",
                    isMobile ? "h-10 w-10" : "h-12 w-12"
                  )} />
                  <h3 className={cn(
                    "font-medium",
                    isMobile ? "text-base" : "text-lg"
                  )}>All Distributions Have Receipts</h3>
                  <p className={cn(
                    "text-gray-500",
                    isMobile ? "text-sm" : "text-base"
                  )}>Great job! All distributions have been properly confirmed.</p>
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
          ) : (
            isMobile ? (
              <div className="space-y-3">
                {filteredDistributions.map((dist) => (
                  <Card key={dist.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1 mr-2">
                          <h4 className="font-medium text-sm leading-tight">{dist.schoolName}</h4>
                          <p className="text-xs text-gray-600">{dist.councilName}</p>
                          <p className="text-xs text-gray-500">{dist.itemName}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getUrgencyBadge(dist.urgency, dist.daysPending)}
                          <span className="text-xs text-gray-500">
                            {new Date(dist.distributionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-sm font-medium">
                          {dist.quantityDistributed.toLocaleString()} items
                        </span>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/distributions/${dist.id}`}>
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
                      <TableHead>Distribution Date</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Council</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDistributions.map((dist) => (
                      <TableRow key={dist.id}>
                        <TableCell className="font-medium">
                          {new Date(dist.distributionDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{dist.schoolName}</TableCell>
                        <TableCell>{dist.councilName}</TableCell>
                        <TableCell className="max-w-xs truncate">{dist.itemName}</TableCell>
                        <TableCell>{dist.quantityDistributed.toLocaleString()}</TableCell>
                        <TableCell>
                          {getUrgencyBadge(dist.urgency, dist.daysPending)}
                        </TableCell>
                        <TableCell>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/distributions/${dist.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
