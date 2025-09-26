import { render, screen } from "@testing-library/react";
import { MVPDashboard } from "../mvp-dashboard";
import * as ResponsiveHook from "../../../hooks/useResponsive";
import * as UserHook from "../../../hooks/useUser";

// Mock the hooks
jest.mock("../../../hooks/useResponsive");
jest.mock("../../../hooks/useUser");
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(() => "last30"),
    toString: jest.fn(() => ""),
  }),
}));

// Mock API
jest.mock("../../../lib/api", () => ({
  get: jest.fn().mockResolvedValue({
    data: {
      success: true,
      data: {
        role: "admin",
        kpis: [],
        lists: {},
        alerts: [],
        links: [],
      },
    },
  }),
}));

const mockUseResponsive = ResponsiveHook.useResponsive as jest.MockedFunction<
  typeof ResponsiveHook.useResponsive
>;

const mockUseUser = UserHook.useUser as jest.MockedFunction<
  typeof UserHook.useUser
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
  useResponsiveGrid: () => ({
    getGridColumns: () => ({ mobile: 1, tablet: 2, desktop: 3 }),
  }),
});

describe("MVPDashboard Responsive", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUser.mockReturnValue({
      user: { id: 1, name: "Test User", role: "admin" },
      loading: false,
      error: null,
    });
  });

  it("renders dashboard on mobile device", async () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("mobile"));

    render(<MVPDashboard />);
    
    // Should render loading skeleton initially
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders dashboard on desktop device", async () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    render(<MVPDashboard />);
    
    // Should render loading skeleton initially
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("shows mobile filter button on mobile devices", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("mobile"));

    render(<MVPDashboard />);
    
    // Mobile filter button should be present
    expect(screen.getByText("Filters")).toBeInTheDocument();
  });

  it("hides mobile filter button on desktop devices", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    render(<MVPDashboard />);
    
    // Mobile filter button should not be visible on desktop
    const filtersButton = screen.queryByText("Filters");
    if (filtersButton) {
      expect(filtersButton).toHaveClass("lg:hidden");
    }
  });

  it("shows loading state correctly", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));
    mockUseUser.mockReturnValue({
      user: null,
      loading: true,
      error: null,
    });

    render(<MVPDashboard />);
    
    // Should show skeleton loading state
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows error state correctly", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));
    mockUseUser.mockReturnValue({
      user: null,
      loading: false,
      error: new Error("Test error"),
    });

    render(<MVPDashboard />);
    
    // Should show error message
    expect(screen.getByText("Error Loading Dashboard")).toBeInTheDocument();
  });
});