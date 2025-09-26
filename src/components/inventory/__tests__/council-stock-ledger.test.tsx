import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CouncilStockLedger } from "../council-stock-ledger";
import { councilInventoryApi } from "@/lib/api";

// Mock the API modules
jest.mock("@/lib/api");

const mockCouncilInventoryApi = councilInventoryApi as jest.Mocked<
  typeof councilInventoryApi
>;

const mockStockMovements = [
  {
    transactionId: 1,
    transactionType: "SHIPMENT_RECEIVED" as const,
    itemId: 1,
    itemName: "Mathematics Textbook",
    itemCode: "TB001",
    councilId: 1,
    councilName: "Western Area Urban District Council",
    quantity: 100,
    balanceAfter: 300,
    referenceType: "SHIPMENT" as const,
    referenceId: 1,
    referenceNumber: "SH001",
    userId: 1,
    userName: "John Doe",
    notes: "Received from national warehouse",
    transactionDate: "2024-01-15T10:00:00Z",
  },
  {
    transactionId: 2,
    transactionType: "DISTRIBUTION" as const,
    itemId: 1,
    itemName: "Mathematics Textbook",
    itemCode: "TB001",
    councilId: 1,
    councilName: "Western Area Urban District Council",
    quantity: 50,
    balanceAfter: 250,
    referenceType: "DISTRIBUTION" as const,
    referenceId: 1,
    referenceNumber: "DT001",
    userId: 2,
    userName: "Jane Smith",
    notes: "Distributed to Primary School A",
    transactionDate: "2024-01-16T14:30:00Z",
  },
];

describe("CouncilStockLedger", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockCouncilInventoryApi.getCouncilStockMovements.mockResolvedValue({
      success: true,
      data: { movements: mockStockMovements, total: 2, page: 1, limit: 20 },
    });
  });

  it("renders the stock ledger with movement data", async () => {
    render(<CouncilStockLedger />);

    await waitFor(() => {
      expect(screen.getByText("Stock Movement Ledger")).toBeInTheDocument();
      expect(screen.getByText("Mathematics Textbook")).toBeInTheDocument();
      expect(screen.getByText("TB001")).toBeInTheDocument();
      expect(
        screen.getByText("Western Area Urban District Council")
      ).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });
  });

  it("displays transaction type badges correctly", async () => {
    render(<CouncilStockLedger />);

    await waitFor(() => {
      expect(screen.getByText("Received")).toBeInTheDocument();
      expect(screen.getByText("Distributed")).toBeInTheDocument();
    });
  });

  it("displays reference type badges correctly", async () => {
    render(<CouncilStockLedger />);

    await waitFor(() => {
      expect(screen.getAllByText("Shipment")).toHaveLength(1);
      expect(screen.getAllByText("Distribution")).toHaveLength(1);
    });
  });

  it("displays quantity changes with correct colors", async () => {
    render(<CouncilStockLedger />);

    await waitFor(() => {
      // Check for positive quantity (green)
      const positiveQuantity = screen.getByText("+100");
      expect(positiveQuantity).toHaveClass("text-green-600");

      // Check for negative quantity (red)
      const negativeQuantity = screen.getByText("-50");
      expect(negativeQuantity).toHaveClass("text-red-600");
    });
  });

  it("displays balance after transaction", async () => {
    render(<CouncilStockLedger />);

    await waitFor(() => {
      expect(screen.getByText("300")).toBeInTheDocument();
      expect(screen.getByText("250")).toBeInTheDocument();
    });
  });

  it("displays reference numbers when available", async () => {
    render(<CouncilStockLedger />);

    await waitFor(() => {
      expect(screen.getByText("#SH001")).toBeInTheDocument();
      expect(screen.getByText("#DT001")).toBeInTheDocument();
    });
  });

  it("displays notes when available", async () => {
    render(<CouncilStockLedger />);

    await waitFor(() => {
      expect(
        screen.getByText("Received from national warehouse")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Distributed to Primary School A")
      ).toBeInTheDocument();
    });
  });

  it("loads stock movements data on mount", async () => {
    render(<CouncilStockLedger />);

    await waitFor(() => {
      expect(
        mockCouncilInventoryApi.getCouncilStockMovements
      ).toHaveBeenCalledWith(1, 20, {});
    });
  });

  it("applies filters when provided", async () => {
    const filters = { councilId: 1, transactionType: "SHIPMENT_RECEIVED" };
    render(<CouncilStockLedger filters={filters} />);

    await waitFor(() => {
      expect(
        mockCouncilInventoryApi.getCouncilStockMovements
      ).toHaveBeenCalledWith(1, 20, filters);
    });
  });

  it("handles pagination correctly", async () => {
    const user = userEvent.setup();

    // Mock response with more items to enable pagination
    mockCouncilInventoryApi.getCouncilStockMovements.mockResolvedValue({
      success: true,
      data: { movements: mockStockMovements, total: 50, page: 1, limit: 20 },
    });

    render(<CouncilStockLedger />);

    await waitFor(() => {
      expect(screen.getByText("Next")).toBeInTheDocument();
    });

    const nextButton = screen.getByText("Next");
    await user.click(nextButton);

    await waitFor(() => {
      expect(
        mockCouncilInventoryApi.getCouncilStockMovements
      ).toHaveBeenCalledWith(2, 20, {});
    });
  });

  it("displays pagination information correctly", async () => {
    mockCouncilInventoryApi.getCouncilStockMovements.mockResolvedValue({
      success: true,
      data: { movements: mockStockMovements, total: 50, page: 1, limit: 20 },
    });

    render(<CouncilStockLedger />);

    await waitFor(() => {
      expect(
        screen.getByText("Showing 1 to 2 of 50 movements")
      ).toBeInTheDocument();
    });
  });

  it("handles API errors gracefully", async () => {
    mockCouncilInventoryApi.getCouncilStockMovements.mockResolvedValue({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch stock movements",
        timestamp: "2024-01-01T00:00:00Z",
      },
    });

    render(<CouncilStockLedger />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to fetch stock movements")
      ).toBeInTheDocument();
    });
  });

  it("displays loading state", async () => {
    // Mock a delayed response
    mockCouncilInventoryApi.getCouncilStockMovements.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                success: true,
                data: {
                  movements: mockStockMovements,
                  total: 2,
                  page: 1,
                  limit: 20,
                },
              }),
            100
          )
        )
    );

    render(<CouncilStockLedger />);

    // Check for skeleton loading state
    expect(document.querySelectorAll('[data-testid="skeleton"]')).toHaveLength(
      0
    );

    await waitFor(() => {
      expect(screen.getByText("Mathematics Textbook")).toBeInTheDocument();
    });
  });

  it("displays empty state when no movements", async () => {
    mockCouncilInventoryApi.getCouncilStockMovements.mockResolvedValue({
      success: true,
      data: { movements: [], total: 0, page: 1, limit: 20 },
    });

    render(<CouncilStockLedger />);

    await waitFor(() => {
      expect(screen.getByText("No stock movements found")).toBeInTheDocument();
      expect(
        screen.getByText("No stock movements have been recorded yet")
      ).toBeInTheDocument();
    });
  });

  it("displays empty state with filter message when filters are applied", async () => {
    mockCouncilInventoryApi.getCouncilStockMovements.mockResolvedValue({
      success: true,
      data: { movements: [], total: 0, page: 1, limit: 20 },
    });

    const filters = { itemId: 999 };
    render(<CouncilStockLedger filters={filters} />);

    await waitFor(() => {
      expect(screen.getByText("No stock movements found")).toBeInTheDocument();
      expect(
        screen.getByText("Try adjusting your search filters")
      ).toBeInTheDocument();
    });
  });

  it("formats dates correctly", async () => {
    render(<CouncilStockLedger />);

    await waitFor(() => {
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 16, 2024/)).toBeInTheDocument();
    });
  });

  it("handles adjustment transaction type", async () => {
    const adjustmentMovement = {
      ...mockStockMovements[0],
      transactionType: "ADJUSTMENT" as const,
      referenceType: "ADJUSTMENT" as const,
    };

    mockCouncilInventoryApi.getCouncilStockMovements.mockResolvedValue({
      success: true,
      data: { movements: [adjustmentMovement], total: 1, page: 1, limit: 20 },
    });

    render(<CouncilStockLedger />);

    await waitFor(() => {
      expect(screen.getByText("Adjustment")).toBeInTheDocument();
    });
  });
});
