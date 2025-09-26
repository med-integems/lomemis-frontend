"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Users, UserCheck, UserX, Shield, Menu, Search } from "lucide-react";
import { useResponsive } from "@/hooks/useResponsive";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { UserTable } from "./user-table";
import { UserForm } from "./user-form";
import { UserSearch } from "./user-search";
import { useUsers } from "@/hooks/useUsers";
import { useUserStatistics } from "@/hooks/useAdminStatistics";
import { User, UserRole } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/usePermissions";
import { ScopeIndicator } from "@/components/ui/scope-indicator";

interface UserFilters {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  councilId?: number;
  warehouseId?: number;
  district?: string;
}

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const { deviceType, isMobile, isTouchDevice } = useResponsive();
  const { isDistrictOfficer, canViewSection } = usePermissions();
  const [activeTab, setActiveTab] = useState("list");
  const [currentPage, setCurrentPage] = useState(1);
  // Apply role-based default filters
  const getDefaultFilters = (): UserFilters => {
    if (!currentUser) return {};

    // District Officers see only users in their district
    if (currentUser.role === "district_officer" && currentUser.district) {
      return { district: currentUser.district };
    }

    // LC Officers see only users in their council
    if (currentUser.role === "lc_officer" && currentUser.localCouncilId) {
      return { councilId: currentUser.localCouncilId };
    }

    return {};
  };

  const [filters, setFilters] = useState<UserFilters>(getDefaultFilters());
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);

  const pageSize = 10;

  const {
    data: usersResponse,
    isLoading,
    error,
  } = useUsers(currentPage, pageSize, filters);

  // Handle API response structure safely
  console.log("Debug - usersResponse:", usersResponse);
  console.log("Debug - usersResponse.data:", usersResponse?.data);
  const users: User[] = Array.isArray(usersResponse?.data?.users)
    ? usersResponse.data.users
    : [];
  const totalCount =
    typeof usersResponse?.data?.total === "number"
      ? usersResponse.data.total
      : 0;
  console.log("Debug - processed users:", { users: users.length, totalCount });
  console.log("Debug - error:", error);
  console.log("Debug - isLoading:", isLoading);

  // Calculate user statistics
  // System-wide user stats
  const { data: userStatsResponse } = useUserStatistics();
  const stats = (userStatsResponse as any)?.data as
    | { total: number; active: number; byRole: Record<string, number> }
    | undefined;

  const totalUsers = typeof stats?.total === "number" ? stats.total : totalCount;
  const activeUsersCount = typeof stats?.active === "number" ? stats.active : users.filter((u) => u.isActive).length;
  const inactiveUsersCount =
    typeof stats?.total === "number" && typeof stats?.active === "number"
      ? stats.total - stats.active
      : users.filter((u) => !u.isActive).length;
  const adminUsersCount = stats?.byRole?.super_admin ?? users.filter((u) => u.role === "super_admin").length;
  const roleStats = {
    super_admin: stats?.byRole?.super_admin ?? users.filter((u) => u.role === "super_admin").length,
    national_manager:
      stats?.byRole?.national_manager ?? users.filter((u) => u.role === "national_manager").length,
    lc_officer: stats?.byRole?.lc_officer ?? users.filter((u) => u.role === "lc_officer").length,
    school_rep: stats?.byRole?.school_rep ?? users.filter((u) => u.role === "school_rep").length,
    view_only: stats?.byRole?.view_only ?? users.filter((u) => u.role === "view_only").length,
  };

  useEffect(() => {
    setMounted(true);
    // Apply default filters when component mounts
    if (currentUser) {
      setFilters(getDefaultFilters());
    }
  }, [currentUser]);

  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowForm(true);
    setActiveTab("form");
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowForm(true);
    setActiveTab("form");
  };

  const handleCloseForm = () => {
    setSelectedUser(null);
    setShowForm(false);
    setActiveTab("list");
  };

  const handleSearch = (searchFilters: UserFilters) => {
    setFilters(searchFilters);
    setCurrentPage(1);
  };

  // Only super_admin and system_admin can access user management
  const canManageUsers = mounted && currentUser && (
    currentUser.role === "super_admin" ||
    currentUser.role === "system_admin"
  );

  // Mobile Actions Sheet
  const MobileActionsSheet = () => (
    <Sheet open={mobileActionsOpen} onOpenChange={setMobileActionsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[60vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>User Actions</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          {currentUser && (currentUser.role === "super_admin" || currentUser.role === "system_admin") && (
            <Button
              onClick={() => {
                handleCreateUser();
                setMobileActionsOpen(false);
              }}
              className="w-full justify-start bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  if (!mounted || isLoading) {
    return (
      <div className={cn(
        "space-y-6",
        deviceType === "mobile" && "space-y-4"
      )}>
        <div>
          <h1 className={cn(
            "font-bold text-foreground",
            deviceType === "mobile" ? "text-xl" : "text-3xl"
          )}>
            {deviceType === "mobile" ? "User Management" : "User Management"}
          </h1>
          <p className={cn(
            "text-muted-foreground",
            deviceType === "mobile" ? "text-sm" : "text-base"
          )}>
            {deviceType === "mobile" 
              ? "Manage users and permissions"
              : "Manage system users and their permissions"
            }
          </p>
        </div>
        <div className={cn(
          "bg-card rounded-lg border",
          deviceType === "mobile" ? "p-4" : "p-6"
        )}>
          <div className={cn(
            "flex justify-center",
            deviceType === "mobile" ? "py-6" : "py-8"
          )}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!canManageUsers) {
    return (
      <div className={cn(
        "space-y-6",
        deviceType === "mobile" && "space-y-4"
      )}>
        <div>
          <h1 className={cn(
            "font-bold text-foreground",
            deviceType === "mobile" ? "text-xl" : "text-3xl"
          )}>
            User Management
          </h1>
          <p className={cn(
            "text-muted-foreground",
            deviceType === "mobile" ? "text-sm" : "text-base"
          )}>
            {deviceType === "mobile" 
              ? "Manage users and permissions"
              : "Manage system users and their permissions"
            }
          </p>
        </div>
        <div className={cn(
          "bg-card rounded-lg border",
          deviceType === "mobile" ? "p-4" : "p-6"
        )}>
          <p className={cn(
            "text-muted-foreground",
            deviceType === "mobile" ? "text-sm" : "text-base"
          )}>
            {deviceType === "mobile"
              ? "Access denied for user management."
              : "You don't have permission to access user management."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "space-y-6",
      deviceType === "mobile" && "space-y-4"
    )}>
      <div className={cn(
        "flex justify-between items-start",
        deviceType === "mobile" && "flex-col space-y-4 items-start"
      )}>
        <div className={cn(
          deviceType === "mobile" && "w-full"
        )}>
          <h1 className={cn(
            "font-bold text-foreground",
            deviceType === "mobile" ? "text-xl" : "text-3xl"
          )}>
            {deviceType === "mobile" ? "Users" : "User Management"}
          </h1>
          <p className={cn(
            "text-muted-foreground",
            deviceType === "mobile" ? "text-sm" : "text-base"
          )}>
            {deviceType === "mobile" 
              ? "Manage users and permissions"
              : "Manage system users and their permissions"
            }
          </p>
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden lg:flex">
          {currentUser && (currentUser.role === "super_admin" || currentUser.role === "system_admin") && (
            <Button
              onClick={handleCreateUser}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          )}
        </div>
        
        {/* Mobile Actions */}
        <MobileActionsSheet />
      </div>

      {/* Scope Indicator */}
      {currentUser?.role === "district_officer" && currentUser.district && (
        <ScopeIndicator
          type="district"
          scopeName={currentUser.district}
          dataType="users"
        />
      )}
      {currentUser?.role === "lc_officer" && currentUser.localCouncilId && (
        <ScopeIndicator
          type="council"
          scopeName={`Council ${currentUser.localCouncilId}`}
          dataType="users"
        />
      )}

      {/* Summary Stats */}
      <div className={cn(
        "grid gap-4",
        deviceType === "mobile" 
          ? "grid-cols-2" 
          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      )}>
        <Card>
          <CardContent className={cn(
            deviceType === "mobile" ? "p-4" : "p-6"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  "font-medium text-muted-foreground",
                  deviceType === "mobile" ? "text-xs" : "text-sm"
                )}>
                  Total Users
                </p>
                <p className={cn(
                  "font-bold",
                  deviceType === "mobile" ? "text-lg" : "text-2xl"
                )}>{totalUsers}</p>
              </div>
              <Users className={cn(
                "text-blue-600",
                deviceType === "mobile" ? "h-6 w-6" : "h-8 w-8"
              )} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={cn(
            deviceType === "mobile" ? "p-4" : "p-6"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  "font-medium text-muted-foreground",
                  deviceType === "mobile" ? "text-xs" : "text-sm"
                )}>
                  Active Users
                </p>
                <p className={cn(
                  "font-bold",
                  deviceType === "mobile" ? "text-lg" : "text-2xl"
                )}>{activeUsersCount}</p>
                {deviceType !== "mobile" && (
                  <p className="text-xs text-muted-foreground">System-wide</p>
                )}
              </div>
              <UserCheck className={cn(
                "text-green-600",
                deviceType === "mobile" ? "h-6 w-6" : "h-8 w-8"
              )} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={cn(
            deviceType === "mobile" ? "p-4" : "p-6"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  "font-medium text-muted-foreground",
                  deviceType === "mobile" ? "text-xs" : "text-sm"
                )}>
                  Inactive Users
                </p>
                <p className={cn(
                  "font-bold",
                  deviceType === "mobile" ? "text-lg" : "text-2xl"
                )}>{inactiveUsersCount}</p>
                {deviceType !== "mobile" && (
                  <p className="text-xs text-muted-foreground">System-wide</p>
                )}
              </div>
              <UserX className={cn(
                "text-red-600",
                deviceType === "mobile" ? "h-6 w-6" : "h-8 w-8"
              )} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={cn(
            deviceType === "mobile" ? "p-4" : "p-6"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  "font-medium text-muted-foreground",
                  deviceType === "mobile" ? "text-xs" : "text-sm"
                )}>
                  Administrators
                </p>
                <p className={cn(
                  "font-bold",
                  deviceType === "mobile" ? "text-lg" : "text-2xl"
                )}>{adminUsersCount}</p>
                {deviceType !== "mobile" && (
                  <p className="text-xs text-muted-foreground">On current page</p>
                )}
              </div>
              <Shield className={cn(
                "text-purple-600",
                deviceType === "mobile" ? "h-6 w-6" : "h-8 w-8"
              )} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Distribution */}
      {deviceType === "mobile" ? (
        /* Mobile: Show role stats in a compact grid */
        <div className="grid grid-cols-3 gap-2">
          <Card>
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-xs font-medium text-muted-foreground">
                  Admin
                </p>
                <p className="text-base font-bold text-purple-600">
                  {roleStats.super_admin}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-xs font-medium text-muted-foreground">
                  Manager
                </p>
                <p className="text-base font-bold text-blue-600">
                  {roleStats.national_manager}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-xs font-medium text-muted-foreground">
                  LC Officer
                </p>
                <p className="text-base font-bold text-green-600">
                  {roleStats.lc_officer}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-xs font-medium text-muted-foreground">
                  School Rep
                </p>
                <p className="text-base font-bold text-orange-600">
                  {roleStats.school_rep}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-xs font-medium text-muted-foreground">
                  View Only
                </p>
                <p className="text-base font-bold text-gray-600">
                  {roleStats.view_only}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Desktop: Show full role distribution */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  Super Admin
                </p>
                <p className="text-xl font-bold text-purple-600">
                  {roleStats.super_admin}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  National Manager
                </p>
                <p className="text-xl font-bold text-blue-600">
                  {roleStats.national_manager}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  LC Officer
                </p>
                <p className="text-xl font-bold text-green-600">
                  {roleStats.lc_officer}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  School Rep
                </p>
                <p className="text-xl font-bold text-orange-600">
                  {roleStats.school_rep}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  View Only
                </p>
                <p className="text-xl font-bold text-gray-600">
                  {roleStats.view_only}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
        suppressHydrationWarning
      >
        <TabsList className={cn(
          "grid w-full",
          deviceType === "mobile" 
            ? "grid-cols-2 h-auto" 
            : showForm ? "grid-cols-3" : "grid-cols-2"
        )}>
          {deviceType === "mobile" ? (
            // Mobile: Show only essential tabs
            <>
              <TabsTrigger value="list" className={cn(
                "flex items-center gap-2 py-3 text-sm justify-center"
              )}>
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">User List</span>
                <span className="sm:hidden">Users</span>
              </TabsTrigger>
              {showForm ? (
                <TabsTrigger value="form" className={cn(
                  "flex items-center gap-2 py-3 text-sm justify-center"
                )}>
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {selectedUser ? "Edit User" : "Create User"}
                  </span>
                  <span className="sm:hidden">
                    {selectedUser ? "Edit" : "Create"}
                  </span>
                </TabsTrigger>
              ) : (
                <TabsTrigger value="search" className={cn(
                  "flex items-center gap-2 py-3 text-sm justify-center"
                )}>
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Search</span>
                  <span className="sm:hidden">Find</span>
                </TabsTrigger>
              )}
            </>
          ) : (
            // Desktop: Show all tabs
            <>
              <TabsTrigger value="list">User List</TabsTrigger>
              <TabsTrigger value="search">Search & Filter</TabsTrigger>
              {showForm && (
                <TabsTrigger value="form">
                  {selectedUser ? "Edit User" : "Create User"}
                </TabsTrigger>
              )}
            </>
          )}
        </TabsList>
        
        {/* Mobile Secondary Navigation */}
        {deviceType === "mobile" && !showForm && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={activeTab === "search" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("search")}
              className="flex-shrink-0"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        )}

        <TabsContent value="list" className={cn(
          deviceType === "mobile" ? "space-y-3" : "space-y-4"
        )}>
          <UserTable
            users={users}
            loading={isLoading}
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onEditUser={handleEditUser}
            currentUser={currentUser}
          />
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <UserSearch onSearch={handleSearch} currentFilters={filters} />

          {/* Show filtered results directly in search tab */}
          {Object.keys(filters).length > 0 && (
            <UserTable
              users={users}
              loading={isLoading}
              totalCount={totalCount}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onEditUser={handleEditUser}
              currentUser={currentUser}
            />
          )}
        </TabsContent>

        {showForm && (
          <TabsContent value="form" className="space-y-4">
            <UserForm
              user={selectedUser}
              onClose={handleCloseForm}
              onSuccess={() => {
                handleCloseForm();
                setActiveTab("list");
              }}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
