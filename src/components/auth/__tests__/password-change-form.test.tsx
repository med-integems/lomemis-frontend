import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordChangeForm } from "../password-change-form";

// Mock the auth context
const mockChangePassword = jest.fn();
jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    changePassword: mockChangePassword,
  }),
}));

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("PasswordChangeForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders password change form with all required fields", () => {
    render(<PasswordChangeForm />);

    expect(
      screen.getByRole("button", { name: /change password/i })
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter your current password")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter your new password")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Confirm your new password")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /change password/i })
    ).toBeInTheDocument();
  });

  it("shows validation errors for empty fields", async () => {
    const user = userEvent.setup();
    render(<PasswordChangeForm />);

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Current password is required")
      ).toBeInTheDocument();
    });
  });

  it("calls changePassword function with correct data", async () => {
    const user = userEvent.setup();
    mockChangePassword.mockResolvedValue(undefined);

    render(<PasswordChangeForm />);

    const currentPasswordInput = screen.getByPlaceholderText(
      "Enter your current password"
    );
    const newPasswordInput = screen.getByPlaceholderText(
      "Enter your new password"
    );
    const confirmPasswordInput = screen.getByPlaceholderText(
      "Confirm your new password"
    );
    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });

    await user.type(currentPasswordInput, "OldPassword123");
    await user.type(newPasswordInput, "NewPassword123");
    await user.type(confirmPasswordInput, "NewPassword123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith(
        "OldPassword123",
        "NewPassword123"
      );
    });
  });
});
