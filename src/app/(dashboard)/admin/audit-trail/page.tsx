"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useResponsive } from "@/hooks/useResponsive";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  Filter,
  Calendar,
  User,
  Database,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Edit,
  Trash,
  Plus,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useApiQuery } from "@/hooks/useApi";
import { auditApi, usersApi } from "@/lib/api";
import type { ApiResponse } from "@/types";

interface AuditLogRecord {
  id: number;
  tableName: string;
  recordId: number;
  action: "INSERT" | "UPDATE" | "DELETE";
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  userId?: number;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface AuditLogFilters {
  tableName?: string;
  recordId?: number;
  action?: "INSERT" | "UPDATE" | "DELETE";
  userId?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export default function AuditTrailPage() {
  const { user } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [tableFilter, setTableFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [userFilter, setUserFilter] = useState<string>("");
  const [filters, setFilters] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const [selectedRecord, setSelectedRecord] = useState<AuditLogRecord | null>(null);

  const limit = isMobile ? 10 : 20;

  // Build filters for API
  const apiFilters: AuditLogFilters = {};
  if (searchTerm) {
    apiFilters.search = searchTerm;
  }
  if (tableFilter && tableFilter !== "ALL") {
    apiFilters.tableName = tableFilter;
  }
  if (actionFilter && actionFilter !== "ALL") {
    apiFilters.action = actionFilter as "INSERT" | "UPDATE" | "DELETE";
  }
  if (userFilter && userFilter !== "ALL") {
    apiFilters.userId = parseInt(userFilter);
  }
  if (filters.startDate) {
    apiFilters.startDate = filters.startDate;
  }
  if (filters.endDate) {
    apiFilters.endDate = filters.endDate;
  }

  // Fetch audit logs with pagination and filtering
  const {
    data: auditResponse,
    isLoading: loading,
    error: apiError,
    refetch,
  } = useApiQuery(
    ["audit-logs", currentPage, limit, apiFilters],
    () => auditApi.getAuditLogs(currentPage, limit, apiFilters),
    {}
  );

  // Fetch users for filter dropdown
  const { data: usersResponse } = useApiQuery(
    ["users-for-audit"],
    () => usersApi.getUsers(1, 100, { isActive: true }),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const auditLogs = (auditResponse as any)?.success
    ? (auditResponse as any).data?.auditLogs || []
    : [];
  const totalLogs = (auditResponse as any)?.success
    ? (auditResponse as any).data?.total || 0
    : 0;
  const totalPages = Math.ceil(totalLogs / limit);
  const users = (usersResponse as any)?.success
    ? (usersResponse as any).data?.users || []
    : [];
  const error = apiError ? "Failed to load audit logs" : null;

  // Check permissions
  const hasAccess = user?.role === "super_admin" || 
                   (user?.role as any) === "national_warehouse_manager";

  const getActionBadge = (action: string) => {
    const actionColors = {
      INSERT: "bg-green-100 text-green-800 border-green-200",
      UPDATE: "bg-blue-100 text-blue-800 border-blue-200",
      DELETE: "bg-red-100 text-red-800 border-red-200",
    };
    return (
      actionColors[action as keyof typeof actionColors] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  const getTableBadge = (tableName: string) => {
    const tableColors = {
      users: "bg-purple-100 text-purple-800 border-purple-200",
      items: "bg-orange-100 text-orange-800 border-orange-200",
      schools: "bg-indigo-100 text-indigo-800 border-indigo-200",
      warehouses: "bg-teal-100 text-teal-800 border-teal-200",
      inventory_transactions: "bg-yellow-100 text-yellow-800 border-yellow-200",
      shipments: "bg-blue-100 text-blue-800 border-blue-200",
      distributions: "bg-green-100 text-green-800 border-green-200",
    };
    return (
      tableColors[tableName as keyof typeof tableColors] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  // Reset to first page when filters change
  const resetToFirstPage = () => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  // Effect to reset page when filters change
  useEffect(() => {
    resetToFirstPage();
  }, [
    searchTerm,
    tableFilter,
    actionFilter,
    userFilter,
    filters.startDate,
    filters.endDate,
  ]);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatJsonValue = (value: any) => {
    if (!value) return "N/A";
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const handleViewDetails = (record: AuditLogRecord) => {
    setSelectedRecord(record);
  };

  // Access control check
  if (!hasAccess) {
    return (
      <div className="p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            Access denied. Only Super Administrators and National Warehouse Managers can view audit logs.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-between items-center'}`}>
          <div>
            <Skeleton className={`h-8 ${isMobile ? 'w-48' : 'w-64'}`} />
            <Skeleton className={`h-4 ${isMobile ? 'w-64' : 'w-96'} mt-2`} />
          </div>
          {!isMobile && <Skeleton className="h-10 w-40" />}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-between items-center'}`}>
        <div className="flex-1 min-w-0">
          <h1 className={`${isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900`}>
            {isMobile ? "System Audit Trail" : "System Audit Trail"}
          </h1>
          <p className={`mt-2 ${isMobile ? 'text-sm' : 'text-sm'} text-gray-600`}>
            {isMobile 
              ? "Track system changes and user activities"
              : "Monitor and track all system changes, user activities, and data modifications"
            }
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          className={`${isMobile ? 'w-full h-12' : ''}`}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Filter className="w-5 h-5 mr-2" />
            Filter Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
            <div className="space-y-2">
              <Label htmlFor="search" className={`${isMobile ? 'text-sm' : ''}`}>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder={isMobile ? "Search..." : "Search logs..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 ${isMobile ? 'text-base' : ''}`}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="table" className={`${isMobile ? 'text-sm' : ''}`}>Table</Label>
              <Select value={tableFilter} onValueChange={setTableFilter}>
                <SelectTrigger className={`${isMobile ? 'text-base' : ''}`}>
                  <SelectValue placeholder="All Tables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Tables</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="items">Items</SelectItem>
                  <SelectItem value="schools">Schools</SelectItem>
                  <SelectItem value="warehouses">Warehouses</SelectItem>
                  <SelectItem value="inventory_transactions">Inventory Transactions</SelectItem>
                  <SelectItem value="shipments">Shipments</SelectItem>
                  <SelectItem value="distributions">Distributions</SelectItem>
                  <SelectItem value="warehouse_stock_receipts">Stock Receipts</SelectItem>
                  <SelectItem value="direct_shipments">Direct Shipments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="action" className={`${isMobile ? 'text-sm' : ''}`}>Action</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className={`${isMobile ? 'text-base' : ''}`}>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Actions</SelectItem>
                  <SelectItem value="INSERT">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user" className={`${isMobile ? 'text-sm' : ''}`}>User</Label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className={`${isMobile ? 'text-base' : ''}`}>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Users</SelectItem>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range Filters */}
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4 mt-4`}>
            <div className="space-y-2">
              <Label htmlFor="start-date" className={`${isMobile ? 'text-sm' : ''}`}>Start Date</Label>
              <Input
                id="start-date"
                type="datetime-local"
                value={filters.startDate || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className={`${isMobile ? 'text-base' : ''}`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date" className={`${isMobile ? 'text-sm' : ''}`}>End Date</Label>
              <Input
                id="end-date"
                type="datetime-local"
                value={filters.endDate || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className={`${isMobile ? 'text-base' : ''}`}
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className={`flex items-center ${isMobile ? 'flex-col gap-3' : 'justify-between'} mt-4`}>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setTableFilter("ALL");
                setActionFilter("ALL");
                setUserFilter("ALL");
                setFilters({});
              }}
              className={`${isMobile ? 'w-full h-12' : ''}`}
            >
              Clear Filters
            </Button>
            <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
              Total audit logs: {totalLogs.toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Audit Logs ({auditLogs.length})
            </div>
          </CardTitle>
          <CardDescription>
            Complete log of all system changes, user activities, and data modifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <div className="text-center py-8">
              <Database className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} text-gray-400 mx-auto mb-4`} />
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-900 mb-2`}>
                No audit logs found
              </h3>
              <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-500`}>
                {totalLogs === 0
                  ? "No audit logs have been created yet."
                  : "No logs match your current filters."}
              </p>
            </div>
          ) : (
            <>
              {isMobile ? (
                <div className="space-y-3">
                  {auditLogs.map((log: AuditLogRecord) => (
                    <Card key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold mb-1">
                            Record #{log.recordId}
                          </h3>
                          <p className="text-xs text-gray-600 truncate">
                            {log.userName || 'System'} • {formatDateTime(log.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <Badge className={getActionBadge(log.action)}>
                            {log.action}
                          </Badge>
                          <Badge className={getTableBadge(log.tableName)}>
                            {log.tableName}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t">
                        <Button
                          variant="outline"
                          onClick={() => handleViewDetails(log)}
                          className="w-full h-10 text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Table</TableHead>
                        <TableHead>Record ID</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log: AuditLogRecord) => (
                        <TableRow key={log.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {log.id}
                          </TableCell>
                          <TableCell>
                            <Badge className={getTableBadge(log.tableName)}>
                              {log.tableName}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.recordId}</TableCell>
                          <TableCell>
                            <Badge className={getActionBadge(log.action)}>
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <User className="w-4 h-4 mr-1 text-gray-400" />
                              {log.userName || 'System'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                              {formatDateTime(log.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {log.ipAddress || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(log)}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={`flex items-center ${isMobile ? 'flex-col space-y-3' : 'justify-between'} mt-6`}>
                  <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-700 ${isMobile ? 'order-2' : ''}`}>
                    Showing {(currentPage - 1) * limit + 1} to{" "}
                    {Math.min(currentPage * limit, totalLogs)} of{" "}
                    {totalLogs} logs
                  </div>
                  <div className={`flex items-center ${isMobile ? 'space-x-1 order-1' : 'space-x-2'}`}>
                    <Button
                      variant="outline"
                      size={isMobile ? "sm" : "sm"}
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className={`${isMobile ? 'px-2' : ''}`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      {!isMobile && "Previous"}
                    </Button>

                    {!isMobile && (
                      <div className="flex items-center space-x-1">
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
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
                                variant={
                                  currentPage === pageNum ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="w-8 h-8 p-0"
                              >
                                {pageNum}
                              </Button>
                            );
                          }
                        )}
                      </div>
                    )}

                    {isMobile && (
                      <span className="text-sm font-medium px-3">
                        {currentPage} / {totalPages}
                      </span>
                    )}

                    <Button
                      variant="outline"
                      size={isMobile ? "sm" : "sm"}
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className={`${isMobile ? 'px-2' : ''}`}
                    >
                      {!isMobile && "Next"}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Audit Log Details Dialog */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 ${isMobile ? 'w-full max-h-[90vh]' : 'w-full max-w-5xl max-h-[90vh]'} overflow-hidden`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Audit Log Details</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedRecord.tableName} • Record #{selectedRecord.recordId} • {selectedRecord.action}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRecord(null)}
                  className="bg-white hover:bg-gray-50"
                >
                  Close
                </Button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-white dark:bg-gray-900">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-lg border-b pb-2">
                    Basic Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="font-medium text-gray-700 dark:text-gray-300 w-24 flex-shrink-0">ID:</span>
                      <span className="text-gray-900 dark:text-white">{selectedRecord.id}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-medium text-gray-700 dark:text-gray-300 w-24 flex-shrink-0">Table:</span>
                      <div>
                        <Badge className={getTableBadge(selectedRecord.tableName)}>
                          {selectedRecord.tableName}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="font-medium text-gray-700 dark:text-gray-300 w-24 flex-shrink-0">Record:</span>
                      <span className="text-gray-900 dark:text-white font-mono">#{selectedRecord.recordId}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-medium text-gray-700 dark:text-gray-300 w-24 flex-shrink-0">Action:</span>
                      <div>
                        <Badge className={getActionBadge(selectedRecord.action)}>
                          {selectedRecord.action}
                        </Badge>
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                          {selectedRecord.action === 'INSERT' ? 'Created new record' : 
                           selectedRecord.action === 'UPDATE' ? 'Modified existing record' :
                           'Deleted record'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="font-medium text-gray-700 dark:text-gray-300 w-24 flex-shrink-0">User:</span>
                      <div>
                        <span className="text-gray-900 dark:text-white">
                          {selectedRecord.userName || 'System'}
                        </span>
                        {selectedRecord.userId && (
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                            (ID: {selectedRecord.userId})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="font-medium text-gray-700 dark:text-gray-300 w-24 flex-shrink-0">When:</span>
                      <div>
                        <span className="text-gray-900 dark:text-white">
                          {new Date(selectedRecord.createdAt).toLocaleDateString('en-GB', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {new Date(selectedRecord.createdAt).toLocaleTimeString('en-GB')} 
                          <span className="ml-2">
                            ({Math.round((Date.now() - new Date(selectedRecord.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technical Details */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-lg border-b pb-2">
                    Technical Details
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="font-medium text-gray-700 dark:text-gray-300 w-24 flex-shrink-0">IP Address:</span>
                      <span className="text-gray-900 dark:text-white font-mono">
                        {selectedRecord.ipAddress || 'Not recorded'}
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-medium text-gray-700 dark:text-gray-300 w-24 flex-shrink-0">User Agent:</span>
                      <div className="flex-1 min-w-0">
                        {selectedRecord.userAgent ? (
                          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono break-all">
                            {selectedRecord.userAgent}
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">Not recorded</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Changes Section */}
              {(selectedRecord.oldValues || selectedRecord.newValues) && (
                <div className="mt-8 space-y-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-lg border-b pb-2">
                    Data Changes
                  </h4>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {selectedRecord.oldValues && (
                      <div className="space-y-3">
                        <h5 className="font-medium text-red-700 dark:text-red-400 flex items-center">
                          <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                          Previous Values
                        </h5>
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                          <pre className="text-sm font-mono text-red-900 dark:text-red-100 whitespace-pre-wrap overflow-x-auto">
                            {formatJsonValue(selectedRecord.oldValues)}
                          </pre>
                        </div>
                      </div>
                    )}
                    
                    {selectedRecord.newValues && (
                      <div className="space-y-3">
                        <h5 className="font-medium text-green-700 dark:text-green-400 flex items-center">
                          <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                          New Values
                        </h5>
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                          <pre className="text-sm font-mono text-green-900 dark:text-green-100 whitespace-pre-wrap overflow-x-auto">
                            {formatJsonValue(selectedRecord.newValues)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Value Comparison */}
                  {selectedRecord.oldValues && selectedRecord.newValues && selectedRecord.action === 'UPDATE' && (
                    <div className="mt-6">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-3">Changes Summary</h5>
                      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="text-sm">
                          {Object.keys(selectedRecord.newValues).map((key) => {
                            const oldVal = selectedRecord.oldValues?.[key];
                            const newVal = selectedRecord.newValues?.[key];
                            if (oldVal !== newVal) {
                              return (
                                <div key={key} className="flex items-center justify-between py-2 border-b border-blue-200 dark:border-blue-800 last:border-b-0">
                                  <span className="font-medium text-blue-900 dark:text-blue-100">{key}:</span>
                                  <div className="text-right">
                                    <span className="text-red-600 dark:text-red-400 line-through mr-2">
                                      {String(oldVal)}
                                    </span>
                                    <span className="text-green-600 dark:text-green-400 font-medium">
                                      {String(newVal)}
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
