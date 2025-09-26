import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StockReceiptForm } from "../StockReceiptForm";

// Mock the API modules
jest.mock("@/lib/api", () => ({
  stockReceiptApi: {
    createStockReceipt: jest.fn(),
  },
  itemsApi: {
    getItems: jest.fn(),
  },
  warehousesApi: {
    getWarehouses: jest.fn(),
  },
}));

// Mock the hooks
jest.mock("@/hooks/useApi", () => ({
  useApiQuery: jest.fn(() => ({
    data: { success: true, data: { items: [] } },
    isLoading: false,
  })),
  useApiMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
  })),
}));

// Mock the toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithQueryClient = (component: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe("StockReceiptForm", () => {
  it("renders the form with basic elements", () => {
    renderWithQueryClient(<StockReceiptForm />);

    expect(screen.getByText("Create Stock Receipt")).toBeInTheDocument();
    expect(screen.getByText("Basic Information")).toBeInTheDocument();
    expect(screen.getByText("Supplier Information")).toBeInTheDocument();
    expect(screen.getByText("Receipt Items (1)")).toBeInTheDocument();
  });

  it("renders form fields", () => {
    renderWithQueryClient(<StockReceiptForm />);

    expect(screen.getByLabelText(/Warehouse/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Receipt Date/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Receipt Notes/)).toBeInTheDocument();
  });

  it("renders action buttons", () => {
    renderWithQueryClient(<StockReceiptForm />);

    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Create Stock Receipt")).toBeInTheDocument();
  });
});
