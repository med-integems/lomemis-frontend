import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Header } from "../header";
import { useAuth } from "@/contexts/auth-context";
import { SidebarProvider } from "@/components/ui/sidebar";

// Mock auth context
jest.mock("@/contexts/auth-context", () => ({
  useAuth: jest.fn(),
}));

// Mock Next.js Link
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock sidebar hook
jest.mock("@/components/ui/sidebar", () => ({
  ...jest.requireActual("@/components/ui/sidebar"),
  useSidebar: () => ({
    isMobile: false,
    toggleSidebar: jest.fn(),
  }),
  SidebarTrigger: ({ onClick }: { onClick?: () => void }) => (
    <button onClick={onClick}>Toggle Sidebar</button>
  ),
}));

const renderWithProvider = (component: React.ReactElement) => {
  return render(component);
};

describe("Header", () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        name: "John Doe",
        email: "john.doe@gov.sl",
        role: "super_admin",
        isActive: true,
        createdAt: "2025-01-01",
        updatedAt: "2025-01-01",
      },
      isLoading: false,
      login: jest.fn(),
      logout: mockLogout,
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the header with title and user info", () => {
    renderWithProvider(<Header />);

    expect(
      screen.getByText("Teaching and Learning Materials Management")
    ).toBeInTheDocument();
    expect(screen.getByText("Government of Sierra Leone")).toBeInTheDocument();
  });

  it("shows mobile title on small screens", () => {
    renderWithProvider(<Header />);

    expect(screen.getByText("LoMEMIS")).toBeInTheDocument();
  });

  it("displays user information in dropdown", async () => {
    renderWithProvider(<Header />);

    const userButton = screen.getByRole("button", { name: /john doe/i });
    fireEvent.click(userButton);

    await waitFor(() => {
      expect(screen.getByText("john.doe@gov.sl")).toBeInTheDocument();
      expect(screen.getByText("System Administrator")).toBeInTheDocument();
    });
  });

  it("shows correct role display names", async () => {
    const testCases = [
      { role: "super_admin", display: "System Administrator" },
      { role: "national_manager", display: "National Warehouse Manager" },
      { role: "lc_officer", display: "Local Council Officer" },
      { role: "school_rep", display: "School Representative" },
      { role: "view_only", display: "View Only User" },
    ];

    for (const testCase of testCases) {
      mockUseAuth.mockReturnValue({
        user: {
          id: 1,
          name: "Test User",
          email: "test@example.com",
          role: testCase.role as any,
          isActive: true,
          createdAt: "2025-01-01",
          updatedAt: "2025-01-01",
        },
        isLoading: false,
        login: jest.fn(),
        logout: mockLogout,
        updateProfile: jest.fn(),
        changePassword: jest.fn(),
      });

      const { rerender } = renderWithProvider(<Header />);

      const userButton = screen.getByRole("button");
      fireEvent.click(userButton);

      await waitFor(() => {
        expect(screen.getByText(testCase.display)).toBeInTheDocument();
      });

      rerender(<div />); // Clear the component
    }
  });

  it("handles logout when sign out is clicked", async () => {
    renderWithProvider(<Header />);

    const userButton = screen.getByRole("button", { name: /john doe/i });
    fireEvent.click(userButton);

    await waitFor(() => {
      const signOutButton = screen.getByText("Sign Out");
      fireEvent.click(signOutButton);
    });

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("renders notification button with badge", () => {
    renderWithProvider(<Header />);

    const notificationButton = screen.getByRole("button", {
      name: /notifications/i,
    });
    expect(notificationButton).toBeInTheDocument();

    // Check for notification badge
    const badge = notificationButton.querySelector(".bg-destructive");
    expect(badge).toBeInTheDocument();
  });

  it("renders settings button on desktop", () => {
    renderWithProvider(<Header />);

    const settingsButtons = screen.getAllByRole("button", {
      name: /settings/i,
    });
    expect(settingsButtons.length).toBeGreaterThan(0);
  });

  it("includes profile and settings links in dropdown", async () => {
    renderWithProvider(<Header />);

    const userButton = screen.getByRole("button", { name: /john doe/i });
    fireEvent.click(userButton);

    await waitFor(() => {
      const profileLinks = screen.getAllByText("Profile");
      const settingsLinks = screen.getAllByText("Settings");

      expect(profileLinks.length).toBeGreaterThan(0);
      expect(settingsLinks.length).toBeGreaterThan(0);
    });
  });

  it("handles missing user gracefully", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      login: jest.fn(),
      logout: mockLogout,
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
    });

    renderWithProvider(<Header />);

    expect(screen.getByText("User")).toBeInTheDocument();
  });
});
