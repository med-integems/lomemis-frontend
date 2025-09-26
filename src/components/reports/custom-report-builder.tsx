"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Minus,
  Play,
  Save,
  Download,
  Database,
  Filter,
  Calendar,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiMutation } from "@/hooks/useApi";
import { reportsApi } from "@/lib/api";
import { toast } from "sonner";

export interface QueryField {
  id: string;
  name: string;
  type: "string" | "number" | "date" | "boolean";
  table: string;
  description?: string;
}

export interface QueryFilter {
  id: string;
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "greater_than"
    | "less_than"
    | "contains"
    | "between";
  value: string | number | [string | number, string | number];
}

export interface CustomQuery {
  id?: string;
  name: string;
  description?: string;
  fields: string[];
  filters: QueryFilter[];
  groupBy?: string[];
  orderBy?: { field: string; direction: "asc" | "desc" }[];
  limit?: number;
}

interface CustomReportBuilderProps {
  userRole?: string;
  onExecuteQuery: (query: CustomQuery) => void;
  onSaveQuery: (query: CustomQuery) => void;
  isExecuting?: boolean;
  queryResult?: any[];
}

const availableFields: QueryField[] = [
  // Inventory fields
  {
    id: "item_name",
    name: "Item Name",
    type: "string",
    table: "items",
    description: "Name of the inventory item",
  },
  {
    id: "item_category",
    name: "Item Category",
    type: "string",
    table: "items",
    description: "Category of the item",
  },
  {
    id: "item_unit",
    name: "Unit",
    type: "string",
    table: "items",
    description: "Unit of measurement",
  },
  {
    id: "warehouse_name",
    name: "Warehouse Name",
    type: "string",
    table: "warehouses",
    description: "Name of the warehouse",
  },
  {
    id: "warehouse_location",
    name: "Warehouse Location",
    type: "string",
    table: "warehouses",
    description: "Location of the warehouse",
  },
  {
    id: "stock_quantity",
    name: "Stock Quantity",
    type: "number",
    table: "inventory",
    description: "Current stock quantity",
  },

  // Shipment fields
  {
    id: "shipment_id",
    name: "Shipment ID",
    type: "string",
    table: "shipments",
    description: "Unique shipment identifier",
  },
  {
    id: "shipment_status",
    name: "Shipment Status",
    type: "string",
    table: "shipments",
    description: "Current status of shipment",
  },
  {
    id: "dispatch_date",
    name: "Dispatch Date",
    type: "date",
    table: "shipments",
    description: "Date when shipment was dispatched",
  },
  {
    id: "arrival_date",
    name: "Arrival Date",
    type: "date",
    table: "shipments",
    description: "Date when shipment arrived",
  },
  {
    id: "council_name",
    name: "Council Name",
    type: "string",
    table: "councils",
    description: "Name of the local council",
  },

  // Distribution fields
  {
    id: "distribution_id",
    name: "Distribution ID",
    type: "string",
    table: "distributions",
    description: "Unique distribution identifier",
  },
  {
    id: "school_name",
    name: "School Name",
    type: "string",
    table: "schools",
    description: "Name of the school",
  },
  {
    id: "distribution_date",
    name: "Distribution Date",
    type: "date",
    table: "distributions",
    description: "Date of distribution",
  },
  {
    id: "distribution_quantity",
    name: "Distribution Quantity",
    type: "number",
    table: "distributions",
    description: "Quantity distributed",
  },

  // User fields
  {
    id: "user_name",
    name: "User Name",
    type: "string",
    table: "users",
    description: "Name of the user",
  },
  {
    id: "user_role",
    name: "User Role",
    type: "string",
    table: "users",
    description: "Role of the user",
  },
  {
    id: "created_at",
    name: "Created Date",
    type: "date",
    table: "common",
    description: "Date when record was created",
  },
  {
    id: "updated_at",
    name: "Updated Date",
    type: "date",
    table: "common",
    description: "Date when record was last updated",
  },
];

const operators = [
  {
    value: "equals",
    label: "Equals",
    types: ["string", "number", "date", "boolean"],
  },
  {
    value: "not_equals",
    label: "Not Equals",
    types: ["string", "number", "date", "boolean"],
  },
  { value: "greater_than", label: "Greater Than", types: ["number", "date"] },
  { value: "less_than", label: "Less Than", types: ["number", "date"] },
  { value: "contains", label: "Contains", types: ["string"] },
  { value: "between", label: "Between", types: ["number", "date"] },
];

export function CustomReportBuilder({
  userRole,
  onExecuteQuery,
  onSaveQuery,
  isExecuting,
  queryResult,
}: CustomReportBuilderProps) {
  const [query, setQuery] = useState<CustomQuery>({
    name: "",
    description: "",
    fields: [],
    filters: [],
    groupBy: [],
    orderBy: [],
    limit: 100,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Filter fields based on user role
  const getAvailableFields = () => {
    if (!userRole) return availableFields;

    // Role-based field filtering
    switch (userRole) {
      case "school_rep":
        return availableFields.filter((field) =>
          ["distribution_", "school_", "item_"].some((prefix) =>
            field.id.startsWith(prefix)
          )
        );
      case "lc_officer":
        return availableFields.filter(
          (field) => !field.id.startsWith("user_") || field.id === "user_name"
        );
      case "national_manager":
        return availableFields.filter((field) => field.id !== "user_role");
      default:
        return availableFields;
    }
  };

  const availableFieldsForRole = getAvailableFields();

  const addField = (fieldId: string) => {
    if (!query.fields.includes(fieldId)) {
      setQuery((prev) => ({
        ...prev,
        fields: [...prev.fields, fieldId],
      }));
    }
  };

  const removeField = (fieldId: string) => {
    setQuery((prev) => ({
      ...prev,
      fields: prev.fields.filter((f) => f !== fieldId),
    }));
  };

  const addFilter = () => {
    const newFilter: QueryFilter = {
      id: Date.now().toString(),
      field: availableFieldsForRole[0]?.id || "",
      operator: "equals",
      value: "",
    };

    setQuery((prev) => ({
      ...prev,
      filters: [...prev.filters, newFilter],
    }));
  };

  const updateFilter = (filterId: string, updates: Partial<QueryFilter>) => {
    setQuery((prev) => ({
      ...prev,
      filters: prev.filters.map((filter) =>
        filter.id === filterId ? { ...filter, ...updates } : filter
      ),
    }));
  };

  const removeFilter = (filterId: string) => {
    setQuery((prev) => ({
      ...prev,
      filters: prev.filters.filter((f) => f.id !== filterId),
    }));
  };

  const getFieldType = (fieldId: string) => {
    return (
      availableFieldsForRole.find((f) => f.id === fieldId)?.type || "string"
    );
  };

  const getAvailableOperators = (fieldType: string) => {
    return operators.filter((op) => op.types.includes(fieldType));
  };

  // Execute query mutation
  const executeQueryMutation = useApiMutation(
    (queryData: CustomQuery) => reportsApi.executeCustomQuery(queryData),
    {
      onSuccess: (data) => {
        onExecuteQuery(query);
        toast.success(
          `Query executed successfully. ${
            data.data?.data?.length || 0
          } rows returned.`
        );
      },
      onError: (error: any) => {
        toast.error(`Failed to execute query: ${error.message}`);
      },
    }
  );

  // Save query mutation
  const saveQueryMutation = useApiMutation(
    (queryData: CustomQuery) => reportsApi.saveCustomQuery(queryData),
    {
      onSuccess: () => {
        toast.success("Custom query saved successfully");
        onSaveQuery(query);
      },
      onError: (error: any) => {
        toast.error(`Failed to save query: ${error.message}`);
      },
    }
  );

  const handleExecuteQuery = () => {
    if (query.fields.length === 0) {
      toast.error("Please select at least one field to include in the report.");
      return;
    }
    executeQueryMutation.mutate(query);
  };

  const handleSaveQuery = () => {
    if (!query.name.trim()) {
      toast.error("Please enter a name for the custom report.");
      return;
    }
    if (query.fields.length === 0) {
      toast.error("Please select at least one field to include in the report.");
      return;
    }
    saveQueryMutation.mutate(query);
  };

  return (
    <div className="space-y-6">
      {/* Query Builder Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Custom Report Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="query-name">Report Name</Label>
              <Input
                id="query-name"
                placeholder="Enter report name..."
                value={query.name}
                onChange={(e) =>
                  setQuery((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="query-description">Description (Optional)</Label>
              <Input
                id="query-description"
                placeholder="Enter report description..."
                value={query.description}
                onChange={(e) =>
                  setQuery((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Field Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Fields</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose the data fields to include in your report
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Selected Fields */}
            {query.fields.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Selected Fields:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {query.fields.map((fieldId) => {
                    const field = availableFieldsForRole.find(
                      (f) => f.id === fieldId
                    );
                    return (
                      <Badge
                        key={fieldId}
                        variant="default"
                        className="flex items-center gap-1"
                      >
                        {field?.name || fieldId}
                        <button
                          onClick={() => removeField(fieldId)}
                          className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available Fields */}
            <div>
              <Label className="text-sm font-medium">Available Fields:</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto">
                {availableFieldsForRole.map((field) => (
                  <div
                    key={field.id}
                    className={cn(
                      "p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors",
                      query.fields.includes(field.id) &&
                        "bg-primary/10 border-primary"
                    )}
                    onClick={() =>
                      query.fields.includes(field.id)
                        ? removeField(field.id)
                        : addField(field.id)
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{field.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {field.type}
                      </Badge>
                    </div>
                    {field.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {field.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Add conditions to filter your data
              </p>
            </div>
            <Button onClick={addFilter} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {query.filters.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No filters added. Click "Add Filter" to add conditions.
            </p>
          ) : (
            <div className="space-y-3">
              {query.filters.map((filter, index) => {
                const field = availableFieldsForRole.find(
                  (f) => f.id === filter.field
                );
                const fieldType = field?.type || "string";
                const availableOps = getAvailableOperators(fieldType);

                return (
                  <div
                    key={filter.id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                      {/* Field Selection */}
                      <select
                        value={filter.field}
                        onChange={(e) =>
                          updateFilter(filter.id, { field: e.target.value })
                        }
                        className="px-3 py-2 border rounded-md text-sm"
                      >
                        {availableFieldsForRole.map((field) => (
                          <option key={field.id} value={field.id}>
                            {field.name}
                          </option>
                        ))}
                      </select>

                      {/* Operator Selection */}
                      <select
                        value={filter.operator}
                        onChange={(e) =>
                          updateFilter(filter.id, {
                            operator: e.target.value as any,
                          })
                        }
                        className="px-3 py-2 border rounded-md text-sm"
                      >
                        {availableOps.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>

                      {/* Value Input */}
                      <div className="md:col-span-2">
                        {filter.operator === "between" ? (
                          <div className="flex gap-2">
                            <Input
                              placeholder="From"
                              type={
                                fieldType === "number"
                                  ? "number"
                                  : fieldType === "date"
                                  ? "date"
                                  : "text"
                              }
                              value={
                                Array.isArray(filter.value)
                                  ? filter.value[0]
                                  : ""
                              }
                              onChange={(e) =>
                                updateFilter(filter.id, {
                                  value: [
                                    e.target.value,
                                    Array.isArray(filter.value)
                                      ? filter.value[1]
                                      : "",
                                  ],
                                })
                              }
                            />
                            <Input
                              placeholder="To"
                              type={
                                fieldType === "number"
                                  ? "number"
                                  : fieldType === "date"
                                  ? "date"
                                  : "text"
                              }
                              value={
                                Array.isArray(filter.value)
                                  ? filter.value[1]
                                  : ""
                              }
                              onChange={(e) =>
                                updateFilter(filter.id, {
                                  value: [
                                    Array.isArray(filter.value)
                                      ? filter.value[0]
                                      : "",
                                    e.target.value,
                                  ],
                                })
                              }
                            />
                          </div>
                        ) : (
                          <Input
                            placeholder="Enter value..."
                            type={
                              fieldType === "number"
                                ? "number"
                                : fieldType === "date"
                                ? "date"
                                : "text"
                            }
                            value={
                              Array.isArray(filter.value) ? "" : filter.value
                            }
                            onChange={(e) =>
                              updateFilter(filter.id, { value: e.target.value })
                            }
                          />
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={() => removeFilter(filter.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Options */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Advanced Options</CardTitle>
            <Button
              onClick={() => setShowAdvanced(!showAdvanced)}
              variant="ghost"
              size="sm"
            >
              {showAdvanced ? "Hide" : "Show"} Advanced
            </Button>
          </div>
        </CardHeader>
        {showAdvanced && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="limit">Result Limit</Label>
                <Input
                  id="limit"
                  type="number"
                  min="1"
                  max="10000"
                  value={query.limit}
                  onChange={(e) =>
                    setQuery((prev) => ({
                      ...prev,
                      limit: parseInt(e.target.value) || 100,
                    }))
                  }
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleExecuteQuery}
          disabled={executeQueryMutation.isPending || query.fields.length === 0}
          className="flex items-center gap-2"
        >
          {executeQueryMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Executing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Execute Query
            </>
          )}
        </Button>

        <Button
          onClick={handleSaveQuery}
          variant="outline"
          disabled={
            saveQueryMutation.isPending ||
            !query.name.trim() ||
            query.fields.length === 0
          }
          className="flex items-center gap-2"
        >
          {saveQueryMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Query
            </>
          )}
        </Button>
      </div>

      {/* Query Results */}
      {queryResult && queryResult.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Query Results ({queryResult.length} rows)
              </CardTitle>
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    {query.fields.map((fieldId) => {
                      const field = availableFieldsForRole.find(
                        (f) => f.id === fieldId
                      );
                      return (
                        <th
                          key={fieldId}
                          className="border border-gray-200 px-4 py-2 text-left font-medium"
                        >
                          {field?.name || fieldId}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {queryResult.slice(0, 10).map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {query.fields.map((fieldId) => (
                        <td
                          key={fieldId}
                          className="border border-gray-200 px-4 py-2"
                        >
                          {row[fieldId] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {queryResult.length > 10 && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Showing first 10 rows of {queryResult.length} results
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
