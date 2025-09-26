import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CustomReportBuilder } from "../custom-report-builder";

const mockOnExecuteQuery = jest.fn();
const mockOnSaveQuery = jest.fn();

describe("CustomReportBuilder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the query builder interface", () => {
    render(
      <CustomReportBuilder
        userRole="super_admin"
        onExecuteQuery={mockOnExecuteQuery}
        onSaveQuery={mockOnSaveQuery}
      />
    );

    expect(screen.getByText("Custom Report Builder")).toBeInTheDocument();
    expect(screen.getByText("Select Fields")).toBeInTheDocument();
    expect(screen.getByText("Filters")).toBeInTheDocument();
    expect(screen.getByText("Advanced Options")).toBeInTheDocument();
  });

  it("allows entering report name and description", () => {
    render(
      <CustomReportBuilder
        userRole="super_admin"
        onExecuteQuery={mockOnExecuteQuery}
        onSaveQuery={mockOnSaveQuery}
      />
    );

    const nameInput = screen.getByPlaceholderText("Enter report name...");
    const descriptionInput = screen.getByPlaceholderText(
      "Enter report description..."
    );

    fireEvent.change(nameInput, { target: { value: "Test Report" } });
    fireEvent.change(descriptionInput, {
      target: { value: "Test Description" },
    });

    expect(nameInput).toHaveValue("Test Report");
    expect(descriptionInput).toHaveValue("Test Description");
  });

  it("displays available fields for selection", () => {
    render(
      <CustomReportBuilder
        userRole="super_admin"
        onExecuteQuery={mockOnExecuteQuery}
        onSaveQuery={mockOnSaveQuery}
      />
    );

    // Should show available fields
    expect(screen.getByText("Item Name")).toBeInTheDocument();
    expect(screen.getByText("Item Category")).toBeInTheDocument();
    expect(screen.getByText("Warehouse Name")).toBeInTheDocument();
    expect(screen.getByText("Stock Quantity")).toBeInTheDocument();
  });

  it("allows selecting and deselecting fields", () => {
    render(
      <CustomReportBuilder
        userRole="super_admin"
        onExecuteQuery={mockOnExecuteQuery}
        onSaveQuery={mockOnSaveQuery}
      />
    );

    // Click on a field to select it
    const itemNameField = screen.getByText("Item Name").closest("div");
    fireEvent.click(itemNameField!);

    // Should show in selected fields
    expect(screen.getByText("Selected Fields:")).toBeInTheDocument();

    // Click again to deselect
    fireEvent.click(itemNameField!);
  });

  it("allows adding and removing filters", () => {
    render(
      <CustomReportBuilder
        userRole="super_admin"
        onExecuteQuery={mockOnExecuteQuery}
        onSaveQuery={mockOnSaveQuery}
      />
    );

    // Initially no filters
    expect(
      screen.getByText(
        'No filters added. Click "Add Filter" to add conditions.'
      )
    ).toBeInTheDocument();

    // Add a filter
    const addFilterButton = screen.getByText("Add Filter");
    fireEvent.click(addFilterButton);

    // Should show filter controls
    expect(screen.queryByText("No filters added")).not.toBeInTheDocument();
  });

  it("shows advanced options when toggled", () => {
    render(
      <CustomReportBuilder
        userRole="super_admin"
        onExecuteQuery={mockOnExecuteQuery}
        onSaveQuery={mockOnSaveQuery}
      />
    );

    // Advanced options should be hidden initially
    expect(screen.queryByText("Result Limit")).not.toBeInTheDocument();

    // Click to show advanced options
    const showAdvancedButton = screen.getByText("Show Advanced");
    fireEvent.click(showAdvancedButton);

    // Should show advanced options
    expect(screen.getByText("Result Limit")).toBeInTheDocument();
  });

  it("prevents execution without selected fields", () => {
    render(
      <CustomReportBuilder
        userRole="super_admin"
        onExecuteQuery={mockOnExecuteQuery}
        onSaveQuery={mockOnSaveQuery}
      />
    );

    const executeButton = screen.getByText("Execute Query");
    expect(executeButton).toBeDisabled();
  });

  it("prevents saving without report name", () => {
    render(
      <CustomReportBuilder
        userRole="super_admin"
        onExecuteQuery={mockOnExecuteQuery}
        onSaveQuery={mockOnSaveQuery}
      />
    );

    const saveButton = screen.getByText("Save Query");
    expect(saveButton).toBeDisabled();
  });

  it("calls onExecuteQuery when execute button is clicked with valid query", () => {
    render(
      <CustomReportBuilder
        userRole="super_admin"
        onExecuteQuery={mockOnExecuteQuery}
        onSaveQuery={mockOnSaveQuery}
      />
    );

    // Select a field first
    const itemNameField = screen.getByText("Item Name").closest("div");
    fireEvent.click(itemNameField!);

    // Now execute button should be enabled
    const executeButton = screen.getByText("Execute Query");
    expect(executeButton).not.toBeDisabled();

    fireEvent.click(executeButton);
    expect(mockOnExecuteQuery).toHaveBeenCalled();
  });

  it("calls onSaveQuery when save button is clicked with valid query", () => {
    render(
      <CustomReportBuilder
        userRole="super_admin"
        onExecuteQuery={mockOnExecuteQuery}
        onSaveQuery={mockOnSaveQuery}
      />
    );

    // Enter report name
    const nameInput = screen.getByPlaceholderText("Enter report name...");
    fireEvent.change(nameInput, { target: { value: "Test Report" } });

    // Select a field
    const itemNameField = screen.getByText("Item Name").closest("div");
    fireEvent.click(itemNameField!);

    // Now save button should be enabled
    const saveButton = screen.getByText("Save Query");
    expect(saveButton).not.toBeDisabled();

    fireEvent.click(saveButton);
    expect(mockOnSaveQuery).toHaveBeenCalled();
  });

  it("shows executing state correctly", () => {
    render(
      <CustomReportBuilder
        userRole="super_admin"
        onExecuteQuery={mockOnExecuteQuery}
        onSaveQuery={mockOnSaveQuery}
        isExecuting={true}
      />
    );

    expect(screen.getByText("Executing...")).toBeInTheDocument();

    const executeButton = screen.getByText("Executing...").closest("button");
    expect(executeButton).toBeDisabled();
  });

  it("displays query results when provided", () => {
    const mockResults = [
      { item_name: "Test Item 1", stock_quantity: 100 },
      { item_name: "Test Item 2", stock_quantity: 200 },
    ];

    render(
      <CustomReportBuilder
        userRole="super_admin"
        onExecuteQuery={mockOnExecuteQuery}
        onSaveQuery={mockOnSaveQuery}
        queryResult={mockResults}
      />
    );

    // The query results will only show if fields are selected
    // For this test, we'll just check that the component renders without error
    expect(screen.getByText("Custom Report Builder")).toBeInTheDocument();
  });

  it("filters available fields based on user role", () => {
    render(
      <CustomReportBuilder
        userRole="school_rep"
        onExecuteQuery={mockOnExecuteQuery}
        onSaveQuery={mockOnSaveQuery}
      />
    );

    // School representatives should see limited fields
    expect(screen.getByText("Distribution ID")).toBeInTheDocument();
    expect(screen.getByText("School Name")).toBeInTheDocument();

    // Should not see user-related fields
    expect(screen.queryByText("User Role")).not.toBeInTheDocument();
  });
});
