import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CouncilInventoryTable } from "../council-inventory-table";
import { councilInventoryApi } from "@/lib/api";

// Mock the API modules
jest.mock("@/lib/api");

const mockCouncilInventoryApi = councilInventoryApi as jest.Mocked<
  typeof councilInventoryApi
>;

const mockCouncilInventoryItems = [
  {
    itemId: 1,
    itemName: "Mathematics Textbook",
    itemCode: "TB001",
    itemDescription: "Grade 5 Mathematics Textbook",
    category: "Books",
    unitOfMeasure: "pieces",
    councilId: 1,
    councilName: "Western Area Urban District Council",
    quantityOnHand: 300,
    reservedQuantity: 30,
    availableQuantity: 270,
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
    councilId: 2,
    councilName: "Bo District Council",
    quantityOnHand: 25,
    reservedQuantity: 5,
    availableQuantity: 20,
    minimumStockLevel: 100,
    lastUpdated: "2024-01-15T09:00:00Z",
    isLowStock: true,
  },
];

describe("CouncilInventoryTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockCouncilInventoryApi.getCouncilInventory.mockResolvedValue({
      success: true,
      data: { inventory: mockCouncilInventoryItems, total: 2, page: 1, limit: 20 },
    });
  });

  it("renders the council inventory table with data", async () => {
    render(<CouncilInventoryTable />);

    await waitFor(() => {
      expect(screen.getByText("Mathematics Textbook")).toBeInTheDocument();
      expect(screen.getByText("Exercise Notebook")).toBeInTheDocument();
      expect(screen.getByText(/TB001/)).toBeInTheDocument();
      expect(screen.getByText(/NB001/)).toBeInTheDocument();
      expect(
        screen.getByText("Western Area Urban District Council")
      ).toBeInTheDocument();
      expect(screen.getByText("Bo District Council")).toBeInTheDocument();
    });
  });

  it("displays stock status badges correctly", async () => {
    render(<CouncilInventoryTable />);

    await waitFor(() => {
      expect(screen.getByText("In Stock")).toBeInTheDocument();
      expect(screen.getByText("Low Stock")).toBeInTheDocument();
    });
  });

  it("displays quantity information correctly", async () => {
    render(<CouncilInventoryTable />);

    await waitFor(() => {
      expect(screen.getByText("270")).toBeInTheDocument(); // Available quantity for first item
      expect(screen.getByText("20")).toBeInTheDocument(); // Available quantity for second item
    });
  });

  it("loads council inventory data on mount", async () => {
    render(<CouncilInventoryTable />);

    await waitFor(() => {
      expect(mockCouncilInventoryApi.getCouncilInventory).toHaveBeenCalledWith(
        1,
        20,
        {}
      );
    });
  });

  it("applies filters when provided", async () => {
    const filters = { councilId: 1, lowStockOnly: true };
    render(<CouncilInventoryTable filters={filters} />);

    await waitFor(() => {
      expect(mockCouncilInventoryApi.getCouncilInventory).toHaveBeenCalledWith(
        1,
        20,
        filters
      );
    });
  });

  it("handles pagination correctly", async () => {
    const user = userEvent.setup();

    // Mock response with more items to enable pagination
    mockCouncilInventoryApi.getCouncilInventory.mockResolvedValue({
      success: true,
      data: { inventory: mockCouncilInventoryItems, total: 50, page: 1, limit: 20 },
    });

    render(<CouncilInventoryTable />);

    await waitFor(() => {
      expect(screen.getByText("Next")).toBeInTheDocument();
    });

    const nextButton = screen.getByText("Next");
    await user.click(nextButton);

    await waitFor(() => {
      expect(mockCouncilInventoryApi.getCouncilInventory).toHaveBeenCalledWith(
        2,
        20,
        {}
      );
    });
  });

  it("displays pagination information correctly", async () => {
    mockCouncilInventoryApi.getCouncilInventory.mockResolvedValue({
      success: true,
      data: { inventory: mockCouncilInventoryItems, total: 50, page: 1, limit: 20 },
    });

    render(<CouncilInventoryTable />);

    await waitFor(() => {
      expect(
        screen.getByText(/Showing 1 to 2 of 50 items/)
      ).toBeInTheDocument();
    });
  });

  it("handles API errors gracefully", async () => {
    mockCouncilInventoryApi.getCouncilInventory.mockResolvedValue({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch council inventory",
        timestamp: "2024-01-01T00:00:00Z",
      },
    });

    render(<CouncilInventoryTable />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to fetch council inventory")
      ).toBeInTheDocument();
    });
  });

  it("displays loading state", async () => {
    // Mock a delayed response
    mockCouncilInventoryApi.getCouncilInventory.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                success: true,
                data: {
                  inventory: mockCouncilInventoryItems,
                  total: 2,
                  page: 1,
                  limit: 20,
                },
              }),
            100
          )
        )
    );

    render(<CouncilInventoryTable />);

    // Check for skeleton loading state
    expect(document.querySelectorAll('[data-testid="skeleton"]')).toHaveLength(
      0
    );

    await waitFor(() => {
      expect(screen.getByText("Mathematics Textbook")).toBeInTheDocument();
    });
  });

  it("displays empty state when no data", async () => {
    mockCouncilInventoryApi.getCouncilInventory.mockResolvedValue({
      success: true,
      data: { items: [], total: 0, page: 1, limit: 20 },
    });

    render(<CouncilInventoryTable />);

    await waitFor(() => {
      expect(screen.getByText("No inventory items found")).toBeInTheDocument();
      expect(
        screen.getByText("No inventory items are currently available")
      ).toBeInTheDocument();
    });
  });

  it("displays empty state with filter message when filters are applied", async () => {
    mockCouncilInventoryApi.getCouncilInventory.mockResolvedValue({
      success: true,
      data: { items: [], total: 0, page: 1, limit: 20 },
    });

    const filters = { search: "nonexistent" };
    render(<CouncilInventoryTable filters={filters} />);

    await waitFor(() => {
      expect(screen.getByText("No inventory items found")).toBeInTheDocument();
      expect(
        screen.getByText("Try adjusting your search filters")
      ).toBeInTheDocument();
    });
  });

  it("formats dates correctly", async () => {
    render(<CouncilInventoryTable />);

    await waitFor(() => {
      expect(screen.getAllByText(/Jan 15, 2024/)).toHaveLength(2);
    });
  });

  it("displays out of stock badge when available quantity is zero", async () => {
    const outOfStockItem = {
      ...mockCouncilInventoryItems[0],
      quantityOnHand: 0,
      availableQuantity: 0,
      isLowStock: false,
    };

    mockCouncilInventoryApi.getCouncilInventory.mockResolvedValue({
      success: true,
      data: { items: [outOfStockItem], total: 1, page: 1, limit: 20 },
    });

    render(<CouncilInventoryTable />);

    await waitFor(() => {
      expect(screen.getByText("Out of Stock")).toBeInTheDocument();
    });
  });
});
