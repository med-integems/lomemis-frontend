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
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Search,
  RotateCcw,
  CheckCircle,
} from "lucide-react";
import { useItems, useDeleteItem, useActivateItem, useHardDeleteItem } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/auth-context";
import { useResponsive } from "@/hooks/useResponsive";
import { usePermissions } from "@/hooks/usePermissions";
import { Item } from "@/types";
import { Pagination } from "@/components/ui/pagination";
import { ItemForm } from "./item-form";

interface ItemFilters {
  search?: string;
  category?: string;
  isActive?: boolean;
}

export function ItemManagement() {
  const { isMobile, isTablet } = useResponsive();
  const { user } = useAuth();
  const { canUpdate, canDelete } = usePermissions();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ItemFilters>({});
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Item | null>(null);
  const [activateConfirm, setActivateConfirm] = useState<Item | null>(null);
  const [hardDeleteConfirm, setHardDeleteConfirm] = useState<Item | null>(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const pageSize = 10;

  const {
    data: itemsResponse,
    isLoading,
    error,
  } = useItems(currentPage, pageSize, filters);

  const deleteItemMutation = useDeleteItem();
  const activateItemMutation = useActivateItem();
  const hardDeleteMutation = useHardDeleteItem();

  const items: Item[] = itemsResponse?.data?.items || [];
  const totalCount = itemsResponse?.data?.total || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Get unique categories from items
  const uniqueCategories: string[] = Array.from(
    new Set(items.map((item) => item.category).filter(Boolean))
  ) as string[];

  const handleCreateItem = () => {
    setSelectedItem(null);
    setShowForm(true);
  };

  const handleEditItem = (item: Item) => {
    setSelectedItem(item);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setSelectedItem(null);
    setShowForm(false);
  };

  const handleDeleteItem = (item: Item) => {
    setDeleteConfirm(item);
  };

  const handleHardDeleteItem = (item: Item) => {
    setHardDeleteConfirm(item);
  };

  const handleActivateItem = (item: Item) => {
    setActivateConfirm(item);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteItemMutation.mutate(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const confirmActivate = () => {
    if (activateConfirm) {
      activateItemMutation.mutate(activateConfirm.id);
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
    const newFilters: ItemFilters = {};
    if (searchTerm.trim()) newFilters.search = searchTerm.trim();
    if (categoryFilter && categoryFilter !== "all")
      newFilters.category = categoryFilter;

    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSearch = () => {
    updateFilters();
  };

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
    // Auto-apply filter when dropdown changes
    setTimeout(() => {
      const newFilters: ItemFilters = {};
      if (searchTerm.trim()) newFilters.search = searchTerm.trim();
      if (value && value !== "all") newFilters.category = value;
      setFilters(newFilters);
      setCurrentPage(1);
    }, 0);
  };

  const handleReset = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setFilters({});
    setCurrentPage(1);
  };

  if (showForm) {
    return (
      <ItemForm
        item={selectedItem}
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
            Item Management
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage teaching and learning materials
          </p>
        </div>
        <Button
          onClick={handleCreateItem}
          className={`bg-green-600 hover:bg-green-700 ${isMobile ? 'h-12 w-full' : 'lg:w-auto'}`}
          size={isMobile ? "lg" : "default"}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="text-sm font-medium">Search Items</label>
              <Input
                placeholder="Search by name, code, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className={isMobile ? "h-12" : ""}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select
                value={categoryFilter}
                onValueChange={handleCategoryFilterChange}
              >
                <SelectTrigger className={isMobile ? "h-12" : ""}>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {uniqueCategories.map((category: string) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
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

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Items ({totalCount} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No items found</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              {isMobile ? (
                <div className="space-y-3">
                  {items.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{item.code}</span>
                            {item.category && (
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-base mb-1">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Unit: {item.unitOfMeasure}
                          </p>
                        </div>
                        <Badge variant={item.isActive ? "success" : "secondary"} className="text-xs">
                          {item.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditItem(item)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        {canUpdate(["super_admin", "system_admin"]) && (
                          item.isActive ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteItem(item)}
                              className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActivateItem(item)}
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
                            onClick={() => handleHardDeleteItem(item)}
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
                        <TableHead>Category</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[70px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.code}
                          </TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>
                            {item.category && (
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{item.unitOfMeasure}</TableCell>
                          <TableCell>
                            <Badge
                              variant={item.isActive ? "success" : "secondary"}
                            >
                              {item.isActive ? "Active" : "Inactive"}
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
                                <DropdownMenuItem
                                  onClick={() => handleEditItem(item)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Item
                                </DropdownMenuItem>

                                {canUpdate(["super_admin", "system_admin"]) && (item.isActive ? (
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteItem(item)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Deactivate Item
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => handleActivateItem(item)}
                                    className="text-green-600"
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Activate Item
                                </DropdownMenuItem>
                              ))}
                              {canDelete(["super_admin"]) && (
                                <DropdownMenuItem
                                  onClick={() => handleHardDeleteItem(item)}
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
            <AlertDialogTitle>Deactivate Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate the item{" "}
              <strong>{deleteConfirm?.name}</strong>? This will make the item
              unavailable for new transactions, but existing inventory records
              will remain intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteItemMutation.isPending}
            >
              {deleteItemMutation.isPending
                ? "Deactivating..."
                : "Deactivate Item"}
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
            <AlertDialogTitle>Activate Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to activate the item{" "}
              <strong>{activateConfirm?.name}</strong>? This will make the item
              available for new transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmActivate}
              className="bg-green-600 hover:bg-green-700"
              disabled={activateItemMutation.isPending}
            >
              {activateItemMutation.isPending
                ? "Activating..."
                : "Activate Item"}
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
            <AlertDialogTitle>Delete Item Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. It will permanently delete the item <strong>{hardDeleteConfirm?.name}</strong> if it is not referenced by inventory, shipments, or distributions.
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
