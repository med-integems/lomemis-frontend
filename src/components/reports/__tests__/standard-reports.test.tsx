import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StandardReports } from "../standard-reports";

const mockOnGenerateReport = jest.fn();
const mockOnDownloadReport = jest.fn();

describe("StandardReports", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all standard reports for super admin", () => {
    render(
      <StandardReports
        userRole="super_admin"
        onGenerateReport={mockOnGenerateReport}
        onDownloadReport={mockOnDownloadReport}
      />
    );

    // Should show all reports for super admin
    expect(screen.getByText("National Inventory Summary")).toBeInTheDocument();
    expect(screen.getByText("Shipment History Report")).toBeInTheDocument();
    expect(screen.getByText("Local Council Stock Levels")).toBeInTheDocument();
    expect(screen.getByText("Distribution by School")).toBeInTheDocument();
    expect(screen.getByText("User Activity Report")).toBeInTheDocument();
    expect(
      screen.getByText("Inventory Movement Analytics")
    ).toBeInTheDocument();
  });

  it("filters reports based on user role", () => {
    render(
      <StandardReports
        userRole="school_rep"
        onGenerateReport={mockOnGenerateReport}
        onDownloadReport={mockOnDownloadReport}
      />
    );

    // School representatives should not see any reports based on current configuration
    expect(screen.getByText("No reports available")).toBeInTheDocument();
    expect(
      screen.getByText(
        "You don't have access to any reports with your current role."
      )
    ).toBeInTheDocument();
  });

  it("shows category filters with correct counts", () => {
    render(
      <StandardReports
        userRole="super_admin"
        onGenerateReport={mockOnGenerateReport}
        onDownloadReport={mockOnDownloadReport}
      />
    );

    // Check category filter buttons
    expect(screen.getByText("All Reports")).toBeInTheDocument();
    expect(screen.getByText("Inventory")).toBeInTheDocument();
    expect(screen.getByText("Shipments")).toBeInTheDocument();
    expect(screen.getByText("Distributions")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
  });

  it("filters reports by category", async () => {
    render(
      <StandardReports
        userRole="super_admin"
        onGenerateReport={mockOnGenerateReport}
        onDownloadReport={mockOnDownloadReport}
      />
    );

    // Click on Inventory category
    fireEvent.click(screen.getByText("Inventory"));

    // Should only show inventory reports
    expect(screen.getByText("National Inventory Summary")).toBeInTheDocument();
    expect(screen.getByText("Local Council Stock Levels")).toBeInTheDocument();

    // Should not show non-inventory reports
    expect(screen.queryByText("User Activity Report")).not.toBeInTheDocument();
  });

  it("calls onGenerateReport when generate button is clicked", async () => {
    render(
      <StandardReports
        userRole="super_admin"
        onGenerateReport={mockOnGenerateReport}
        onDownloadReport={mockOnDownloadReport}
      />
    );

    // Find and click a generate button
    const generateButtons = screen.getAllByText("Generate");
    fireEvent.click(generateButtons[0]);

    expect(mockOnGenerateReport).toHaveBeenCalledWith("national-inventory");
  });

  it("calls onDownloadReport when download button is clicked", async () => {
    render(
      <StandardReports
        userRole="super_admin"
        onGenerateReport={mockOnGenerateReport}
        onDownloadReport={mockOnDownloadReport}
      />
    );

    // Find and click a download button (represented by Download icon)
    const downloadButtons = screen.getAllByRole("button");
    const downloadButton = downloadButtons.find((button) =>
      button.querySelector("svg")?.classList.contains("lucide-download")
    );

    if (downloadButton) {
      fireEvent.click(downloadButton);
      expect(mockOnDownloadReport).toHaveBeenCalled();
    }
  });

  it("shows generating state correctly", () => {
    render(
      <StandardReports
        userRole="super_admin"
        onGenerateReport={mockOnGenerateReport}
        onDownloadReport={mockOnDownloadReport}
        isGenerating="national-inventory"
      />
    );

    // Should show generating state for the specific report
    expect(screen.getByText("Generating...")).toBeInTheDocument();

    // Generate button should be disabled
    const generateButton = screen.getByText("Generating...").closest("button");
    expect(generateButton).toBeDisabled();
  });

  it("displays report metadata correctly", () => {
    render(
      <StandardReports
        userRole="super_admin"
        onGenerateReport={mockOnGenerateReport}
        onDownloadReport={mockOnDownloadReport}
      />
    );

    // Check for frequency badges (there are multiple of each)
    expect(screen.getAllByText("daily")).toHaveLength(2);
    expect(screen.getAllByText("weekly")).toHaveLength(2);
    expect(screen.getAllByText("monthly")).toHaveLength(2);

    // Check for category badges (there are multiple of each)
    expect(screen.getAllByText("inventory")).toHaveLength(2);
    expect(screen.getByText("shipments")).toBeInTheDocument();
    expect(screen.getByText("distributions")).toBeInTheDocument();
  });

  it("shows last generated timestamps", () => {
    render(
      <StandardReports
        userRole="super_admin"
        onGenerateReport={mockOnGenerateReport}
        onDownloadReport={mockOnDownloadReport}
      />
    );

    // Should show "Last generated:" text
    expect(screen.getAllByText(/Last generated:/)).toHaveLength(6);
  });

  it("shows file sizes for generated reports", () => {
    render(
      <StandardReports
        userRole="super_admin"
        onGenerateReport={mockOnGenerateReport}
        onDownloadReport={mockOnDownloadReport}
      />
    );

    // Should show file sizes
    expect(screen.getByText("File size: 2.3 MB")).toBeInTheDocument();
    expect(screen.getByText("File size: 1.8 MB")).toBeInTheDocument();
  });
});
