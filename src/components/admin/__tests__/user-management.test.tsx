import React from "react";
import { render, screen } from "@testing-library/react";
import { jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserManagement } from "../user-management";
import { useUsers } from "@/hooks/useUsers";
import { useUser } from "@/hooks/useUser";

// Mock the hooks
jest.mock("@/hooks/useUsers", () => ({
  useUsers: jest.fn(),
}));

jest.mock("@/hooks/useUser", () => ({
  useUser: jest.fn(),
}));

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUsers = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: "lc_officer" as const,
    councilId: 1,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

describe("UserManagement", () => {
  const mockUseUsers = useUsers as jest.MockedFunction<typeof useUsers>;
  const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;

  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockUseUser.mockReturnValue({
      user: {
        id: 1,
        name: "Admin User",
        email: "admin@lomemis.gov.sl",
        role: "super_admin",
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      loading: false,
      error: null,
    });

    mockUseUsers.mockReturnValue({
      data: {
        data: mockUsers,
        total: 1,
        page: 1,
        limit: 10,
      },
      isLoading: false,
      error: null,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it("should render user management interface for super admin", () => {
    renderWithQueryClient(<UserManagement />);

    expect(screen.getByText("User Management")).toBeInTheDocument();
    expect(screen.getByText("Create User")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "User List" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Search & Filter" })).toBeInTheDocument();
  });

  it("should deny access for non-admin users", () => {
    mockUseUser.mockReturnValue({
      user: {
        id: 2,
        name: "Regular User",
        email: "user@example.com",
        role: "lc_officer",
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      loading: false,
      error: null,
    });

    renderWithQueryClient(<UserManagement />);

    expect(screen.getByText("You don't have permission to access user management.")).toBeInTheDocument();
    expect(screen.queryByText("Create User")).not.toBeInTheDocument();
  });

  it("should show loading state", () => {
    mockUseUsers.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    renderWithQueryClient(<UserManagement />);

    expect(screen.getByText("User Management")).toBeInTheDocument();
  });
});