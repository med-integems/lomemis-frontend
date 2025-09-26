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
import { useResponsive } from "@/hooks/useResponsive";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, CheckCircle, Settings } from "lucide-react";
import { DistributionWithDetails, UserRole } from "@/types";
import { formatDate } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";

interface DistributionTableProps {
  distributions: DistributionWithDetails[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onConfirmReceipt?: (distribution: DistributionWithDetails) => void;
  onViewDetails?: (distributionId: number) => void;
  onResolveDiscrepancy?: (distribution: DistributionWithDetails) => void;
  onMarkSent?: (distribution: DistributionWithDetails) => void;
  userRole: UserRole;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "CREATED":
      return <Badge variant="secondary">Created</Badge>;
    case "CONFIRMED":
      return <Badge variant="success">Confirmed</Badge>;
    case "DISCREPANCY":
      return <Badge variant="destructive">Discrepancy</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function DistributionTable({
  distributions,
  loading,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onConfirmReceipt,
  onViewDetails,
  onResolveDiscrepancy,
  onMarkSent,
  userRole,
}: DistributionTableProps) {
  const { deviceType, isMobile, isTouchDevice } = useResponsive();
  const [selectedDistribution, setSelectedDistribution] =
    useState<DistributionWithDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Mobile Distribution Card Component
  const MobileDistributionCard = ({ distribution }: { distribution: DistributionWithDetails }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Distribution Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">{distribution.distributionNumber}</h3>
              <p className="text-sm text-muted-foreground truncate">{distribution.schoolName}</p>
              <div className="mt-1">
                {getStatusBadge(distribution.status)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails?.(distribution.id)}
                className={cn(isTouchDevice && "min-h-[44px] px-3")}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Distribution Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Council:</span>
              <span className="font-medium truncate ml-2">{distribution.localCouncilName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Items:</span>
              <span className="font-medium">{distribution.totalItems}</span>
            </div>
          </div>

          {/* Additional Details Grid */}
          <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
            <div>
              <span className="text-muted-foreground">Distributed:</span>
              <div className="font-medium text-xs">{formatDate(distribution.distributionDate)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Created by:</span>
              <div className="font-medium text-xs">{distribution.createdByName}</div>
            </div>
          </div>

          {/* Action Buttons */}
          {onConfirmReceipt && userRole === "school_rep" && distribution.status === "SENT" && (
            <Button
              onClick={() => onConfirmReceipt(distribution)}
              className="w-full bg-[#007A33] hover:bg-[#005A25]"
              size="sm"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Receipt
            </Button>
          )}
          
          {onMarkSent && distribution.status === "CREATED" && 
           (userRole === "lc_officer" || userRole === "super_admin") && (
            <Button
              onClick={() => onMarkSent(distribution)}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Sent
            </Button>
          )}
          
          {onResolveDiscrepancy && distribution.status === "DISCREPANCY" && 
           (userRole === "lc_officer" || userRole === "super_admin") && (
            <Button
              onClick={() => onResolveDiscrepancy(distribution)}
              variant="outline"
              className="w-full text-orange-600 border-orange-600 hover:bg-orange-600 hover:text-white"
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              Resolve Discrepancy
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader className={cn(
          deviceType === "mobile" && "px-4 py-3"
        )}>
          <CardTitle className={cn(
            deviceType === "mobile" ? "text-lg" : "text-xl"
          )}>Distributions</CardTitle>
        </CardHeader>
        <CardContent className={cn(
          deviceType === "mobile" && "px-4 pb-4"
        )}>
          <div className="space-y-3">
            {deviceType === "mobile" ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (distributions.length === 0) {
    return (
      <Card>
        <CardHeader className={cn(
          deviceType === "mobile" && "px-4 py-3"
        )}>
          <CardTitle className={cn(
            deviceType === "mobile" ? "text-lg" : "text-xl"
          )}>Distributions</CardTitle>
        </CardHeader>
        <CardContent className={cn(
          deviceType === "mobile" && "px-4 pb-4"
        )}>
          <div className={cn(
            "text-center",
            deviceType === "mobile" ? "py-6" : "py-8"
          )}>
            <p className={cn(
              "text-muted-foreground",
              deviceType === "mobile" ? "text-sm" : "text-base"
            )}>No distributions found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className={cn(
          deviceType === "mobile" && "px-4 py-3"
        )}>
          <CardTitle className={cn(
            deviceType === "mobile" ? "text-lg" : "text-xl"
          )}>
            {deviceType === "mobile" 
              ? `Distributions (${totalCount})` 
              : `Distributions (${totalCount} total)`}
          </CardTitle>
        </CardHeader>
        <CardContent className={cn(
          deviceType === "mobile" && "px-4 pb-4"
        )}>
          {deviceType === "mobile" ? (
            /* Mobile Card View */
            <div className="space-y-4">
              {distributions.map((distribution) => (
                <MobileDistributionCard key={distribution.id} distribution={distribution} />
              ))}
            </div>
          ) : (
            /* Desktop Table View */
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Distribution #</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Local Council</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Distribution Date</TableHead>
                    <TableHead>Total Items</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributions.map((distribution) => (
                    <TableRow key={distribution.id}>
                      <TableCell className="font-medium">
                        {distribution.distributionNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {distribution.schoolName}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{distribution.localCouncilName}</TableCell>
                      <TableCell>{getStatusBadge(distribution.status)}</TableCell>
                      <TableCell>
                        {formatDate(distribution.distributionDate)}
                      </TableCell>
                      <TableCell>{distribution.totalItems}</TableCell>
                      <TableCell>{distribution.createdByName}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onViewDetails?.(distribution.id)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {onMarkSent &&
                              distribution.status === "CREATED" &&
                              (userRole === "lc_officer" ||
                                userRole === "super_admin") && (
                                <DropdownMenuItem
                                  onClick={() => onMarkSent(distribution)}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark as Sent
                                </DropdownMenuItem>
                              )}
                            {onResolveDiscrepancy &&
                              distribution.status === "DISCREPANCY" &&
                              (userRole === "lc_officer" ||
                                userRole === "super_admin") && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    onResolveDiscrepancy(distribution)
                                  }
                                >
                                  <Settings className="mr-2 h-4 w-4" />
                                  Resolve Discrepancy
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
            <div className={cn(
              "mt-4 flex",
              deviceType === "mobile" ? "justify-center" : "justify-center"
            )}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribution Details Modal */}
      {showDetails && selectedDistribution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={cn(
            "bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto",
            deviceType === "mobile" ? "m-2 p-4" : "m-4 p-6"
          )}>
            <div className="flex justify-between items-start mb-4">
              <h2 className={cn(
                "font-semibold",
                deviceType === "mobile" ? "text-lg" : "text-xl"
              )}>Distribution Details</h2>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDetails(false);
                  setSelectedDistribution(null);
                }}
                className={cn(
                  isTouchDevice && "min-h-[44px] min-w-[44px]"
                )}
              >
                ×
              </Button>
            </div>

            <div className={cn(
              "gap-4 mb-6",
              deviceType === "mobile" ? "grid grid-cols-1" : "grid grid-cols-2"
            )}>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Distribution Number
                </label>
                <p>{selectedDistribution.distributionNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Status
                </label>
                <div className="mt-1">
                  {getStatusBadge(selectedDistribution.status)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  School
                </label>
                <p>{selectedDistribution.schoolName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Local Council
                </label>
                <p>{selectedDistribution.localCouncilName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Distribution Date
                </label>
                <p>{formatDate(selectedDistribution.distributionDate)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Created By
                </label>
                <p>{selectedDistribution.createdByName}</p>
              </div>
              {selectedDistribution.confirmationDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Confirmation Date
                  </label>
                  <p>{formatDate(selectedDistribution.confirmationDate)}</p>
                </div>
              )}
              {selectedDistribution.confirmedByName && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Confirmed By
                  </label>
                  <p>{selectedDistribution.confirmedByName}</p>
                </div>
              )}
            </div>

            {selectedDistribution.notes && (
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-500">
                  Notes
                </label>
                <p className="mt-1 text-sm">{selectedDistribution.notes}</p>
              </div>
            )}

            {selectedDistribution.discrepancyNotes && (
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-500">
                  Discrepancy Notes
                </label>
                <p className="mt-1 text-sm text-red-600">
                  {selectedDistribution.discrepancyNotes}
                </p>
              </div>
            )}

            <div>
              <h3 className={cn(
                "font-medium mb-3",
                deviceType === "mobile" ? "text-base" : "text-lg"
              )}>Distribution Items</h3>
              {deviceType === "mobile" ? (
                /* Mobile: Show items as cards */
                <div className="space-y-3">
                  {selectedDistribution.items.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-sm">{item.itemName}</h4>
                              <p className="text-xs text-muted-foreground">{item.itemCode}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">{item.unitOfMeasure}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Distributed:</span>
                              <div className="font-medium">{item.quantityDistributed}</div>
                            </div>
                            {selectedDistribution.status !== "CREATED" && (
                              <div>
                                <span className="text-muted-foreground">Confirmed:</span>
                                <div className="font-medium">{item.quantityConfirmed || "-"}</div>
                              </div>
                            )}
                            {item.discrepancyQuantity !== undefined && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Discrepancy:</span>
                                <div className={cn(
                                  "font-medium",
                                  item.discrepancyQuantity !== 0 ? "text-red-600" : "text-green-600"
                                )}>
                                  {item.discrepancyQuantity > 0 ? "+" : ""}{item.discrepancyQuantity}
                                </div>
                              </div>
                            )}
                          </div>
                          {item.notes && (
                            <div className="pt-2 border-t">
                              <span className="text-muted-foreground text-xs">Notes:</span>
                              <p className="text-xs">{item.notes}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                /* Desktop: Show items as table */
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Qty Distributed</TableHead>
                        {selectedDistribution.status !== "CREATED" && (
                          <TableHead>Qty Confirmed</TableHead>
                        )}
                        {selectedDistribution.items.some(
                          (item) => item.discrepancyQuantity !== undefined
                        ) && <TableHead>Discrepancy</TableHead>}
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedDistribution.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.itemName}</TableCell>
                          <TableCell>{item.itemCode}</TableCell>
                          <TableCell>{item.unitOfMeasure}</TableCell>
                          <TableCell>{item.quantityDistributed}</TableCell>
                          {selectedDistribution.status !== "CREATED" && (
                            <TableCell>{item.quantityConfirmed || "-"}</TableCell>
                          )}
                          {selectedDistribution.items.some(
                            (item) => item.discrepancyQuantity !== undefined
                          ) && (
                            <TableCell>
                              {item.discrepancyQuantity !== undefined ? (
                                <span
                                  className={
                                    item.discrepancyQuantity !== 0
                                      ? "text-red-600"
                                      : "text-green-600"
                                  }
                                >
                                  {item.discrepancyQuantity > 0 ? "+" : ""}
                                  {item.discrepancyQuantity}
                                </span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                          )}
                          <TableCell>{item.notes || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
