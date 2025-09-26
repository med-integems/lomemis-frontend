import { render, screen } from "@testing-library/react";
import { InventoryCharts, type InventoryChartData } from "../inventory-charts";

const mockChartData: InventoryChartData = {
  categoryDistribution: [
    { name: "Textbooks", value: 450, color: "#007A33" },
    { name: "Exercise Books", value: 320, color: "#005DAA" },
    { name: "Stationery", value: 280, color: "#A3C940" },
    { name: "Teaching Aids", value: 200, color: "#FF8042" },
  ],
  inventoryMovement: [
    { period: "Jan", transaction_type: "RECEIPT", totalQuantity: 120, transactionCount: 15 },
    { period: "Feb", transaction_type: "DISTRIBUTION", totalQuantity: 150, transactionCount: 18 },
    { period: "Mar", transaction_type: "SHIPMENT", totalQuantity: 180, transactionCount: 22 },
  ],
  shipmentTrend: [
    { period: "Jan", shipments: 15, delivered: 12, inTransit: 3 },
    { period: "Feb", shipments: 18, delivered: 16, inTransit: 2 },
    { period: "Mar", shipments: 22, delivered: 20, inTransit: 2 },
  ],
  warehouseUtilization: [
    { id: 1, name: "Freetown Central", uniqueItems: 245, totalQuantity: 850, totalValue: 12500, utilizationPercentage: 85 },
    { id: 2, name: "Bo Regional", uniqueItems: 180, totalQuantity: 650, totalValue: 9800, utilizationPercentage: 81 },
  ],
  topMovingItems: [
    { id: 1, name: "Exercise Books", category: "Stationery", totalMovement: 500, transactionCount: 25, currentStock: 1200, turnoverRatio: 2.5 },
  ],
  geographicDistribution: [
    { councilId: 1, councilName: "Western Area Urban", region: "Western", district: "Western Urban", totalSchools: 89, pendingDistributions: 5, completedDistributions: 34, inventoryValue: 85000, distributionEfficiency: 87.5 },
  ],
  alertsSummary: { critical: 2, high: 5, medium: 8, low: 12 },
  alerts: [
    { id: "1", itemId: 15, itemName: "Math Textbooks", currentStock: 25, reorderLevel: 50, severity: "critical", location: "Freetown Central", daysUntilStockout: 5 },
  ],
  movementTrends: [
    { date: "2025-01-01", transactionType: "RECEIPT", inbound: 150, outbound: 0, transactionCount: 5 },
  ],
};

// Mock recharts components to avoid canvas rendering issues in tests
jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe("InventoryCharts", () => {
  it("renders loading state correctly", () => {
    render(<InventoryCharts isLoading={true} />);

    // Should show skeleton loaders
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders chart titles correctly", () => {
    render(<InventoryCharts data={mockChartData} />);

    expect(screen.getByText("Inventory by Category")).toBeInTheDocument();
    expect(screen.getByText("Monthly Inventory Movements")).toBeInTheDocument();
    expect(screen.getByText("Warehouse Stock Levels")).toBeInTheDocument();
    expect(screen.getByText("Council Inventory Levels")).toBeInTheDocument();
  });

  it("renders charts with data", () => {
    render(<InventoryCharts data={mockChartData} />);

    // Check if chart components are rendered
    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    expect(screen.getAllByTestId("bar-chart")).toHaveLength(2);
  });

  it("filters charts based on user role", () => {
    render(<InventoryCharts data={mockChartData} userRole="school_rep" />);

    // School representatives should not see warehouse-specific charts
    expect(
      screen.queryByText("Warehouse Stock Levels")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Inventory by Category")).not.toBeInTheDocument();

    // School representatives should not see any charts based on current role configuration
    expect(
      screen.queryByText("Monthly Inventory Movements")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Council Inventory Levels")
    ).not.toBeInTheDocument();
  });

  it("shows all charts for super admin", () => {
    render(<InventoryCharts data={mockChartData} userRole="super_admin" />);

    // Super admin should see all charts
    expect(screen.getByText("Inventory by Category")).toBeInTheDocument();
    expect(screen.getByText("Monthly Inventory Movements")).toBeInTheDocument();
    expect(screen.getByText("Warehouse Stock Levels")).toBeInTheDocument();
    expect(screen.getByText("Council Inventory Levels")).toBeInTheDocument();
  });

  it("shows appropriate charts for national manager", () => {
    render(
      <InventoryCharts data={mockChartData} userRole="national_manager" />
    );

    // National manager should see all charts
    expect(screen.getByText("Inventory by Category")).toBeInTheDocument();
    expect(screen.getByText("Monthly Inventory Movements")).toBeInTheDocument();
    expect(screen.getByText("Warehouse Stock Levels")).toBeInTheDocument();
    expect(screen.getByText("Council Inventory Levels")).toBeInTheDocument();
  });

  it("shows appropriate charts for LC officer", () => {
    render(<InventoryCharts data={mockChartData} userRole="lc_officer" />);

    // LC officer should not see warehouse-specific charts
    expect(screen.queryByText("Inventory by Category")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Warehouse Stock Levels")
    ).not.toBeInTheDocument();

    // But should see movement and council charts
    expect(screen.getByText("Monthly Inventory Movements")).toBeInTheDocument();
    expect(screen.getByText("Council Inventory Levels")).toBeInTheDocument();
  });

  it("handles empty data gracefully", () => {
    const emptyData: InventoryChartData = {
      categoryDistribution: [],
      inventoryMovement: [],
      shipmentTrend: [],
      warehouseUtilization: [],
      topMovingItems: [],
      geographicDistribution: [],
      alertsSummary: { critical: 0, high: 0, medium: 0, low: 0 },
      alerts: [],
      movementTrends: [],
    };

    render(<InventoryCharts data={emptyData} />);

    // Should still render chart containers
    expect(screen.getByText("Inventory by Category")).toBeInTheDocument();
    expect(screen.getByText("Monthly Inventory Movements")).toBeInTheDocument();
  });

  it("applies correct grid layout", () => {
    const { container } = render(<InventoryCharts data={mockChartData} />);

    // Check for grid layout class
    const gridContainer = container.querySelector(".grid");
    expect(gridContainer).toBeInTheDocument();
    expect(gridContainer).toHaveClass("grid-cols-1", "lg:grid-cols-2");
  });
});
