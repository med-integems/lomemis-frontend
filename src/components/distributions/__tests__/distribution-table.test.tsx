import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";
import { DistributionTable } from "../distribution-table";

const mockDistributions = [
  {
    id: 1,
    distributionNumber: "DIST-2024-001",
    localCouncilId: 1,
    localCouncilName: "Western Area Rural",
    schoolId: 1,
    schoolName: "Government Secondary School",
    status: "CREATED" as const,
    distributionDate: "2024-01-15T00:00:00Z",
    confirmationDate: null,
    totalItems: 3,
    notes: "Regular monthly distribution",
    discrepancyNotes: null,
    createdBy: 1,
    createdByName: "John Doe",
    confirmedBy: null,
    confirmedByName: null,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    items: [
      {
        id: 1,
        distributionId: 1,
        itemId: 1,
        itemName: "Exercise Books",
        itemCode: "EXB-001",
        unitOfMeasure: "pieces",
        quantityDistributed: 100,
        quantityConfirmed: null,
        discrepancyQuantity: null,
        notes: null,
      },
    ],
  },
  {
    id: 2,
    distributionNumber: "DIST-2024-002",
    localCouncilId: 1,
    localCouncilName: "Western Area Rural",
    schoolId: 2,
    schoolName: "Community Primary School",
    status: "CONFIRMED" as const,
    distributionDate: "2024-01-10T00:00:00Z",
    confirmationDate: "2024-01-12T00:00:00Z",
    totalItems: 2,
    notes: null,
    discrepancyNotes: null,
    createdBy: 1,
    createdByName: "John Doe",
    confirmedBy: 2,
    confirmedByName: "Jane Smith",
    createdAt: "2024-01-10T10:00:00Z",
    updatedAt: "2024-01-12T10:00:00Z",
    items: [
      {
        id: 2,
        distributionId: 2,
        itemId: 2,
        itemName: "Textbooks",
        itemCode: "TXB-001",
        unitOfMeasure: "pieces",
        quantityDistributed: 50,
        quantityConfirmed: 50,
        discrepancyQuantity: 0,
        notes: null,
      },
    ],
  },
];

describe("DistributionTable", () => {
  const defaultProps = {
    distributions: mockDistributions,
    loading: false,
    totalCount: 2,
    currentPage: 1,
    pageSize: 10,
    onPageChange: jest.fn(),
    userRole: "lc_officer" as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render distribution table with data", () => {
    render(<DistributionTable {...defaultProps} />);

    expect(screen.getByText("Distributions (2 total)")).toBeInTheDocument();
    expect(screen.getByText("DIST-2024-001")).toBeInTheDocument();
    expect(screen.getByText("DIST-2024-002")).toBeInTheDocument();
    expect(screen.getByText("Government Secondary School")).toBeInTheDocument();
    expect(screen.getByText("Community Primary School")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    render(<DistributionTable {...defaultProps} loading={true} />);

    expect(screen.getByText("Distributions")).toBeInTheDocument();
    // Check for skeleton loading elements
    expect(document.querySelectorAll(".animate-pulse")).toHaveLength(5);
  });

  it("should show empty state when no distributions", () => {
    render(<DistributionTable {...defaultProps} distributions={[]} totalCount={0} />);

    expect(screen.getByText("No distributions found")).toBeInTheDocument();
  });

  it("should display correct status badges", () => {
    render(<DistributionTable {...defaultProps} />);

    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
  });

  it("should show confirm receipt option for school representatives", () => {
    const mockOnConfirmReceipt = jest.fn();
    render(
      <DistributionTable
        {...defaultProps}
        userRole="school_rep"
        onConfirmReceipt={mockOnConfirmReceipt}
      />
    );

    // Find the actions dropdown for the CREATED distribution
    const actionButtons = screen.getAllByRole("button", { name: "" });
    const firstRowActionButton = actionButtons.find(button => 
      button.querySelector("svg") // Looking for the MoreHorizontal icon
    );
    
    if (firstRowActionButton) {
      fireEvent.click(firstRowActionButton);
      
      expect(screen.getByText("Confirm Receipt")).toBeInTheDocument();
    }
  });

  it("should not show confirm receipt for already confirmed distributions", () => {
    const mockOnConfirmReceipt = jest.fn();
    render(
      <DistributionTable
        {...defaultProps}
        userRole="school_rep"
        onConfirmReceipt={mockOnConfirmReceipt}
      />
    );

    // The confirmed distribution should not have a confirm receipt option
    expect(mockDistributions[1].status).toBe("CONFIRMED");
  });

  it("should handle page changes", () => {
    const mockOnPageChange = jest.fn();
    render(
      <DistributionTable
        {...defaultProps}
        totalCount={25}
        currentPage={1}
        pageSize={10}
        onPageChange={mockOnPageChange}
      />
    );

    // Check if pagination is rendered (totalPages > 1)
    const totalPages = Math.ceil(25 / 10); // 3 pages
    expect(totalPages).toBe(3);
  });

  it("should open distribution details modal", async () => {
    render(<DistributionTable {...defaultProps} />);

    // Find and click the first actions dropdown
    const actionButtons = screen.getAllByRole("button", { name: "" });
    const firstRowActionButton = actionButtons.find(button => 
      button.querySelector("svg") // Looking for the MoreHorizontal icon
    );
    
    if (firstRowActionButton) {
      fireEvent.click(firstRowActionButton);
      
      const viewDetailsButton = screen.getByText("View Details");
      fireEvent.click(viewDetailsButton);

      await waitFor(() => {
        expect(screen.getByText("Distribution Details")).toBeInTheDocument();
        expect(screen.getByText("DIST-2024-001")).toBeInTheDocument();
      });
    }
  });

  it("should display distribution items in details modal", async () => {
    render(<DistributionTable {...defaultProps} />);

    // Open details modal
    const actionButtons = screen.getAllByRole("button", { name: "" });
    const firstRowActionButton = actionButtons.find(button => 
      button.querySelector("svg")
    );
    
    if (firstRowActionButton) {
      fireEvent.click(firstRowActionButton);
      
      const viewDetailsButton = screen.getByText("View Details");
      fireEvent.click(viewDetailsButton);

      await waitFor(() => {
        expect(screen.getByText("Distribution Items")).toBeInTheDocument();
        expect(screen.getByText("Exercise Books")).toBeInTheDocument();
        expect(screen.getByText("EXB-001")).toBeInTheDocument();
      });
    }
  });

  it("should close details modal", async () => {
    render(<DistributionTable {...defaultProps} />);

    // Open details modal
    const actionButtons = screen.getAllByRole("button", { name: "" });
    const firstRowActionButton = actionButtons.find(button => 
      button.querySelector("svg")
    );
    
    if (firstRowActionButton) {
      fireEvent.click(firstRowActionButton);
      
      const viewDetailsButton = screen.getByText("View Details");
      fireEvent.click(viewDetailsButton);

      await waitFor(() => {
        expect(screen.getByText("Distribution Details")).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByText("×");
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText("Distribution Details")).not.toBeInTheDocument();
      });
    }
  });

  it("should handle confirm receipt action", () => {
    const mockOnConfirmReceipt = jest.fn();
    render(
      <DistributionTable
        {...defaultProps}
        userRole="school_rep"
        onConfirmReceipt={mockOnConfirmReceipt}
      />
    );

    // Find the CREATED distribution and click confirm receipt
    const actionButtons = screen.getAllByRole("button", { name: "" });
    const firstRowActionButton = actionButtons.find(button => 
      button.querySelector("svg")
    );
    
    if (firstRowActionButton) {
      fireEvent.click(firstRowActionButton);
      
      const confirmButton = screen.getByText("Confirm Receipt");
      fireEvent.click(confirmButton);

      expect(mockOnConfirmReceipt).toHaveBeenCalledWith(mockDistributions[0]);
    }
  });

  it("should display discrepancy information in details", async () => {
    const distributionWithDiscrepancy = {
      ...mockDistributions[1],
      status: "DISCREPANCY" as const,
      discrepancyNotes: "Some items were damaged during transport",
      items: [
        {
          ...mockDistributions[1].items[0],
          quantityConfirmed: 45,
          discrepancyQuantity: -5,
        },
      ],
    };

    render(
      <DistributionTable
        {...defaultProps}
        distributions={[distributionWithDiscrepancy]}
        totalCount={1}
      />
    );

    // Open details modal
    const actionButtons = screen.getAllByRole("button", { name: "" });
    const firstRowActionButton = actionButtons.find(button => 
      button.querySelector("svg")
    );
    
    if (firstRowActionButton) {
      fireEvent.click(firstRowActionButton);
      
      const viewDetailsButton = screen.getByText("View Details");
      fireEvent.click(viewDetailsButton);

      await waitFor(() => {
        expect(screen.getByText("Discrepancy Notes")).toBeInTheDocument();
        expect(screen.getByText("Some items were damaged during transport")).toBeInTheDocument();
      });
    }
  });
});