import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShipmentTable } from "../shipment-table";
import { shipmentsApi } from "@/lib/api";

// Mock the API modules
jest.mock("@/lib/api");

const mockShipmentsApi = shipmentsApi as jest.Mocked<typeof shipmentsApi>;

const mockShipments = [
  {
    id: 1,
    shipmentNumber: "SH001",
    originWarehouseId: 1,
    destinationCouncilId: 1,
    status: "DRAFT",
    dispatchDate: null,
    expectedArrivalDate: "2024-02-15T00:00:00Z",
    actualArrivalDate: null,
    totalItems: 5,
    notes: "Test shipment",
    discrepancyNotes: null,
    createdBy: 1,
    dispatchedBy: null,
    receivedBy: null,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    originWarehouseName: "Central Warehouse",
    destinationCouncilName: "Western Area Urban District Council",
    createdByName: "John Doe",
    dispatchedByName: null,
    receivedByName: null,
    items: [],
  },
  {
    id: 2,
    shipmentNumber: "SH002",
    originWarehouseId: 1,
    destinationCouncilId: 2,
    status: "IN_TRANSIT",
    dispatchDate: "2024-01-20T09:00:00Z",
    expectedArrivalDate: "2024-01-25T00:00:00Z",
    actualArrivalDate: null,
    totalItems: 3,
    notes: "Urgent shipment",
    discrepancyNotes: null,
    createdBy: 1,
    dispatchedBy: 1,
    receivedBy: null,
    createdAt: "2024-01-18T10:00:00Z",
    updatedAt: "2024-01-20T09:00:00Z",
    originWarehouseName: "Central Warehouse",
    destinationCouncilName: "Bo District Council",
    createdByName: "John Doe",
    dispatchedByName: "John Doe",
    receivedByName: null,
    items: [],
  },
];

describe("ShipmentTable", () => {
  const mockOnConfirmReceipt = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockShipmentsApi.getShipments.mockResolvedValue({
      success: true,
      data: { shipments: mockShipments, total: 2, page: 1, limit: 20 },
    });
  });

  it("renders the shipment table with data", async () => {
    render(<ShipmentTable />);

    await waitFor(() => {
      expect(screen.getByText("SH001")).toBeInTheDocument();
      expect(screen.getByText("SH002")).toBeInTheDocument();
      expect(screen.getByText("Central Warehouse")).toBeInTheDocument();
      expect(screen.getByText("Western Area Urban District Council")).toBeInTheDocument();
      expect(screen.getByText("Bo District Council")).toBeInTheDocument();
    });
  });

  it("displays correct status badges", async () => {
    render(<ShipmentTable />);

    await waitFor(() => {
      expect(screen.getByText("Draft")).toBeInTheDocument();
      expect(screen.getByText("In Transit")).toBeInTheDocument();
    });
  });

  it("shows dispatch button for draft shipments", async () => {
    render(<ShipmentTable />);

    await waitFor(() => {
      const dispatchButtons = screen.getAllByText("Dispatch");
      expect(dispatchButtons).toHaveLength(1);
    });
  });

  it("shows confirm receipt button for in-transit shipments when showReceiptActions is true", async () => {
    render(
      <ShipmentTable
        onConfirmReceipt={mockOnConfirmReceipt}
        showReceiptActions={true}
      />
    );

    await waitFor(() => {
      const confirmButtons = screen.getAllByText("Confirm Receipt");
      expect(confirmButtons).toHaveLength(1);
    });
  });

  it("calls onConfirmReceipt when confirm receipt button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ShipmentTable
        onConfirmReceipt={mockOnConfirmReceipt}
        showReceiptActions={true}
      />
    );

    await waitFor(() => {
      const confirmButton = screen.getByText("Confirm Receipt");
      user.click(confirmButton);
    });

    await waitFor(() => {
      expect(mockOnConfirmReceipt).toHaveBeenCalledWith(2);
    });
  });

  it("handles dispatch shipment action", async () => {
    const user = userEvent.setup();
    mockShipmentsApi.dispatchShipment.mockResolvedValue({
      success: true,
      data: {},
    });

    render(<ShipmentTable />);

    await waitFor(() => {
      const dispatchButton = screen.getByText("Dispatch");
      user.click(dispatchButton);
    });

    await waitFor(() => {
      expect(mockShipmentsApi.dispatchShipment).toHaveBeenCalledWith(1);
    });
  });

  it("displays loading state", () => {
    mockShipmentsApi.getShipments.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<ShipmentTable />);

    expect(screen.getAllByTestId("skeleton")).toHaveLength(5);
  });

  it("displays error state", async () => {
    mockShipmentsApi.getShipments.mockResolvedValue({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch shipments",
        timestamp: new Date().toISOString(),
      },
    });

    render(<ShipmentTable />);

    await waitFor(() => {
      expect(screen.getByText("Failed to fetch shipments")).toBeInTheDocument();
    });
  });

  it("displays empty state when no shipments", async () => {
    mockShipmentsApi.getShipments.mockResolvedValue({
      success: true,
      data: { shipments: [], total: 0, page: 1, limit: 20 },
    });

    render(<ShipmentTable />);

    await waitFor(() => {
      expect(screen.getByText("No shipments found")).toBeInTheDocument();
      expect(
        screen.getByText("No shipments have been created yet")
      ).toBeInTheDocument();
    });
  });

  it("displays empty state with filter message when filters applied", async () => {
    mockShipmentsApi.getShipments.mockResolvedValue({
      success: true,
      data: { shipments: [], total: 0, page: 1, limit: 20 },
    });

    render(<ShipmentTable filters={{ status: "RECEIVED" }} />);

    await waitFor(() => {
      expect(screen.getByText("No shipments found")).toBeInTheDocument();
      expect(
        screen.getByText("Try adjusting your search filters")
      ).toBeInTheDocument();
    });
  });

  it("displays pagination when there are multiple pages", async () => {
    mockShipmentsApi.getShipments.mockResolvedValue({
      success: true,
      data: { shipments: mockShipments, total: 50, page: 1, limit: 20 },
    });

    render(<ShipmentTable />);

    await waitFor(() => {
      expect(screen.getByText(/Showing 1 to 2 of 50 shipments/)).toBeInTheDocument();
      expect(screen.getByText("Previous")).toBeInTheDocument();
      expect(screen.getByText("Next")).toBeInTheDocument();
    });
  });

  it("handles page navigation", async () => {
    const user = userEvent.setup();
    mockShipmentsApi.getShipments.mockResolvedValue({
      success: true,
      data: { shipments: mockShipments, total: 50, page: 1, limit: 20 },
    });

    render(<ShipmentTable />);

    await waitFor(() => {
      const nextButton = screen.getByText("Next");
      user.click(nextButton);
    });

    // Should call API again for page 2
    expect(mockShipmentsApi.getShipments).toHaveBeenCalledTimes(2);
  });

  it("applies filters correctly", async () => {
    const filters = { status: "IN_TRANSIT", search: "SH002" };
    render(<ShipmentTable filters={filters} />);

    await waitFor(() => {
      expect(mockShipmentsApi.getShipments).toHaveBeenCalledWith(
        1,
        20,
        filters
      );
    });
  });

  it("formats dates correctly", async () => {
    render(<ShipmentTable />);

    await waitFor(() => {
      expect(screen.getByText("Not dispatched")).toBeInTheDocument();
      expect(screen.getByText(/Jan 20, 2024/)).toBeInTheDocument();
    });
  });

  it("shows all status badge variants", async () => {
    const shipmentsWithAllStatuses = [
      { ...mockShipments[0], status: "DRAFT" },
      { ...mockShipments[1], status: "IN_TRANSIT" },
      { ...mockShipments[0], id: 3, status: "RECEIVED" },
      { ...mockShipments[1], id: 4, status: "DISCREPANCY" },
    ];

    mockShipmentsApi.getShipments.mockResolvedValue({
      success: true,
      data: {
        shipments: shipmentsWithAllStatuses,
        total: 4,
        page: 1,
        limit: 20,
      },
    });

    render(<ShipmentTable />);

    await waitFor(() => {
      expect(screen.getByText("Draft")).toBeInTheDocument();
      expect(screen.getByText("In Transit")).toBeInTheDocument();
      expect(screen.getByText("Received")).toBeInTheDocument();
      expect(screen.getByText("Discrepancy")).toBeInTheDocument();
    });
  });

  it("refetches data when filters change", async () => {
    const { rerender } = render(<ShipmentTable filters={{}} />);

    await waitFor(() => {
      expect(mockShipmentsApi.getShipments).toHaveBeenCalledTimes(1);
    });

    rerender(<ShipmentTable filters={{ status: "DRAFT" }} />);

    await waitFor(() => {
      expect(mockShipmentsApi.getShipments).toHaveBeenCalledTimes(2);
    });
  });
});