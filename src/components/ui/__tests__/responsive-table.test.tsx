import { render, screen, fireEvent } from "@testing-library/react";
import { ResponsiveTable, ResponsiveColumn } from "../responsive-table";
import * as ResponsiveHook from "../../../hooks/useResponsive";

// Mock useResponsive hook
jest.mock("../../../hooks/useResponsive");
const mockUseResponsive = ResponsiveHook.useResponsive as jest.MockedFunction<
  typeof ResponsiveHook.useResponsive
>;

interface TestData {
  id: number;
  name: string;
  status: string;
  value: number;
}

const testData: TestData[] = [
  { id: 1, name: "Item 1", status: "active", value: 100 },
  { id: 2, name: "Item 2", status: "inactive", value: 200 },
  { id: 3, name: "Item 3", status: "active", value: 300 },
];

const testColumns: ResponsiveColumn<TestData>[] = [
  {
    key: "name",
    header: "Name",
    priority: 1,
    mobileVisible: true,
    tabletVisible: true,
    desktopVisible: true,
  },
  {
    key: "status",
    header: "Status",
    priority: 2,
    mobileVisible: true,
    tabletVisible: true,
    desktopVisible: true,
  },
  {
    key: "value",
    header: "Value",
    priority: 3,
    align: "right",
    mobileVisible: false,
    tabletVisible: true,
    desktopVisible: true,
  },
];

const mockResponsiveReturn = (deviceType: "mobile" | "tablet" | "desktop") => ({
  width: deviceType === "mobile" ? 375 : deviceType === "tablet" ? 768 : 1440,
  height: 667,
  isMobile: deviceType === "mobile",
  isTablet: deviceType === "tablet",
  isDesktop: deviceType === "desktop",
  deviceType,
  orientation: "portrait" as const,
  isLandscape: false,
  isPortrait: true,
  isTouchDevice: deviceType !== "desktop",
});

describe("ResponsiveTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders mobile card view correctly", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("mobile"));

    render(
      <ResponsiveTable
        data={testData}
        columns={testColumns}
        mobileCardView={true}
      />
    );

    // Should render cards instead of table
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    
    // Should show all items as cards
    testData.forEach((item) => {
      expect(screen.getByText(item.name)).toBeInTheDocument();
      expect(screen.getByText(item.status)).toBeInTheDocument();
    });

    // Value column should not be visible on mobile
    testData.forEach((item) => {
      expect(screen.queryByText(item.value.toString())).not.toBeInTheDocument();
    });
  });

  it("renders desktop table view correctly", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    render(
      <ResponsiveTable
        data={testData}
        columns={testColumns}
        mobileCardView={true}
      />
    );

    // Should render table
    expect(screen.getByRole("table")).toBeInTheDocument();
    
    // Should show all columns
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Value")).toBeInTheDocument();

    // Should show all data
    testData.forEach((item) => {
      expect(screen.getByText(item.name)).toBeInTheDocument();
      expect(screen.getByText(item.status)).toBeInTheDocument();
      expect(screen.getByText(item.value.toString())).toBeInTheDocument();
    });
  });

  it("handles loading state correctly", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    render(
      <ResponsiveTable
        data={[]}
        columns={testColumns}
        loading={true}
      />
    );

    // Should show skeleton loading state
    expect(screen.getByRole("table")).toBeInTheDocument();
    
    // Should not show actual data
    testData.forEach((item) => {
      expect(screen.queryByText(item.name)).not.toBeInTheDocument();
    });
  });

  it("handles empty data correctly", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    render(
      <ResponsiveTable
        data={[]}
        columns={testColumns}
        emptyMessage="No items found"
      />
    );

    expect(screen.getByText("No items found")).toBeInTheDocument();
  });

  it("handles row clicks correctly", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));
    const mockOnRowClick = jest.fn();

    render(
      <ResponsiveTable
        data={testData}
        columns={testColumns}
        onRowClick={mockOnRowClick}
      />
    );

    // Click on first row
    const firstRow = screen.getByText("Item 1").closest("tr");
    expect(firstRow).toBeInTheDocument();
    
    if (firstRow) {
      fireEvent.click(firstRow);
      expect(mockOnRowClick).toHaveBeenCalledWith(testData[0], 0);
    }
  });

  it("shows pagination when enabled", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));
    const mockOnPageChange = jest.fn();

    render(
      <ResponsiveTable
        data={testData}
        columns={testColumns}
        showPagination={true}
        currentPage={1}
        totalPages={3}
        onPageChange={mockOnPageChange}
        total={100}
        pageSize={50}
      />
    );

    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
  });

  it("filters columns based on device type", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("tablet"));

    render(
      <ResponsiveTable
        data={testData}
        columns={testColumns}
      />
    );

    // Should show Name and Status (tablet visible)
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    
    // Should show Value (tablet visible)
    expect(screen.getByText("Value")).toBeInTheDocument();
  });
});