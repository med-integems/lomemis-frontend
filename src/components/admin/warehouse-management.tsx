"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Plus,
  Search,
  Edit,
  Trash2,
  RotateCcw,
  Warehouse as WarehouseIcon,
  MapPin,
  Users,
  Mail,
  Phone,
  Building,
  MoreHorizontal,
} from "lucide-react";
import { Warehouse, WarehouseFilters } from "@/types";
import {
  useWarehouses,
  useDeleteWarehouse,
  useActivateWarehouse,
  useHardDeleteWarehouse,
} from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/auth-context";
import { useResponsive } from "@/hooks/useResponsive";
import { usePermissions } from "@/hooks/usePermissions";
import { WarehouseForm } from "./warehouse-form";

export function WarehouseManagement() {
  const { isMobile, isTablet } = useResponsive();
  const { user } = useAuth();
  const { canUpdate, canDelete } = usePermissions();
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<WarehouseFilters>({});
  const [showForm, setShowForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Warehouse | null>(null);
  const [activateConfirm, setActivateConfirm] = useState<Warehouse | null>(null);
  const [hardDeleteConfirm, setHardDeleteConfirm] = useState<Warehouse | null>(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  const pageSize = 10;

  const {
    data: warehousesResponse,
    isLoading,
    error,
  } = useWarehouses(currentPage, pageSize, filters);

  const deleteWarehouseMutation = useDeleteWarehouse();
  const activateWarehouseMutation = useActivateWarehouse();
  const hardDeleteMutation = useHardDeleteWarehouse();

  const warehouses = warehousesResponse?.data?.warehouses || [];
  const totalWarehouses = warehousesResponse?.data?.total || 0;
  const totalPages = Math.ceil(totalWarehouses / pageSize);

  const handleSearch = () => {
    const newFilters: WarehouseFilters = {};
    if (searchTerm.trim()) newFilters.search = searchTerm.trim();
    
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchTerm("");
    setFilters({});
    setCurrentPage(1);
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingWarehouse(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingWarehouse(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingWarehouse(null);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      await deleteWarehouseMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const handleHardDeleteConfirm = async () => {
    if (hardDeleteConfirm) {
      await hardDeleteMutation.mutateAsync(hardDeleteConfirm.id);
      setHardDeleteConfirm(null);
    }
  };

  const handleActivateConfirm = async () => {
    if (activateConfirm) {
      await activateWarehouseMutation.mutateAsync(activateConfirm.id);
      setActivateConfirm(null);
    }
  };

  if (showForm) {
    return (
      <WarehouseForm
        warehouse={editingWarehouse}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:justify-between lg:items-start lg:space-y-0">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">
            Warehouse Management
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage warehouse facilities and storage locations
          </p>
        </div>
        <Button 
          onClick={handleAdd} 
          className={`bg-green-600 hover:bg-green-700 ${isMobile ? 'h-12 w-full' : 'lg:w-auto'}`}
          size={isMobile ? "lg" : "default"}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Warehouse
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 mr-3">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total Warehouses</p>
                <p className="text-xl sm:text-2xl font-bold">{totalWarehouses}</p>
              </div>
              <WarehouseIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 mr-3">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Active Warehouses</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {warehouses.filter((w: Warehouse) => w.isActive).length}
                </p>
              </div>
              <Building className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 mr-3">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Current Page</p>
                <p className="text-xl sm:text-2xl font-bold">{currentPage} of {totalPages}</p>
              </div>
              <Search className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search by name, location, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className={isMobile ? "h-12" : ""}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleSearch} 
                className={`bg-blue-600 hover:bg-blue-700 ${isMobile ? 'h-12 w-full' : 'lg:w-auto'}`}
                size={isMobile ? "lg" : "default"}
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button 
                onClick={handleReset} 
                variant="outline"
                className={`${isMobile ? 'h-12 w-full' : 'lg:w-auto'}`}
                size={isMobile ? "lg" : "default"}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warehouses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Warehouses ({totalWarehouses})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-4 text-red-600">
              Error loading warehouses. Please try again.
            </div>
          ) : warehouses.length === 0 ? (
            <div className="text-center py-8">
              <WarehouseIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No warehouses found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Try adjusting your search criteria." : "Get started by adding your first warehouse."}
              </p>
              <Button onClick={searchTerm ? handleReset : handleAdd}>
                {searchTerm ? "Clear Search" : "Add Warehouse"}
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              {isMobile ? (
                <div className="space-y-3">
                  {warehouses.map((warehouse: Warehouse) => (
                    <Card key={warehouse.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="p-2 bg-blue-100 rounded flex-shrink-0">
                            <WarehouseIcon className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-base mb-1 truncate">{warehouse.name}</h3>
                            <p className="text-sm text-muted-foreground mb-1">
                              {warehouse.location || "Not specified"}
                            </p>
                            {warehouse.address && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{warehouse.address}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant={warehouse.isActive ? "default" : "secondary"} className="text-xs flex-shrink-0">
                          {warehouse.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3 text-sm mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Manager:</span>
                          </div>
                          <p className="font-medium truncate">{warehouse.managerName || "Not assigned"}</p>
                        </div>
                        
                        {(warehouse.contactPhone || warehouse.contactEmail) && (
                          <div>
                            <span className="text-muted-foreground">Contact:</span>
                            <div className="mt-1 space-y-1">
                              {warehouse.contactPhone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">{warehouse.contactPhone}</span>
                                </div>
                              )}
                              {warehouse.contactEmail && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm truncate">{warehouse.contactEmail}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(warehouse)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        {canUpdate(["super_admin", "system_admin"]) && (
                          warehouse.isActive ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteConfirm(warehouse)}
                              className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActivateConfirm(warehouse)}
                              className="flex-1 text-green-600 border-green-300 hover:bg-green-50"
                            >
                              Activate
                            </Button>
                          )
                        )}
                        {canDelete(["super_admin"]) && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setHardDeleteConfirm(warehouse)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                /* Desktop Table View */
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.map((warehouse: Warehouse) => (
                    <TableRow key={warehouse.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded">
                            <WarehouseIcon className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{warehouse.name}</div>
                            {warehouse.address && (
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {warehouse.address.length > 50
                                  ? `${warehouse.address.substring(0, 50)}...`
                                  : warehouse.address}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {warehouse.location || "Not specified"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {warehouse.managerName || "Not assigned"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {warehouse.contactPhone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span>{warehouse.contactPhone}</span>
                            </div>
                          )}
                          {warehouse.contactEmail && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span>{warehouse.contactEmail}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={warehouse.isActive ? "default" : "secondary"}>
                          {warehouse.isActive ? "Active" : "Inactive"}
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
                            <DropdownMenuItem onClick={() => handleEdit(warehouse)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Warehouse
                            </DropdownMenuItem>
                            {canUpdate(["super_admin", "system_admin"]) && (
                              warehouse.isActive ? (
                                <DropdownMenuItem
                                  onClick={() => setDeleteConfirm(warehouse)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Deactivate Warehouse
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => setActivateConfirm(warehouse)}
                                  className="text-green-600"
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Activate Warehouse
                                </DropdownMenuItem>
                              )
                            )}
                            {canDelete(["super_admin"]) && (
                              <DropdownMenuItem
                                onClick={() => setHardDeleteConfirm(warehouse)}
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
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * pageSize) + 1} to{" "}
                    {Math.min(currentPage * pageSize, totalWarehouses)} of {totalWarehouses} warehouses
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Warehouse</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate &quot;{deleteConfirm?.name}&quot;? This warehouse will be marked as inactive but data will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate Confirmation Dialog */}
      <AlertDialog open={!!activateConfirm} onOpenChange={() => setActivateConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate Warehouse</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to activate &quot;{activateConfirm?.name}&quot;? This warehouse will be marked as active and available for operations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActivateConfirm}
              className="bg-green-600 hover:bg-green-700"
            >
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation Dialog (Super Admin only) */}
      <AlertDialog open={!!hardDeleteConfirm} onOpenChange={() => setHardDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Warehouse Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. It will permanently delete &quot;{hardDeleteConfirm?.name}&quot; if it is not referenced by any transactions or users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleHardDeleteConfirm}
              className="bg-red-700 hover:bg-red-800"
            >
              {hardDeleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
