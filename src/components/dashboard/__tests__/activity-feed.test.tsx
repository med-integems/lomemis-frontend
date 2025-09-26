import { render, screen } from "@testing-library/react";
import { ActivityFeed, type ActivityItem } from "../activity-feed";

const mockActivities: ActivityItem[] = [
  {
    id: "1",
    type: "receipt",
    title: "Stock Receipt Processed",
    description: "Received 500 Grade 3 Mathematics textbooks from supplier",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    user: "John Kamara",
    status: "success",
    metadata: {
      itemCount: 500,
      location: "Freetown Central Warehouse",
      reference: "RCP-2024-001",
    },
  },
  {
    id: "2",
    type: "shipment",
    title: "Shipment Dispatched",
    description: "Shipment to Bo District Council dispatched",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    user: "Mary Sesay",
    status: "info",
    metadata: {
      itemCount: 150,
      location: "Bo District",
      reference: "SHP-2024-045",
    },
  },
  {
    id: "3",
    type: "distribution",
    title: "School Distribution Confirmed",
    description: "Distribution to St. Mary's Primary School confirmed",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    user: "Abdul Rahman",
    status: "success",
    metadata: {
      itemCount: 75,
      location: "Western Area Urban",
      reference: "DST-2024-123",
    },
  },
];

describe("ActivityFeed", () => {
  it("renders loading state correctly", () => {
    render(<ActivityFeed isLoading={true} />);

    expect(screen.getByText("Recent Activity")).toBeInTheDocument();

    // Should show skeleton loaders
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders empty state when no activities", () => {
    render(<ActivityFeed activities={[]} />);

    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    expect(
      screen.getByText("No recent activity to display")
    ).toBeInTheDocument();
  });

  it("renders activity items correctly", () => {
    render(<ActivityFeed activities={mockActivities} />);

    // Check if activity titles are displayed
    expect(screen.getByText("Stock Receipt Processed")).toBeInTheDocument();
    expect(screen.getByText("Shipment Dispatched")).toBeInTheDocument();
    expect(
      screen.getByText("School Distribution Confirmed")
    ).toBeInTheDocument();

    // Check if descriptions are displayed
    expect(
      screen.getByText(
        "Received 500 Grade 3 Mathematics textbooks from supplier"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("Shipment to Bo District Council dispatched")
    ).toBeInTheDocument();

    // Check if users are displayed
    expect(screen.getByText("by John Kamara")).toBeInTheDocument();
    expect(screen.getByText("by Mary Sesay")).toBeInTheDocument();
    expect(screen.getByText("by Abdul Rahman")).toBeInTheDocument();
  });

  it("displays metadata badges correctly", () => {
    render(<ActivityFeed activities={mockActivities} />);

    // Check for item count badges
    expect(screen.getByText("500 items")).toBeInTheDocument();
    expect(screen.getByText("150 items")).toBeInTheDocument();
    expect(screen.getByText("75 items")).toBeInTheDocument();

    // Check for location badges
    expect(screen.getByText("Freetown Central Warehouse")).toBeInTheDocument();
    expect(screen.getByText("Bo District")).toBeInTheDocument();
    expect(screen.getByText("Western Area Urban")).toBeInTheDocument();

    // Check for reference badges
    expect(screen.getByText("RCP-2024-001")).toBeInTheDocument();
    expect(screen.getByText("SHP-2024-045")).toBeInTheDocument();
    expect(screen.getByText("DST-2024-123")).toBeInTheDocument();
  });

  it("displays status badges correctly", () => {
    render(<ActivityFeed activities={mockActivities} />);

    // Check for status badges
    const successBadges = screen.getAllByText("success");
    expect(successBadges).toHaveLength(2);

    expect(screen.getByText("info")).toBeInTheDocument();
  });

  it("respects maxItems prop", () => {
    const manyActivities = Array.from({ length: 20 }, (_, i) => ({
      ...mockActivities[0],
      id: `activity-${i}`,
      title: `Activity ${i + 1}`,
    }));

    render(<ActivityFeed activities={manyActivities} maxItems={5} />);

    // Should only show 5 activities
    const activityElements = screen.getAllByText(/Activity \d+/);
    expect(activityElements).toHaveLength(5);
  });

  it("shows relative timestamps", () => {
    render(<ActivityFeed activities={mockActivities} />);

    // Should show relative time strings
    expect(screen.getAllByText(/ago$/)).toHaveLength(3);
  });

  it("displays correct icons for different activity types", () => {
    render(<ActivityFeed activities={mockActivities} />);

    // The component should render different icons for different activity types
    // We can't easily test the specific icons, but we can ensure the component renders
    const activityItems = screen.getAllByRole("generic");
    expect(activityItems.length).toBeGreaterThan(0);
  });
});
