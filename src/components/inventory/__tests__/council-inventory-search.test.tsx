import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CouncilInventorySearch } from "../council-inventory-search";
import { localCouncilsApi, itemsApi } from "@/lib/api";

// Mock the API modules
jest.mock("@/lib/api");

const mockLocalCouncilsApi = localCouncilsApi as jest.Mocked<
  typeof localCouncilsApi
>;
const mockItemsApi = itemsApi as jest.Mocked<typeof itemsApi>;

const mockCouncils = [
  {
    id: 1,
    name: "Western Area Urban District Council",
    region: "Western Area",
    isActive: true,
  },
  {
    id: 2,
    name: "Bo District Council",
    region: "Southern Province",
    isActive: true,
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
    standardCost: 15.0,
    minimumStockLevel: 100,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Exercise Notebook",
    code: "NB001",
    description: "A4 Exercise Notebook",
    category: "Stationery",
    unitOfMeasure: "pieces",
    standardCost: 2.5,
    minimumStockLevel: 200,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

const mockOnFiltersChange = jest.fn();

describe("CouncilInventorySearch", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockLocalCouncilsApi.getLocalCouncils.mockResolvedValue({
      success: true,
      data: { items: mockCouncils, total: 2, page: 1, limit: 100 },
    });

    mockItemsApi.getItems.mockResolvedValue({
      success: true,
      data: { items: mockItems, total: 2, page: 1, limit: 500 },
    });
  });

  it("renders the search form with all filter options", async () => {
    render(<CouncilInventorySearch onFiltersChange={mockOnFiltersChange} />);

    await waitFor(() => {
      expect(
        screen.getByText("Search & Filter Council Inventory")
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Search by item name or code...")
      ).toBeInTheDocument();
      expect(screen.getByText("Local Council")).toBeInTheDocument();
      expect(screen.getByText("Category")).toBeInTheDocument();
      expect(screen.getByText("Specific Item")).toBeInTheDocument();
      expect(screen.getByText("Show only low stock items")).toBeInTheDocument();
    });
  });

  it("loads councils and items data on mount", async () => {
    render(<CouncilInventorySearch onFiltersChange={mockOnFiltersChange} />);

    await waitFor(() => {
      expect(mockLocalCouncilsApi.getLocalCouncils).toHaveBeenCalledWith(
        1,
        100
      );
      expect(mockItemsApi.getItems).toHaveBeenCalledWith(1, 500);
    });
  });

  it("populates council dropdown with fetched data", async () => {
    const user = userEvent.setup();
    render(<CouncilInventorySearch onFiltersChange={mockOnFiltersChange} />);

    await waitFor(() => {
      expect(screen.getByText("Select council...")).toBeInTheDocument();
    });

    // Click on council dropdown
    const councilSelect = screen.getByText("Select council...");
    await user.click(councilSelect);

    await waitFor(() => {
      expect(
        screen.getByText("Western Area Urban District Council (Western Area)")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Bo District Council (Southern Province)")
      ).toBeInTheDocument();
    });
  });

  it("populates category dropdown with unique categories from items", async () => {
    const user = userEvent.setup();
    render(<CouncilInventorySearch onFiltersChange={mockOnFiltersChange} />);

    await waitFor(() => {
      expect(screen.getByText("Select category...")).toBeInTheDocument();
    });

    // Click on category dropdown
    const categorySelect = screen.getByText("Select category...");
    await user.click(categorySelect);

    await waitFor(() => {
      expect(screen.getByText("Books")).toBeInTheDocument();
      expect(screen.getByText("Stationery")).toBeInTheDocument();
    });
  });

  it("populates item dropdown with fetched items", async () => {
    const user = userEvent.setup();
    render(<CouncilInventorySearch onFiltersChange={mockOnFiltersChange} />);

    await waitFor(() => {
      expect(screen.getByText("Select item...")).toBeInTheDocument();
    });

    // Click on item dropdown
    const itemSelect = screen.getByText("Select item...");
    await user.click(itemSelect);

    await waitFor(() => {
      expect(
        screen.getByText("Mathematics Textbook (TB001)")
      ).toBeInTheDocument();
      expect(screen.getByText("Exercise Notebook (NB001)")).toBeInTheDocument();
    });
  });

  it("handles search input changes", async () => {
    const user = userEvent.setup();
    render(<CouncilInventorySearch onFiltersChange={mockOnFiltersChange} />);

    const searchInput = screen.getByPlaceholderText(
      "Search by item name or code..."
    );
    await user.type(searchInput, "Mathematics");

    expect(searchInput).toHaveValue("Mathematics");
  });

  it("handles low stock checkbox changes", async () => {
    const user = userEvent.setup();
    render(<CouncilInventorySearch onFiltersChange={mockOnFiltersChange} />);

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    expect(checkbox).toBeChecked();
  });

  it("calls onFiltersChange when search button is clicked", async () => {
    const user = userEvent.setup();
    render(<CouncilInventorySearch onFiltersChange={mockOnFiltersChange} />);

    const searchInput = screen.getByPlaceholderText(
      "Search by item name or code..."
    );
    await user.type(searchInput, "Mathematics");

    const searchButton = screen.getByText("Search Inventory");
    await user.click(searchButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      search: "Mathematics",
    });
  });

  it("calls onFiltersChange with multiple filters", async () => {
    const user = userEvent.setup();
    render(<CouncilInventorySearch onFiltersChange={mockOnFiltersChange} />);

    // Set search term
    const searchInput = screen.getByPlaceholderText(
      "Search by item name or code..."
    );
    await user.type(searchInput, "Mathematics");

    // Set low stock filter
    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    // Click search
    const searchButton = screen.getByText("Search Inventory");
    await user.click(searchButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      search: "Mathematics",
      lowStockOnly: true,
    });
  });

  it("clears filters when clear button is clicked", async () => {
    const user = userEvent.setup();
    render(<CouncilInventorySearch onFiltersChange={mockOnFiltersChange} />);

    // Set some filters first
    const searchInput = screen.getByPlaceholderText(
      "Search by item name or code..."
    );
    await user.type(searchInput, "Mathematics");

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    // Clear filters
    const clearButton = screen.getByText("Clear Filters");
    await user.click(clearButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({});
    expect(searchInput).toHaveValue("");
    expect(checkbox).not.toBeChecked();
  });

  it("displays active filters when filters are applied", async () => {
    const user = userEvent.setup();
    render(<CouncilInventorySearch onFiltersChange={mockOnFiltersChange} />);

    // Set search term
    const searchInput = screen.getByPlaceholderText(
      "Search by item name or code..."
    );
    await user.type(searchInput, "Mathematics");

    await waitFor(() => {
      expect(screen.getByText("Active Filters:")).toBeInTheDocument();
      expect(screen.getByText('Search: "Mathematics"')).toBeInTheDocument();
    });
  });

  it("shows clear filters button only when filters are active", async () => {
    const user = userEvent.setup();
    render(<CouncilInventorySearch onFiltersChange={mockOnFiltersChange} />);

    // Initially no clear button
    expect(screen.queryByText("Clear Filters")).not.toBeInTheDocument();

    // Set a filter
    const searchInput = screen.getByPlaceholderText(
      "Search by item name or code..."
    );
    await user.type(searchInput, "Mathematics");

    // Now clear button should appear
    await waitFor(() => {
      expect(screen.getByText("Clear Filters")).toBeInTheDocument();
    });
  });

  it("handles initial filters prop", () => {
    const initialFilters = { search: "Test", lowStockOnly: true };
    render(
      <CouncilInventorySearch
        onFiltersChange={mockOnFiltersChange}
        initialFilters={initialFilters}
      />
    );

    const searchInput = screen.getByPlaceholderText(
      "Search by item name or code..."
    );
    expect(searchInput).toHaveValue("Test");

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("handles API errors gracefully", async () => {
    mockLocalCouncilsApi.getLocalCouncils.mockResolvedValue({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch councils",
        timestamp: "2024-01-01T00:00:00Z",
      },
    });

    mockItemsApi.getItems.mockResolvedValue({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch items",
        timestamp: "2024-01-01T00:00:00Z",
      },
    });

    render(<CouncilInventorySearch onFiltersChange={mockOnFiltersChange} />);

    // Component should still render even with API errors
    expect(
      screen.getByText("Search & Filter Council Inventory")
    ).toBeInTheDocument();
  });

  it("filters out empty values when calling onFiltersChange", async () => {
    const user = userEvent.setup();
    render(<CouncilInventorySearch onFiltersChange={mockOnFiltersChange} />);

    // Set search term then clear it
    const searchInput = screen.getByPlaceholderText(
      "Search by item name or code..."
    );
    await user.type(searchInput, "Mathematics");
    await user.clear(searchInput);

    const searchButton = screen.getByText("Search Inventory");
    await user.click(searchButton);

    // Should not include empty search in filters
    expect(mockOnFiltersChange).toHaveBeenCalledWith({});
  });
});
