import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InventoryTable } from "../inventory-table";
import { nationalInventoryApi, warehousesApi } from "@/lib/api";
import { toast } from "sonner";

// Mock the API modules
jest.mock("@/lib/api");
jest.mock("sonner");

const mockNationalInventoryApi = nationalInventoryApi as jest.Mocked<
  typeof nationalInventoryApi
>;
const mockWarehousesApi = warehousesApi as jest.Mocked<typeof warehousesApi>;
const mockToast = toast as jest.Mocked<typeof toast>;

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
  {
    itemId: 2,
    itemName: "Exercise Notebook",
    itemCode: "NB001",
    itemDescription: "A4 Exercise Notebook",
    category: "Stationery",
    unitOfMeasure: "pieces",
    warehouseId: 1,
    warehouseName: "Central Warehouse",
    quantityOnHand: 50,
    reservedQuantity: 10,
    availableQuantity: 40,
    minimumStockLevel: 200,
    lastUpdated: "2024-01-15T09:00:00Z",
    isLowStock: true,
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

describe("InventoryTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockWarehousesApi.getWarehouses.mockResolvedValue({
      success: true,
      data: { warehouses: mockWarehouses, total: 1, page: 1, limit: 100 },
    });

    mockNationalInventoryApi.getNationalInventory.mockResolvedValue({
      success: true,
      data: { items: mockInventoryItems, total: 2, page: 1, limit: 50 },
    });

    mockNationalInventoryApi.getNationalInventorySummary.mockResolvedValue({
      success: true,
      data: { items: mockInventoryItems, total: 2, page: 1, limit: 50 },
    });
  });

  it("renders the inventory table with data", async () => {
    render(<InventoryTable />);

    await waitFor(() => {
      expect(screen.getByText("National Inventory")).toBeInTheDocument();
      expect(screen.getByText("Mathematics Textbook")).toBeInTheDocument();
      expect(screen.getByText("Exercise Notebook")).toBeInTheDocument();
      expect(screen.getByText("TB001")).toBeInTheDocument();
      expect(screen.getByText("NB001")).toBeInTheDocument();
    });
  });

  it("displays low stock badge for items below minimum level", async () => {
    render(<InventoryTable />);

    await waitFor(() => {
      const lowStockBadges = screen.getAllByText("Low Stock");
      expect(lowStockBadges).toHaveLength(1);

      const normalBadges = screen.getAllByText("Normal");
      expect(normalBadges).toHaveLength(1);
    });
  });

  it("loads warehouses and inventory data on mount", async () => {
    render(<InventoryTable />);

    await waitFor(() => {
      expect(mockWarehousesApi.getWarehouses).toHaveBeenCalledWith(1, 100, {
        isActive: true,
      });
      expect(
        mockNationalInventoryApi.getNationalInventory
      ).toHaveBeenCalledWith(1, 50, {});
    });
  });

  it("allows searching for items", async () => {
    const user = userEvent.setup();
    render(<InventoryTable />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Search items...")
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search items...");
    await user.type(searchInput, "Mathematics");

    const searchButton = screen.getByRole("button", { name: "" });
    await user.click(searchButton);

    await waitFor(() => {
      expect(
        mockNationalInventoryApi.getNationalInventory
      ).toHaveBeenCalledWith(1, 50, {
        search: "Mathematics",
      });
    });
  });

  it("allows filtering by warehouse", async () => {
    const user = userEvent.setup();
    render(<InventoryTable />);

    await waitFor(() => {
      expect(screen.getByText("Filters")).toBeInTheDocument();
    });

    // Open filters
    const filtersButton = screen.getByText("Filters");
    await user.click(filtersButton);

    await waitFor(() => {
      expect(screen.getByText("Warehouse")).toBeInTheDocument();
    });

    // Select warehouse filter
    const warehouseSelect = screen.getByDisplayValue("All Warehouses");
    await user.selectOptions(warehouseSelect, "1");

    await waitFor(() => {
      expect(
        mockNationalInventoryApi.getNationalInventory
      ).toHaveBeenCalledWith(1, 50, {
        warehouseId: 1,
      });
    });
  });

  it("allows filtering by low stock only", async () => {
    const user = userEvent.setup();
    render(<InventoryTable />);

    // Open filters
    const filtersButton = screen.getByText("Filters");
    await user.click(filtersButton);

    await waitFor(() => {
      expect(screen.getByText("Low Stock Only")).toBeInTheDocument();
    });

    // Check low stock only filter
    const lowStockCheckbox = screen.getByRole("checkbox");
    await user.click(lowStockCheckbox);

    await waitFor(() => {
      expect(
        mockNationalInventoryApi.getNationalInventory
      ).toHaveBeenCalledWith(1, 50, {
        lowStockOnly: true,
      });
    });
  });

  it("allows clearing filters", async () => {
    const user = userEvent.setup();
    render(<InventoryTable />);

    // Open filters and apply some filters
    const filtersButton = screen.getByText("Filters");
    await user.click(filtersButton);

    const categoryInput = screen.getByPlaceholderText("Filter by category");
    await user.type(categoryInput, "Books");

    await waitFor(() => {
      expect(
        mockNationalInventoryApi.getNationalInventory
      ).toHaveBeenCalledWith(1, 50, {
        category: "Books",
      });
    });

    // Clear filters
    const clearButton = screen.getByText("Clear Filters");
    await user.click(clearButton);

    await waitFor(() => {
      expect(
        mockNationalInventoryApi.getNationalInventory
      ).toHaveBeenCalledWith(1, 50, {});
    });
  });

  it("handles pagination", async () => {
    const user = userEvent.setup();

    // Mock response with more items to enable pagination
    mockNationalInventoryApi.getNationalInventory.mockResolvedValue({
      success: true,
      data: { items: mockInventoryItems, total: 100, page: 1, limit: 50 },
    });

    render(<InventoryTable />);

    await waitFor(() => {
      expect(screen.getByText("Next")).toBeInTheDocument();
    });

    const nextButton = screen.getByText("Next");
    await user.click(nextButton);

    await waitFor(() => {
      expect(
        mockNationalInventoryApi.getNationalInventory
      ).toHaveBeenCalledWith(2, 50, {});
    });
  });

  it("refreshes data when refresh button is clicked", async () => {
    const user = userEvent.setup();
    render(<InventoryTable />);

    await waitFor(() => {
      expect(screen.getByText("Refresh")).toBeInTheDocument();
    });

    const refreshButton = screen.getByText("Refresh");
    await user.click(refreshButton);

    await waitFor(() => {
      expect(
        mockNationalInventoryApi.getNationalInventory
      ).toHaveBeenCalledTimes(2);
    });
  });

  it("uses summary API when viewMode is summary", async () => {
    render(<InventoryTable viewMode="summary" />);

    await waitFor(() => {
      expect(
        mockNationalInventoryApi.getNationalInventorySummary
      ).toHaveBeenCalledWith(1, 50, {});
    });
  });

  it("handles API errors gracefully", async () => {
    mockNationalInventoryApi.getNationalInventory.mockResolvedValue({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch inventory data",
        timestamp: "2024-01-01T00:00:00Z",
      },
    });

    render(<InventoryTable />);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        "Failed to load inventory data"
      );
    });
  });

  it("displays loading state", async () => {
    // Mock a delayed response
    mockNationalInventoryApi.getNationalInventory.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                success: true,
                data: {
                  items: mockInventoryItems,
                  total: 2,
                  page: 1,
                  limit: 50,
                },
              }),
            100
          )
        )
    );

    render(<InventoryTable />);

    expect(screen.getByText("Loading inventory data...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Mathematics Textbook")).toBeInTheDocument();
    });
  });

  it("displays empty state when no data", async () => {
    mockNationalInventoryApi.getNationalInventory.mockResolvedValue({
      success: true,
      data: { items: [], total: 0, page: 1, limit: 50 },
    });

    render(<InventoryTable />);

    await waitFor(() => {
      expect(screen.getByText("No inventory data found")).toBeInTheDocument();
    });
  });
});
