"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal, Plus, Edit, Trash2, Search, RotateCcw, CheckCircle, School as SchoolIcon, GraduationCap, Users, Building, Upload, FileSpreadsheet, Eye, History, ChevronDown, ChevronRight } from "lucide-react";
import { useSchools, useDeleteSchool, useActivateSchool, useLocalCouncils, useRecentImports } from "@/hooks/useAdmin";
import { useSchoolStatistics } from "@/hooks/useAdminStatistics";
import { useResponsive } from "@/hooks/useResponsive";
import { useAuth } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/usePermissions";
import { ScopeIndicator } from "@/components/ui/scope-indicator";
import { School, ImportRunRecord } from "@/types";
import { useRouter } from "next/navigation";
import { Pagination } from "@/components/ui/pagination";
import { SchoolForm } from "./school-form";

interface SchoolFilters {
  search?: string;
  localCouncilId?: number;
  schoolType?: "PRIMARY" | "SECONDARY" | "COMBINED";
  district?: string;
  isActive?: boolean;
}

export function SchoolManagement() {
  const { isMobile, isTablet } = useResponsive();
  const { user } = useAuth();
  const { isDistrictOfficer, canUpdate, canDelete } = usePermissions();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  // Apply role-based default filters
  const getDefaultFilters = (): SchoolFilters => {
    if (!user) return {};

    // District Officers see only schools in their district
    if (user.role === "district_officer" && user.district) {
      return { district: user.district };
    }

    // LC Officers see only schools in their council
    if (user.role === "lc_officer" && user.localCouncilId) {
      return { localCouncilId: user.localCouncilId };
    }

    return {};
  };

  const [filters, setFilters] = useState<SchoolFilters>(getDefaultFilters());
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<School | null>(null);
  const [activateConfirm, setActivateConfirm] = useState<School | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [isImportHistoryCollapsed, setIsImportHistoryCollapsed] = useState(true);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [councilFilter, setCouncilFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const pageSize = 10;

  const {
    data: schoolsResponse,
    isLoading,
    error,
  } = useSchools(currentPage, pageSize, filters);

  // Get school statistics efficiently
  const { data: schoolStatsResponse } = useSchoolStatistics();

  const { data: councilsResponse } = useLocalCouncils(1, 1000); // Get councils for filter
  const { data: recentImportsResponse } = useRecentImports();

  const deleteSchoolMutation = useDeleteSchool();
  const activateSchoolMutation = useActivateSchool();

  const schools: School[] = schoolsResponse?.data?.schools || [];
  const totalCount = schoolsResponse?.data?.total || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const councils = councilsResponse?.data?.councils || [];
  const recentImports: ImportRunRecord[] = recentImportsResponse?.data?.imports || [];

  // Check for pending imports
  const pendingImports = recentImports.filter(importRecord =>
    ['pending_review', 'processing', 'validating', 'uploading'].includes(importRecord.status)
  );
  
  // Get statistics from dedicated statistics endpoint
  const schoolStats = (schoolStatsResponse as any)?.data as {
    total: number;
    active: number;
    byType: { [type: string]: number };
    totalEnrollment: number;
  } | undefined;

  const primarySchoolsCount = schoolStats?.byType?.PRIMARY || 0;
  const secondarySchoolsCount = schoolStats?.byType?.SECONDARY || 0;
  const combinedSchoolsCount = schoolStats?.byType?.COMBINED || 0;
  const activeSchoolsCount = schoolStats?.active || 0;
  const totalEnrollment = schoolStats?.totalEnrollment || 0;

  const handleCreateSchool = () => {
    setSelectedSchool(null);
    setShowForm(true);
  };

  const handleEditSchool = (school: School) => {
    setSelectedSchool(school);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setSelectedSchool(null);
    setShowForm(false);
  };

  const handleDeleteSchool = (school: School) => {
    setDeleteConfirm(school);
  };

  const handleActivateSchool = (school: School) => {
    setActivateConfirm(school);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteSchoolMutation.mutate(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const confirmActivate = () => {
    if (activateConfirm) {
      activateSchoolMutation.mutate(activateConfirm.id);
      setActivateConfirm(null);
    }
  };

  const updateFilters = () => {
    const newFilters: SchoolFilters = {};
    if (searchTerm.trim()) newFilters.search = searchTerm.trim();
    if (councilFilter && councilFilter !== "all") newFilters.localCouncilId = parseInt(councilFilter);
    if (typeFilter && typeFilter !== "all") newFilters.schoolType = typeFilter as "PRIMARY" | "SECONDARY" | "COMBINED";
    
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSearch = () => {
    updateFilters();
  };

  const handleCouncilFilterChange = (value: string) => {
    setCouncilFilter(value);
    // Auto-apply filter when dropdown changes
    setTimeout(() => {
      const newFilters: SchoolFilters = {};
      if (searchTerm.trim()) newFilters.search = searchTerm.trim();
      if (value && value !== "all") newFilters.localCouncilId = parseInt(value);
      if (typeFilter && typeFilter !== "all") newFilters.schoolType = typeFilter as "PRIMARY" | "SECONDARY" | "COMBINED";
      setFilters(newFilters);
      setCurrentPage(1);
    }, 0);
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    // Auto-apply filter when dropdown changes
    setTimeout(() => {
      const newFilters: SchoolFilters = {};
      if (searchTerm.trim()) newFilters.search = searchTerm.trim();
      if (councilFilter && councilFilter !== "all") newFilters.localCouncilId = parseInt(councilFilter);
      if (value && value !== "all") newFilters.schoolType = value as "PRIMARY" | "SECONDARY" | "COMBINED";
      setFilters(newFilters);
      setCurrentPage(1);
    }, 0);
  };

  const handleReset = () => {
    setSearchTerm("");
    setCouncilFilter("all");
    setTypeFilter("all");
    setFilters(getDefaultFilters()); // Preserve role-based defaults
    setCurrentPage(1);
  };

  const handleImportSchools = () => {
    if (pendingImports.length > 0) {
      setShowImportConfirm(true);
    } else {
      router.push('/admin/schools/import');
    }
  };

  const confirmImport = () => {
    setShowImportConfirm(false);
    router.push('/admin/schools/import');
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | "success" => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
      case 'validating':
      case 'uploading':
        return 'secondary';
      case 'failed':
      case 'cancelled':
        return 'destructive';
      case 'pending_review':
        return 'outline';
      default:
        return 'default';
    }
  };

  const formatImportStatus = (status: string): string => {
    switch (status) {
      case 'pending_review':
        return 'Pending Review';
      case 'processing':
        return 'Processing';
      case 'validating':
        return 'Validating';
      case 'uploading':
        return 'Uploading';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (showForm) {
    return (
      <SchoolForm
        school={selectedSchool}
        onClose={handleCloseForm}
        onSuccess={() => {
          handleCloseForm();
        }}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:justify-between lg:items-start lg:space-y-0">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">
            School Management
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage schools and their information
          </p>
        </div>
        <div className={`flex gap-2 ${isMobile ? 'flex-col w-full' : 'lg:flex-row'}`}>
          <Button
            onClick={handleCreateSchool}
            className={`bg-green-600 hover:bg-green-700 ${isMobile ? 'h-12 w-full' : 'lg:w-auto'}`}
            size={isMobile ? "lg" : "default"}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add School
          </Button>
          <Button
            onClick={handleImportSchools}
            className={`bg-blue-600 hover:bg-blue-700 ${isMobile ? 'h-12 w-full' : 'lg:w-auto'}`}
            size={isMobile ? "lg" : "default"}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Schools
          </Button>
        </div>
      </div>

      {/* Scope Indicator */}
      {user?.role === "district_officer" && user.district && (
        <ScopeIndicator
          type="district"
          scopeName={user.district}
          dataType="schools"
        />
      )}
      {user?.role === "lc_officer" && user.localCouncilId && (
        <ScopeIndicator
          type="council"
          scopeName={`Council ${user.localCouncilId}`}
          dataType="schools"
        />
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card>
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">Total Schools</p>
                <p className="text-lg lg:text-2xl font-bold">{totalCount}</p>
              </div>
              <SchoolIcon className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">Primary Schools</p>
                <p className="text-lg lg:text-2xl font-bold">{primarySchoolsCount}</p>
              </div>
              <Users className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">Secondary Schools</p>
                <p className="text-lg lg:text-2xl font-bold">{secondarySchoolsCount}</p>
              </div>
              <GraduationCap className="h-6 w-6 lg:h-8 lg:w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">Combined Schools</p>
                <p className="text-lg lg:text-2xl font-bold">{combinedSchoolsCount}</p>
              </div>
              <Building className="h-6 w-6 lg:h-8 lg:w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
        <Card>
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">Active Schools</p>
                <p className="text-lg lg:text-2xl font-bold">{activeSchoolsCount}</p>
                <p className="text-xs text-muted-foreground">
                  {(schoolStats?.total || 0) > 0 ? Math.round((activeSchoolsCount / (schoolStats?.total || 1)) * 100) : 0}% of total
                </p>
              </div>
              <CheckCircle className="h-6 w-6 lg:h-8 lg:w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">Total Enrollment</p>
                <p className="text-lg lg:text-2xl font-bold">{totalEnrollment.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  Avg: {(schoolStats?.total || 0) > 0 ? Math.round(totalEnrollment / (schoolStats?.total || 1)) : 0} per school
                </p>
              </div>
              <Users className="h-6 w-6 lg:h-8 lg:w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">Local Councils</p>
                <p className="text-lg lg:text-2xl font-bold">{councils.length}</p>
                <p className="text-xs text-muted-foreground">
                  Coverage regions
                </p>
              </div>
              <Building className="h-6 w-6 lg:h-8 lg:w-8 text-teal-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import History */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:justify-between lg:items-start lg:space-y-0">
            <div
              className="cursor-pointer flex items-center gap-2 flex-1"
              onClick={() => setIsImportHistoryCollapsed(!isImportHistoryCollapsed)}
            >
              <div className="flex items-center gap-2">
                {isImportHistoryCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
                <History className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base sm:text-lg lg:text-xl">
                  Import History
                </CardTitle>
              </div>
            </div>
          </div>
          {!isImportHistoryCollapsed && (
            <p className="text-sm text-muted-foreground mt-2">View completed school data imports and their status</p>
          )}
        </CardHeader>
        {!isImportHistoryCollapsed && (
          <CardContent className="pt-0">
          {recentImports.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
              <History className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-muted-foreground mb-2">No import history</p>
              <p className="text-sm text-muted-foreground">Import history will appear here after completing imports</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Recent Import History</h4>
              <div className="space-y-2">
                {recentImports
                  .filter(importRecord => ['completed', 'failed', 'cancelled'].includes(importRecord.status))
                  .slice(0, 5)
                  .map((importRecord) => (
                  <div
                    key={importRecord.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/admin/schools/import/${importRecord.id}`)}
                  >
                    <div className="flex items-center space-x-3">
                      <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">{importRecord.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(importRecord.startedAt).toLocaleDateString()} •
                          {importRecord.totalRows} rows
                          {importRecord.status === 'COMMITTED' && importRecord.successfulRows &&
                            ` • ${importRecord.successfulRows} committed`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={getStatusVariant(importRecord.status)}
                        className="text-xs"
                      >
                        {formatImportStatus(importRecord.status)}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {recentImports.filter(importRecord => ['completed', 'failed', 'cancelled'].includes(importRecord.status)).length > 5 && (
                <div className="text-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/admin/schools/import')}
                  >
                    View All Import History
                  </Button>
                </div>
              )}
            </div>
          )}
          </CardContent>
        )}
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="lg:col-span-2">
              <label className="text-sm font-medium">Search Schools</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, code, or principal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 min-h-[48px] lg:min-h-[40px]"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Local Council</label>
              <Select value={councilFilter} onValueChange={handleCouncilFilterChange}>
                <SelectTrigger className="min-h-[48px] lg:min-h-[40px]">
                  <SelectValue placeholder="All councils" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All councils</SelectItem>
                  {councils.map((council: any) => (
                    <SelectItem key={council.id} value={council.id.toString()}>
                      {council.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">School Type</label>
              <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
                <SelectTrigger className="min-h-[48px] lg:min-h-[40px]">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="PRIMARY">Primary</SelectItem>
                  <SelectItem value="SECONDARY">Secondary</SelectItem>
                  <SelectItem value="COMBINED">Combined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button 
              onClick={handleSearch} 
              className={`bg-blue-600 hover:bg-blue-700 ${isMobile ? 'h-12 w-full' : 'lg:w-auto'}`}
              size={isMobile ? "lg" : "default"}
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset} 
              className={`${isMobile ? 'h-12 w-full' : 'lg:w-auto'}`}
              size={isMobile ? "lg" : "default"}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schools Table */}
      <Card>
        <CardHeader>
          <CardTitle>Schools ({totalCount} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : schools.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No schools found</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              {isMobile ? (
                <div className="space-y-3">
                  {schools.map((school) => (
                    <Card key={school.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{school.code}</span>
                            <Badge variant="outline" className="text-xs">
                              {school.schoolType}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-base mb-1">{school.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {school.localCouncilName || "No council assigned"}
                          </p>
                        </div>
                        <Badge variant={school.isActive ? "success" : "secondary"} className="text-xs">
                          {school.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Principal:</span>
                          <p className="font-medium truncate">{school.principalName || "-"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Enrollment:</span>
                          <p className="font-medium">{school.enrollmentCount}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSchool(school)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        {canUpdate(["super_admin", "system_admin"]) && (
                          school.isActive ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteSchool(school)}
                              className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActivateSchool(school)}
                              className="flex-1 text-green-600 border-green-300 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Activate
                            </Button>
                          )
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                /* Desktop Table View */
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Local Council</TableHead>
                        <TableHead>Principal</TableHead>
                        <TableHead>Enrollment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[70px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schools.map((school) => (
                        <TableRow key={school.id}>
                          <TableCell className="font-medium">{school.code}</TableCell>
                          <TableCell>{school.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {school.schoolType}
                            </Badge>
                          </TableCell>
                          <TableCell>{school.localCouncilName || "-"}</TableCell>
                          <TableCell>{school.principalName || "-"}</TableCell>
                          <TableCell>{school.enrollmentCount}</TableCell>
                          <TableCell>
                            <Badge variant={school.isActive ? "success" : "secondary"}>
                              {school.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditSchool(school)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit School
                                </DropdownMenuItem>
                                {canUpdate(["super_admin", "system_admin"]) && (
                                  school.isActive ? (
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteSchool(school)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Deactivate School
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() => handleActivateSchool(school)}
                                      className="text-green-600"
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Activate School
                                    </DropdownMenuItem>
                                  )
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog 
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate School</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate the school{" "}
              <strong>{deleteConfirm?.name}</strong>? This will make the school
              unavailable for new operations, but existing data will remain intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteSchoolMutation.isPending}
            >
              {deleteSchoolMutation.isPending ? "Deactivating..." : "Deactivate School"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate Confirmation Dialog */}
      <AlertDialog 
        open={!!activateConfirm}
        onOpenChange={() => setActivateConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate School</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to activate the school{" "}
              <strong>{activateConfirm?.name}</strong>? This will make the school
              available for new operations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmActivate}
              className="bg-green-600 hover:bg-green-700"
              disabled={activateSchoolMutation.isPending}
            >
              {activateSchoolMutation.isPending ? "Activating..." : "Activate School"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Confirmation Dialog */}
      <AlertDialog
        open={showImportConfirm}
        onOpenChange={setShowImportConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pending Import Detected</AlertDialogTitle>
            <AlertDialogDescription>
              You have {pendingImports.length} pending import{pendingImports.length > 1 ? 's' : ''} that {pendingImports.length > 1 ? 'are' : 'is'} still processing.
              Starting a new import while others are pending may cause confusion or duplicate data.
              <br /><br />
              <strong>Pending imports:</strong>
              <ul className="mt-2 list-disc list-inside text-sm">
                {pendingImports.slice(0, 3).map((imp) => (
                  <li key={imp.id}>
                    {imp.fileName} - {formatImportStatus(imp.status)}
                  </li>
                ))}
                {pendingImports.length > 3 && (
                  <li>...and {pendingImports.length - 3} more</li>
                )}
              </ul>
              <br />
              Are you sure you want to start a new import?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmImport}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Continue with New Import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}