import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";
import { DistributionCreateForm } from "../distribution-create-form";
import { schoolsApi, councilInventoryApi } from "@/lib/api";
import { toast } from "sonner";

// Mock the APIs
const mockSchoolsApi = {
  getSchoolsByCouncil: jest.fn(),
};

const mockCouncilInventoryApi = {
  getCouncilInventory: jest.fn(),
};

jest.mock("@/lib/api", () => ({
  schoolsApi: mockSchoolsApi,
  councilInventoryApi: mockCouncilInventoryApi,
}));

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockSchools = [
  {
    id: 1,
    name: "Government Secondary School",
    councilId: 1,
    location: "Freetown",
    isActive: true,
  },
  {
    id: 2,
    name: "Community Primary School",
    councilId: 1,
    location: "Waterloo",
    isActive: true,
  },
];

const mockInventory = [
  {
    itemId: 1,
    itemName: "Exercise Books",
    itemCode: "EXB-001",
    itemDescription: "Standard exercise books",
    category: "Stationery",
    unitOfMeasure: "pieces",
    councilId: 1,
    councilName: "Western Area Rural",
    quantityOnHand: 500,
    reservedQuantity: 100,
    availableQuantity: 400,
    minimumStockLevel: 50,
    lastUpdated: "2024-01-15T10:00:00Z",
    isLowStock: false,
  },
  {
    itemId: 2,
    itemName: "Textbooks",
    itemCode: "TXB-001",
    itemDescription: "Mathematics textbooks",
    category: "Books",
    unitOfMeasure: "pieces",
    councilId: 1,
    councilName: "Western Area Rural",
    quantityOnHand: 200,
    reservedQuantity: 50,
    availableQuantity: 150,
    minimumStockLevel: 20,
    lastUpdated: "2024-01-15T10:00:00Z",
    isLowStock: false,
  },
];

describe("DistributionCreateForm", () => {
  const mockOnSubmit = jest.fn<Promise<void>, [any]>().mockResolvedValue(undefined);

  const defaultProps = {
    onSubmit: mockOnSubmit,
    councilId: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSchoolsApi.getSchoolsByCouncil.mockResolvedValue({
      success: true,
      data: mockSchools
    });
    mockCouncilInventoryApi.getCouncilInventory.mockResolvedValue({
      success: true,
      data: {
        inventory: mockInventory,
        total: 2,
        page: 1,
        limit: 100,
      }
    });
  });

  it("should render the form with initial elements", async () => {
    render(<DistributionCreateForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Create Distribution")).toBeInTheDocument();
      expect(screen.getByLabelText(/School/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Distribution Date/)).toBeInTheDocument();
      expect(screen.getByText("Distribution Items")).toBeInTheDocument();
    });
  });

  it("should load schools and inventory on mount", async () => {
    render(<DistributionCreateForm {...defaultProps} />);

    await waitFor(() => {
      expect(mockSchoolsApi.getSchoolsByCouncil).toHaveBeenCalledWith(1);
      expect(mockCouncilInventoryApi.getCouncilInventory).toHaveBeenCalledWith(
        1,
        100,
        { councilId: 1 }
      );
    });
  });

  it("should populate school dropdown with fetched schools", async () => {
    render(<DistributionCreateForm {...defaultProps} />);

    await waitFor(() => {
      const schoolSelect = screen.getByRole("combobox", { name: /School/ });
      fireEvent.click(schoolSelect);
    });

    await waitFor(() => {
      expect(screen.getByText("Government Secondary School")).toBeInTheDocument();
      expect(screen.getByText("Community Primary School")).toBeInTheDocument();
    });
  });

  it("should populate item dropdown with inventory items", async () => {
    render(<DistributionCreateForm {...defaultProps} />);

    await waitFor(() => {
      const itemSelect = screen.getByRole("combobox", { name: /Item/ });
      fireEvent.click(itemSelect);
    });

    await waitFor(() => {
      expect(screen.getByText(/Exercise Books.*Available: 400/)).toBeInTheDocument();
      expect(screen.getByText(/Textbooks.*Available: 150/)).toBeInTheDocument();
    });
  });

  it("should add new item rows", async () => {
    render(<DistributionCreateForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Add Item")).toBeInTheDocument();
    });

    const addButton = screen.getByText("Add Item");
    fireEvent.click(addButton);

    // Should now have 2 item rows
    const itemSelects = screen.getAllByRole("combobox", { name: /Item/ });
    expect(itemSelects).toHaveLength(2);
  });

  it("should remove item rows", async () => {
    render(<DistributionCreateForm {...defaultProps} />);

    await waitFor(() => {
      const addButton = screen.getByText("Add Item");
      fireEvent.click(addButton);
    });

    // Should have 2 item rows now
    let itemSelects = screen.getAllByRole("combobox", { name: /Item/ });
    expect(itemSelects).toHaveLength(2);

    // Remove one item
    const removeButtons = screen.getAllByRole("button");
    const trashButton = removeButtons.find(button => 
      button.querySelector("svg") && button.textContent === ""
    );
    
    if (trashButton) {
      fireEvent.click(trashButton);
    }

    // Should be back to 1 item row
    itemSelects = screen.getAllByRole("combobox", { name: /Item/ });
    expect(itemSelects).toHaveLength(1);
  });

  it("should validate inventory availability", async () => {
    const user = userEvent.setup();
    render(<DistributionCreateForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Create Distribution")).toBeInTheDocument();
    });

    // Select an item
    const itemSelect = screen.getByRole("combobox", { name: /Item/ });
    fireEvent.click(itemSelect);
    
    await waitFor(() => {
      const exerciseBooksOption = screen.getByText(/Exercise Books.*Available: 400/);
      fireEvent.click(exerciseBooksOption);
    });

    // Enter quantity that exceeds available stock
    const quantityInput = screen.getByRole("spinbutton", { name: /Quantity/ });
    await user.clear(quantityInput);
    await user.type(quantityInput, "500");

    await waitFor(() => {
      expect(screen.getByText(/Exceeds available quantity/)).toBeInTheDocument();
    });
  });

  it("should show available quantity for selected items", async () => {
    render(<DistributionCreateForm {...defaultProps} />);

    await waitFor(() => {
      const itemSelect = screen.getByRole("combobox", { name: /Item/ });
      fireEvent.click(itemSelect);
    });

    await waitFor(() => {
      const exerciseBooksOption = screen.getByText(/Exercise Books.*Available: 400/);
      fireEvent.click(exerciseBooksOption);
    });

    await waitFor(() => {
      expect(screen.getByText("Available: 400 pieces")).toBeInTheDocument();
    });
  });

  it("should submit form with valid data", async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);

    render(<DistributionCreateForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Create Distribution")).toBeInTheDocument();
    });

    // Fill out the form
    const schoolSelect = screen.getByRole("combobox", { name: /School/ });
    fireEvent.click(schoolSelect);
    await waitFor(() => {
      fireEvent.click(screen.getByText("Government Secondary School"));
    });

    const itemSelect = screen.getByRole("combobox", { name: /Item/ });
    fireEvent.click(itemSelect);
    await waitFor(() => {
      fireEvent.click(screen.getByText(/Exercise Books.*Available: 400/));
    });

    const quantityInput = screen.getByRole("spinbutton", { name: /Quantity/ });
    await user.clear(quantityInput);
    await user.type(quantityInput, "100");

    const notesTextarea = screen.getByRole("textbox", { name: /Notes/ });
    await user.type(notesTextarea, "Test distribution");

    // Submit the form
    const submitButton = screen.getByText("Create Distribution");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        localCouncilId: 1,
        schoolId: 1,
        distributionDate: expect.any(String),
        notes: "Test distribution",
        items: [
          {
            itemId: 1,
            quantityDistributed: 100,
            notes: "",
          },
        ],
      });
    });
  });

  it("should reset form when reset button is clicked", async () => {
    const user = userEvent.setup();
    render(<DistributionCreateForm {...defaultProps} />);

    await waitFor(() => {
      const notesTextarea = screen.getByRole("textbox", { name: /Notes/ });
      user.type(notesTextarea, "Test notes");
    });

    const resetButton = screen.getByText("Reset");
    fireEvent.click(resetButton);

    await waitFor(() => {
      const notesTextarea = screen.getByRole("textbox", { name: /Notes/ });
      expect(notesTextarea).toHaveValue("");
    });
  });

  it("should handle API errors gracefully", async () => {
    // Override the mocks for this test
    mockSchoolsApi.getSchoolsByCouncil.mockRejectedValueOnce(new Error("Network error"));
    mockCouncilInventoryApi.getCouncilInventory.mockRejectedValueOnce(new Error("Network error"));

    render(<DistributionCreateForm {...defaultProps} />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to load schools");
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to load inventory");
    }, { timeout: 3000 });
  });

  it("should prevent submission with insufficient inventory", async () => {
    const user = userEvent.setup();
    render(<DistributionCreateForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Create Distribution")).toBeInTheDocument();
    });

    // Select school
    const schoolSelect = screen.getByRole("combobox", { name: /School/ });
    fireEvent.click(schoolSelect);
    await waitFor(() => {
      fireEvent.click(screen.getByText("Government Secondary School"));
    });

    // Select item
    const itemSelect = screen.getByRole("combobox", { name: /Item/ });
    fireEvent.click(itemSelect);
    await waitFor(() => {
      fireEvent.click(screen.getByText(/Exercise Books.*Available: 400/));
    });

    // Enter quantity that exceeds available stock
    const quantityInput = screen.getByRole("spinbutton", { name: /Quantity/ });
    await user.clear(quantityInput);
    await user.type(quantityInput, "500");

    // Try to submit
    const submitButton = screen.getByText("Create Distribution");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("Insufficient inventory for Exercise Books")
      );
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it("should show loading state during form submission", async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(<DistributionCreateForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Create Distribution")).toBeInTheDocument();
    });

    // Fill out minimal form data
    const schoolSelect = screen.getByRole("combobox", { name: /School/ });
    fireEvent.click(schoolSelect);
    await waitFor(() => {
      fireEvent.click(screen.getByText("Government Secondary School"));
    });

    const itemSelect = screen.getByRole("combobox", { name: /Item/ });
    fireEvent.click(itemSelect);
    await waitFor(() => {
      fireEvent.click(screen.getByText(/Exercise Books.*Available: 400/));
    });

    // Submit the form
    const submitButton = screen.getByText("Create Distribution");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Creating...")).toBeInTheDocument();
    });
  });
});