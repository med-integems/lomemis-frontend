import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "../app-sidebar";
import { useAuth } from "@/contexts/auth-context";
import { SidebarProvider } from "@/components/ui/sidebar";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

// Mock auth context
jest.mock("@/contexts/auth-context", () => ({
  useAuth: jest.fn(),
}));

// Mock the entire sidebar module
jest.mock("@/components/ui/sidebar", () => ({
  Sidebar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar">{children}</div>
  ),
  SidebarContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-content">{children}</div>
  ),
  SidebarFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-footer">{children}</div>
  ),
  SidebarHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-header">{children}</div>
  ),
  SidebarMenu: ({ children }: { children: React.ReactNode }) => (
    <ul data-testid="sidebar-menu">{children}</ul>
  ),
  SidebarMenuButton: ({
    children,
    onClick,
    tooltip,
    isActive,
    asChild,
    ...props
  }: any) => {
    const Component = asChild ? "div" : "button";
    return (
      <Component onClick={onClick} data-active={isActive} {...props}>
        {children}
      </Component>
    );
  },
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => (
    <li data-testid="sidebar-menu-item">{children}</li>
  ),
  SidebarMenuSub: ({ children }: { children: React.ReactNode }) => (
    <ul data-testid="sidebar-menu-sub">{children}</ul>
  ),
  SidebarMenuSubButton: ({ children, asChild, isActive, ...props }: any) => {
    const Component = asChild ? "div" : "button";
    return (
      <Component data-active={isActive} {...props}>
        {children}
      </Component>
    );
  },
  SidebarMenuSubItem: ({ children }: { children: React.ReactNode }) => (
    <li data-testid="sidebar-menu-sub-item">{children}</li>
  ),
  SidebarRail: () => <div data-testid="sidebar-rail" />,
  SidebarProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-provider">{children}</div>
  ),
  useSidebar: () => ({
    state: "expanded",
    open: true,
    setOpen: jest.fn(),
    openMobile: false,
    setOpenMobile: jest.fn(),
    isMobile: false,
    toggleSidebar: jest.fn(),
  }),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const renderWithProvider = (component: React.ReactElement) => {
  return render(component);
};

describe("AppSidebar", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/dashboard");
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        role: "super_admin",
        isActive: true,
        createdAt: "2025-01-01",
        updatedAt: "2025-01-01",
      },
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the sidebar with logo and title", () => {
    renderWithProvider(<AppSidebar />);

    expect(screen.getByText("LoMEMIS")).toBeInTheDocument();
    expect(screen.getByText("Government of Sierra Leone")).toBeInTheDocument();
  });

  it("shows all navigation items for super admin", () => {
    renderWithProvider(<AppSidebar />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("TLM Management")).toBeInTheDocument();
    expect(screen.getByText("Shipments")).toBeInTheDocument();
    expect(screen.getByText("Distributions")).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.getByText("System Administration")).toBeInTheDocument();
  });

  it("filters navigation items based on user role", () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        name: "LC Officer",
        email: "lc@example.com",
        role: "lc_officer",
        isActive: true,
        createdAt: "2025-01-01",
        updatedAt: "2025-01-01",
      },
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
    });

    renderWithProvider(<AppSidebar />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("TLM Management")).toBeInTheDocument();
    expect(screen.getByText("Shipments")).toBeInTheDocument();
    expect(screen.getByText("Distributions")).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.queryByText("System Administration")).not.toBeInTheDocument();
  });

  it("highlights active navigation item", () => {
    mockUsePathname.mockReturnValue("/warehouse/shipments");
    renderWithProvider(<AppSidebar />);

    const shipmentsLink = screen.getByRole("link", { name: /shipments/i });
    expect(shipmentsLink).toHaveAttribute("href", "/warehouse/shipments");
  });

  it("expands and collapses submenu items", async () => {
    renderWithProvider(<AppSidebar />);

    const tlmManagementButton = screen.getByText("TLM Management");
    fireEvent.click(tlmManagementButton);

    await waitFor(() => {
      expect(screen.getByText("National Warehouses")).toBeInTheDocument();
      expect(screen.getByText("Local Councils")).toBeInTheDocument();
    });

    // Click again to collapse
    fireEvent.click(tlmManagementButton);

    await waitFor(() => {
      expect(screen.queryByText("National Warehouses")).not.toBeInTheDocument();
      expect(screen.queryByText("Local Councils")).not.toBeInTheDocument();
    });
  });

  it("shows submenu items based on user role", async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        name: "National Manager",
        email: "national@example.com",
        role: "national_manager",
        isActive: true,
        createdAt: "2025-01-01",
        updatedAt: "2025-01-01",
      },
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
    });

    renderWithProvider(<AppSidebar />);

    const tlmManagementButton = screen.getByText("TLM Management");
    fireEvent.click(tlmManagementButton);

    await waitFor(() => {
      expect(screen.getByText("National Warehouses")).toBeInTheDocument();
      expect(screen.queryByText("Local Councils")).not.toBeInTheDocument();
    });
  });

  it("renders footer with version information", () => {
    renderWithProvider(<AppSidebar />);

    expect(screen.getByText("Version 1.0.0")).toBeInTheDocument();
    expect(
      screen.getByText("© 2025 Government of Sierra Leone")
    ).toBeInTheDocument();
  });

  it("handles view-only user role", () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        name: "View Only User",
        email: "view@example.com",
        role: "view_only",
        isActive: true,
        createdAt: "2025-01-01",
        updatedAt: "2025-01-01",
      },
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
    });

    renderWithProvider(<AppSidebar />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.queryByText("TLM Management")).not.toBeInTheDocument();
    expect(screen.queryByText("Shipments")).not.toBeInTheDocument();
    expect(screen.queryByText("Distributions")).not.toBeInTheDocument();
    expect(screen.queryByText("System Administration")).not.toBeInTheDocument();
  });
});
