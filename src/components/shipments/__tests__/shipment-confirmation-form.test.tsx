import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShipmentConfirmationForm } from '../shipment-confirmation-form';

const mockShipment = {
  id: 1,
  originWarehouseName: 'Central National Warehouse',
  originAddress: 'Freetown, Sierra Leone',
  status: 'in_transit',
  priority: 'medium',
  totalItems: 3,
  shippedDate: '2024-01-10',
  expectedDeliveryDate: '2024-01-15',
  hasDiscrepancies: false,
  createdAt: '2024-01-10T10:00:00Z',
  updatedAt: '2024-01-10T10:00:00Z',
  items: [
    {
      itemId: 1,
      itemName: 'English Textbook Grade 1',
      quantity: 100,
      unitPrice: 15.00
    },
    {
      itemId: 2,
      itemName: 'Exercise Books',
      quantity: 200,
      unitPrice: 2.50
    },
    {
      itemId: 3,
      itemName: 'Pencils HB',
      quantity: 500,
      unitPrice: 0.50
    }
  ]
};

const mockOnConfirm = jest.fn();
const mockOnCancel = jest.fn();

describe('ShipmentConfirmationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render shipment details correctly', () => {
      render(
        <ShipmentConfirmationForm
          shipment={mockShipment}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Confirm Shipment Receipt')).toBeInTheDocument();
      expect(screen.getByText(/SH-000001/)).toBeInTheDocument();
      expect(screen.getByText('Central National Warehouse')).toBeInTheDocument();
      expect(screen.getByText('3 items')).toBeInTheDocument();
    });

    it('should render all items with expected quantities', () => {
      render(
        <ShipmentConfirmationForm
          shipment={mockShipment}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('English Textbook Grade 1')).toBeInTheDocument();
      expect(screen.getByText('Expected: 100')).toBeInTheDocument();
      
      expect(screen.getByText('Exercise Books')).toBeInTheDocument();
      expect(screen.getByText('Expected: 200')).toBeInTheDocument();
      
      expect(screen.getByText('Pencils HB')).toBeInTheDocument();
      expect(screen.getByText('Expected: 500')).toBeInTheDocument();
    });

    it('should have default form values set correctly', () => {
      render(
        <ShipmentConfirmationForm
          shipment={mockShipment}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Check received date is today
      const dateInput = screen.getByLabelText('Date Received') as HTMLInputElement;
      expect(dateInput.value).toBe(new Date().toISOString().split('T')[0]);

      // Check received quantities default to expected quantities
      const quantityInputs = screen.getAllByLabelText('Received Quantity');
      expect(quantityInputs[0]).toHaveValue(100);
      expect(quantityInputs[1]).toHaveValue(200);
      expect(quantityInputs[2]).toHaveValue(500);

      // Check overall condition defaults to 'good'
      const conditionSelect = screen.getByDisplayValue('Good - Minor packaging wear, items intact');
      expect(conditionSelect).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should update received quantities and detect discrepancies', async () => {
      const user = userEvent.setup();
      
      render(
        <ShipmentConfirmationForm
          shipment={mockShipment}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const quantityInputs = screen.getAllByLabelText('Received Quantity');
      
      // Change first item quantity to create discrepancy
      await user.clear(quantityInputs[0]);
      await user.type(quantityInputs[0], '95');

      await waitFor(() => {
        expect(screen.getByText('Discrepancies Detected')).toBeInTheDocument();
        expect(screen.getByText('Total discrepancy: 5 items')).toBeInTheDocument();
        
        const discrepancyBadges = screen.getAllByText('Discrepancy');
        expect(discrepancyBadges).toHaveLength(1);
        
        const matchBadges = screen.getAllByText('Match');
        expect(matchBadges).toHaveLength(2); // Other 2 items still match
      });
    });

    it('should require discrepancy reasons for items with discrepancies', async () => {
      const user = userEvent.setup();
      
      render(
        <ShipmentConfirmationForm
          shipment={mockShipment}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const quantityInputs = screen.getAllByLabelText('Received Quantity');
      
      // Create discrepancy
      await user.clear(quantityInputs[0]);
      await user.type(quantityInputs[0], '90');

      await waitFor(() => {
        expect(screen.getByLabelText('Reason for Discrepancy')).toBeInTheDocument();
      });

      // Enter discrepancy reason
      const reasonInput = screen.getByLabelText('Reason for Discrepancy');
      await user.type(reasonInput, 'Some items were damaged during transport');

      expect(reasonInput).toHaveValue('Some items were damaged during transport');
    });

    it('should update form when basic information is changed', async () => {
      const user = userEvent.setup();
      
      render(
        <ShipmentConfirmationForm
          shipment={mockShipment}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Change received by
      const receivedByInput = screen.getByLabelText('Received By');
      await user.type(receivedByInput, 'John Doe');
      expect(receivedByInput).toHaveValue('John Doe');

      // Change overall condition
      const conditionSelect = screen.getByRole('combobox');
      await user.selectOptions(conditionSelect, 'poor');
      expect(conditionSelect).toHaveValue('poor');

      // Add notes
      const notesInput = screen.getByLabelText('Additional Notes');
      await user.type(notesInput, 'Packaging was damaged but items are intact');
      expect(notesInput).toHaveValue('Packaging was damaged but items are intact');
    });
  });

  describe('Form Submission', () => {
    it('should submit form with correct data when no discrepancies', async () => {
      const user = userEvent.setup();
      
      render(
        <ShipmentConfirmationForm
          shipment={mockShipment}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Fill required fields
      await user.type(screen.getByLabelText('Received By'), 'Jane Smith');
      await user.type(screen.getByLabelText('Additional Notes'), 'All items received in good condition');

      // Submit form
      await user.click(screen.getByText('Confirm Receipt'));

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith(1, {
          shipmentId: 1,
          status: 'delivered',
          receivedDate: new Date().toISOString().split('T')[0],
          receivedBy: 'Jane Smith',
          items: [
            {
              itemId: 1,
              itemName: 'English Textbook Grade 1',
              expectedQuantity: 100,
              receivedQuantity: 100,
              hasDiscrepancy: false,
              discrepancyReason: ''
            },
            {
              itemId: 2,
              itemName: 'Exercise Books',
              expectedQuantity: 200,
              receivedQuantity: 200,
              hasDiscrepancy: false,
              discrepancyReason: ''
            },
            {
              itemId: 3,
              itemName: 'Pencils HB',
              expectedQuantity: 500,
              receivedQuantity: 500,
              hasDiscrepancy: false,
              discrepancyReason: ''
            }
          ],
          overallCondition: 'good',
          notes: 'All items received in good condition',
          hasDiscrepancies: false,
          totalDiscrepancies: 0
        });
      });
    });

    it('should submit form with discrepancy data', async () => {
      const user = userEvent.setup();
      
      render(
        <ShipmentConfirmationForm
          shipment={mockShipment}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Fill required fields
      await user.type(screen.getByLabelText('Received By'), 'John Doe');

      // Create discrepancies
      const quantityInputs = screen.getAllByLabelText('Received Quantity');
      await user.clear(quantityInputs[0]);
      await user.type(quantityInputs[0], '95');

      await user.clear(quantityInputs[1]);
      await user.type(quantityInputs[1], '190');

      await waitFor(() => {
        expect(screen.getAllByLabelText('Reason for Discrepancy')).toHaveLength(2);
      });

      // Fill discrepancy reasons
      const reasonInputs = screen.getAllByLabelText('Reason for Discrepancy');
      await user.type(reasonInputs[0], 'Damaged items');
      await user.type(reasonInputs[1], 'Missing items');

      // Change condition
      const conditionSelect = screen.getByRole('combobox');
      await user.selectOptions(conditionSelect, 'fair');

      // Submit form
      await user.click(screen.getByText('Confirm Receipt'));

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith(1, {
          shipmentId: 1,
          status: 'delivered',
          receivedDate: new Date().toISOString().split('T')[0],
          receivedBy: 'John Doe',
          items: [
            {
              itemId: 1,
              itemName: 'English Textbook Grade 1',
              expectedQuantity: 100,
              receivedQuantity: 95,
              hasDiscrepancy: true,
              discrepancyReason: 'Damaged items'
            },
            {
              itemId: 2,
              itemName: 'Exercise Books',
              expectedQuantity: 200,
              receivedQuantity: 190,
              hasDiscrepancy: true,
              discrepancyReason: 'Missing items'
            },
            {
              itemId: 3,
              itemName: 'Pencils HB',
              expectedQuantity: 500,
              receivedQuantity: 500,
              hasDiscrepancy: false,
              discrepancyReason: ''
            }
          ],
          overallCondition: 'fair',
          notes: '',
          hasDiscrepancies: true,
          totalDiscrepancies: 15
        });
      });
    });

    it('should prevent submission without required fields', async () => {
      const user = userEvent.setup();
      
      render(
        <ShipmentConfirmationForm
          shipment={mockShipment}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Try to submit without filling required fields
      await user.click(screen.getByText('Confirm Receipt'));

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('Receiver name is required')).toBeInTheDocument();
      });

      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should handle form submission loading state', async () => {
      const user = userEvent.setup();
      
      // Mock a slow confirmation
      const slowOnConfirm = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      
      render(
        <ShipmentConfirmationForm
          shipment={mockShipment}
          onConfirm={slowOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      await user.type(screen.getByLabelText('Received By'), 'Test User');
      
      const submitButton = screen.getByText('Confirm Receipt');
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText('Confirming...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form Cancellation', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <ShipmentConfirmationForm
          shipment={mockShipment}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByText('Cancel'));

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should call onCancel when dialog is closed', async () => {
      const user = userEvent.setup();
      
      render(
        <ShipmentConfirmationForm
          shipment={mockShipment}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Close dialog with escape key
      await user.keyboard('{Escape}');

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should validate negative quantities', async () => {
      const user = userEvent.setup();
      
      render(
        <ShipmentConfirmationForm
          shipment={mockShipment}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const quantityInput = screen.getAllByLabelText('Received Quantity')[0];
      await user.clear(quantityInput);
      await user.type(quantityInput, '-5');

      await user.type(screen.getByLabelText('Received By'), 'Test User');
      await user.click(screen.getByText('Confirm Receipt'));

      await waitFor(() => {
        expect(screen.getByText('Quantity must be non-negative')).toBeInTheDocument();
      });

      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should validate required date field', async () => {
      const user = userEvent.setup();
      
      render(
        <ShipmentConfirmationForm
          shipment={mockShipment}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const dateInput = screen.getByLabelText('Date Received');
      await user.clear(dateInput);

      await user.type(screen.getByLabelText('Received By'), 'Test User');
      await user.click(screen.getByText('Confirm Receipt'));

      await waitFor(() => {
        expect(screen.getByText('Received date is required')).toBeInTheDocument();
      });

      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <ShipmentConfirmationForm
          shipment={mockShipment}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText('Date Received')).toBeInTheDocument();
      expect(screen.getByLabelText('Received By')).toBeInTheDocument();
      expect(screen.getAllByLabelText('Received Quantity')).toHaveLength(3);
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <ShipmentConfirmationForm
          shipment={mockShipment}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Should be able to tab through form elements
      await user.tab();
      expect(screen.getByLabelText('Date Received')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Received By')).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('combobox')).toHaveFocus();
    });
  });
});