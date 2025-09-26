import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InventorySearch } from "../inventory-search";
import { nationalInventoryApi, warehousesApi, itemsApi } from "@/lib/api";
import { toast } from "sonner";

// Mock the API modules
jest.mock("@/lib/api");
jest.mock("sonner");

const mockNationalInventoryApi = nationalInventoryApi as jest.Mocked<
  typeof nationalInventoryApi
>;
const mockWarehousesApi = warehousesApi as jest.Mocked<typeof warehousesApi>;
const mockItemsApi = itemsApi as jest.Mocked<typeof itemsApi>;
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

describe("InventorySearch", () => {
  const mockOnResultsChange = jest.fn();

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
      data: { items: mockInventoryItems, total: 1, page: 1, limit: 100 },
    });
  });

  it("renders the search interface", async () => {
    render(<InventorySearch onResultsChange={mockOnResultsChange} />);

    await waitFor(() => {
      expect(screen.getByText("Search & Filter Inventory")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(
          "Search by item name, code, or description..."
        )
      ).toBeInTheDocument();
      expect(screen.getByText("Search")).toBeInTheDocument();
      expect(screen.getByText("Clear")).toBeInTheDocument();
    });
  });

  it("loads warehouses and items on mount", async () => {
    render(<InventorySearch onResultsChange={mockOnResultsChange} />);

    await waitFor(() => {
      expect(mockWarehousesApi.getWarehouses).toHaveBeenCalledWith(1, 100, {
        isActive: true,
      });
      expect(mockItemsApi.getItems).toHaveBeenCalledWith(1, 1000, {
        isActive: true,
      });
    });
  });

  it("performs search with search term", async () => {
    const user = userEvent.setup();
    render(<InventorySearch onResultsChange={mockOnResultsChange} />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(
          "Search by item name, code, or description..."
        )
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      "Search by item name, code, or description..."
    );
    await user.type(searchInput, "Mathematics");

    const searchButton = screen.getByText("Search");
    await user.click(searchButton);

    await waitFor(() => {
      expect(
        mockNationalInventoryApi.getNationalInventory
      ).toHaveBeenCalledWith(1, 100, {
        search: "Mathematics",
      });
      expect(mockOnResultsChange).toHaveBeenCalledWith(mockInventoryItems);
      expect(mockToast.success).toHaveBeenCalledWith("Found 1 items");
    });
  });

  it("performs search with Enter key", async () => {
    const user = userEvent.setup();
    render(<InventorySearch onResultsChange={mockOnResultsChange} />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(
          "Search by item name, code, or description..."
        )
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      "Search by item name, code, or description..."
    );
    await user.type(searchInput, "Mathematics");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(
        mockNationalInventoryApi.getNationalInventory
      ).toHaveBeenCalledWith(1, 100, {
        search: "Mathematics",
      });
    });
  });

  it("applies category filter", async () => {
    const user = userEvent.setup();
    render(<InventorySearch onResultsChange={mockOnResultsChange} />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Filter by category")
      ).toBeInTheDocument();
    });

    const categoryInput = screen.getByPlaceholderText("Filter by category");
    await user.type(categoryInput, "Books");

    const searchButton = screen.getByText("Search");
    await user.click(searchButton);

    await waitFor(() => {
      expect(
        mockNationalInventoryApi.getNationalInventory
      ).toHaveBeenCalledWith(1, 100, {
        category: "Books",
      });
    });
  });

  it("applies warehouse filter", async () => {
    const user = userEvent.setup();
    render(<InventorySearch onResultsChange={mockOnResultsChange} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("All Warehouses")).toBeInTheDocument();
    });

    const warehouseSelect = screen.getByDisplayValue("All Warehouses");
    await user.selectOptions(warehouseSelect, "1");

    const searchButton = screen.getByText("Search");
    await user.click(searchButton);

    await waitFor(() => {
      expect(
        mockNationalInventoryApi.getNationalInventory
      ).toHaveBeenCalledWith(1, 100, {
        warehouseId: 1,
      });
    });
  });

  it("applies specific item filter", async () => {
    const user = userEvent.setup();
    render(<InventorySearch onResultsChange={mockOnResultsChange} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("All Items")).toBeInTheDocument();
    });

    const itemSelect = screen.getByDisplayValue("All Items");
    await user.selectOptions(itemSelect, "1");

    const searchButton = screen.getByText("Search");
    await user.click(searchButton);

    await waitFor(() => {
      expect(
        mockNationalInventoryApi.getNationalInventory
      ).toHaveBeenCalledWith(1, 100, {
        itemId: 1,
      });
    });
  });

  it("applies low stock only filter", async () => {
    const user = userEvent.setup();
    render(<InventorySearch onResultsChange={mockOnResultsChange} />);

    await waitFor(() => {
      expect(screen.getByText("Low Stock Only")).toBeInTheDocument();
    });

    const lowStockCheckbox = screen.getByRole("checkbox");
    await user.click(lowStockCheckbox);

    const searchButton = screen.getByText("Search");
    await user.click(searchButton);

    await waitFor(() => {
      expect(
        mockNationalInventoryApi.getNationalInventory
      ).toHaveBeenCalledWith(1, 100, {
        lowStockOnly: true,
      });
    });
  });

  it("combines multiple filters", async () => {
    const user = userEvent.setup();
    render(<InventorySearch onResultsChange={mockOnResultsChange} />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(
          "Search by item name, code, or description..."
        )
      ).toBeInTheDocument();
    });

    // Apply multiple filters
    const searchInput = screen.getByPlaceholderText(
      "Search by item name, code, or description..."
    );
    await user.type(searchInput, "Mathematics");

    const categoryInput = screen.getByPlaceholderText("Filter by category");
    await user.type(categoryInput, "Books");

    const warehouseSelect = screen.getByDisplayValue("All Warehouses");
    await user.selectOptions(warehouseSelect, "1");

    const searchButton = screen.getByText("Search");
    await user.click(searchButton);

    await waitFor(() => {
      expect(
        mockNationalInventoryApi.getNationalInventory
      ).toHaveBeenCalledWith(1, 100, {
        search: "Mathematics",
        category: "Books",
        warehouseId: 1,
      });
    });
  });

  it("displays active filters", async () => {
    const user = userEvent.setup();
    render(<InventorySearch onResultsChange={mockOnResultsChange} />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(
          "Search by item name, code, or description..."
        )
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      "Search by item name, code, or description..."
    );
    await user.type(searchInput, "Mathematics");

    const categoryInput = screen.getByPlaceholderText("Filter by category");
    await user.type(categoryInput, "Books");

    await waitFor(() => {
      expect(screen.getByText("Active filters:")).toBeInTheDocument();
      expect(screen.getByText('Search: "Mathematics"')).toBeInTheDocument();
      expect(screen.getByText("Category: Books")).toBeInTheDocument();
    });
  });

  it("clears search and filters", async () => {
    const user = userEvent.setup();
    render(<InventorySearch onResultsChange={mockOnResultsChange} />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(
          "Search by item name, code, or description..."
        )
      ).toBeInTheDocument();
    });

    // Apply some filters
    const searchInput = screen.getByPlaceholderText(
      "Search by item name, code, or description..."
    );
    await user.type(searchInput, "Mathematics");

    const categoryInput = screen.getByPlaceholderText("Filter by category");
    await user.type(categoryInput, "Books");

    // Clear everything
    const clearButton = screen.getByText("Clear");
    await user.click(clearButton);

    await waitFor(() => {
      expect(searchInput).toHaveValue("");
      expect(categoryInput).toHaveValue("");
      expect(mockOnResultsChange).toHaveBeenCalledWith([]);
    });
  });

  it("displays search results", async () => {
    const user = userEvent.setup();
    render(<InventorySearch onResultsChange={mockOnResultsChange} />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(
          "Search by item name, code, or description..."
        )
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      "Search by item name, code, or description..."
    );
    await user.type(searchInput, "Mathematics");

    const searchButton = screen.getByText("Search");
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText("Search Results (1 items)")).toBeInTheDocument();
      expect(screen.getByText("Mathematics Textbook")).toBeInTheDocument();
      expect(screen.getByText("TB001")).toBeInTheDocument();
      expect(screen.getByText("Central Warehouse")).toBeInTheDocument();
    });
  });

  it("shows error when search fails", async () => {
    const user = userEvent.setup();
    mockNationalInventoryApi.getNationalInventory.mockResolvedValue({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to search inventory",
        timestamp: "2024-01-01T00:00:00Z",
      },
    });

    render(<InventorySearch onResultsChange={mockOnResultsChange} />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(
          "Search by item name, code, or description..."
        )
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      "Search by item name, code, or description..."
    );
    await user.type(searchInput, "Mathematics");

    const searchButton = screen.getByText("Search");
    await user.click(searchButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        "Failed to search inventory"
      );
    });
  });

  it("shows info message when no results found", async () => {
    const user = userEvent.setup();
    mockNationalInventoryApi.getNationalInventory.mockResolvedValue({
      success: true,
      data: { items: [], total: 0, page: 1, limit: 100 },
    });

    render(<InventorySearch onResultsChange={mockOnResultsChange} />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(
          "Search by item name, code, or description..."
        )
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      "Search by item name, code, or description..."
    );
    await user.type(searchInput, "NonExistent");

    const searchButton = screen.getByText("Search");
    await user.click(searchButton);

    await waitFor(() => {
      expect(mockToast.info).toHaveBeenCalledWith(
        "No items found matching your search criteria"
      );
    });
  });

  it("requires search term or filters before searching", async () => {
    const user = userEvent.setup();
    render(<InventorySearch onResultsChange={mockOnResultsChange} />);

    await waitFor(() => {
      expect(screen.getByText("Search")).toBeInTheDocument();
    });

    const searchButton = screen.getByText("Search");
    await user.click(searchButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        "Please enter a search term or apply filters"
      );
    });
  });
});
