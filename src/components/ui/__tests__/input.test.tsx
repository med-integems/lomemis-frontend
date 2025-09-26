import { render } from "@testing-library/react";
import { Input } from "../input";
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

describe("Input", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("applies touch-optimized sizing on touch devices", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("mobile"));

    const { container } = render(<Input />);
    const input = container.querySelector("input");
    
    expect(input).toHaveClass("h-11");
    expect(input).toHaveClass("text-base");
    expect(input).toHaveClass("touch-manipulation");
  });

  it("applies desktop sizing on desktop devices", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    const { container } = render(<Input />);
    const input = container.querySelector("input");
    
    expect(input).toHaveClass("h-9");
    expect(input).toHaveClass("md:text-sm");
    expect(input).not.toHaveClass("touch-manipulation");
  });

  it("applies small size correctly", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("mobile"));

    const { container } = render(<Input size="sm" />);
    const input = container.querySelector("input");
    
    expect(input).toHaveClass("h-10");
    expect(input).toHaveClass("text-sm");
  });

  it("applies large size correctly", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    const { container } = render(<Input size="lg" />);
    const input = container.querySelector("input");
    
    expect(input).toHaveClass("h-11");
    expect(input).toHaveClass("text-base");
  });

  it("maintains accessibility attributes", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    const { container } = render(
      <Input 
        placeholder="Enter text"
        aria-label="Test input"
        disabled
      />
    );
    const input = container.querySelector("input");
    
    expect(input).toHaveAttribute("placeholder", "Enter text");
    expect(input).toHaveAttribute("aria-label", "Test input");
    expect(input).toBeDisabled();
  });
});