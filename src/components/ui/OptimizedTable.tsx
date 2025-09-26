"use client";

import React, { useMemo, useCallback, useState } from "react";
import {
  useDebouncedSearch,
  useVirtualScrolling,
} from "@/hooks/useSimplePerformance";
import VirtualScrollList from "./VirtualScrollList";

interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: number | string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  className?: string;
}

interface OptimizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowHeight?: number;
  containerHeight?: number;
  className?: string;
  onRowClick?: (row: T, index: number) => void;
  loading?: boolean;
  emptyMessage?: string;
  searchable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  virtualScrolling?: boolean;
  stickyHeader?: boolean;
  striped?: boolean;
  hoverable?: boolean;
}

type SortDirection = "asc" | "desc" | null;

interface SortState {
  column: string | null;
  direction: SortDirection;
}

const OptimizedTable = <T extends Record<string, any>>({
  data,
  columns,
  rowHeight = 50,
  containerHeight = 400,
  className = "",
  onRowClick,
  loading = false,
  emptyMessage = "No data available",
  searchable = false,
  sortable = false,
  filterable = false,
  pagination,
  virtualScrolling = false,
  stickyHeader = true,
  striped = true,
  hoverable = true,
}: OptimizedTableProps<T>) => {
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: null,
  });
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Search functionality
  const { searchQuery, handleSearch, isSearching } = useDebouncedSearch(
    useCallback((query: string) => {
      // Search is handled in the filtered data memo
    }, []),
    300
  );

  // Memoized filtered and sorted data
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (searchable && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) =>
        columns.some((column) => {
          const value = row[column.key as keyof T];
          return String(value).toLowerCase().includes(query);
        })
      );
    }

    // Apply column filters
    if (filterable) {
      Object.entries(filters).forEach(([columnKey, filterValue]) => {
        if (filterValue.trim()) {
          result = result.filter((row) => {
            const value = row[columnKey as keyof T];
            return String(value)
              .toLowerCase()
              .includes(filterValue.toLowerCase());
          });
        }
      });
    }

    // Apply sorting
    if (sortable && sortState.column && sortState.direction) {
      result.sort((a, b) => {
        const aValue = a[sortState.column as keyof T];
        const bValue = b[sortState.column as keyof T];

        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;

        return sortState.direction === "desc" ? -comparison : comparison;
      });
    }

    return result;
  }, [
    data,
    searchQuery,
    filters,
    sortState,
    columns,
    searchable,
    filterable,
    sortable,
  ]);

  // Handle sorting
  const handleSort = useCallback(
    (columnKey: string) => {
      if (!sortable) return;

      setSortState((prev) => {
        if (prev.column === columnKey) {
          // Cycle through: asc -> desc -> null
          const newDirection: SortDirection =
            prev.direction === "asc"
              ? "desc"
              : prev.direction === "desc"
              ? null
              : "asc";
          return {
            column: newDirection ? columnKey : null,
            direction: newDirection,
          };
        } else {
          return {
            column: columnKey,
            direction: "asc",
          };
        }
      });
    },
    [sortable]
  );

  // Handle filter change
  const handleFilterChange = useCallback((columnKey: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [columnKey]: value,
    }));
  }, []);

  // Render table header
  const renderHeader = useCallback(
    () => (
      <thead
        className={`bg-gray-50 ${stickyHeader ? "sticky top-0 z-10" : ""}`}
      >
        <tr>
          {columns.map((column) => (
            <th
              key={String(column.key)}
              className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                column.className || ""
              } ${
                sortable && column.sortable !== false
                  ? "cursor-pointer hover:bg-gray-100"
                  : ""
              }`}
              style={{ width: column.width }}
              onClick={() =>
                sortable &&
                column.sortable !== false &&
                handleSort(String(column.key))
              }
            >
              <div className="flex items-center space-x-1">
                <span>{column.header}</span>
                {sortable && column.sortable !== false && (
                  <div className="flex flex-col">
                    <svg
                      className={`w-3 h-3 ${
                        sortState.column === String(column.key) &&
                        sortState.direction === "asc"
                          ? "text-blue-600"
                          : "text-gray-300"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                    <svg
                      className={`w-3 h-3 -mt-1 ${
                        sortState.column === String(column.key) &&
                        sortState.direction === "desc"
                          ? "text-blue-600"
                          : "text-gray-300"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      transform="rotate(180)"
                    >
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                )}
              </div>
            </th>
          ))}
        </tr>
        {filterable && (
          <tr className="bg-gray-25">
            {columns.map((column) => (
              <th key={`filter-${String(column.key)}`} className="px-4 py-2">
                {column.filterable !== false && (
                  <input
                    type="text"
                    placeholder={`Filter ${column.header}...`}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={filters[String(column.key)] || ""}
                    onChange={(e) =>
                      handleFilterChange(String(column.key), e.target.value)
                    }
                  />
                )}
              </th>
            ))}
          </tr>
        )}
      </thead>
    ),
    [
      columns,
      sortState,
      sortable,
      filterable,
      filters,
      stickyHeader,
      handleSort,
      handleFilterChange,
    ]
  );

  // Render table row
  const renderRow = useCallback(
    (row: T, index: number) => (
      <tr
        key={index}
        className={`
        ${striped && index % 2 === 0 ? "bg-white" : "bg-gray-50"}
        ${hoverable ? "hover:bg-blue-50" : ""}
        ${onRowClick ? "cursor-pointer" : ""}
        transition-colors duration-150
      `}
        onClick={() => onRowClick?.(row, index)}
      >
        {columns.map((column) => {
          const value = row[column.key as keyof T];
          return (
            <td
              key={String(column.key)}
              className={`px-4 py-3 text-sm text-gray-900 ${
                column.className || ""
              }`}
              style={{ width: column.width }}
            >
              {column.render
                ? column.render(value, row, index)
                : String(value || "")}
            </td>
          );
        })}
      </tr>
    ),
    [columns, striped, hoverable, onRowClick]
  );

  // Loading state
  if (loading) {
    return (
      <div className={`border border-gray-200 rounded-lg ${className}`}>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded-t-lg"></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 bg-gray-100 border-t border-gray-200"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}
    >
      {/* Search bar */}
      {searchable && (
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {isSearching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {virtualScrolling && processedData.length > 0 ? (
        <div className="relative">
          <table className="min-w-full divide-y divide-gray-200">
            {renderHeader()}
          </table>
          <VirtualScrollList
            items={processedData}
            itemHeight={rowHeight}
            containerHeight={containerHeight}
            renderItem={(row, index) => (
              <table className="min-w-full">
                <tbody className="bg-white divide-y divide-gray-200">
                  {renderRow(row, index)}
                </tbody>
              </table>
            )}
          />
        </div>
      ) : (
        <div className="overflow-auto" style={{ maxHeight: containerHeight }}>
          <table className="min-w-full divide-y divide-gray-200">
            {renderHeader()}
            <tbody className="bg-white divide-y divide-gray-200">
              {processedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                processedData.map((row, index) => renderRow(row, index))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <div className="px-4 py-3 bg-white border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing{" "}
            {Math.min(
              (pagination.page - 1) * pagination.limit + 1,
              pagination.total
            )}{" "}
            to {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
            of {pagination.total} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm">
              Page {pagination.page} of{" "}
              {Math.ceil(pagination.total / pagination.limit)}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={
                pagination.page >=
                Math.ceil(pagination.total / pagination.limit)
              }
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(OptimizedTable) as <T extends Record<string, any>>(
  props: OptimizedTableProps<T>
) => JSX.Element;
