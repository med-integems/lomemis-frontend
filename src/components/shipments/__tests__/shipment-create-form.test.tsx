import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShipmentCreateForm } from "../shipment-create-form";
import {
  shipmentsApi,
  localCouncilsApi,
  warehousesApi,
  nationalInventoryApi,
} from "@/lib/api";

// Mock the API modules
jest.mock("@/lib/api");

const mockShipmentsApi = shipmentsApi as jest.Mocked<typeof shipmentsApi>;
const mockLocalCouncilsApi = localCouncilsApi as jest.Mocked<typeof localCouncilsApi>;
const mockWarehousesApi = warehousesApi as jest.Mocked<typeof warehousesApi>;
const mockNationalInventoryApi = nationalInventoryApi as jest.Mocked<
  typeof nationalInventoryApi
>;

const mockWarehouses = [
  {
    id: 1,
    name: "Central Warehouse",
    location: "Freetown",
    address: "1 Main Street",
    managerName: "John Manager",
    contactPhone: "+23276123456",
    contactEmail: "manager@warehouse.com",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

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
    quantityOnHand: 1000,
    reservedQuantity: 100,
    availableQuantity: 900,
    minimumStockLevel: 200,
    lastUpdated: "2024-01-15T10:00:00Z",
    isLowStock: false,
  },
];

describe("ShipmentCreateForm", () => {
  const mockOnShipmentCreated = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock API responses
    mockWarehousesApi.getWarehouses.mockResolvedValue({
      success: true,
      data: { items: mockWarehouses, total: 1, page: 1, limit: 100 },
    });

    mockLocalCouncilsApi.getLocalCouncils.mockResolvedValue({
      success: true,
      data: { items: mockCouncils, total: 2, page: 1, limit: 100 },
    });

    mockNationalInventoryApi.getNationalInventory.mockResolvedValue({
      success: true,
      data: { items: mockInventoryItems, total: 2, page: 1, limit: 500 },
    });

    mockShipmentsApi.createShipment.mockResolvedValue({
      success: true,
      data: { id: 1, shipmentNumber: "SH001" },
    });
  });

  it("renders the form with initial state", async () => {
    render(
      <ShipmentCreateForm
        onShipmentCreated={mockOnShipmentCreated}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText("Shipment Details")).toBeInTheDocument();
    expect(screen.getByText("Shipment Items")).toBeInTheDocument();
    expect(screen.getByText("Create Shipment")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("loads warehouses and councils on mount", async () => {
    render(
      <ShipmentCreateForm
        onShipmentCreated={mockOnShipmentCreated}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      expect(mockWarehousesApi.getWarehouses).toHaveBeenCalledWith(1, 100);
      expect(mockLocalCouncilsApi.getLocalCouncils).toHaveBeenCalledWith(1, 100);
    });
  });

  it("loads inventory items when warehouse is selected", async () => {
    const user = userEvent.setup();
    render(
      <ShipmentCreateForm
        onShipmentCreated={mockOnShipmentCreated}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Select warehouse...")).toBeInTheDocument();
    });

    // Select warehouse
    const warehouseSelect = screen.getByText("Select warehouse...");
    await user.click(warehouseSelect);
    
    await waitFor(() => {
      const warehouseOption = screen.getByText("Central Warehouse - Freetown");
      user.click(warehouseOption);
    });

    await waitFor(() => {
      expect(mockNationalInventoryApi.getNationalInventory).toHaveBeenCalledWith(
        1,
        500,
        { warehouseId: 1 }
      );
    });
  });

  it("allows adding and removing items", async () => {
    const user = userEvent.setup();
    render(
      <ShipmentCreateForm
        onShipmentCreated={mockOnShipmentCreated}
        onCancel={mockOnCancel}
      />
    );

    // Select warehouse first to enable add item button
    await waitFor(() => {
      const warehouseSelect = screen.getByText("Select warehouse...");
      user.click(warehouseSelect);
    });

    await waitFor(() => {
      const warehouseOption = screen.getByText("Central Warehouse - Freetown");
      user.click(warehouseOption);
    });

    // Add item
    await waitFor(() => {
      const addItemButton = screen.getByText("Add Item");
      expect(addItemButton).not.toBeDisabled();
      user.click(addItemButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Item 1")).toBeInTheDocument();
    });

    // Remove item
    const removeButton = screen.getByRole("button", { name: /remove/i });
    await user.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByText("Item 1")).not.toBeInTheDocument();
    });
  });

  it("prevents adding items without selecting warehouse", () => {
    render(
      <ShipmentCreateForm
        onShipmentCreated={mockOnShipmentCreated}
        onCancel={mockOnCancel}
      />
    );

    const addItemButton = screen.getByText("Add Item");
    expect(addItemButton).toBeDisabled();
    expect(
      screen.getByText("Please select an origin warehouse first to add items")
    ).toBeInTheDocument();
  });

  it("validates form before submission", async () => {
    const user = userEvent.setup();
    render(
      <ShipmentCreateForm
        onShipmentCreated={mockOnShipmentCreated}
        onCancel={mockOnCancel}
      />
    );

    // Try to submit without filling required fields
    const submitButton = screen.getByText("Create Shipment");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Please select an origin warehouse")).toBeInTheDocument();
    });
  });

  it("validates item quantities against available stock", async () => {
    const user = userEvent.setup();
    render(
      <ShipmentCreateForm
        onShipmentCreated={mockOnShipmentCreated}
        onCancel={mockOnCancel}
      />
    );

    // Fill in required fields and add item
    await waitFor(() => {
      const warehouseSelect = screen.getByText("Select warehouse...");
      user.click(warehouseSelect);
    });

    await waitFor(() => {
      const warehouseOption = screen.getByText("Central Warehouse - Freetown");
      user.click(warehouseOption);
    });

    await waitFor(() => {
      const councilSelect = screen.getByText("Select council...");
      user.click(councilSelect);
    });

    await waitFor(() => {
      const councilOption = screen.getByText("Western Area Urban District Council (Western Area)");
      user.click(councilOption);
    });

    // Add item
    await waitFor(() => {
      const addItemButton = screen.getByText("Add Item");
      user.click(addItemButton);
    });

    // Select item and enter excessive quantity
    await waitFor(() => {
      const itemSelect = screen.getByText("Select item...");
      user.click(itemSelect);
    });

    await waitFor(() => {
      const itemOption = screen.getByText("Mathematics Textbook (TB001)");
      user.click(itemOption);
    });

    const quantityInput = screen.getByDisplayValue("0");
    await user.clear(quantityInput);
    await user.type(quantityInput, "1000"); // More than available (450)

    // Try to submit
    const submitButton = screen.getByText("Create Shipment");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/exceeds available stock/)
      ).toBeInTheDocument();
    });
  });

  it("creates shipment successfully", async () => {
    const user = userEvent.setup();
    render(
      <ShipmentCreateForm
        onShipmentCreated={mockOnShipmentCreated}
        onCancel={mockOnCancel}
      />
    );

    // Fill in all required fields
    await waitFor(() => {
      const warehouseSelect = screen.getByText("Select warehouse...");
      user.click(warehouseSelect);
    });

    await waitFor(() => {
      const warehouseOption = screen.getByText("Central Warehouse - Freetown");
      user.click(warehouseOption);
    });

    await waitFor(() => {
      const councilSelect = screen.getByText("Select council...");
      user.click(councilSelect);
    });

    await waitFor(() => {
      const councilOption = screen.getByText("Western Area Urban District Council (Western Area)");
      user.click(councilOption);
    });

    // Add item
    await waitFor(() => {
      const addItemButton = screen.getByText("Add Item");
      user.click(addItemButton);
    });

    await waitFor(() => {
      const itemSelect = screen.getByText("Select item...");
      user.click(itemSelect);
    });

    await waitFor(() => {
      const itemOption = screen.getByText("Mathematics Textbook (TB001)");
      user.click(itemOption);
    });

    const quantityInput = screen.getByDisplayValue("0");
    await user.clear(quantityInput);
    await user.type(quantityInput, "100");

    // Submit form
    const submitButton = screen.getByText("Create Shipment");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockShipmentsApi.createShipment).toHaveBeenCalledWith({
        originWarehouseId: 1,
        destinationCouncilId: 1,
        expectedArrivalDate: "",
        notes: "",
        items: [
          {
            itemId: 1,
            quantityShipped: 100,
            notes: "",
          },
        ],
      });
    });

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText("Shipment Created Successfully!")).toBeInTheDocument();
    });

    // Should call onShipmentCreated after delay
    await waitFor(
      () => {
        expect(mockOnShipmentCreated).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );
  });

  it("handles API errors gracefully", async () => {
    const user = userEvent.setup();
    mockShipmentsApi.createShipment.mockResolvedValue({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid shipment data",
        timestamp: new Date().toISOString(),
      },
    });

    render(
      <ShipmentCreateForm
        onShipmentCreated={mockOnShipmentCreated}
        onCancel={mockOnCancel}
      />
    );

    // Fill in valid form data and submit
    await waitFor(() => {
      const warehouseSelect = screen.getByText("Select warehouse...");
      user.click(warehouseSelect);
    });

    await waitFor(() => {
      const warehouseOption = screen.getByText("Central Warehouse - Freetown");
      user.click(warehouseOption);
    });

    await waitFor(() => {
      const councilSelect = screen.getByText("Select council...");
      user.click(councilSelect);
    });

    await waitFor(() => {
      const councilOption = screen.getByText("Western Area Urban District Council (Western Area)");
      user.click(councilOption);
    });

    await waitFor(() => {
      const addItemButton = screen.getByText("Add Item");
      user.click(addItemButton);
    });

    await waitFor(() => {
      const itemSelect = screen.getByText("Select item...");
      user.click(itemSelect);
    });

    await waitFor(() => {
      const itemOption = screen.getByText("Mathematics Textbook (TB001)");
      user.click(itemOption);
    });

    const quantityInput = screen.getByDisplayValue("0");
    await user.clear(quantityInput);
    await user.type(quantityInput, "100");

    const submitButton = screen.getByText("Create Shipment");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid shipment data")).toBeInTheDocument();
    });
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ShipmentCreateForm
        onShipmentCreated={mockOnShipmentCreated}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("displays loading state during submission", async () => {
    const user = userEvent.setup();
    
    // Make the API call hang to test loading state
    mockShipmentsApi.createShipment.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <ShipmentCreateForm
        onShipmentCreated={mockOnShipmentCreated}
        onCancel={mockOnCancel}
      />
    );

    // Fill in valid form and submit
    await waitFor(() => {
      const warehouseSelect = screen.getByText("Select warehouse...");
      user.click(warehouseSelect);
    });

    await waitFor(() => {
      const warehouseOption = screen.getByText("Central Warehouse - Freetown");
      user.click(warehouseOption);
    });

    await waitFor(() => {
      const councilSelect = screen.getByText("Select council...");
      user.click(councilSelect);
    });

    await waitFor(() => {
      const councilOption = screen.getByText("Western Area Urban District Council (Western Area)");
      user.click(councilOption);
    });

    await waitFor(() => {
      const addItemButton = screen.getByText("Add Item");
      user.click(addItemButton);
    });

    await waitFor(() => {
      const itemSelect = screen.getByText("Select item...");
      user.click(itemSelect);
    });

    await waitFor(() => {
      const itemOption = screen.getByText("Mathematics Textbook (TB001)");
      user.click(itemOption);
    });

    const quantityInput = screen.getByDisplayValue("0");
    await user.clear(quantityInput);
    await user.type(quantityInput, "100");

    const submitButton = screen.getByText("Create Shipment");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Creating...")).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });
});