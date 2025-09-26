import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShipmentManagement } from "../shipment-management";
import { shipmentsApi, localCouncilsApi, warehousesApi } from "@/lib/api";

// Mock the API modules
jest.mock("@/lib/api");

const mockShipmentsApi = shipmentsApi as jest.Mocked<typeof shipmentsApi>;
const mockLocalCouncilsApi = localCouncilsApi as jest.Mocked<typeof localCouncilsApi>;
const mockWarehousesApi = warehousesApi as jest.Mocked<typeof warehousesApi>;

// Mock child components
jest.mock("../shipment-table", () => ({
  ShipmentTable: ({ filters, onConfirmReceipt, showReceiptActions }: any) => (
    <div data-testid="shipment-table">
      <div>Filters: {JSON.stringify(filters)}</div>
      <div>Show Receipt Actions: {showReceiptActions ? "true" : "false"}</div>
      <button
        onClick={() => onConfirmReceipt && onConfirmReceipt(1)}
        data-testid="confirm-receipt-btn"
      >
        Confirm Receipt
      </button>
    </div>
  ),
}));

jest.mock("../shipment-create-form", () => ({
  ShipmentCreateForm: ({ onShipmentCreated, onCancel }: any) => (
    <div data-testid="shipment-create-form">
      <button onClick={onShipmentCreated} data-testid="create-success">
        Create Success
      </button>
      <button onClick={onCancel} data-testid="create-cancel">
        Cancel
      </button>
    </div>
  ),
}));

jest.mock("../shipment-search", () => ({
  ShipmentSearch: ({ onFiltersChange, initialFilters }: any) => (
    <div data-testid="shipment-search">
      <button
        onClick={() => onFiltersChange({ status: "IN_TRANSIT" })}
        data-testid="apply-filters"
      >
        Apply Filters
      </button>
      <div>Initial Filters: {JSON.stringify(initialFilters)}</div>
    </div>
  ),
}));

jest.mock("../receipt-confirmation-dialog", () => ({
  ReceiptConfirmationDialog: ({ shipmentId, isOpen, onClose, onConfirmed }: any) =>
    isOpen ? (
      <div data-testid="receipt-dialog">
        <div>Shipment ID: {shipmentId}</div>
        <button onClick={onConfirmed} data-testid="confirm-receipt">
          Confirm
        </button>
        <button onClick={onClose} data-testid="close-dialog">
          Close
        </button>
      </div>
    ) : null,
}));

describe("ShipmentManagement", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock API responses
    mockShipmentsApi.getShipments.mockResolvedValue({
      success: true,
      data: { shipments: [], total: 0, page: 1, limit: 20 },
    });

    mockLocalCouncilsApi.getLocalCouncils.mockResolvedValue({
      success: true,
      data: { items: [], total: 0, page: 1, limit: 100 },
    });

    mockWarehousesApi.getWarehouses.mockResolvedValue({
      success: true,
      data: { items: [], total: 0, page: 1, limit: 100 },
    });
  });

  it("renders the main heading and description", () => {
    render(<ShipmentManagement />);

    expect(screen.getByText("Shipment Management")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Create, track, and manage shipments from national warehouses to local councils"
      )
    ).toBeInTheDocument();
  });

  it("renders create shipment button", () => {
    render(<ShipmentManagement />);

    expect(screen.getByText("Create Shipment")).toBeInTheDocument();
  });

  it("renders all tab options", () => {
    render(<ShipmentManagement />);

    expect(screen.getByText("All Shipments")).toBeInTheDocument();
    expect(screen.getByText("Create Shipment")).toBeInTheDocument();
    expect(screen.getByText("Search & Filter")).toBeInTheDocument();
    expect(screen.getByText("Pending Receipts")).toBeInTheDocument();
  });

  it("shows shipment list tab by default", () => {
    render(<ShipmentManagement />);

    expect(screen.getByTestId("shipment-table")).toBeInTheDocument();
    expect(screen.getByText("Shipment Tracking")).toBeInTheDocument();
  });

  it("switches to create tab when create button is clicked", async () => {
    const user = userEvent.setup();
    render(<ShipmentManagement />);

    const createButton = screen.getByText("Create Shipment");
    await user.click(createButton);

    expect(screen.getByTestId("shipment-create-form")).toBeInTheDocument();
    expect(screen.getByText("Create New Shipment")).toBeInTheDocument();
  });

  it("switches to search tab when clicked", async () => {
    const user = userEvent.setup();
    render(<ShipmentManagement />);

    const searchTab = screen.getByText("Search & Filter");
    await user.click(searchTab);

    expect(screen.getByTestId("shipment-search")).toBeInTheDocument();
  });

  it("switches to pending receipts tab and shows receipt actions", async () => {
    const user = userEvent.setup();
    render(<ShipmentManagement />);

    const receiptsTab = screen.getByText("Pending Receipts");
    await user.click(receiptsTab);

    expect(screen.getByText("Pending Receipt Confirmations")).toBeInTheDocument();
    expect(screen.getByText("Show Receipt Actions: true")).toBeInTheDocument();
    expect(screen.getByText('Filters: {"status":"IN_TRANSIT"}')).toBeInTheDocument();
  });

  it("handles filter changes and switches to list tab", async () => {
    const user = userEvent.setup();
    render(<ShipmentManagement />);

    // Go to search tab
    const searchTab = screen.getByText("Search & Filter");
    await user.click(searchTab);

    // Apply filters
    const applyFiltersButton = screen.getByTestId("apply-filters");
    await user.click(applyFiltersButton);

    // Should switch back to list tab and show updated filters
    await waitFor(() => {
      expect(screen.getByTestId("shipment-table")).toBeInTheDocument();
      expect(screen.getByText('Filters: {"status":"IN_TRANSIT"}')).toBeInTheDocument();
    });
  });

  it("handles shipment creation success", async () => {
    const user = userEvent.setup();
    render(<ShipmentManagement />);

    // Go to create tab
    const createButton = screen.getByText("Create Shipment");
    await user.click(createButton);

    // Simulate successful creation
    const createSuccessButton = screen.getByTestId("create-success");
    await user.click(createSuccessButton);

    // Should switch back to list tab
    await waitFor(() => {
      expect(screen.getByTestId("shipment-table")).toBeInTheDocument();
    });
  });

  it("handles create form cancellation", async () => {
    const user = userEvent.setup();
    render(<ShipmentManagement />);

    // Go to create tab
    const createButton = screen.getByText("Create Shipment");
    await user.click(createButton);

    // Cancel creation
    const cancelButton = screen.getByTestId("create-cancel");
    await user.click(cancelButton);

    // Should switch back to list tab
    await waitFor(() => {
      expect(screen.getByTestId("shipment-table")).toBeInTheDocument();
    });
  });

  it("opens receipt confirmation dialog", async () => {
    const user = userEvent.setup();
    render(<ShipmentManagement />);

    // Trigger receipt confirmation
    const confirmReceiptBtn = screen.getByTestId("confirm-receipt-btn");
    await user.click(confirmReceiptBtn);

    expect(screen.getByTestId("receipt-dialog")).toBeInTheDocument();
    expect(screen.getByText("Shipment ID: 1")).toBeInTheDocument();
  });

  it("handles receipt confirmation success", async () => {
    const user = userEvent.setup();
    render(<ShipmentManagement />);

    // Open receipt dialog
    const confirmReceiptBtn = screen.getByTestId("confirm-receipt-btn");
    await user.click(confirmReceiptBtn);

    // Confirm receipt
    const confirmButton = screen.getByTestId("confirm-receipt");
    await user.click(confirmButton);

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByTestId("receipt-dialog")).not.toBeInTheDocument();
    });
  });

  it("closes receipt confirmation dialog", async () => {
    const user = userEvent.setup();
    render(<ShipmentManagement />);

    // Open receipt dialog
    const confirmReceiptBtn = screen.getByTestId("confirm-receipt-btn");
    await user.click(confirmReceiptBtn);

    // Close dialog
    const closeButton = screen.getByTestId("close-dialog");
    await user.click(closeButton);

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByTestId("receipt-dialog")).not.toBeInTheDocument();
    });
  });

  it("displays correct content for each tab", async () => {
    const user = userEvent.setup();
    render(<ShipmentManagement />);

    // List tab content
    expect(screen.getByText("Shipment Tracking")).toBeInTheDocument();
    expect(
      screen.getByText(
        "View and track all shipments with real-time status updates, dispatch information, and delivery confirmations."
      )
    ).toBeInTheDocument();

    // Create tab content
    await user.click(screen.getByText("Create Shipment"));
    expect(screen.getByText("Create New Shipment")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Create a new shipment by selecting a destination council and adding items from available national warehouse inventory."
      )
    ).toBeInTheDocument();

    // Receipts tab content
    await user.click(screen.getByText("Pending Receipts"));
    expect(screen.getByText("Pending Receipt Confirmations")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Shipments that have been dispatched and are awaiting receipt confirmation from local council officers."
      )
    ).toBeInTheDocument();
  });

  it("passes initial filters to search component", async () => {
    const user = userEvent.setup();
    render(<ShipmentManagement />);

    const searchTab = screen.getByText("Search & Filter");
    await user.click(searchTab);

    expect(screen.getByText("Initial Filters: {}")).toBeInTheDocument();
  });

  it("maintains filter state when switching between tabs", async () => {
    const user = userEvent.setup();
    render(<ShipmentManagement />);

    // Apply filters
    const searchTab = screen.getByText("Search & Filter");
    await user.click(searchTab);

    const applyFiltersButton = screen.getByTestId("apply-filters");
    await user.click(applyFiltersButton);

    // Switch to receipts tab
    const receiptsTab = screen.getByText("Pending Receipts");
    await user.click(receiptsTab);

    // Switch back to list tab - filters should be maintained
    const listTab = screen.getByText("All Shipments");
    await user.click(listTab);

    expect(screen.getByText('Filters: {"status":"IN_TRANSIT"}')).toBeInTheDocument();
  });
});