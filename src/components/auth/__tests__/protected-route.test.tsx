import { render, screen } from "@testing-library/react";
import { ProtectedRoute } from "../protected-route";
import { User, UserRole } from "@/types";

// Mock the auth context
const mockUser: User = {
  id: 1,
  name: "Test User",
  email: "test@example.com",
  role: "national_manager",
  isActive: true,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

const mockUseAuth = jest.fn();
jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("ProtectedRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading spinner when authentication is loading", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("renders children when user is authenticated and has no role restrictions", () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("renders children when user has required role", () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
    });

    render(
      <ProtectedRoute allowedRoles={["national_manager", "super_admin"]}>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("shows access denied when user does not have required role", () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
    });

    render(
      <ProtectedRoute allowedRoles={["super_admin"]}>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Access Denied")).toBeInTheDocument();
    expect(
      screen.getByText("You don't have permission to access this page.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("does not render children when user is not authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("renders children when requireAuth is false and user is not authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
    });

    render(
      <ProtectedRoute requireAuth={false}>
        <div>Public Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Public Content")).toBeInTheDocument();
  });
});
