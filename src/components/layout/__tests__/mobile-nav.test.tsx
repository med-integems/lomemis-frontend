import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { MobileNav } from "../mobile-nav";
import { useAuth } from "@/contexts/auth-context";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

// Mock auth context
jest.mock("@/contexts/auth-context", () => ({
  useAuth: jest.fn(),
}));

// Mock Next.js Link
jest.mock("next/link", () => {
  return ({
    children,
    href,
    onClick,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  );
});

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe("MobileNav", () => {
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

  it("renders mobile navigation trigger button", () => {
    render(<MobileNav />);

    const triggerButton = screen.getByRole("button", {
      name: /toggle navigation menu/i,
    });
    expect(triggerButton).toBeInTheDocument();
  });

  it("opens navigation sheet when trigger is clicked", async () => {
    render(<MobileNav />);

    const triggerButton = screen.getByRole("button", {
      name: /toggle navigation menu/i,
    });
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText("LoMEMIS")).toBeInTheDocument();
      expect(
        screen.getByText("Government of Sierra Leone")
      ).toBeInTheDocument();
    });
  });

  it("shows navigation items based on user role", async () => {
    render(<MobileNav />);

    const triggerButton = screen.getByRole("button", {
      name: /toggle navigation menu/i,
    });
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("TLM Management")).toBeInTheDocument();
      expect(screen.getByText("Shipments")).toBeInTheDocument();
      expect(screen.getByText("Distributions")).toBeInTheDocument();
      expect(screen.getByText("Reports")).toBeInTheDocument();
      expect(screen.getByText("System Administration")).toBeInTheDocument();
    });
  });

  it("filters navigation items for non-admin users", async () => {
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

    render(<MobileNav />);

    const triggerButton = screen.getByRole("button", {
      name: /toggle navigation menu/i,
    });
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("TLM Management")).toBeInTheDocument();
      expect(screen.getByText("Shipments")).toBeInTheDocument();
      expect(screen.getByText("Distributions")).toBeInTheDocument();
      expect(screen.getByText("Reports")).toBeInTheDocument();
      expect(
        screen.queryByText("System Administration")
      ).not.toBeInTheDocument();
    });
  });

  it("expands and collapses submenu items", async () => {
    render(<MobileNav />);

    const triggerButton = screen.getByRole("button", {
      name: /toggle navigation menu/i,
    });
    fireEvent.click(triggerButton);

    await waitFor(() => {
      const tlmButton = screen.getByText("TLM Management");
      fireEvent.click(tlmButton);
    });

    await waitFor(() => {
      expect(screen.getByText("National Warehouses")).toBeInTheDocument();
      expect(screen.getByText("Local Councils")).toBeInTheDocument();
    });

    // Click again to collapse
    const tlmButton = screen.getByText("TLM Management");
    fireEvent.click(tlmButton);

    await waitFor(() => {
      expect(screen.queryByText("National Warehouses")).not.toBeInTheDocument();
      expect(screen.queryByText("Local Councils")).not.toBeInTheDocument();
    });
  });

  it("highlights active navigation items", async () => {
    mockUsePathname.mockReturnValue("/warehouse/shipments");
    render(<MobileNav />);

    const triggerButton = screen.getByRole("button", {
      name: /toggle navigation menu/i,
    });
    fireEvent.click(triggerButton);

    await waitFor(() => {
      const shipmentsButton = screen.getByRole("link", { name: /shipments/i });
      expect(shipmentsButton).toHaveAttribute("href", "/warehouse/shipments");
    });
  });

  it("closes navigation when link is clicked", async () => {
    render(<MobileNav />);

    const triggerButton = screen.getByRole("button", {
      name: /toggle navigation menu/i,
    });
    fireEvent.click(triggerButton);

    await waitFor(() => {
      const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      fireEvent.click(dashboardLink);
    });

    // The sheet should close (navigation items should not be visible)
    await waitFor(() => {
      expect(screen.queryByText("TLM Management")).not.toBeInTheDocument();
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

    render(<MobileNav />);

    const triggerButton = screen.getByRole("button", {
      name: /toggle navigation menu/i,
    });
    fireEvent.click(triggerButton);

    await waitFor(() => {
      const tlmButton = screen.getByText("TLM Management");
      fireEvent.click(tlmButton);
    });

    await waitFor(() => {
      expect(screen.getByText("National Warehouses")).toBeInTheDocument();
      expect(screen.queryByText("Local Councils")).not.toBeInTheDocument();
    });
  });

  it("renders footer with version information", async () => {
    render(<MobileNav />);

    const triggerButton = screen.getByRole("button", {
      name: /toggle navigation menu/i,
    });
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText("Version 1.0.0")).toBeInTheDocument();
      expect(
        screen.getByText("© 2025 Government of Sierra Leone")
      ).toBeInTheDocument();
    });
  });

  it("applies custom className", () => {
    const { container } = render(<MobileNav className="custom-class" />);

    const triggerButton = container.querySelector("button");
    expect(triggerButton).toHaveClass("custom-class");
  });

  it("handles view-only user role", async () => {
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

    render(<MobileNav />);

    const triggerButton = screen.getByRole("button", {
      name: /toggle navigation menu/i,
    });
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Reports")).toBeInTheDocument();
      expect(screen.queryByText("TLM Management")).not.toBeInTheDocument();
      expect(screen.queryByText("Shipments")).not.toBeInTheDocument();
      expect(screen.queryByText("Distributions")).not.toBeInTheDocument();
      expect(
        screen.queryByText("System Administration")
      ).not.toBeInTheDocument();
    });
  });
});
