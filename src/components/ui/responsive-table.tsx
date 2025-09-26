"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useResponsive } from "@/hooks/useResponsive";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface ResponsiveColumn<T> {
  key: keyof T | string;
  header: string;
  accessor?: (item: T) => React.ReactNode;
  mobileVisible?: boolean;
  tabletVisible?: boolean;
  desktopVisible?: boolean;
  sticky?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
  className?: string;
  renderMobile?: (item: T) => React.ReactNode;
  renderDesktop?: (item: T) => React.ReactNode;
  sortable?: boolean;
  priority?: number; // Lower number = higher priority on mobile
}

export interface ResponsiveTableProps<T> {
  data: T[];
  columns: ResponsiveColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T, index: number) => void;
  className?: string;
  keyExtractor?: (item: T, index: number) => string;
  mobileCardView?: boolean;
  stickyHeader?: boolean;
  maxMobileColumns?: number;
  showPagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  total?: number;
}

export function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = "No data available",
  onRowClick,
  className,
  keyExtractor,
  mobileCardView = true,
  stickyHeader = false,
  maxMobileColumns = 3,
  showPagination = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  pageSize,
  total,
}: ResponsiveTableProps<T>) {
  const { isMobile, isTablet, isTouchDevice } = useResponsive();

  const getKey = (item: T, index: number): string => {
    if (keyExtractor) return keyExtractor(item, index);
    if ("id" in item) return String(item.id);
    return index.toString();
  };

  const visibleColumns = useMemo(() => {
    return columns.filter((column) => {
      if (isMobile) {
        return column.mobileVisible !== false;
      }
      if (isTablet) {
        return column.tabletVisible !== false;
      }
      return column.desktopVisible !== false;
    });
  }, [columns, isMobile, isTablet]);

  const mobileColumns = useMemo(() => {
    if (!isMobile || !mobileCardView) return visibleColumns;
    
    // Sort by priority (lower number = higher priority) and take up to maxMobileColumns
    const prioritizedColumns = [...visibleColumns].sort((a, b) => {
      const priorityA = a.priority ?? 999;
      const priorityB = b.priority ?? 999;
      return priorityA - priorityB;
    });
    
    return prioritizedColumns.slice(0, maxMobileColumns);
  }, [visibleColumns, isMobile, mobileCardView, maxMobileColumns]);

  const renderCellContent = (column: ResponsiveColumn<T>, item: T): React.ReactNode => {
    if (isMobile && column.renderMobile) {
      return column.renderMobile(item);
    }
    if (column.renderDesktop) {
      return column.renderDesktop(item);
    }
    if (column.accessor) {
      return column.accessor(item);
    }
    return item[column.key as keyof T];
  };

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {isMobile && mobileCardView ? (
          // Mobile card skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {Array.from({ length: Math.min(mobileColumns.length, 3) }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          // Desktop table skeleton
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.map((column, index) => (
                    <TableHead key={index}>
                      <Skeleton className="h-4 w-20" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {visibleColumns.map((_, colIndex) => (
                      <TableCell key={colIndex}>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Mobile card view
  if (isMobile && mobileCardView) {
    return (
      <div className={cn("space-y-3", className)}>
        {data.map((item, index) => (
          <Card
            key={getKey(item, index)}
            className={cn(
              "transition-all duration-200",
              onRowClick && "cursor-pointer hover:shadow-md",
              isTouchDevice && "touch-manipulation"
            )}
            onClick={() => onRowClick?.(item, index)}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                {mobileColumns.map((column, colIndex) => {
                  const content = renderCellContent(column, item);
                  if (!content) return null;
                  
                  return (
                    <div key={colIndex} className="flex justify-between items-start">
                      <span className="text-sm font-medium text-muted-foreground min-w-0 flex-shrink-0 mr-3">
                        {column.header}:
                      </span>
                      <div className={cn(
                        "text-sm min-w-0 flex-1",
                        column.align === "right" && "text-right",
                        column.align === "center" && "text-center"
                      )}>
                        {content}
                      </div>
                    </div>
                  );
                })}
                
                {/* Show additional columns in a condensed format if there are more */}
                {visibleColumns.length > mobileColumns.length && (
                  <div className="pt-2 border-t border-border/50">
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      {visibleColumns.slice(mobileColumns.length).map((column, colIndex) => {
                        const content = renderCellContent(column, item);
                        if (!content) return null;
                        
                        return (
                          <div key={colIndex} className="truncate">
                            <span className="font-medium">{column.header}:</span> {content}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {showPagination && (
          <ResponsivePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            pageSize={pageSize}
            total={total}
            isMobile={isMobile}
          />
        )}
      </div>
    );
  }

  // Desktop/Tablet table view
  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className={cn(stickyHeader && "sticky top-0 bg-background z-10")}>
              <TableRow>
                {visibleColumns.map((column, index) => (
                  <TableHead
                    key={index}
                    className={cn(
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center",
                      column.sticky && "sticky left-0 bg-background z-20",
                      column.className,
                      isTouchDevice && "py-3"
                    )}
                    style={{ width: column.width }}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow
                  key={getKey(item, index)}
                  className={cn(
                    onRowClick && "cursor-pointer",
                    isTouchDevice && "hover:bg-muted/30"
                  )}
                  onClick={() => onRowClick?.(item, index)}
                >
                  {visibleColumns.map((column, colIndex) => (
                    <TableCell
                      key={colIndex}
                      className={cn(
                        column.align === "right" && "text-right",
                        column.align === "center" && "text-center",
                        column.sticky && "sticky left-0 bg-background",
                        column.className,
                        isTouchDevice && "py-3"
                      )}
                    >
                      {renderCellContent(column, item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {showPagination && (
        <ResponsivePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          pageSize={pageSize}
          total={total}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}

interface ResponsivePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  total?: number;
  isMobile?: boolean;
}

function ResponsivePagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  total,
  isMobile,
}: ResponsivePaginationProps) {
  if (!onPageChange || totalPages <= 1) return null;

  const showingFrom = pageSize ? (currentPage - 1) * pageSize + 1 : 1;
  const showingTo = pageSize && total ? Math.min(currentPage * pageSize, total) : 0;

  return (
    <div className={cn(
      "flex items-center justify-between",
      isMobile ? "flex-col gap-2" : "flex-row"
    )}>
      {pageSize && total && (
        <div className={cn(
          "text-sm text-muted-foreground",
          isMobile && "order-2"
        )}>
          Showing {showingFrom} to {showingTo} of {total} items
        </div>
      )}
      <div className={cn(
        "flex gap-2",
        isMobile && "order-1"
      )}>
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          variant="outline"
          size={isMobile ? "default" : "sm"}
          className={cn(isMobile && "flex-1")}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        
        {!isMobile && totalPages > 2 && (
          <div className="flex items-center gap-1">
            {/* Show current page info */}
            <span className="text-sm text-muted-foreground px-2">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        )}
        
        {isMobile && (
          <div className="flex-shrink-0 px-4 py-2 text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </div>
        )}
        
        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          variant="outline"
          size={isMobile ? "default" : "sm"}
          className={cn(isMobile && "flex-1")}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

export default ResponsiveTable;