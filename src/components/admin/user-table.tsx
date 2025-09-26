"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  MoreHorizontal,
  Edit,
  UserCheck,
  UserX,
  Eye,
  Shield,
  X,
} from "lucide-react";
import { User, UserRole } from "@/types";
import { formatDate } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { useActivateUser, useDeactivateUser, useHardDeleteUser } from "@/hooks/useUsers";
import { useAuth } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/usePermissions";
import { UserSessionsDialog } from "./user-sessions-dialog";

interface UserTableProps {
  users: User[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onEditUser: (user: User) => void;
  currentUser?: User | null;
}

const getRoleBadge = (role: UserRole) => {
  const roleConfig: Record<UserRole, { label: string; variant: "destructive" | "default" | "secondary" | "outline" }> = {
    super_admin: { label: "Super Admin", variant: "destructive" as const },
    system_admin: { label: "System Admin", variant: "destructive" as const },
    national_manager: {
      label: "National Manager",
      variant: "default" as const,
    },
    lc_officer: { label: "LC Officer", variant: "secondary" as const },
    district_officer: { label: "District Officer", variant: "secondary" as const },
    school_rep: { label: "School Rep", variant: "outline" as const },
    view_only: { label: "View Only", variant: "outline" as const },
  };

  const config = roleConfig[role] || {
    label: role || "Unknown",
    variant: "secondary" as const,
  };
  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  );
};

const getStatusBadge = (isActive: boolean) => {
  return isActive ? (
    <Badge variant="success" className="text-xs">
      Active
    </Badge>
  ) : (
    <Badge variant="secondary" className="text-xs">
      Inactive
    </Badge>
  );
};

export function UserTable({
  users,
  loading,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onEditUser,
  currentUser,
}: UserTableProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [sessionsUser, setSessionsUser] = useState<User | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    user: User;
    action: "activate" | "deactivate";
  } | null>(null);

  const activateUserMutation = useActivateUser();
  const deactivateUserMutation = useDeactivateUser();
  const hardDeleteUserMutation = useHardDeleteUser();
  const { user: authUser } = useAuth();
  const { canDelete, canUpdate, canManageSuperAdmin } = usePermissions();
  const [hardDeleteConfirm, setHardDeleteConfirm] = useState<User | null>(null);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleActivateUser = (user: User) => {
    setConfirmAction({ user, action: "activate" });
  };

  const handleDeactivateUser = (user: User) => {
    setConfirmAction({ user, action: "deactivate" });
  };

  const handleHardDeleteUser = (user: User) => {
    setHardDeleteConfirm(user);
  };

  const confirmStatusChange = () => {
    if (confirmAction) {
      if (confirmAction.action === "activate") {
        activateUserMutation.mutate(confirmAction.user.id);
      } else {
        deactivateUserMutation.mutate(confirmAction.user.id);
      }
      setConfirmAction(null);
    }
  };

  const canEditUser = (user: User): boolean => {
    if (!currentUser) return false;

    // Users can edit their own profile
    if (currentUser.id === user.id) return true;

    // Only super_admin and system_admin can edit other users
    if (currentUser.role !== "super_admin" && currentUser.role !== "system_admin") {
      return false;
    }

    // System Administrators cannot edit Super Administrators
    if (user.role === "super_admin" && currentUser.role !== "super_admin") {
      return false;
    }

    return true;
  };

  const canChangeStatus = (user: User): boolean => {
    if (!currentUser) return false;

    // Can't change own status
    if (currentUser.id === user.id) return false;

    // Only super_admin and system_admin can change user status
    if (currentUser.role !== "super_admin" && currentUser.role !== "system_admin") {
      return false;
    }

    // System Administrators cannot change Super Administrator status
    if (user.role === "super_admin" && currentUser.role !== "super_admin") {
      return false;
    }

    return true;
  };

  const canViewSessions = (user: User): boolean => {
    if (!currentUser) return false;

    // Users can view their own sessions
    if (currentUser.id === user.id) return true;

    // Only super_admin and system_admin can view other user sessions
    if (currentUser.role !== "super_admin" && currentUser.role !== "system_admin") {
      return false;
    }

    // System Administrators cannot view Super Administrator sessions
    if (user.role === "super_admin" && currentUser.role !== "super_admin") {
      return false;
    }

    return true;
  };

  const handleViewSessions = (user: User) => {
    setSessionsUser(user);
    setShowSessions(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg lg:text-xl">Users</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile Loading */}
          <div className="lg:hidden space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-10" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Desktop Loading */}
          <div className="hidden lg:block space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg lg:text-xl">Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 lg:py-12">
            <p className="text-muted-foreground text-sm lg:text-base">No users found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg lg:text-xl">
            Users ({totalCount} total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile View - Card Layout */}
          <div className="lg:hidden space-y-3">
            {Array.isArray(users) ? (
              users.map((user) => (
                <Card key={user.id} className="p-4 border">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base truncate">
                        {user.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-h-[44px] min-w-[44px] p-2"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="h-auto">
                        <SheetHeader>
                          <SheetTitle>User Actions</SheetTitle>
                        </SheetHeader>
                        <div className="grid gap-3 mt-4">
                          <Button
                            variant="outline"
                            className="justify-start min-h-[48px]"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDetails(true);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                          {canViewSessions(user) && (
                            <Button
                              variant="outline"
                              className="justify-start min-h-[48px]"
                              onClick={() => handleViewSessions(user)}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              View Sessions
                            </Button>
                          )}
                          {canEditUser(user) && (
                            <Button
                              variant="outline"
                              className="justify-start min-h-[48px]"
                              onClick={() => onEditUser(user)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </Button>
                          )}
                          {canChangeStatus(user) && user.isActive && (
                            <Button
                              variant="outline"
                              className="justify-start min-h-[48px] text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleDeactivateUser(user)}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Deactivate
                            </Button>
                          )}
                          {canChangeStatus(user) && !user.isActive && (
                            <Button
                              variant="outline"
                              className="justify-start min-h-[48px] text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => handleActivateUser(user)}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activate
                            </Button>
                          )}
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Role</span>
                      {getRoleBadge(user.role)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      {getStatusBadge(user.isActive)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Assignment</span>
                      <span className="text-sm text-right max-w-[180px] truncate">
                        {user.localCouncilName ||
                          user.warehouseName ||
                          user.schoolName ||
                          (user.district && `${user.district} District`) ||
                          "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Created</span>
                      <span className="text-sm">{formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            )}
          </div>

          {/* Desktop View - Table Layout */}
          <div className="hidden lg:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(users) ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                      <TableCell>
                        {user.localCouncilName && user.localCouncilName}
                        {user.warehouseName && user.warehouseName}
                        {user.schoolName && user.schoolName}
                        {user.district && `${user.district} District`}
                        {!user.localCouncilName &&
                          !user.warehouseName &&
                          !user.schoolName &&
                          !user.district &&
                          "-"}
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDetails(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {canViewSessions(user) && (
                              <DropdownMenuItem
                                onClick={() => handleViewSessions(user)}
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                View Sessions
                              </DropdownMenuItem>
                            )}
                            {canEditUser(user) && (
                              <DropdownMenuItem
                                onClick={() => onEditUser(user)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                            )}
                            {canChangeStatus(user) && user.isActive && (
                              <DropdownMenuItem
                                onClick={() => handleDeactivateUser(user)}
                                className="text-red-600"
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                            )}
                            {canChangeStatus(user) && !user.isActive && (
                              <DropdownMenuItem
                                onClick={() => handleActivateUser(user)}
                                className="text-green-600"
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            {canDelete(["super_admin"]) && (
                              <DropdownMenuItem
                                onClick={() => handleHardDeleteUser(user)}
                                className="text-red-700"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Delete Permanently
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">Loading users...</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Modal */}
      {showDetails && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start p-4 lg:p-6 border-b">
              <h2 className="text-lg lg:text-xl font-semibold">User Details</h2>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] min-w-[44px] p-2"
                onClick={() => {
                  setShowDetails(false);
                  setSelectedUser(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 lg:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Name
                  </label>
                  <p className="text-sm lg:text-base">{selectedUser.name}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <p className="text-sm lg:text-base break-all">{selectedUser.email}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Role
                  </label>
                  <div>{getRoleBadge(selectedUser.role)}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <div>{getStatusBadge(selectedUser.isActive)}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Local Council
                  </label>
                  <p className="text-sm lg:text-base">{selectedUser.localCouncilName || "-"}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Warehouse
                  </label>
                  <p className="text-sm lg:text-base">{selectedUser.warehouseName || "-"}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    School
                  </label>
                  <p className="text-sm lg:text-base">{selectedUser.schoolName || "-"}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    District
                  </label>
                  <p className="text-sm lg:text-base">{selectedUser.district || "-"}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Created
                  </label>
                  <p className="text-sm lg:text-base">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </label>
                  <p className="text-sm lg:text-base">{formatDate(selectedUser.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Sessions Dialog */}
      {sessionsUser && (
        <UserSessionsDialog
          user={sessionsUser}
          open={showSessions}
          onOpenChange={(open) => {
            setShowSessions(open);
            if (!open) {
              setSessionsUser(null);
            }
          }}
        />
      )}

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === "activate" ? "Activate" : "Deactivate"}{" "}
              User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {confirmAction?.action} the user{" "}
              <strong>{confirmAction?.user.name}</strong>?
              {confirmAction?.action === "deactivate" &&
                " This will prevent them from accessing the system."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              className={
                confirmAction?.action === "activate"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
              disabled={
                activateUserMutation.isPending ||
                deactivateUserMutation.isPending
              }
            >
              {activateUserMutation.isPending ||
              deactivateUserMutation.isPending
                ? "Processing..."
                : confirmAction?.action === "activate"
                ? "Activate"
                : "Deactivate"}
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
            <AlertDialogTitle>Delete User Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. It will permanently delete the user <strong>{hardDeleteConfirm?.name}</strong> if they have no linked records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (hardDeleteConfirm) {
                  hardDeleteUserMutation.mutate(hardDeleteConfirm.id);
                  setHardDeleteConfirm(null);
                }
              }}
              className="bg-red-700 hover:bg-red-800"
              disabled={hardDeleteUserMutation.isPending}
            >
              {hardDeleteUserMutation.isPending ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
