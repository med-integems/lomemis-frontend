import { renderHook, act } from "@testing-library/react";
import { useResponsive } from "../useResponsive";

// Mock window dimensions
const mockWindowDimensions = (width: number, height: number) => {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
  
  Object.defineProperty(window, "innerHeight", {
    writable: true,
    configurable: true,
    value: height,
  });
};

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock navigator for touch detection
Object.defineProperty(navigator, "maxTouchPoints", {
  writable: true,
  configurable: true,
  value: 0,
});

describe("useResponsive", () => {
  beforeEach(() => {
    // Reset to default desktop dimensions
    mockWindowDimensions(1024, 768);
  });

  it("should detect mobile device correctly", () => {
    mockWindowDimensions(375, 667); // iPhone dimensions
    
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.deviceType).toBe("mobile");
  });

  it("should detect tablet device correctly", () => {
    mockWindowDimensions(768, 1024); // iPad dimensions
    
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.deviceType).toBe("tablet");
  });

  it("should detect desktop device correctly", () => {
    mockWindowDimensions(1440, 900); // Desktop dimensions
    
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.deviceType).toBe("desktop");
  });

  it("should detect portrait orientation correctly", () => {
    mockWindowDimensions(375, 667); // Portrait phone
    
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.orientation).toBe("portrait");
    expect(result.current.isPortrait).toBe(true);
    expect(result.current.isLandscape).toBe(false);
  });

  it("should detect landscape orientation correctly", () => {
    mockWindowDimensions(667, 375); // Landscape phone
    
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.orientation).toBe("landscape");
    expect(result.current.isLandscape).toBe(true);
    expect(result.current.isPortrait).toBe(false);
  });

  it("should return correct dimensions", () => {
    const width = 1200;
    const height = 800;
    mockWindowDimensions(width, height);
    
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.width).toBe(width);
    expect(result.current.height).toBe(height);
  });

  it("should detect touch device when maxTouchPoints > 0", () => {
    Object.defineProperty(navigator, "maxTouchPoints", {
      writable: true,
      configurable: true,
      value: 1,
    });
    
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.isTouchDevice).toBe(true);
  });

  it("should update dimensions on window resize", () => {
    const { result } = renderHook(() => useResponsive());
    
    // Initial desktop
    expect(result.current.isDesktop).toBe(true);
    
    // Simulate resize to mobile
    act(() => {
      mockWindowDimensions(375, 667);
      window.dispatchEvent(new Event("resize"));
    });
    
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it("should handle SSR correctly", () => {
    // Mock window as undefined (SSR environment)
    const originalWindow = global.window;
    // @ts-expect-error - Deleting window for SSR testing
    delete global.window;
    
    const { result } = renderHook(() => useResponsive());
    
    // Should fall back to default desktop dimensions
    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
    expect(result.current.isDesktop).toBe(true);
    
    // Restore window
    global.window = originalWindow;
  });
});