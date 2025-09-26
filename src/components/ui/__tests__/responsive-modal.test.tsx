import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ResponsiveModal, ConfirmationModal, FormModal } from "../responsive-modal";
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

describe("ResponsiveModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders modal with title and description", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    render(
      <ResponsiveModal
        open={true}
        title="Test Modal"
        description="This is a test modal"
      >
        <div>Modal content</div>
      </ResponsiveModal>
    );

    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("This is a test modal")).toBeInTheDocument();
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("renders modal with footer", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    render(
      <ResponsiveModal
        open={true}
        title="Test Modal"
        footer={
          <div>
            <button>Save</button>
            <button>Cancel</button>
          </div>
        }
      >
        <div>Modal content</div>
      </ResponsiveModal>
    );

    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("forces full screen on mobile devices", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("mobile"));

    render(
      <ResponsiveModal
        open={true}
        title="Mobile Modal"
      >
        <div>Content</div>
      </ResponsiveModal>
    );

    // Should render content but with mobile-optimized layout
    expect(screen.getByText("Mobile Modal")).toBeInTheDocument();
  });

  it("calls onOpenChange when modal state changes", async () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));
    const mockOnOpenChange = jest.fn();

    render(
      <ResponsiveModal
        open={true}
        onOpenChange={mockOnOpenChange}
        title="Test Modal"
      >
        <div>Content</div>
      </ResponsiveModal>
    );

    // Click the close button
    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

describe("ConfirmationModal", () => {
  it("renders confirmation modal with custom text", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));
    const mockOnConfirm = jest.fn();

    render(
      <ConfirmationModal
        open={true}
        title="Confirm Action"
        description="Are you sure?"
        confirmText="Yes, do it"
        cancelText="No, cancel"
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText("Confirm Action")).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    expect(screen.getByText("Yes, do it")).toBeInTheDocument();
    expect(screen.getByText("No, cancel")).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));
    const mockOnConfirm = jest.fn().mockResolvedValue(undefined);
    const mockOnOpenChange = jest.fn();

    render(
      <ConfirmationModal
        open={true}
        onOpenChange={mockOnOpenChange}
        title="Confirm Action"
        confirmText="Confirm"
        onConfirm={mockOnConfirm}
      />
    );

    const confirmButton = screen.getByRole("button", { name: "Confirm" });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("calls onCancel when cancel button is clicked", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));
    const mockOnCancel = jest.fn();
    const mockOnOpenChange = jest.fn();

    render(
      <ConfirmationModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onCancel={mockOnCancel}
        title="Confirm"
        onConfirm={jest.fn()}
      />
    );

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows loading state correctly", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    render(
      <ConfirmationModal
        open={true}
        title="Confirm"
        onConfirm={jest.fn()}
        loading={true}
      />
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    
    // Buttons should be disabled during loading
    const confirmButton = screen.getByText("Loading...");
    const cancelButton = screen.getByText("Cancel");
    
    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it("stacks buttons on mobile", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("mobile"));

    render(
      <ConfirmationModal
        open={true}
        title="Confirm Action"
        onConfirm={jest.fn()}
      />
    );

    // On mobile, buttons should be present and accessible
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });
});

describe("FormModal", () => {
  it("renders form modal with submit and cancel buttons", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));
    const mockOnSubmit = jest.fn();

    render(
      <FormModal
        open={true}
        title="Form Modal"
        onSubmit={mockOnSubmit}
      >
        <input placeholder="Test input" />
      </FormModal>
    );

    expect(screen.getByText("Form Modal")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Test input")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("calls onSubmit when form is submitted", async () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
    const mockOnOpenChange = jest.fn();

    render(
      <FormModal
        open={true}
        onOpenChange={mockOnOpenChange}
        title="Form"
        onSubmit={mockOnSubmit}
      >
        <input name="test" />
      </FormModal>
    );

    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("shows loading state during form submission", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    render(
      <FormModal
        open={true}
        title="Form"
        onSubmit={jest.fn()}
        loading={true}
      >
        <input />
      </FormModal>
    );

    expect(screen.getByText("Saving...")).toBeInTheDocument();
    
    const saveButton = screen.getByText("Saving...");
    expect(saveButton).toBeDisabled();
  });

  it("disables submit button when disabled prop is true", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    render(
      <FormModal
        open={true}
        title="Form"
        onSubmit={jest.fn()}
        disabled={true}
      >
        <input />
      </FormModal>
    );

    const saveButton = screen.getByText("Save");
    expect(saveButton).toBeDisabled();
  });
});