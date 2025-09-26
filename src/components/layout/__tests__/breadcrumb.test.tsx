import React from "react";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { Breadcrumb, useBreadcrumb } from "../breadcrumb";
import { renderHook, act } from "@testing-library/react";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

// Mock Next.js Link
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe("Breadcrumb", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/dashboard");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders breadcrumb for dashboard path", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    render(<Breadcrumb />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("generates breadcrumbs from pathname", () => {
    mockUsePathname.mockReturnValue("/inventory/national");
    render(<Breadcrumb />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("TLM Management")).toBeInTheDocument();
    expect(screen.getByText("National Warehouses")).toBeInTheDocument();
  });

  it("renders custom breadcrumb items", () => {
    const customItems = [
      { label: "Home", href: "/dashboard" },
      { label: "Custom Page", href: "/custom" },
      { label: "Current Page" },
    ];

    render(<Breadcrumb items={customItems} />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Custom Page")).toBeInTheDocument();
    expect(screen.getByText("Current Page")).toBeInTheDocument();
  });

  it("makes last item non-clickable", () => {
    mockUsePathname.mockReturnValue("/inventory/national");
    render(<Breadcrumb />);

    const homeLink = screen.getByRole("link", { name: /home/i });
    expect(homeLink).toHaveAttribute("href", "/dashboard");

    const inventoryLink = screen.getByRole("link", { name: /tlm management/i });
    expect(inventoryLink).toHaveAttribute("href", "/inventory");

    // Last item should not be a link
    const nationalText = screen.getByText("National Warehouses");
    expect(nationalText.closest("a")).toBeNull();
  });

  it("renders chevron separators between items", () => {
    mockUsePathname.mockReturnValue("/inventory/national");
    const { container } = render(<Breadcrumb />);

    // Check for chevron icons by looking for SVG elements
    const chevrons = container.querySelectorAll("svg");

    // Should have chevrons between items (at least 2 for 3 breadcrumb items)
    expect(chevrons.length).toBeGreaterThan(1);
  });

  it("handles deep nested paths", () => {
    mockUsePathname.mockReturnValue("/admin/users/123/edit");
    render(<Breadcrumb />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("System Administration")).toBeInTheDocument();
    expect(screen.getByText("User Management")).toBeInTheDocument();
    expect(screen.getByText("123")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
  });

  it("capitalizes unknown route segments", () => {
    mockUsePathname.mockReturnValue("/unknown/path");
    render(<Breadcrumb />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Unknown")).toBeInTheDocument();
    expect(screen.getByText("Path")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    mockUsePathname.mockReturnValue("/inventory/national");
    const { container } = render(<Breadcrumb className="custom-class" />);

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders icons when provided in custom items", () => {
    const MockIcon = () => <span data-testid="mock-icon">Icon</span>;
    const customItems = [
      { label: "Home", href: "/dashboard", icon: MockIcon },
      { label: "Current Page" },
    ];

    render(<Breadcrumb items={customItems} />);

    expect(screen.getByTestId("mock-icon")).toBeInTheDocument();
  });
});

describe("useBreadcrumb hook", () => {
  it("manages custom breadcrumb items", () => {
    const { result } = renderHook(() => useBreadcrumb());

    expect(result.current.items).toEqual([]);

    const customItems = [
      { label: "Custom", href: "/custom" },
      { label: "Page" },
    ];

    act(() => {
      result.current.setBreadcrumb(customItems);
    });

    expect(result.current.items).toEqual(customItems);

    act(() => {
      result.current.clearBreadcrumb();
    });

    expect(result.current.items).toEqual([]);
  });

  it("updates breadcrumb items correctly", () => {
    const { result } = renderHook(() => useBreadcrumb());

    const items1 = [{ label: "First", href: "/first" }];
    const items2 = [{ label: "Second", href: "/second" }];

    act(() => {
      result.current.setBreadcrumb(items1);
    });

    expect(result.current.items).toEqual(items1);

    act(() => {
      result.current.setBreadcrumb(items2);
    });

    expect(result.current.items).toEqual(items2);
  });
});
