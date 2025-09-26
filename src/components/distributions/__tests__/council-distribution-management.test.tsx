import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CouncilDistributionManagement } from '../council-distribution-management';
import { distributionsApi, councilInventoryApi, usersApi, localCouncilsApi } from '@/lib/api';
import { toast } from 'sonner';

// Mock the API modules
jest.mock('@/lib/api', () => ({
  distributionsApi: {
    getDistributions: jest.fn(),
    createDistribution: jest.fn(),
    getDistributionsByCouncil: jest.fn(),
  },
  councilInventoryApi: {
    getDashboardKPIs: jest.fn(),
  },
  usersApi: {
    getCurrentUser: jest.fn(),
  },
  localCouncilsApi: {
    getLocalCouncils: jest.fn(),
  },
}));

// Mock the toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the child components
jest.mock('../distribution-table', () => {
  return {
    DistributionTable: ({ distributions, onView }: any) => (
      <div data-testid="distribution-table">
        {distributions.map((dist: any) => (
          <div key={dist.id} data-testid={`distribution-${dist.id}`}>
            {dist.schoolName} - {dist.status}
            <button onClick={() => onView(dist)}>View</button>
          </div>
        ))}
      </div>
    ),
  };
});

jest.mock('../distribution-create-form', () => {
  return {
    DistributionCreateForm: ({ onSubmit }: any) => (
      <div data-testid="distribution-create-form">
        <button
          onClick={() => onSubmit({
            schoolId: 1,
            distributionDate: '2024-01-15',
            items: [{ itemId: 1, quantityDistributed: 100 }],
            notes: 'Test distribution'
          })}
        >
          Create Distribution
        </button>
      </div>
    ),
  };
});

jest.mock('../schools/schools-for-distributions', () => {
  return {
    SchoolsForDistributions: ({ onSelectSchool }: any) => (
      <div data-testid="schools-for-distributions">
        <button
          onClick={() => onSelectSchool({
            id: 1,
            name: 'Test School',
            type: 'primary',
            address: 'Test Address',
            localCouncilId: 1
          })}
        >
          Select Test School
        </button>
      </div>
    ),
  };
});

jest.mock('../distribution-planning-tools', () => {
  return {
    DistributionPlanningTools: () => (
      <div data-testid="distribution-planning-tools">
        Planning Tools Component
      </div>
    ),
  };
});

const mockDistributionsApi = distributionsApi as jest.Mocked<typeof distributionsApi>;
const mockCouncilInventoryApi = councilInventoryApi as jest.Mocked<typeof councilInventoryApi>;
const mockToast = toast as jest.Mocked<typeof toast>;

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('CouncilDistributionManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default API mocks
    mockDistributionsApi.getDistributions.mockResolvedValue({
      success: true,
      data: {
        distributions: [
          {
            id: 1,
            schoolId: 1,
            schoolName: 'Test School 1',
            status: 'completed',
            distributionDate: '2024-01-10',
            totalQuantity: 100,
            createdAt: '2024-01-10T10:00:00Z'
          },
          {
            id: 2,
            schoolId: 2,
            schoolName: 'Test School 2',
            status: 'pending',
            distributionDate: '2024-01-12',
            totalQuantity: 75,
            createdAt: '2024-01-12T10:00:00Z'
          }
        ],
        total: 2,
        page: 1,
        limit: 10
      }
    });

    mockCouncilInventoryApi.getDashboardKPIs.mockResolvedValue({
      success: true,
      data: {
        totalDistributions: 2,
        pendingDistributions: 1,
        completedDistributions: 1,
        totalSchoolsServed: 2,
        totalItemsDistributed: 175,
        averageDeliveryTime: 3,
        distributionSuccessRate: 50,
        lastDistributionDate: new Date('2024-01-12')
      }
    });
  });

  describe('Component Rendering', () => {
    it('should render the main component with tabs', async () => {
      renderWithQueryClient(<CouncilDistributionManagement />);

      expect(screen.getByText('Distribution Management')).toBeInTheDocument();
      expect(screen.getByText('Manage educational material distributions for local councils')).toBeInTheDocument();

      // Check tabs
      expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /distributions/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /create/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /planning/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /search/i })).toBeInTheDocument();
    });

    it('should display KPIs in overview tab by default', async () => {
      renderWithQueryClient(<CouncilDistributionManagement />);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Total distributions
        expect(screen.getByText('1')).toBeInTheDocument(); // Pending distributions
        expect(screen.getByText('175')).toBeInTheDocument(); // Total items distributed
      });
    });

    it('should show loading state initially', () => {
      renderWithQueryClient(<CouncilDistributionManagement />);

      // Should show loading skeletons
      expect(screen.getAllByRole('progressbar')).toHaveLength(4); // 4 KPI cards loading
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to distributions tab and show distribution table', async () => {
      renderWithQueryClient(<CouncilDistributionManagement />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });

      // Click distributions tab
      fireEvent.click(screen.getByRole('tab', { name: /distributions/i }));

      await waitFor(() => {
        expect(screen.getByTestId('distribution-table')).toBeInTheDocument();
        expect(screen.getByTestId('distribution-1')).toBeInTheDocument();
        expect(screen.getByTestId('distribution-2')).toBeInTheDocument();
      });
    });

    it('should switch to create tab and show school selection', async () => {
      renderWithQueryClient(<CouncilDistributionManagement />);

      // Click create tab
      fireEvent.click(screen.getByRole('tab', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByTestId('schools-for-distributions')).toBeInTheDocument();
      });
    });

    it('should switch to planning tab and show planning tools', async () => {
      renderWithQueryClient(<CouncilDistributionManagement />);

      // Click planning tab
      fireEvent.click(screen.getByRole('tab', { name: /planning/i }));

      expect(screen.getByTestId('distribution-planning-tools')).toBeInTheDocument();
    });
  });

  describe('Distribution Creation Workflow', () => {
    it('should handle school selection and show create form', async () => {
      renderWithQueryClient(<CouncilDistributionManagement />);

      // Go to create tab
      fireEvent.click(screen.getByRole('tab', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByTestId('schools-for-distributions')).toBeInTheDocument();
      });

      // Select a school
      fireEvent.click(screen.getByText('Select Test School'));

      await waitFor(() => {
        expect(screen.getByText('Create Distribution for Test School')).toBeInTheDocument();
        expect(screen.getByText('Test Address')).toBeInTheDocument();
        expect(screen.getByTestId('distribution-create-form')).toBeInTheDocument();
      });
    });

    it('should handle distribution creation success', async () => {
      mockDistributionsApi.createDistribution.mockResolvedValue({
        success: true,
        data: {
          id: 3,
          schoolId: 1,
          status: 'pending',
          distributionDate: '2024-01-15',
          totalQuantity: 100,
          createdAt: '2024-01-15T10:00:00Z'
        }
      });

      renderWithQueryClient(<CouncilDistributionManagement />);

      // Navigate to create tab and select school
      fireEvent.click(screen.getByRole('tab', { name: /create/i }));
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Select Test School'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('distribution-create-form')).toBeInTheDocument();
      });

      // Create distribution
      fireEvent.click(screen.getByText('Create Distribution'));

      await waitFor(() => {
        expect(mockDistributionsApi.createDistribution).toHaveBeenCalledWith({
          schoolId: 1,
          distributionDate: '2024-01-15',
          items: [{ itemId: 1, quantityDistributed: 100 }],
          notes: 'Test distribution'
        });
        expect(mockToast.success).toHaveBeenCalledWith('Distribution created successfully');
      });
    });

    it('should handle distribution creation failure', async () => {
      mockDistributionsApi.createDistribution.mockResolvedValue({
        success: false,
        error: {
          code: 'INSUFFICIENT_INVENTORY',
          message: 'Insufficient inventory',
          timestamp: new Date().toISOString()
        }
      });

      renderWithQueryClient(<CouncilDistributionManagement />);

      // Navigate to create tab and select school
      fireEvent.click(screen.getByRole('tab', { name: /create/i }));
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Select Test School'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('distribution-create-form')).toBeInTheDocument();
      });

      // Create distribution
      fireEvent.click(screen.getByText('Create Distribution'));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Insufficient inventory');
      });
    });

    it('should allow changing selected school', async () => {
      renderWithQueryClient(<CouncilDistributionManagement />);

      // Navigate to create tab and select school
      fireEvent.click(screen.getByRole('tab', { name: /create/i }));
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Select Test School'));
      });

      await waitFor(() => {
        expect(screen.getByText('Create Distribution for Test School')).toBeInTheDocument();
      });

      // Click change school button
      fireEvent.click(screen.getByText('Change School'));

      await waitFor(() => {
        expect(screen.getByTestId('schools-for-distributions')).toBeInTheDocument();
        expect(screen.queryByText('Create Distribution for Test School')).not.toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching and Error Handling', () => {
    it('should handle KPI fetch errors', async () => {
      mockCouncilInventoryApi.getDashboardKPIs.mockRejectedValue(new Error('Network error'));

      renderWithQueryClient(<CouncilDistributionManagement />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load distribution data/i)).toBeInTheDocument();
      });
    });

    it('should handle distributions fetch errors', async () => {
      mockDistributionsApi.getDistributions.mockResolvedValue({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database error',
          timestamp: new Date().toISOString()
        }
      });

      renderWithQueryClient(<CouncilDistributionManagement />);

      // Switch to distributions tab
      fireEvent.click(screen.getByRole('tab', { name: /distributions/i }));

      await waitFor(() => {
        expect(screen.getByText(/database error/i)).toBeInTheDocument();
      });
    });

    it('should handle empty distributions data', async () => {
      mockDistributionsApi.getDistributions.mockResolvedValue({
        success: true,
        data: {
          distributions: [],
          total: 0,
          page: 1,
          limit: 10
        }
      });

      mockCouncilInventoryApi.getDashboardKPIs.mockResolvedValue({
        success: true,
        data: {
          totalDistributions: 0,
          pendingDistributions: 0,
          completedDistributions: 0,
          totalSchoolsServed: 0,
          totalItemsDistributed: 0,
          averageDeliveryTime: 0,
          distributionSuccessRate: 0,
          lastDistributionDate: null
        }
      });

      renderWithQueryClient(<CouncilDistributionManagement />);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument(); // Total distributions
      });

      // Switch to distributions tab
      fireEvent.click(screen.getByRole('tab', { name: /distributions/i }));

      await waitFor(() => {
        expect(screen.getByText(/no distributions found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should refresh data when distributions are created', async () => {
      mockDistributionsApi.createDistribution.mockResolvedValue({
        success: true,
        data: {
          id: 3,
          schoolId: 1,
          status: 'pending',
          distributionDate: '2024-01-15',
          totalQuantity: 100,
          createdAt: '2024-01-15T10:00:00Z'
        }
      });

      renderWithQueryClient(<CouncilDistributionManagement />);

      // Create a distribution
      fireEvent.click(screen.getByRole('tab', { name: /create/i }));
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Select Test School'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('Create Distribution'));
      });

      await waitFor(() => {
        // Should be redirected to distributions tab
        expect(screen.getByTestId('distribution-table')).toBeInTheDocument();
        
        // Should have refreshed the data
        expect(mockDistributionsApi.getDistributions).toHaveBeenCalledTimes(2); // Initial + refresh
        expect(mockCouncilInventoryApi.getDashboardKPIs).toHaveBeenCalledTimes(2); // Initial + refresh
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      renderWithQueryClient(<CouncilDistributionManagement />);

      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(5);
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      renderWithQueryClient(<CouncilDistributionManagement />);

      const firstTab = screen.getByRole('tab', { name: /overview/i });
      const secondTab = screen.getByRole('tab', { name: /distributions/i });

      // Focus first tab
      firstTab.focus();
      expect(firstTab).toHaveFocus();

      // Navigate to second tab with keyboard
      fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
      expect(secondTab).toHaveFocus();
    });
  });
});
