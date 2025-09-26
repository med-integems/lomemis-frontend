import { render, screen, fireEvent } from "@testing-library/react";
import {
  ResponsiveDashboardGrid,
  DashboardSection,
  ResponsiveDashboardLayout,
  DashboardWidget,
} from "../responsive-dashboard-grid";
import * as ResponsiveHook from "../../../hooks/useResponsive";

// Mock useResponsive hook
jest.mock("../../../hooks/useResponsive");
const mockUseResponsive = ResponsiveHook.useResponsive as jest.MockedFunction<
  typeof ResponsiveHook.useResponsive
>;

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

describe("ResponsiveDashboardGrid", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children in responsive grid", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    render(
      <ResponsiveDashboardGrid>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </ResponsiveDashboardGrid>
    );

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();
  });

  it("applies mobile spacing on mobile devices", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("mobile"));

    const { container } = render(
      <ResponsiveDashboardGrid spacing="md">
        <div>Item 1</div>
      </ResponsiveDashboardGrid>
    );

    const grid = container.firstChild as HTMLElement;
    expect(grid).toHaveClass("gap-4");
  });

  it("applies desktop spacing on desktop devices", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    const { container } = render(
      <ResponsiveDashboardGrid spacing="md">
        <div>Item 1</div>
      </ResponsiveDashboardGrid>
    );

    const grid = container.firstChild as HTMLElement;
    expect(grid).toHaveClass("gap-6");
  });
});

describe("DashboardSection", () => {
  it("renders title and description", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    render(
      <DashboardSection
        title="Test Section"
        description="This is a test section"
      >
        <div>Section content</div>
      </DashboardSection>
    );

    expect(screen.getByText("Test Section")).toBeInTheDocument();
    expect(screen.getByText("This is a test section")).toBeInTheDocument();
    expect(screen.getByText("Section content")).toBeInTheDocument();
  });

  it("renders actions when provided", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    render(
      <DashboardSection
        title="Test Section"
        actions={<button>Action Button</button>}
      >
        <div>Section content</div>
      </DashboardSection>
    );

    expect(screen.getByText("Action Button")).toBeInTheDocument();
  });

  it("handles collapsible sections correctly", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    render(
      <DashboardSection
        title="Collapsible Section"
        collapsible={true}
      >
        <div>Collapsible content</div>
      </DashboardSection>
    );

    const content = screen.getByText("Collapsible content");
    expect(content).toBeInTheDocument();

    // Find and click the collapse button
    const collapseButton = screen.getByLabelText(/collapse section/i);
    fireEvent.click(collapseButton);

    // After clicking, the button should change to "expand"
    expect(screen.getByLabelText(/expand section/i)).toBeInTheDocument();
  });

  it("starts collapsed when defaultCollapsed is true", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    render(
      <DashboardSection
        title="Collapsed Section"
        collapsible={true}
        defaultCollapsed={true}
      >
        <div>Hidden content</div>
      </DashboardSection>
    );

    // The expand button should be present
    expect(screen.getByLabelText(/expand section/i)).toBeInTheDocument();
  });
});

describe("ResponsiveDashboardLayout", () => {
  it("renders main content", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    render(
      <ResponsiveDashboardLayout>
        <div>Main content</div>
      </ResponsiveDashboardLayout>
    );

    expect(screen.getByText("Main content")).toBeInTheDocument();
  });

  it("renders header when provided", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    render(
      <ResponsiveDashboardLayout
        header={<div>Dashboard Header</div>}
      >
        <div>Main content</div>
      </ResponsiveDashboardLayout>
    );

    expect(screen.getByText("Dashboard Header")).toBeInTheDocument();
    expect(screen.getByText("Main content")).toBeInTheDocument();
  });

  it("renders sidebar when provided", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    render(
      <ResponsiveDashboardLayout
        sidebar={<div>Dashboard Sidebar</div>}
      >
        <div>Main content</div>
      </ResponsiveDashboardLayout>
    );

    expect(screen.getByText("Dashboard Sidebar")).toBeInTheDocument();
    expect(screen.getByText("Main content")).toBeInTheDocument();
  });

  it("uses column layout on mobile with sidebar", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("mobile"));

    const { container } = render(
      <ResponsiveDashboardLayout
        sidebar={<div>Sidebar</div>}
      >
        <div>Content</div>
      </ResponsiveDashboardLayout>
    );

    // Should have flex-col class for mobile layout
    const flexContainer = container.querySelector(".flex");
    expect(flexContainer).toHaveClass("flex-col");
  });
});

describe("DashboardWidget", () => {
  it("renders children content", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    render(
      <DashboardWidget>
        <div>Widget content</div>
      </DashboardWidget>
    );

    expect(screen.getByText("Widget content")).toBeInTheDocument();
  });

  it("renders title and description when provided", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    render(
      <DashboardWidget
        title="Widget Title"
        description="Widget description"
      >
        <div>Widget content</div>
      </DashboardWidget>
    );

    expect(screen.getByText("Widget Title")).toBeInTheDocument();
    expect(screen.getByText("Widget description")).toBeInTheDocument();
  });

  it("renders actions when provided", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    render(
      <DashboardWidget
        title="Widget"
        actions={<button>Widget Action</button>}
      >
        <div>Widget content</div>
      </DashboardWidget>
    );

    expect(screen.getByText("Widget Action")).toBeInTheDocument();
  });

  it("shows error state correctly", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    render(
      <DashboardWidget
        error="Something went wrong"
      >
        <div>Widget content</div>
      </DashboardWidget>
    );

    expect(screen.getByText("Error loading widget")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    // Widget content should not be rendered when there's an error
    expect(screen.queryByText("Widget content")).not.toBeInTheDocument();
  });

  it("applies loading state correctly", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    const { container } = render(
      <DashboardWidget loading={true}>
        <div>Widget content</div>
      </DashboardWidget>
    );

    // Should have opacity and pointer-events classes for loading state
    const contentContainer = container.querySelector(".opacity-60");
    expect(contentContainer).toBeInTheDocument();
    expect(contentContainer).toHaveClass("pointer-events-none");
  });

  it("applies responsive text sizing on mobile", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("mobile"));

    render(
      <DashboardWidget
        title="Mobile Widget"
        description="Mobile description"
      >
        <div>Content</div>
      </DashboardWidget>
    );

    const title = screen.getByText("Mobile Widget");
    const description = screen.getByText("Mobile description");
    
    expect(title).toHaveClass("text-lg");
    expect(description).toHaveClass("text-xs");
  });
});