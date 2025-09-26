import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StockReceiptForm } from "../stock-receipt-form";
import { stockReceiptApi, itemsApi, warehousesApi } from "@/lib/api";
import { toast } from "sonner";

// Mock the API modules
jest.mock("@/lib/api");
jest.mock("sonner");

const mockStockReceiptApi = stockReceiptApi as jest.Mocked<
  typeof stockReceiptApi
>;
const mockItemsApi = itemsApi as jest.Mocked<typeof itemsApi>;
const mockWarehousesApi = warehousesApi as jest.Mocked<typeof warehousesApi>;
const mockToast = toast as jest.Mocked<typeof toast>;

const mockItems = [
  {
    id: 1,
    name: "Textbook",
    code: "TB001",
    description: "Mathematics Textbook",
    category: "Books",
    unitOfMeasure: "pieces",
    standardCost: 10.0,
    minimumStockLevel: 100,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Notebook",
    code: "NB001",
    description: "Exercise Notebook",
    category: "Stationery",
    unitOfMeasure: "pieces",
    standardCost: 2.0,
    minimumStockLevel: 500,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
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

describe("StockReceiptForm", () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockItemsApi.getItems.mockResolvedValue({
      success: true,
      data: { items: mockItems, total: 2, page: 1, limit: 1000 },
    });

    mockWarehousesApi.getWarehouses.mockResolvedValue({
      success: true,
      data: { warehouses: mockWarehouses, total: 1, page: 1, limit: 100 },
    });
  });

  it("renders the form with all required fields", async () => {
    render(
      <StockReceiptForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    await waitFor(() => {
      expect(screen.getByText("Create Stock Receipt")).toBeInTheDocument();
      expect(screen.getByLabelText(/warehouse/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/receipt date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/supplier name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/supplier contact/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
      expect(screen.getByText("Items")).toBeInTheDocument();
    });
  });

  it("loads items and warehouses on mount", async () => {
    render(
      <StockReceiptForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    await waitFor(() => {
      expect(mockItemsApi.getItems).toHaveBeenCalledWith(1, 1000, {
        isActive: true,
      });
      expect(mockWarehousesApi.getWarehouses).toHaveBeenCalledWith(1, 100, {
        isActive: true,
      });
    });
  });

  it("allows adding and removing items", async () => {
    const user = userEvent.setup();
    render(
      <StockReceiptForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    await waitFor(() => {
      expect(screen.getAllByText(/select item/i)).toHaveLength(1);
    });

    // Add an item
    const addButton = screen.getByText("Add Item");
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getAllByText(/select item/i)).toHaveLength(2);
    });

    // Remove an item (should have remove buttons now)
    const removeButtons = screen.getAllByRole("button", { name: "" });
    const removeButton = removeButtons.find(
      (button) =>
        button.querySelector("svg")?.getAttribute("data-testid") ===
          "trash-2" || button.textContent === ""
    );

    if (removeButton) {
      await user.click(removeButton);
      await waitFor(() => {
        expect(screen.getAllByText(/select item/i)).toHaveLength(1);
      });
    }
  });

  it("validates required fields before submission", async () => {
    const user = userEvent.setup();
    render(
      <StockReceiptForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    const submitButton = screen.getByText("Create Stock Receipt");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Please select a warehouse");
    });
  });

  it("submits form with valid data", async () => {
    const user = userEvent.setup();
    mockStockReceiptApi.createStockReceipt.mockResolvedValue({
      success: true,
      data: { id: 1, receiptNumber: "RCP001" },
    });

    render(
      <StockReceiptForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/warehouse/i)).toBeInTheDocument();
    });

    // Fill in the form
    const warehouseSelect = screen.getByLabelText(/warehouse/i);
    await user.selectOptions(warehouseSelect, "1");

    const receiptDateInput = screen.getByLabelText(/receipt date/i);
    await user.clear(receiptDateInput);
    await user.type(receiptDateInput, "2024-01-15");

    const supplierNameInput = screen.getByLabelText(/supplier name/i);
    await user.type(supplierNameInput, "Test Supplier");

    // Select an item
    const itemSelects = screen.getAllByDisplayValue("Select Item");
    await user.selectOptions(itemSelects[0], "1");

    // Set quantity
    const quantityInputs = screen.getAllByLabelText(/quantity received/i);
    await user.clear(quantityInputs[0]);
    await user.type(quantityInputs[0], "100");

    // Submit the form
    const submitButton = screen.getByText("Create Stock Receipt");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockStockReceiptApi.createStockReceipt).toHaveBeenCalledWith({
        warehouseId: 1,
        supplierName: "Test Supplier",
        supplierContact: "",
        receiptDate: "2024-01-15",
        notes: "",
        items: [
          {
            itemId: 1,
            quantityReceived: 100,
            unitCost: 0,
            expiryDate: "",
            batchNumber: "",
            notes: "",
          },
        ],
      });
      expect(mockToast.success).toHaveBeenCalledWith(
        "Stock receipt created successfully"
      );
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("handles API errors gracefully", async () => {
    const user = userEvent.setup();
    mockStockReceiptApi.createStockReceipt.mockResolvedValue({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid data provided",
        timestamp: "2024-01-01T00:00:00Z",
      },
    });

    render(
      <StockReceiptForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/warehouse/i)).toBeInTheDocument();
    });

    // Fill in minimal required data
    const warehouseSelect = screen.getByLabelText(/warehouse/i);
    await user.selectOptions(warehouseSelect, "1");

    const itemSelects = screen.getAllByDisplayValue("Select Item");
    await user.selectOptions(itemSelects[0], "1");

    const quantityInputs = screen.getAllByLabelText(/quantity received/i);
    await user.clear(quantityInputs[0]);
    await user.type(quantityInputs[0], "100");

    const submitButton = screen.getByText("Create Stock Receipt");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Invalid data provided");
    });
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <StockReceiptForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });
});
