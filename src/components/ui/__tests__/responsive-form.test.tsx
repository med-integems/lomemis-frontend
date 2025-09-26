import { render, screen } from "@testing-library/react";
import { 
  ResponsiveForm, 
  ResponsiveFormField,
  ResponsiveFormSection,
  ResponsiveFormActions 
} from "../responsive-form";
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

describe("ResponsiveForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders form with title and description", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    render(
      <ResponsiveForm
        title="Test Form"
        description="This is a test form"
      >
        <div>Form content</div>
      </ResponsiveForm>
    );

    expect(screen.getByText("Test Form")).toBeInTheDocument();
    expect(screen.getByText("This is a test form")).toBeInTheDocument();
    expect(screen.getByText("Form content")).toBeInTheDocument();
  });

  it("renders as card when asCard is true", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    render(
      <ResponsiveForm
        title="Card Form"
        asCard={true}
      >
        <div>Card content</div>
      </ResponsiveForm>
    );

    expect(screen.getByText("Card Form")).toBeInTheDocument();
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("adjusts grid columns based on responsive props", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("mobile"));

    const { container } = render(
      <ResponsiveForm
        columns={{ mobile: 1, tablet: 2, desktop: 3 }}
      >
        <div>Content</div>
      </ResponsiveForm>
    );

    const form = container.querySelector("form");
    expect(form).toHaveClass("grid-cols-1");
    expect(form).toHaveClass("md:grid-cols-2");
    expect(form).toHaveClass("lg:grid-cols-3");
  });

  it("applies touch manipulation on touch devices", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("mobile"));

    const { container } = render(
      <ResponsiveForm>
        <div>Content</div>
      </ResponsiveForm>
    );

    const form = container.querySelector("form");
    expect(form).toHaveClass("touch-manipulation");
  });
});

describe("ResponsiveFormField", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with full width when fullWidth is true", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    const { container } = render(
      <ResponsiveFormField fullWidth>
        <div>Field content</div>
      </ResponsiveFormField>
    );

    expect(container.firstChild).toHaveClass("col-span-full");
  });

  it("applies span classes for different breakpoints", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    const { container } = render(
      <ResponsiveFormField span={{ mobile: 1, tablet: 2, desktop: 3 }}>
        <div>Field content</div>
      </ResponsiveFormField>
    );

    expect(container.firstChild).toHaveClass("col-span-1");
    expect(container.firstChild).toHaveClass("md:col-span-2");
    expect(container.firstChild).toHaveClass("lg:col-span-3");
  });
});

describe("ResponsiveFormSection", () => {
  it("renders section with title and description", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    render(
      <ResponsiveFormSection
        title="Section Title"
        description="Section description"
      >
        <div>Section content</div>
      </ResponsiveFormSection>
    );

    expect(screen.getByText("Section Title")).toBeInTheDocument();
    expect(screen.getByText("Section description")).toBeInTheDocument();
    expect(screen.getByText("Section content")).toBeInTheDocument();
  });

  it("applies border when border is true", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    const { container } = render(
      <ResponsiveFormSection border>
        <div>Content</div>
      </ResponsiveFormSection>
    );

    expect(container.firstChild).toHaveClass("border-b");
  });
});

describe("ResponsiveFormActions", () => {
  it("stacks buttons on mobile devices", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("mobile"));

    const { container } = render(
      <ResponsiveFormActions>
        <button>Save</button>
        <button>Cancel</button>
      </ResponsiveFormActions>
    );

    const actionsContainer = container.querySelector(".flex");
    expect(actionsContainer).toHaveClass("flex-col");
  });

  it("aligns buttons horizontally on desktop", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    const { container } = render(
      <ResponsiveFormActions>
        <button>Save</button>
        <button>Cancel</button>
      </ResponsiveFormActions>
    );

    const actionsContainer = container.querySelector(".flex");
    expect(actionsContainer).toHaveClass("flex-row");
    expect(actionsContainer).toHaveClass("justify-end");
  });

  it("applies correct alignment classes", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));

    const { container } = render(
      <ResponsiveFormActions align="left">
        <button>Save</button>
      </ResponsiveFormActions>
    );

    const actionsContainer = container.querySelector(".flex");
    expect(actionsContainer).toHaveClass("justify-start");
  });
});