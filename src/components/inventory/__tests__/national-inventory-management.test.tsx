import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NationalInventoryManagement } from "../national-inventory-management";
import { nationalInventoryApi, warehousesApi, itemsApi } from "@/lib/api";

// Mock the API modules
jest.mock("@/lib/api");
jest.mock("sonner");

const mockNationalInventoryApi = nationalInventoryApi as jest.Mocked<
  typeof nationalInventoryApi
>;
const mockWarehousesApi = warehousesApi as jest.Mocked<typeof warehousesApi>;
const mockItemsApi = itemsApi as jest.Mocked<typeof itemsApi>;

const mockInventoryItems = [
  {
    itemId: 1,
    itemName: "Mathematics Textbook",
    itemCode: "TB001",
    itemDescription: "Grade 5 Mathematics Textbook",
    category: "Books",
    unitOfMeasure: "pieces",
    warehouseId: 1,
    warehouseName: "Central Warehouse",
    quantityOnHand: 500,
    reservedQuantity: 50,
    availableQuantity: 450,
    minimumStockLevel: 100,
    lastUpdated: "2024-01-15T10:00:00Z",
    isLowStock: false,
  },
];

const mockWarehouses = [
  {
    id: 1,
    name: "Central Warehouse",
    location: "Freetown",
    address: "123 Main St",
    managerName: "John Doe",
    contactPhone: "+232123456789",
    contactEmail: "john@example.com",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

const mockItems = [
  {
    id: 1,
    name: "Mathematics Textbook",
    code: "TB001",
    description: "Grade 5 Mathematics Textbook",
    category: "Books",
    unitOfMeasure: "pieces",
    standardCost: 10.0,
    minimumStockLevel: 100,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

describe("NationalInventoryManagement", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockWarehousesApi.getWarehouses.mockResolvedValue({
      success: true,
      data: { warehouses: mockWarehouses, total: 1, page: 1, limit: 100 },
    });

    mockItemsApi.getItems.mockResolvedValue({
      success: true,
      data: { items: mockItems, total: 1, page: 1, limit: 1000 },
    });

    mockNationalInventoryApi.getNationalInventory.mockResolvedValue({
      success: true,
      data: { items: mockInventoryItems, total: 1, page: 1, limit: 50 },
    });

    mockNationalInventoryApi.getNationalInventorySummary.mockResolvedValue({
      success: true,
      data: { items: mockInventoryItems, total: 1, page: 1, limit: 50 },
    });
  });

  it("renders the main interface with tabs", async () => {
    render(<NationalInventoryManagement />);

    expect(
      screen.getByText("National Warehouse Inventory")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Manage inventory at national warehouses with real-time tracking"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Receive Stock")).toBeInTheDocument();
    expect(screen.getByText("Current Inventory")).toBeInTheDocument();
    expect(screen.getByText("Search & Filter")).toBeInTheDocument();
    expect(screen.getByText("Summary View")).toBeInTheDocument();
  });

  it("shows stock receipt form when receive stock button is clicked", async () => {
    const user = userEvent.setup();
    render(<NationalInventoryManagement />);

    const receiveStockButton = screen.getByText("Receive Stock");
    await user.click(receiveStockButton);

    await waitFor(() => {
      expect(screen.getByText("Create Stock Receipt")).toBeInTheDocument();
      expect(screen.getByText("← Back to Inventory")).toBeInTheDocument();
    });
  });

  it("returns to inventory view when back button is clicked", async () => {
    const user = userEvent.setup();
    render(<NationalInventoryManagement />);

    // Go to stock receipt form
    const receiveStockButton = screen.getByText("Receive Stock");
    await user.click(receiveStockButton);

    await waitFor(() => {
      expect(screen.getByText("Create Stock Receipt")).toBeInTheDocument();
    });

    // Go back to inventory
    const backButton = screen.getByText("← Back to Inventory");
    await user.click(backButton);

    await waitFor(() => {
      expect(
        screen.getByText("National Warehouse Inventory")
      ).toBeInTheDocument();
      expect(screen.getByText("Current Inventory")).toBeInTheDocument();
    });
  });

  it("switches between tabs correctly", async () => {
    const user = userEvent.setup();
    render(<NationalInventoryManagement />);

    // Default tab should be Current Inventory
    expect(screen.getByText("Real-time Inventory Display")).toBeInTheDocument();

    // Switch to Search & Filter tab
    const searchTab = screen.getByText("Search & Filter");
    await user.click(searchTab);

    await waitFor(() => {
      expect(
        screen.getByText("Advanced Search & Filtering")
      ).toBeInTheDocument();
    });

    // Switch to Summary View tab
    const summaryTab = screen.getByText("Summary View");
    await user.click(summaryTab);

    await waitFor(() => {
      expect(screen.getByText("Inventory Summary")).toBeInTheDocument();
    });
  });

  it("displays appropriate descriptions for each tab", async () => {
    const user = userEvent.setup();
    render(<NationalInventoryManagement />);

    // Current Inventory tab description
    expect(
      screen.getByText(
        /View detailed inventory levels across all national warehouses/
      )
    ).toBeInTheDocument();

    // Search & Filter tab
    const searchTab = screen.getByText("Search & Filter");
    await user.click(searchTab);

    await waitFor(() => {
      expect(
        screen.getByText(/Search for specific items using multiple criteria/)
      ).toBeInTheDocument();
    });

    // Summary View tab
    const summaryTab = screen.getByText("Summary View");
    await user.click(summaryTab);

    await waitFor(() => {
      expect(
        screen.getByText(/View aggregated inventory data across all warehouses/)
      ).toBeInTheDocument();
    });
  });

  it("applies custom className when provided", () => {
    const { container } = render(
      <NationalInventoryManagement className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});
