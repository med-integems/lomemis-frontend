import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  siblingCount?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  siblingCount = 1,
}: PaginationProps) {
  const range = React.useMemo(() => {
    const delta = siblingCount + 2; // +2 for first and last page
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - siblingCount);
      i <= Math.min(totalPages - 1, currentPage + siblingCount);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - siblingCount > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + siblingCount < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  }, [currentPage, totalPages, siblingCount]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Previous button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      {/* Page numbers */}
      <div className="flex items-center space-x-1">
        {range.map((pageNumber, index) => {
          if (pageNumber === "...") {
            return (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                disabled
                className="w-8 h-8 p-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            );
          }

          const isCurrentPage = pageNumber === currentPage;
          return (
            <Button
              key={index}
              variant={isCurrentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNumber as number)}
              className={cn(
                "w-8 h-8 p-0",
                isCurrentPage && "bg-primary text-primary-foreground"
              )}
            >
              {pageNumber}
            </Button>
          );
        })}
      </div>

      {/* Next button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}