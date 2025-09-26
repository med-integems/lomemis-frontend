import { renderHook } from "@testing-library/react";
import { useResponsiveGrid, useResponsiveKPIGrid } from "../useResponsiveGrid";
import * as ResponsiveHook from "../useResponsive";

// Mock useResponsive hook
jest.mock("../useResponsive");
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

describe("useResponsiveGrid", () => {
  const testItems = ["item1", "item2", "item3", "item4", "item5", "item6"];
  const columns = { mobile: 1, tablet: 2, desktop: 3 };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should use mobile layout for mobile devices", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("mobile"));
    
    const { result } = renderHook(() =>
      useResponsiveGrid({ items: testItems, columns })
    );
    
    expect(result.current.currentColumns).toBe(1);
    expect(result.current.chunkedItems).toHaveLength(6);
    expect(result.current.chunkedItems[0]).toEqual(["item1"]);
    expect(result.current.gridClasses).toContain("grid-cols-1");
    expect(result.current.gridClasses).toContain("md:grid-cols-2");
    expect(result.current.gridClasses).toContain("xl:grid-cols-3");
  });

  it("should use tablet layout for tablet devices", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("tablet"));
    
    const { result } = renderHook(() =>
      useResponsiveGrid({ items: testItems, columns })
    );
    
    expect(result.current.currentColumns).toBe(2);
    expect(result.current.chunkedItems).toHaveLength(3);
    expect(result.current.chunkedItems[0]).toEqual(["item1", "item2"]);
    expect(result.current.chunkedItems[1]).toEqual(["item3", "item4"]);
    expect(result.current.chunkedItems[2]).toEqual(["item5", "item6"]);
  });

  it("should use desktop layout for desktop devices", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));
    
    const { result } = renderHook(() =>
      useResponsiveGrid({ items: testItems, columns })
    );
    
    expect(result.current.currentColumns).toBe(3);
    expect(result.current.chunkedItems).toHaveLength(2);
    expect(result.current.chunkedItems[0]).toEqual(["item1", "item2", "item3"]);
    expect(result.current.chunkedItems[1]).toEqual(["item4", "item5", "item6"]);
  });

  it("should handle empty items array", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));
    
    const { result } = renderHook(() =>
      useResponsiveGrid({ items: [], columns })
    );
    
    expect(result.current.chunkedItems).toHaveLength(0);
    expect(result.current.currentColumns).toBe(3);
    expect(result.current.totalRows).toBe(0);
  });

  it("should calculate total rows correctly", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("tablet"));
    
    const { result } = renderHook(() =>
      useResponsiveGrid({ items: testItems.slice(0, 5), columns })
    );
    
    expect(result.current.totalRows).toBe(3); // 5 items, 2 per row = 3 rows
    expect(result.current.chunkedItems).toHaveLength(3);
    expect(result.current.chunkedItems[2]).toEqual(["item5"]);
  });

  it("should use custom gap classes", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));
    
    const { result } = renderHook(() =>
      useResponsiveGrid({ items: testItems, columns, gap: "gap-8" })
    );
    
    expect(result.current.gridClasses).toContain("gap-8");
    expect(result.current.gridClasses).not.toContain("gap-4");
  });
});

describe("useResponsiveKPIGrid", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should use appropriate columns for small KPI count", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));
    const items = ["kpi1", "kpi2"];
    
    const { result } = renderHook(() => useResponsiveKPIGrid(items));
    
    expect(result.current.currentColumns).toBe(2);
    expect(result.current.chunkedItems[0]).toEqual(["kpi1", "kpi2"]);
  });

  it("should use appropriate columns for medium KPI count", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));
    const items = ["kpi1", "kpi2", "kpi3", "kpi4"];
    
    const { result } = renderHook(() => useResponsiveKPIGrid(items));
    
    expect(result.current.currentColumns).toBe(4);
    expect(result.current.chunkedItems[0]).toEqual(["kpi1", "kpi2", "kpi3", "kpi4"]);
  });

  it("should use appropriate columns for large KPI count", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("desktop"));
    const items = ["kpi1", "kpi2", "kpi3", "kpi4", "kpi5", "kpi6"];
    
    const { result } = renderHook(() => useResponsiveKPIGrid(items));
    
    expect(result.current.currentColumns).toBe(3);
    expect(result.current.chunkedItems).toHaveLength(2);
  });

  it("should always use single column on mobile for KPIs", () => {
    mockUseResponsive.mockReturnValue(mockResponsiveReturn("mobile"));
    const items = ["kpi1", "kpi2", "kpi3", "kpi4"];
    
    const { result } = renderHook(() => useResponsiveKPIGrid(items));
    
    expect(result.current.currentColumns).toBe(1);
    expect(result.current.chunkedItems).toHaveLength(4);
  });
});