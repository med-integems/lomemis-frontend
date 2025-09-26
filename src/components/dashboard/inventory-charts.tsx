"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

export interface InventoryChartData {
  categoryDistribution: Array<{
    name: string;
    value: number;
    itemCount?: number;
    totalValue?: number;
    lowStockCount?: number;
    color: string;
  }>;
  shipmentTrend: Array<{
    period: string;
    shipments: number;
    delivered: number;
    inTransit?: number;
    discrepancies?: number;
  }>;
  inventoryMovement: Array<{
    period: string;
    transaction_type: string;
    totalQuantity: number;
    transactionCount: number;
  }>;
  warehouseUtilization: Array<{
    id: number;
    name: string;
    uniqueItems: number;
    totalQuantity: number;
    totalValue: number;
    utilizationPercentage: number;
  }>;
  topMovingItems: Array<{
    id: number;
    name: string;
    category: string;
    totalMovement: number;
    transactionCount: number;
    currentStock: number;
    turnoverRatio: number;
  }>;
  geographicDistribution: Array<{
    councilId: number;
    councilName: string;
    region: string;
    district: string;
    totalSchools: number;
    pendingDistributions: number;
    completedDistributions: number;
    inventoryValue: number;
    distributionEfficiency: number;
  }>;
  alertsSummary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  alerts: Array<{
    id: string;
    itemId: number;
    itemName: string;
    currentStock: number;
    reorderLevel: number;
    severity: "critical" | "high" | "medium" | "low";
    location: string;
    daysUntilStockout: number;
  }>;
  movementTrends: Array<{
    date: string;
    transactionType: string;
    inbound: number;
    outbound: number;
    transactionCount: number;
  }>;
}

interface InventoryChartsProps {
  data?: InventoryChartData;
  isLoading?: boolean;
  userRole?: string;
}

const COLORS = [
  "#007A33",
  "#005DAA",
  "#A3C940",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

export function InventoryCharts({
  data,
  isLoading,
  userRole,
}: InventoryChartsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const shouldShowChart = (roles: string[]) => {
    return !userRole || roles.includes(userRole);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Category Distribution Pie Chart */}
      {shouldShowChart(["super_admin", "national_manager", "view_only"]) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Inventory by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.categoryDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) =>
                    `${props.name} ${((props.percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(data?.categoryDistribution || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Shipment Trends Line Chart */}
      {shouldShowChart([
        "super_admin",
        "national_manager",
        "lc_officer",
        "view_only",
      ]) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Shipment Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.shipmentTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="shipments"
                  stroke="#007A33"
                  strokeWidth={2}
                  name="Total Shipments"
                />
                <Line
                  type="monotone"
                  dataKey="delivered"
                  stroke="#005DAA"
                  strokeWidth={2}
                  name="Delivered"
                />
                {data?.shipmentTrend?.[0]?.inTransit !== undefined && (
                  <Line
                    type="monotone"
                    dataKey="inTransit"
                    stroke="#A3C940"
                    strokeWidth={2}
                    name="In Transit"
                  />
                )}
                {data?.shipmentTrend?.[0]?.discrepancies !== undefined && (
                  <Line
                    type="monotone"
                    dataKey="discrepancies"
                    stroke="#FF8042"
                    strokeWidth={2}
                    name="Discrepancies"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Warehouse Utilization */}
      {shouldShowChart(["super_admin", "national_manager", "view_only"]) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Warehouse Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.warehouseUtilization || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "utilizationPercentage")
                      return [`${value}%`, "Utilization"];
                    if (name === "totalValue")
                      return [`${value.toLocaleString()}`, "Total Value"];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar
                  dataKey="totalQuantity"
                  fill="#007A33"
                  name="Total Quantity"
                />
                <Bar
                  dataKey="utilizationPercentage"
                  fill="#005DAA"
                  name="Utilization %"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Geographic Distribution */}
      {shouldShowChart([
        "super_admin",
        "national_manager",
        "lc_officer",
        "view_only",
      ]) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Council Distribution Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.geographicDistribution?.slice(0, 8) || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="councilName"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "distributionEfficiency")
                      return [`${Number(value).toFixed(1)}%`, "Efficiency"];
                    if (name === "inventoryValue")
                      return [`${Number(value).toLocaleString()}`, "Inventory Value"];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar
                  dataKey="totalSchools"
                  fill="#007A33"
                  name="Schools Served"
                />
                <Bar
                  dataKey="distributionEfficiency"
                  fill="#005DAA"
                  name="Efficiency %"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Moving Items */}
      {shouldShowChart(["super_admin", "national_manager"]) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Top Moving Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.topMovingItems?.slice(0, 8) || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "turnoverRatio")
                      return [`${Number(value).toFixed(2)}`, "Turnover Ratio"];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar
                  dataKey="totalMovement"
                  fill="#A3C940"
                  name="Total Movement"
                />
                <Bar
                  dataKey="currentStock"
                  fill="#FF8042"
                  name="Current Stock"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Inventory Alerts Summary */}
      {shouldShowChart(["super_admin", "national_manager", "lc_officer"]) &&
        data?.alertsSummary && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Inventory Alerts Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: "Critical",
                        value: data.alertsSummary.critical,
                        color: "#DC2626",
                      },
                      {
                        name: "High",
                        value: data.alertsSummary.high,
                        color: "#EA580C",
                      },
                      {
                        name: "Medium",
                        value: data.alertsSummary.medium,
                        color: "#CA8A04",
                      },
                      {
                        name: "Low",
                        value: data.alertsSummary.low,
                        color: "#16A34A",
                      },
                    ].filter((item) => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) =>
                      `${props.name} ${((props.percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      {
                        name: "Critical",
                        value: data.alertsSummary.critical,
                        color: "#DC2626",
                      },
                      {
                        name: "High",
                        value: data.alertsSummary.high,
                        color: "#EA580C",
                      },
                      {
                        name: "Medium",
                        value: data.alertsSummary.medium,
                        color: "#CA8A04",
                      },
                      {
                        name: "Low",
                        value: data.alertsSummary.low,
                        color: "#16A34A",
                      },
                    ]
                      .filter((item) => item.value > 0)
                      .map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
