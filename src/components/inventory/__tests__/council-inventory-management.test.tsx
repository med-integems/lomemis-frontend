import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CouncilInventoryManagement } from "../council-inventory-management";
import { councilInventoryApi, localCouncilsApi, itemsApi } from "@/lib/api";

// Mock the API modules
jest.mock("@/lib/api");

const mockCouncilInventoryApi = councilInventoryApi as jest.Mocked<
  typeof councilInventoryApi
>;
const mockLocalCouncilsApi = localCouncilsApi as jest.Mocked<
  typeof localCouncilsApi
>;
const mockItemsApi = itemsApi as jest.Mocked<typeof itemsApi>;

// Mock child components
jest.mock("../council-inventory-table", () => ({
  CouncilInventoryTable: ({ filters }: { filters: any }) => (
    <div data-testid="council-inventory-table">
      Council Inventory Table - Filters: {JSON.stringify(filters)}
    </div>
  ),
}));

jest.mock("../council-stock-ledger", () => ({
  CouncilStockLedger: ({ filters }: { filters: any }) => (
    <div data-testid="council-stock-ledger">
      Council Stock Ledger - Filters: {JSON.stringify(filters)}
    </div>
  ),
}));

jest.mock("../council-inventory-search", () => ({
  CouncilInventorySearch: ({ onFiltersChange, initialFilters }: any) => (
    <div data-testid="council-inventory-search">
      <button
        onClick={() => onFiltersChange({ search: "test" })}
        data-testid="apply-filters"
      >
        Apply Filters
      </button>
      <div>Initial Filters: {JSON.stringify(initialFilters)}</div>
    </div>
  ),
}));

describe("CouncilInventoryManagement", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock API responses
    mockCouncilInventoryApi.getCouncilInventory.mockResolvedValue({
      success: true,
      data: { items: [], total: 0, page: 1, limit: 20 },
    });

    mockCouncilInventoryApi.getCouncilStockMovements.mockResolvedValue({
      success: true,
      data: { movements: [], total: 0, page: 1, limit: 20 },
    });

    mockLocalCouncilsApi.getLocalCouncils.mockResolvedValue({
      success: true,
      data: { items: [], total: 0, page: 1, limit: 100 },
    });

    mockItemsApi.getItems.mockResolvedValue({
      success: true,
      data: { items: [], total: 0, page: 1, limit: 500 },
    });
  });

  it("renders the main heading and description", () => {
    render(<CouncilInventoryManagement />);

    expect(
      screen.getByText("Council Inventory Management")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "View and manage local council inventories with detailed stock tracking"
      )
    ).toBeInTheDocument();
  });

  it("renders all tab options", () => {
    render(<CouncilInventoryManagement />);

    expect(screen.getByText("Council Inventory")).toBeInTheDocument();
    expect(screen.getByText("Stock Ledger")).toBeInTheDocument();
    expect(screen.getByText("Search & Filter")).toBeInTheDocument();
  });

  it("shows inventory tab by default", () => {
    render(<CouncilInventoryManagement />);

    expect(screen.getByTestId("council-inventory-table")).toBeInTheDocument();
    expect(
      screen.getByText("Council-Specific Inventory Display")
    ).toBeInTheDocument();
  });

  it("switches to stock ledger tab when clicked", async () => {
    const user = userEvent.setup();
    render(<CouncilInventoryManagement />);

    const ledgerTab = screen.getByText("Stock Ledger");
    await user.click(ledgerTab);

    expect(screen.getByTestId("council-stock-ledger")).toBeInTheDocument();
  });

  it("switches to search tab when clicked", async () => {
    const user = userEvent.setup();
    render(<CouncilInventoryManagement />);

    const searchTab = screen.getByText("Search & Filter");
    await user.click(searchTab);

    expect(screen.getByTestId("council-inventory-search")).toBeInTheDocument();
    expect(screen.getByText("Movement Filters")).toBeInTheDocument();
  });

  it("passes filters to inventory table", () => {
    render(<CouncilInventoryManagement />);

    expect(
      screen.getByText("Council Inventory Table - Filters: {}")
    ).toBeInTheDocument();
  });

  it("passes filters to stock ledger", async () => {
    const user = userEvent.setup();
    render(<CouncilInventoryManagement />);

    const ledgerTab = screen.getByText("Stock Ledger");
    await user.click(ledgerTab);

    expect(
      screen.getByText("Council Stock Ledger - Filters: {}")
    ).toBeInTheDocument();
  });

  it("updates inventory filters when search filters change", async () => {
    const user = userEvent.setup();
    render(<CouncilInventoryManagement />);

    // Go to search tab
    const searchTab = screen.getByText("Search & Filter");
    await user.click(searchTab);

    // Apply filters
    const applyFiltersButton = screen.getByTestId("apply-filters");
    await user.click(applyFiltersButton);

    // Should switch back to inventory tab and show updated filters
    await waitFor(() => {
      expect(screen.getByTestId("council-inventory-table")).toBeInTheDocument();
      expect(
        screen.getByText('Council Inventory Table - Filters: {"search":"test"}')
      ).toBeInTheDocument();
    });
  });

  it("switches to inventory tab when inventory filters are applied", async () => {
    const user = userEvent.setup();
    render(<CouncilInventoryManagement />);

    // Start on ledger tab
    const ledgerTab = screen.getByText("Stock Ledger");
    await user.click(ledgerTab);

    // Go to search tab
    const searchTab = screen.getByText("Search & Filter");
    await user.click(searchTab);

    // Apply filters - should switch to inventory tab
    const applyFiltersButton = screen.getByTestId("apply-filters");
    await user.click(applyFiltersButton);

    await waitFor(() => {
      expect(screen.getByTestId("council-inventory-table")).toBeInTheDocument();
    });
  });

  it("provides movement filter controls in search tab", async () => {
    const user = userEvent.setup();
    render(<CouncilInventoryManagement />);

    const searchTab = screen.getByText("Search & Filter");
    await user.click(searchTab);

    expect(screen.getByText("Movement Filters")).toBeInTheDocument();
    expect(screen.getByText("Start Date")).toBeInTheDocument();
    expect(screen.getByText("End Date")).toBeInTheDocument();
    expect(screen.getByText("Filter Movements")).toBeInTheDocument();
  });

  it("handles movement filter date inputs", async () => {
    const user = userEvent.setup();
    render(<CouncilInventoryManagement />);

    const searchTab = screen.getByText("Search & Filter");
    await user.click(searchTab);

    const startDateInput = screen.getByLabelText("Start Date");
    const endDateInput = screen.getByLabelText("End Date");

    await user.type(startDateInput, "2024-01-01");
    await user.type(endDateInput, "2024-01-31");

    expect(startDateInput).toHaveValue("2024-01-01");
    expect(endDateInput).toHaveValue("2024-01-31");
  });

  it("applies movement filters and switches to ledger tab", async () => {
    const user = userEvent.setup();
    render(<CouncilInventoryManagement />);

    const searchTab = screen.getByText("Search & Filter");
    await user.click(searchTab);

    // Set date filters
    const startDateInput = screen.getByLabelText("Start Date");
    await user.type(startDateInput, "2024-01-01");

    // Apply movement filters
    const filterMovementsButton = screen.getByText("Filter Movements");
    await user.click(filterMovementsButton);

    // Should switch to ledger tab with filters
    await waitFor(() => {
      expect(screen.getByTestId("council-stock-ledger")).toBeInTheDocument();
      expect(
        screen.getByText(
          'Council Stock Ledger - Filters: {"startDate":"2024-01-01"}'
        )
      ).toBeInTheDocument();
    });
  });

  it("displays inventory tab content correctly", () => {
    render(<CouncilInventoryManagement />);

    expect(
      screen.getByText("Council-Specific Inventory Display")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "View real-time inventory levels across all local councils with detailed stock information, availability status, and council-specific access controls."
      )
    ).toBeInTheDocument();
  });

  it("passes initial filters to search component", async () => {
    const user = userEvent.setup();
    render(<CouncilInventoryManagement />);

    const searchTab = screen.getByText("Search & Filter");
    await user.click(searchTab);

    expect(screen.getByText("Initial Filters: {}")).toBeInTheDocument();
  });

  it("maintains filter state when switching between tabs", async () => {
    const user = userEvent.setup();
    render(<CouncilInventoryManagement />);

    // Apply inventory filters
    const searchTab = screen.getByText("Search & Filter");
    await user.click(searchTab);

    const applyFiltersButton = screen.getByTestId("apply-filters");
    await user.click(applyFiltersButton);

    // Switch to ledger tab
    const ledgerTab = screen.getByText("Stock Ledger");
    await user.click(ledgerTab);

    // Switch back to inventory tab - filters should be maintained
    const inventoryTab = screen.getByText("Council Inventory");
    await user.click(inventoryTab);

    expect(
      screen.getByText('Council Inventory Table - Filters: {"search":"test"}')
    ).toBeInTheDocument();
  });
});
