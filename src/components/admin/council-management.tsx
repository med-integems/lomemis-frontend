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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, Plus, Edit, Trash2, Search, RotateCcw, CheckCircle, Building, Users, MapPin } from "lucide-react";
import { useLocalCouncils, useDeleteLocalCouncil, useActivateLocalCouncil, useHardDeleteLocalCouncil } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/auth-context";
import { useResponsive } from "@/hooks/useResponsive";
import { usePermissions } from "@/hooks/usePermissions";
import { ScopeIndicator } from "@/components/ui/scope-indicator";
import { LocalCouncil } from "@/types";
import { Pagination } from "@/components/ui/pagination";
import { LocalCouncilForm } from "./local-council-form";

// Sierra Leone Regions for filtering
const sierraLeoneRegions = [
  "Eastern",
  "Northern", 
  "North Western",
  "Southern",
  "Western Area"
];

interface CouncilFilters {
  search?: string;
  region?: string;
  district?: string;
  isActive?: boolean;
}

export function CouncilManagement() {
  const { isMobile, isTablet } = useResponsive();
  const { user } = useAuth();
  const { isDistrictOfficer, canUpdate, canDelete } = usePermissions();
  const [currentPage, setCurrentPage] = useState(1);
  // Apply role-based default filters
  const getDefaultFilters = (): CouncilFilters => {
    if (!user) return {};

    // District Officers see only councils in their district
    if (user.role === "district_officer" && user.district) {
      return { district: user.district };
    }

    return {};
  };

  const [filters, setFilters] = useState<CouncilFilters>(getDefaultFilters());
  const [selectedCouncil, setSelectedCouncil] = useState<LocalCouncil | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<LocalCouncil | null>(null);
  const [activateConfirm, setActivateConfirm] = useState<LocalCouncil | null>(null);
  const [hardDeleteConfirm, setHardDeleteConfirm] = useState<LocalCouncil | null>(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");

  const pageSize = 10;

  const {
    data: councilsResponse,
    isLoading,
    error,
  } = useLocalCouncils(currentPage, pageSize, filters);

  const deleteCouncilMutation = useDeleteLocalCouncil();
  const activateCouncilMutation = useActivateLocalCouncil();
  const hardDeleteMutation = useHardDeleteLocalCouncil();

  const councils: LocalCouncil[] = councilsResponse?.data?.councils || [];
  const totalCount = councilsResponse?.data?.total || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Use predefined Sierra Leone regions for filtering
  const availableRegions = sierraLeoneRegions;

  const handleCreateCouncil = () => {
    setSelectedCouncil(null);
    setShowForm(true);
  };

  const handleEditCouncil = (council: LocalCouncil) => {
    setSelectedCouncil(council);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setSelectedCouncil(null);
    setShowForm(false);
  };

  const handleDeleteCouncil = (council: LocalCouncil) => {
    setDeleteConfirm(council);
  };

  const handleActivateCouncil = (council: LocalCouncil) => {
    setActivateConfirm(council);
  };

  const handleHardDeleteCouncil = (council: LocalCouncil) => {
    setHardDeleteConfirm(council);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteCouncilMutation.mutate(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const confirmActivate = () => {
    if (activateConfirm) {
      activateCouncilMutation.mutate(activateConfirm.id);
      setActivateConfirm(null);
    }
  };

  const confirmHardDelete = () => {
    if (hardDeleteConfirm) {
      hardDeleteMutation.mutate(hardDeleteConfirm.id);
      setHardDeleteConfirm(null);
    }
  };

  const updateFilters = () => {
    const newFilters: CouncilFilters = {};
    if (searchTerm.trim()) newFilters.search = searchTerm.trim();
    if (regionFilter && regionFilter !== "all") newFilters.region = regionFilter;
    
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSearch = () => {
    updateFilters();
  };

  const handleRegionFilterChange = (value: string) => {
    setRegionFilter(value);
    // Auto-apply filter when dropdown changes
    setTimeout(() => {
      const newFilters: CouncilFilters = {};
      if (searchTerm.trim()) newFilters.search = searchTerm.trim();
      if (value && value !== "all") newFilters.region = value;
      setFilters(newFilters);
      setCurrentPage(1);
    }, 0);
  };

  const handleReset = () => {
    setSearchTerm("");
    setRegionFilter("all");
    setFilters(getDefaultFilters()); // Preserve role-based defaults
    setCurrentPage(1);
  };

  if (showForm) {
    return (
      <LocalCouncilForm
        council={selectedCouncil}
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
            Local Council Management
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage local councils and their information
          </p>
        </div>
        <Button 
          onClick={handleCreateCouncil} 
          className={`bg-green-600 hover:bg-green-700 ${isMobile ? 'h-12 w-full' : 'lg:w-auto'}`}
          size={isMobile ? "lg" : "default"}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Council
        </Button>
      </div>

      {/* Scope Indicator */}
      {user?.role === "district_officer" && user.district && (
        <ScopeIndicator
          type="district"
          scopeName={user.district}
          dataType="councils"
        />
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card>
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">Total Councils</p>
                <p className="text-lg lg:text-2xl font-bold">{totalCount}</p>
              </div>
              <Building className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">Regions</p>
                <p className="text-lg lg:text-2xl font-bold">{availableRegions.length}</p>
              </div>
              <MapPin className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">Active Councils</p>
                <p className="text-lg lg:text-2xl font-bold">{councils.filter(c => c.isActive).length}</p>
              </div>
              <CheckCircle className="h-6 w-6 lg:h-8 lg:w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">Coverage</p>
                <p className="text-lg lg:text-2xl font-bold">{Math.round((councils.filter(c => c.isActive).length / Math.max(totalCount, 1)) * 100)}%</p>
              </div>
              <Users className="h-6 w-6 lg:h-8 lg:w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg lg:text-xl">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="text-sm font-medium">Search Councils</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, code, or contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 min-h-[48px] lg:min-h-[40px]"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Region</label>
              <Select value={regionFilter} onValueChange={handleRegionFilterChange}>
                <SelectTrigger className="min-h-[48px] lg:min-h-[40px]">
                  <SelectValue placeholder="All regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All regions</SelectItem>
                  {availableRegions.map((region: string) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 mt-4 lg:mt-6">
            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 min-h-[48px] lg:min-h-[40px] w-full lg:w-auto">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button variant="outline" onClick={handleReset} className="min-h-[48px] lg:min-h-[40px] w-full lg:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Councils Table */}
      <Card>
        <CardHeader>
          <CardTitle>Local Councils ({totalCount} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : councils.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No councils found</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              {isMobile ? (
                <div className="space-y-3">
                  {councils.map((council) => (
                    <Card key={council.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{council.code}</span>
                            {council.region && (
                              <Badge variant="outline" className="text-xs">
                                {council.region}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-base mb-1">{council.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {council.district || "No district assigned"}
                          </p>
                        </div>
                        <Badge variant={council.isActive ? "success" : "secondary"} className="text-xs">
                          {council.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      <div className="mb-3">
                        <span className="text-sm text-muted-foreground">Contact Person:</span>
                        <p className="font-medium text-sm truncate">{council.contactPerson || "-"}</p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCouncil(council)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        {canUpdate(["super_admin", "system_admin"]) && (
                          council.isActive ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCouncil(council)}
                              className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActivateCouncil(council)}
                              className="flex-1 text-green-600 border-green-300 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Activate
                            </Button>
                          )
                        )}
                        {canDelete(["super_admin"]) && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleHardDeleteCouncil(council)}
                            className="flex-1"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
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
                        <TableHead>Region</TableHead>
                        <TableHead>District</TableHead>
                        <TableHead>Contact Person</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[70px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {councils.map((council) => (
                        <TableRow key={council.id}>
                          <TableCell className="font-medium">{council.code}</TableCell>
                          <TableCell>{council.name}</TableCell>
                          <TableCell>
                            {council.region && (
                              <Badge variant="outline" className="text-xs">
                                {council.region}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{council.district || "-"}</TableCell>
                          <TableCell>{council.contactPerson || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={council.isActive ? "success" : "secondary"}>
                              {council.isActive ? "Active" : "Inactive"}
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
                                <DropdownMenuItem onClick={() => handleEditCouncil(council)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Council
                                </DropdownMenuItem>
                                {canUpdate(["super_admin", "system_admin"]) && (
                                  council.isActive ? (
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteCouncil(council)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Deactivate Council
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() => handleActivateCouncil(council)}
                                      className="text-green-600"
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Activate Council
                                    </DropdownMenuItem>
                                  )
                                )}
                                {canDelete(["super_admin"]) && (
                                  <DropdownMenuItem
                                    onClick={() => handleHardDeleteCouncil(council)}
                                    className="text-red-700"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Permanently
                                  </DropdownMenuItem>
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
            <AlertDialogTitle>Deactivate Council</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate the council{" "}
              <strong>{deleteConfirm?.name}</strong>? This will make the council
              unavailable for new operations, but existing data will remain intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteCouncilMutation.isPending}
            >
              {deleteCouncilMutation.isPending ? "Deactivating..." : "Deactivate Council"}
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
            <AlertDialogTitle>Activate Council</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to activate the council{" "}
              <strong>{activateConfirm?.name}</strong>? This will make the council
              available for new operations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmActivate}
              className="bg-green-600 hover:bg-green-700"
              disabled={activateCouncilMutation.isPending}
            >
              {activateCouncilMutation.isPending ? "Activating..." : "Activate Council"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation Dialog (Super Admin only) */}
      <AlertDialog 
        open={!!hardDeleteConfirm}
        onOpenChange={() => setHardDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Council Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. It will permanently delete the council <strong>{hardDeleteConfirm?.name}</strong> if it is not referenced by any schools, users, inventory, shipments, or distributions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmHardDelete}
              className="bg-red-700 hover:bg-red-800"
              disabled={hardDeleteMutation.isPending}
            >
              {hardDeleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
