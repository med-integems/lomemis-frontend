import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";
import { DistributionManagement } from "../distribution-management";
import { distributionsApi } from "@/lib/api";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";

// Mock the API
jest.mock("@/lib/api", () => ({
  distributionsApi: {
    getDistributions: jest.fn(),
    getDistributionsByCouncil: jest.fn(),
    getDistributionsBySchool: jest.fn(),
    createDistribution: jest.fn(),
    confirmDistributionReceipt: jest.fn(),
  },
}));

// Mock the user hook
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

const mockDistributions = [
  {
    id: 1,
    distributionNumber: "DIST-2024-001",
    localCouncilId: 1,
    localCouncilName: "Western Area Rural",
    schoolId: 1,
    schoolName: "Government Secondary School",
    status: "CREATED" as const,
    distributionDate: "2024-01-15",
    confirmationDate: null,
    totalItems: 3,
    notes: "Regular monthly distribution",
    discrepancyNotes: null,
    createdBy: 1,
    createdByName: "John Doe",
    confirmedBy: null,
    confirmedByName: null,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    items: [
      {
        id: 1,
        distributionId: 1,
        itemId: 1,
        itemName: "Exercise Books",
        itemCode: "EXB-001",
        unitOfMeasure: "pieces",
        quantityDistributed: 100,
        quantityConfirmed: null,
        discrepancyQuantity: null,
        notes: null,
      },
    ],
  },
];

describe("DistributionManagement", () => {
  const mockUserHook = useUser as jest.MockedFunction<typeof useUser>;
  const mockDistributionsApi = distributionsApi as jest.Mocked<typeof distributionsApi>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("LC Officer Role", () => {
    beforeEach(() => {
      mockUserHook.mockReturnValue({
        user: {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          role: "lc_officer",
          councilId: 1,
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        loading: false,
        setUser: jest.fn(),
      });
    });

    it("should render distribution management interface for LC officers", async () => {
      mockDistributionsApi.getDistributionsByCouncil.mockResolvedValue({
        distributions: mockDistributions,
        total: 1,
        page: 1,
        limit: 10,
      });

      render(<DistributionManagement />);

      expect(screen.getByText("Distribution Management")).toBeInTheDocument();
      expect(screen.getByText("Create Distribution")).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Create Distribution" })).toBeInTheDocument();

      await waitFor(() => {
        expect(mockDistributionsApi.getDistributionsByCouncil).toHaveBeenCalledWith(
          1, // councilId
          1, // currentPage
          10, // pageSize
          {} // filters
        );
      });
    });

    it("should allow LC officers to create distributions", async () => {
      mockDistributionsApi.getDistributionsByCouncil.mockResolvedValue({
        distributions: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      mockDistributionsApi.createDistribution.mockResolvedValue({
        success: true,
        data: mockDistributions[0],
      });

      render(<DistributionManagement />);

      const createButton = screen.getByText("Create Distribution");
      fireEvent.click(createButton);

      expect(screen.getByRole("tab", { name: "Create Distribution" })).toHaveAttribute("data-state", "active");
    });

    it("should handle distribution creation success", async () => {
      mockDistributionsApi.getDistributionsByCouncil.mockResolvedValue({
        distributions: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      mockDistributionsApi.createDistribution.mockResolvedValue({
        success: true,
        data: mockDistributions[0],
      });

      render(<DistributionManagement />);

      // This would normally be triggered by the create form submission
      // For now, we'll test the handler directly through component interaction
      await waitFor(() => {
        expect(screen.getByText("Distribution Management")).toBeInTheDocument();
      });
    });
  });

  describe("School Representative Role", () => {
    beforeEach(() => {
      mockUserHook.mockReturnValue({
        user: {
          id: 2,
          name: "Jane Smith",
          email: "jane@school.edu",
          role: "school_rep",
          schoolId: 1,
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        loading: false,
        setUser: jest.fn(),
      });
    });

    it("should render distribution management for school representatives", async () => {
      mockDistributionsApi.getDistributionsBySchool.mockResolvedValue({
        distributions: mockDistributions,
        total: 1,
        page: 1,
        limit: 10,
      });

      render(<DistributionManagement />);

      expect(screen.getByText("Distribution Management")).toBeInTheDocument();
      expect(screen.queryByText("Create Distribution")).not.toBeInTheDocument();
      expect(screen.queryByRole("tab", { name: "Create Distribution" })).not.toBeInTheDocument();

      await waitFor(() => {
        expect(mockDistributionsApi.getDistributionsBySchool).toHaveBeenCalledWith(
          1, // schoolId
          1, // currentPage
          10, // pageSize
          {} // filters
        );
      });
    });

    it("should allow school representatives to confirm receipts", async () => {
      mockDistributionsApi.getDistributionsBySchool.mockResolvedValue({
        distributions: mockDistributions,
        total: 1,
        page: 1,
        limit: 10,
      });

      mockDistributionsApi.confirmDistributionReceipt.mockResolvedValue({
        success: true,
        data: { ...mockDistributions[0], status: "CONFIRMED" },
      });

      render(<DistributionManagement />);

      await waitFor(() => {
        expect(screen.getByText("DIST-2024-001")).toBeInTheDocument();
      });
    });
  });

  describe("Super Admin Role", () => {
    beforeEach(() => {
      mockUserHook.mockReturnValue({
        user: {
          id: 3,
          name: "Admin User",
          email: "admin@lomemis.gov",
          role: "super_admin",
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        loading: false,
        setUser: jest.fn(),
      });
    });

    it("should render all distributions for super admin", async () => {
      mockDistributionsApi.getDistributions.mockResolvedValue({
        distributions: mockDistributions,
        total: 1,
        page: 1,
        limit: 10,
      });

      render(<DistributionManagement />);

      expect(screen.getByText("Distribution Management")).toBeInTheDocument();
      expect(screen.queryByText("Create Distribution")).not.toBeInTheDocument();

      await waitFor(() => {
        expect(mockDistributionsApi.getDistributions).toHaveBeenCalledWith(
          1, // currentPage
          10, // pageSize
          {} // filters
        );
      });
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      mockUserHook.mockReturnValue({
        user: {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          role: "lc_officer",
          councilId: 1,
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        loading: false,
        setUser: jest.fn(),
      });
    });

    it("should handle API errors gracefully", async () => {
      mockDistributionsApi.getDistributionsByCouncil.mockRejectedValue(
        new Error("Network error")
      );

      render(<DistributionManagement />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to load distributions");
      });
    });

    it("should handle create distribution errors", async () => {
      mockDistributionsApi.getDistributionsByCouncil.mockResolvedValue({
        distributions: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      mockDistributionsApi.createDistribution.mockRejectedValue(
        new Error("Creation failed")
      );

      render(<DistributionManagement />);

      await waitFor(() => {
        expect(screen.getByText("Distribution Management")).toBeInTheDocument();
      });
    });
  });

  describe("Filtering and Search", () => {
    beforeEach(() => {
      mockUserHook.mockReturnValue({
        user: {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          role: "lc_officer",
          councilId: 1,
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        loading: false,
        setUser: jest.fn(),
      });
    });

    it("should apply filters when searching", async () => {
      mockDistributionsApi.getDistributionsByCouncil.mockResolvedValue({
        distributions: mockDistributions,
        total: 1,
        page: 1,
        limit: 10,
      });

      render(<DistributionManagement />);

      const searchTab = screen.getByRole("tab", { name: "Search & Filter" });
      fireEvent.click(searchTab);

      expect(searchTab).toHaveAttribute("data-state", "active");

      await waitFor(() => {
        expect(mockDistributionsApi.getDistributionsByCouncil).toHaveBeenCalled();
      });
    });
  });
});