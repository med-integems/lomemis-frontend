import { render, screen } from "@testing-library/react";
import { KPICards, type KPIData } from "../kpi-cards";

const mockKPIData: KPIData = {
  totalWarehouses: 5,
  totalCouncils: 16,
  totalSchools: 450,
  totalUsers: 125,
  activeUsers: 98,
  systemUptime: 99.8,
  criticalAlerts: 2,
  totalItems: 1250,
  totalInventoryValue: 150000,
  lowStockItems: 3,
  criticalStockItems: 1,
  lowStockThreshold: 10,
  inventoryTurnoverRate: 2.5,
  avgStockLevel: 75.5,
  activeShipments: 8,
  pendingReceipts: 5,
  pendingDistributions: 45,
  completedShipments: 23,
  overdueShipments: 1,
  avgDeliveryTime: 3.2,
  processingEfficiency: 95.5,
  totalDirectShipments: 35,
  directShipmentsPending: 4,
  directShipmentsDispatched: 15,
  directShipmentsDelivered: 12,
  directShipmentsConfirmed: 10,
  avgDirectShipmentDeliveryTime: 2.8,
  monthlyShipmentGrowth: 8.5,
  distributionEfficiency: 92.3,
  userEngagementRate: 78.9,
  systemPerformanceScore: 94.2,
  totalValueProcessed: 2500000,
  costPerTransaction: 15.75,
  inventoryUtilization: 82.4,
};

describe("KPICards", () => {
  it("renders loading state correctly", () => {
    render(<KPICards isLoading={true} />);

    // Should show skeleton loaders
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders KPI data correctly", () => {
    render(<KPICards data={mockKPIData} />);

    // Check if all KPI values are displayed
    expect(screen.getByText("1,250")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("23")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("displays correct KPI titles", () => {
    render(<KPICards data={mockKPIData} />);

    expect(screen.getByText("Total Items")).toBeInTheDocument();
    expect(screen.getByText("Active Shipments")).toBeInTheDocument();
    expect(screen.getByText("Recent Distributions")).toBeInTheDocument();
    expect(screen.getByText("Low Stock Items")).toBeInTheDocument();
    expect(screen.getByText("Completed Shipments")).toBeInTheDocument();
    expect(screen.getByText("Pending Receipts")).toBeInTheDocument();
  });

  it("filters KPIs based on user role", () => {
    render(<KPICards data={mockKPIData} userRole="school_rep" />);

    // School representatives should not see any KPIs based on current role configuration
    expect(screen.queryByText("Total Items")).not.toBeInTheDocument();
    expect(screen.queryByText("Active Shipments")).not.toBeInTheDocument();
    expect(screen.queryByText("Pending Distributions")).not.toBeInTheDocument();
    expect(screen.queryByText("Low Stock Items")).not.toBeInTheDocument();
  });

  it("shows all KPIs for super admin", () => {
    render(<KPICards data={mockKPIData} userRole="super_admin" />);

    // Super admin should see all KPIs
    expect(screen.getByText("Total Items")).toBeInTheDocument();
    expect(screen.getByText("Active Shipments")).toBeInTheDocument();
    expect(screen.getByText("Recent Distributions")).toBeInTheDocument();
    expect(screen.getByText("Low Stock Items")).toBeInTheDocument();
    expect(screen.getByText("Completed Shipments")).toBeInTheDocument();
    expect(screen.getByText("Pending Receipts")).toBeInTheDocument();
  });

  it("handles zero values correctly", () => {
    const zeroData: KPIData = {
      totalWarehouses: 0,
      totalCouncils: 0,
      totalSchools: 0,
      totalUsers: 0,
      activeUsers: 0,
      systemUptime: 0,
      criticalAlerts: 0,
      totalItems: 0,
      totalInventoryValue: 0,
      lowStockItems: 0,
      criticalStockItems: 0,
      lowStockThreshold: 0,
      inventoryTurnoverRate: 0,
      avgStockLevel: 0,
      activeShipments: 0,
      pendingReceipts: 0,
      pendingDistributions: 0,
      completedShipments: 0,
      overdueShipments: 0,
      avgDeliveryTime: 0,
      processingEfficiency: 0,
      totalDirectShipments: 0,
      directShipmentsPending: 0,
      directShipmentsDispatched: 0,
      directShipmentsDelivered: 0,
      directShipmentsConfirmed: 0,
      avgDirectShipmentDeliveryTime: 0,
      monthlyShipmentGrowth: 0,
      distributionEfficiency: 0,
      userEngagementRate: 0,
      systemPerformanceScore: 0,
      totalValueProcessed: 0,
      costPerTransaction: 0,
      inventoryUtilization: 0,
    };

    render(<KPICards data={zeroData} />);

    // Should display zeros
    const zeroElements = screen.getAllByText("0");
    expect(zeroElements.length).toBeGreaterThan(0);
  });

  it("applies correct styling classes", () => {
    const { container } = render(<KPICards data={mockKPIData} />);

    // Check for grid layout
    const gridContainer = container.querySelector(".grid");
    expect(gridContainer).toBeInTheDocument();
    expect(gridContainer).toHaveClass("grid");
  });
});
