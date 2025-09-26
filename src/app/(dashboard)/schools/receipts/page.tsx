"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  AlertTriangle,
  Calendar,
  Package,
  Search,
  School,
  Clock,
  FileText,
  RefreshCw,
  Truck,
  Building2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { useResponsive } from "@/hooks/useResponsive";
import { formatDate } from "@/lib/utils";
import { ReceiptConfirmationDialog } from "@/components/schools/receipt-confirmation-dialog";
import { schoolInventoryApi } from "@/lib/api";
import { useSearchParams, useRouter } from "next/navigation";
import { SchoolSelector } from "@/components/warehouse/SchoolSelector";
import {
  useFilteredExport,
  ExportButton,
  ExportStatus,
} from "@/components/export";

interface PendingReceipt {
  id: number;
  schoolId: number;
  schoolName: string;
  sourceType: "DISTRIBUTION" | "DIRECT_SHIPMENT";
  sourceId: number;
  receiptNumber: string;
  status: "PENDING" | "CONFIRMED" | "DISCREPANCY";
  expectedArrivalDate: string | null;
  totalItemsExpected: number;
  sourceReference: string;
  sourceName: string;
  createdAt: string;
}

export default function SchoolReceiptsPage() {
  const { user, loading: userLoading } = useUser();
  const { isMobile, isTablet } = useResponsive();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Access control check - do this before any other hooks
  const hasAccess =
    !!user &&
    [
      "School Representative",
      "Local Council M&E Officer",
      "Super Administrator",
      "View-Only User",
      "National Warehouse Manager",
    ].includes(((user as any)?.roleName || (user as any)?.role) as string);

  // Resolve effective schoolId: prefer URL ?schoolId=, fallback to user.schoolId
  const schoolIdParam = searchParams.get("schoolId");
  const effectiveSchoolId = schoolIdParam
    ? Number(schoolIdParam)
    : user?.schoolId || null;

  const [receipts, setReceipts] = useState<PendingReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // School receipts export functionality
  const {
    exportData,
    isExporting,
    error: exportError,
    lastExportCount,
    reset: resetExport,
  } = useFilteredExport({
    apiCall: async (params) => {
      if (!effectiveSchoolId) {
        throw new Error("No school selected for export");
      }

      // Use the same API call as the main data fetch
      const result = await schoolInventoryApi.getPendingReceipts(
        effectiveSchoolId
      );
      if (result.success && result.data) {
        return {
          success: true,
          data: result.data,
        } as any;
      } else {
        throw new Error(
          result.error?.message || "Failed to fetch receipts for export"
        );
      }
    },
    getCurrentFilters: () => ({ searchTerm }),
    applyFilters: (data, currentFilters) => {
      if (!currentFilters.searchTerm) return data;

      return data.filter(
        (receipt: any) =>
          (receipt.receiptNumber || "")
            .toLowerCase()
            .includes(currentFilters.searchTerm?.toLowerCase() || "") ||
          (receipt.sourceReference || "")
            .toLowerCase()
            .includes(currentFilters.searchTerm?.toLowerCase() || "") ||
          (receipt.sourceName || "")
            .toLowerCase()
            .includes(currentFilters.searchTerm?.toLowerCase() || "")
      );
    },
    headers: [
      "Receipt Number",
      "Source Type",
      "Source Name",
      "Source Reference",
      "Status",
      "Expected Arrival",
      "Items Expected",
      "School Name",
      "Created Date",
      "Is Overdue",
    ],
    dataTransform: (receipts) =>
      receipts.map((receipt: any) => [
        receipt.receiptNumber || "",
        receipt.sourceType || "",
        receipt.sourceName || "N/A",
        receipt.sourceReference || "N/A",
        receipt.status || "",
        receipt.expectedArrivalDate
          ? new Date(receipt.expectedArrivalDate).toLocaleDateString()
          : "",
        receipt.totalItemsExpected?.toString() || "0",
        receipt.schoolName || "",
        receipt.createdAt
          ? new Date(receipt.createdAt).toLocaleDateString()
          : "",
        receipt.expectedArrivalDate &&
        new Date(receipt.expectedArrivalDate) < new Date()
          ? "Yes"
          : "No",
      ]),
    filename: `school-receipts-${
      effectiveSchoolId ? `school-${effectiveSchoolId}-` : ""
    }${new Date().toISOString().split("T")[0]}.csv`,
    maxRecords: 1000,
  });

  const fetchReceipts = async () => {
      if (!effectiveSchoolId) {
      // No school selected for this user; stop loading and show guidance
      setLoading(false);
      setReceipts([]);
      return;
    }

      try {
        setLoading(true);

        const result = await schoolInventoryApi.getPendingReceipts(
          effectiveSchoolId
        );

        if (result.success && result.data) {
          const data = Array.isArray(result.data)
            ? result.data
            : (result.data as any).receipts || [];
          setReceipts(Array.isArray(data) ? (data as any) : []);
        } else {
          console.error("API response error:", result);
          toast.error(result.error?.message || "Failed to load pending receipts");
          setReceipts([]); // Set empty array on error
      }
    } catch (error) {
      console.error("Error fetching receipts:", error);
      toast.error("Failed to load pending receipts");
      setReceipts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [effectiveSchoolId]);

  const handleViewReceipt = async (receiptId: number) => {
    try {
      const result = await schoolInventoryApi.getReceiptDetails(receiptId);

      if (result.success && result.data) {
        setSelectedReceipt(result.data);
        setIsReadOnly(user?.roleName === "View-Only User");
        setDialogOpen(true);
      } else {
        console.error("API response error:", result);
        toast.error(result.error?.message || "Failed to load receipt details");
      }
    } catch (error) {
      console.error("Error fetching receipt details:", error);
      toast.error("Failed to load receipt details");
    }
  };

  const handleConfirmReceipt = async (
    receiptId: number,
    confirmationData: any
  ) => {
    try {
      const result = await schoolInventoryApi.confirmReceipt(
        receiptId,
        confirmationData
      );

      if (result.success) {
        // Update local state by removing the confirmed receipt
        setReceipts((prev) =>
          prev.filter((receipt) => receipt.id !== receiptId)
        );
        toast.success(
          "Receipt confirmed successfully! Inventory has been updated."
        );

        // Optionally refresh inventory on the school inventory page
        // This could be done via a global state update or event system
      } else {
        throw new Error(result.error?.message || "Failed to confirm receipt");
      }
    } catch (error) {
      console.error("Error confirming receipt:", error);
      throw error; // Re-throw to be handled by dialog
    }
  };

  const filteredReceipts = receipts.filter(
    (receipt) =>
      receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.sourceReference
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      receipt.sourceName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            Pending Confirmation
          </Badge>
        );
      case "CONFIRMED":
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case "DISCREPANCY":
        return (
          <Badge className="bg-orange-100 text-orange-800">
            Has Discrepancies
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSourceIcon = (sourceType: string) => {
    return sourceType === "DISTRIBUTION" ? Building2 : Truck;
  };

  const pendingCount = receipts.filter((r) => r.status === "PENDING").length;
  const overdueCount = receipts.filter(
    (r) =>
      r.status === "PENDING" &&
      r.expectedArrivalDate &&
      new Date(r.expectedArrivalDate) < new Date()
  ).length;

  // Show access restricted message if user doesn't have access
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-sm mx-auto px-4">
          <AlertTriangle
            className={`${
              isMobile ? "h-10 w-10" : "h-12 w-12"
            } mx-auto text-amber-500 mb-4`}
          />
          <h3
            className={`${
              isMobile ? "text-base" : "text-lg"
            } font-medium text-foreground mb-2`}
          >
            Access Restricted
          </h3>
          <p
            className={`${
              isMobile ? "text-sm" : "text-base"
            } text-muted-foreground`}
          >
            This page is only available to School Representatives and
            Administrators.
          </p>
        </div>
      </div>
    );
  }

  // If user has access but no effective school selected, show inline selector for Admin/LC
  if (!effectiveSchoolId) {
    return (
      <div className={`${isMobile ? "space-y-4" : "space-y-6"}`}>
        <div
          className={`flex items-center ${
            isMobile ? "flex-col space-y-3" : "justify-between"
          }`}
        >
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div
              className={`flex items-center justify-center ${
                isMobile ? "w-10 h-10" : "w-12 h-12"
              } bg-blue-100 rounded-lg`}
            >
              <CheckCircle
                className={`${isMobile ? "w-5 h-5" : "w-6 h-6"} text-blue-600`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1
                className={`${
                  isMobile ? "text-xl" : isTablet ? "text-2xl" : "text-3xl"
                } font-bold text-foreground`}
              >
                School Receipts
              </h1>
              <p
                className={`${
                  isMobile ? "text-sm" : "text-base"
                } text-muted-foreground`}
              >
                Select a school to view pending receipts
              </p>
            </div>
          </div>
        </div>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className={`${isMobile ? "p-3" : "p-4"} space-y-4`}>
            <div
              className={`flex items-start ${
                isMobile ? "space-x-2" : "space-x-3"
              }`}
            >
              <AlertTriangle
                className={`${
                  isMobile ? "w-4 h-4" : "w-5 h-5"
                } text-amber-600 mt-0.5 flex-shrink-0`}
              />
              <div className="flex-1 min-w-0">
                <h3
                  className={`font-medium text-amber-800 ${
                    isMobile ? "text-sm" : ""
                  }`}
                >
                  No School Selected
                </h3>
                <p
                  className={`${
                    isMobile ? "text-xs" : "text-sm"
                  } text-amber-700`}
                >
                  Please select a school to view its pending receipts. Super
                  Administrators and Local Council Officers need to choose a
                  specific school context.
                </p>
              </div>
            </div>
            <div className="max-w-xl">
                <SchoolSelector
                  selectedSchoolId={effectiveSchoolId || 0}
                  onSchoolChange={(id) =>
                    router.push(`/schools/receipts?schoolId=${id}`)
                  }
                  required
                />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? "space-y-4" : "space-y-6"}`}>
      {/* Header */}
      <div
        className={`flex items-center ${
          isMobile ? "flex-col space-y-3" : "justify-between"
        }`}
      >
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div
            className={`flex items-center justify-center ${
              isMobile ? "w-10 h-10" : "w-12 h-12"
            } bg-blue-100 rounded-lg`}
          >
            <CheckCircle
              className={`${isMobile ? "w-5 h-5" : "w-6 h-6"} text-blue-600`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1
              className={`${
                isMobile ? "text-xl" : isTablet ? "text-2xl" : "text-3xl"
              } font-bold text-foreground`}
            >
              School Receipts
            </h1>
            <p
              className={`${
                isMobile ? "text-sm" : "text-base"
              } text-muted-foreground`}
            >
              {user?.roleName === "School Representative"
                ? isMobile
                  ? `Confirm materials for ${user?.schoolName || "school"}`
                  : `Confirm receipt of educational materials for ${
                      user?.schoolName || "your school"
                    }`
                : isMobile
                ? "View and manage receipts"
                : "View and manage school receipt confirmations"}
            </p>
          </div>
        </div>

        <div
          className={`flex items-center ${isMobile ? "gap-1 w-full" : "gap-2"}`}
        >
          <ExportButton
            onExport={exportData}
            isExporting={isExporting}
            disabled={
              !effectiveSchoolId ||
              !hasAccess ||
              user?.roleName === "View-Only User"
            }
            tooltip={
              !effectiveSchoolId
                ? "No school selected"
                : user?.roleName === "View-Only User"
                ? "Export not available for view-only users"
                : `Export school receipts${
                    searchTerm ? " (with current search)" : ""
                  }`
            }
            showProgress={true}
          />
          <Button
            onClick={fetchReceipts}
            variant="outline"
            disabled={loading}
            className={`${isMobile ? "flex-1" : ""}`}
          >
            <RefreshCw
              className={`h-4 w-4 ${isMobile ? "" : "mr-2"} ${
                loading ? "animate-spin" : ""
              }`}
            />
            {!isMobile && "Refresh"}
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
      <div
        className={`grid gap-3 sm:gap-4 ${
          isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
        }`}
      >
        <Card>
          <CardContent className={`${isMobile ? "p-3" : "p-6"}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p
                  className={`${
                    isMobile ? "text-xs" : "text-sm"
                  } font-medium text-muted-foreground`}
                >
                  Pending Receipts
                </p>
                <p
                  className={`${
                    isMobile ? "text-lg" : "text-2xl"
                  } font-bold text-yellow-600 truncate`}
                >
                  {pendingCount}
                </p>
              </div>
              <AlertTriangle
                className={`${
                  isMobile ? "w-6 h-6" : "w-8 h-8"
                } text-yellow-500 flex-shrink-0`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={`${isMobile ? "p-3" : "p-6"}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p
                  className={`${
                    isMobile ? "text-xs" : "text-sm"
                  } font-medium text-muted-foreground`}
                >
                  Overdue
                </p>
                <p
                  className={`${
                    isMobile ? "text-lg" : "text-2xl"
                  } font-bold text-red-600 truncate`}
                >
                  {overdueCount}
                </p>
              </div>
              <Calendar
                className={`${
                  isMobile ? "w-6 h-6" : "w-8 h-8"
                } text-red-500 flex-shrink-0`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={`${isMobile ? "p-3" : "p-6"}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p
                  className={`${
                    isMobile ? "text-xs" : "text-sm"
                  } font-medium text-muted-foreground`}
                >
                  {isMobile ? "Items Expected" : "Total Items Expected"}
                </p>
                <p
                  className={`${
                    isMobile ? "text-lg" : "text-2xl"
                  } font-bold text-blue-600 truncate`}
                >
                  {receipts.reduce((sum, r) => sum + r.totalItemsExpected, 0)}
                </p>
              </div>
              <Package
                className={`${
                  isMobile ? "w-6 h-6" : "w-8 h-8"
                } text-blue-500 flex-shrink-0`}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Receipts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex-1 max-w-sm">
            <Label htmlFor="search" className={`${isMobile ? "text-sm" : ""}`}>
              {isMobile
                ? "Search receipts"
                : "Search by receipt number, reference, or source"}
            </Label>
            <Input
              id="search"
              placeholder={isMobile ? "Search..." : "Enter search term..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`mt-1 ${isMobile ? "text-base" : ""}`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Receipts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pending Receipts ({filteredReceipts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                Loading receipts...
              </span>
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No Pending Receipts
              </h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No receipts match your search criteria"
                  : "All receipts have been confirmed"}
              </p>
            </div>
          ) : (
            <div className={`${isMobile ? "space-y-3" : "space-y-4"}`}>
              {filteredReceipts.map((receipt) => {
                const SourceIcon = getSourceIcon(receipt.sourceType);
                const isOverdue =
                  receipt.expectedArrivalDate &&
                  new Date(receipt.expectedArrivalDate) < new Date();

                return (
                  <div
                    key={receipt.id}
                    className={`border rounded-lg ${
                      isMobile ? "p-3" : "p-4"
                    } hover:bg-gray-50 transition-colors ${
                      isOverdue ? "border-red-200 bg-red-50" : ""
                    }`}
                  >
                    <div
                      className={`flex items-start ${
                        isMobile ? "flex-col space-y-2" : "justify-between"
                      } mb-3`}
                    >
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`${
                            isMobile ? "text-base" : "text-lg"
                          } font-semibold mb-1`}
                        >
                          Receipt #{receipt.receiptNumber}
                        </h3>
                        <div
                          className={`flex items-center gap-2 ${
                            isMobile ? "text-xs" : "text-sm"
                          } text-muted-foreground`}
                        >
                          <SourceIcon className="h-4 w-4 flex-shrink-0" />
                          <span className={`${isMobile ? "line-clamp-2" : ""}`}>
                            {receipt.sourceType === "DISTRIBUTION"
                              ? "Distribution from"
                              : "Direct shipment from"}{" "}
                            {receipt.sourceName}
                          </span>
                        </div>
                        <p
                          className={`${
                            isMobile ? "text-xs" : "text-xs"
                          } text-muted-foreground`}
                        >
                          Reference: {receipt.sourceReference}
                        </p>
                      </div>
                      <div
                        className={`flex items-center gap-2 ${
                          isMobile ? "flex-wrap" : ""
                        }`}
                      >
                        {isOverdue && (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                        {getStatusBadge(receipt.status)}
                      </div>
                    </div>

                    <div
                      className={`grid ${
                        isMobile
                          ? "grid-cols-1 gap-3"
                          : "grid-cols-1 md:grid-cols-3 gap-4"
                      } text-sm`}
                    >
                      <div className={`${isMobile ? "border-b pb-2" : ""}`}>
                        <p className="text-muted-foreground">
                          Expected Arrival
                        </p>
                        <p className="font-medium">
                          {receipt.expectedArrivalDate
                            ? new Date(
                                receipt.expectedArrivalDate
                              ).toLocaleDateString()
                            : "Not specified"}
                        </p>
                      </div>

                      <div className={`${isMobile ? "border-b pb-2" : ""}`}>
                        <p className="text-muted-foreground">Items Expected</p>
                        <p className="font-medium text-blue-600">
                          {receipt.totalItemsExpected} items
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">Created</p>
                        <p className="font-medium">
                          {new Date(receipt.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`flex items-center ${
                        isMobile
                          ? "flex-col gap-2 mt-3 pt-3"
                          : "justify-end gap-2 mt-4 pt-3"
                      } border-t`}
                    >
                      <Button
                        variant="outline"
                        size={isMobile ? "default" : "sm"}
                        onClick={() => handleViewReceipt(receipt.id)}
                        className={`${isMobile ? "w-full h-12" : ""}`}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>

                      {user?.role !== "view_only" && (
                        <Button
                          size={isMobile ? "default" : "sm"}
                          onClick={() => handleViewReceipt(receipt.id)}
                          className={`bg-green-600 hover:bg-green-700 ${
                            isMobile ? "w-full h-12" : ""
                          }`}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {isMobile ? "Confirm" : "Confirm Receipt"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className={`${isMobile ? "p-3" : "p-4"}`}>
          <div
            className={`flex items-start ${
              isMobile ? "space-x-2" : "space-x-3"
            }`}
          >
            <FileText
              className={`${
                isMobile ? "w-4 h-4" : "w-5 h-5"
              } text-blue-600 mt-0.5 flex-shrink-0`}
            />
            <div className="flex-1 min-w-0">
              <h3
                className={`font-medium text-blue-800 mb-1 ${
                  isMobile ? "text-sm" : ""
                }`}
              >
                Receipt Confirmation Process
              </h3>
              <ul
                className={`${
                  isMobile ? "text-xs" : "text-sm"
                } text-blue-700 space-y-1`}
              >
                <li>
                  • Click &quot;View Details&quot; to see expected items and confirm
                  receipt
                </li>
                <li>
                  • Record actual quantities received and any damaged items
                </li>
                <li>• Note the condition of materials upon arrival</li>
                <li>• Provide notes for any discrepancies or issues</li>
                <li>
                  • Confirmation will update your school&apos;s inventory
                  automatically
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Confirmation Dialog */}
      <ReceiptConfirmationDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        receipt={selectedReceipt}
        onConfirm={handleConfirmReceipt}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
