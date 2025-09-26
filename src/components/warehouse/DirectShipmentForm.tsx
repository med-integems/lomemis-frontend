"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, 
  AlertTriangle, 
  Calendar, 
  FileText, 
  Package, 
  School as SchoolIcon,
  Warehouse as WarehouseIcon,
  Clock,
  Shield,
  Plus,
  Minus
} from "lucide-react";
import { toast } from "sonner";
import {
  CreateDirectShipmentRequest,
  CreateDirectShipmentItemRequest,
  ShipmentType,
  PriorityLevel,
  Item,
  Warehouse,
} from "@/types";
import { directShipmentsApi, itemsApi, warehousesApi } from "@/lib/api";
import { useResponsive } from "@/hooks/useResponsive";
import SchoolSelector, { SchoolWithCouncil } from "./SchoolSelector";

interface DirectShipmentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialSchoolId?: number;
}

interface ShipmentItem extends Omit<CreateDirectShipmentItemRequest, 'quantityShipped' | 'unitCost'> {
  id: string; // temporary ID for form management
  itemName?: string;
  itemCode?: string;
  unitOfMeasure?: string;
  availableQuantity?: number; // from warehouse inventory
  quantityShipped: number | null;
}

interface ItemWithInventory extends Item {
  availableQuantity?: number;
  batchNumber?: string;
  expiryDate?: string;
}

const SHIPMENT_TYPES: { value: ShipmentType; label: string; description: string; color: string; icon: React.ComponentType<any> }[] = [
  {
    value: 'emergency',
    label: 'Emergency Delivery',
    description: 'Urgent delivery for emergency situations',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertTriangle
  },
  {
    value: 'special_program',
    label: 'Special Program',
    description: 'Special educational programs and initiatives',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Package
  },
  {
    value: 'direct_allocation',
    label: 'Direct Allocation',
    description: 'Direct allocation to specific schools',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: SchoolIcon
  },
  {
    value: 'pilot_program',
    label: 'Pilot Program',
    description: 'Pilot programs and testing',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: FileText
  },
  {
    value: 'disaster_relief',
    label: 'Disaster Relief',
    description: 'Disaster relief and recovery support',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: Shield
  }
];

const PRIORITY_LEVELS: { value: PriorityLevel; label: string; description: string; color: string }[] = [
  {
    value: 'low',
    label: 'Low Priority',
    description: 'Standard delivery timeframe',
    color: 'bg-gray-100 text-gray-800'
  },
  {
    value: 'normal',
    label: 'Normal Priority',
    description: 'Regular priority delivery',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    value: 'high',
    label: 'High Priority',
    description: 'Expedited delivery required',
    color: 'bg-yellow-100 text-yellow-800'
  },
  {
    value: 'urgent',
    label: 'Urgent',
    description: 'Very urgent delivery needed',
    color: 'bg-orange-100 text-orange-800'
  },
  {
    value: 'critical',
    label: 'Critical',
    description: 'Critical emergency delivery',
    color: 'bg-red-100 text-red-800'
  }
];

export function DirectShipmentForm({ onSuccess, onCancel, initialSchoolId }: DirectShipmentFormProps) {
  const { isMobile, isTablet } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [warehouseItems, setWarehouseItems] = useState<ItemWithInventory[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  
  // Form state
  const [warehouseId, setWarehouseId] = useState<number>(0);
  const [schoolId, setSchoolId] = useState<number>(initialSchoolId || 0);
  const [selectedSchool, setSelectedSchool] = useState<SchoolWithCouncil>();
  const [shipmentType, setShipmentType] = useState<ShipmentType>('direct_allocation');
  const [priorityLevel, setPriorityLevel] = useState<PriorityLevel>('normal');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>("");
  const [authorizationReason, setAuthorizationReason] = useState<string>("");
  const [transportMethod, setTransportMethod] = useState<string>("");
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  // Use counter for deterministic IDs to avoid hydration mismatch
  const [itemCounter, setItemCounter] = useState(1);
  const [shipmentItems, setShipmentItems] = useState<ShipmentItem[]>([
    {
      id: "item-1",
      itemId: 0,
      quantityShipped: null,
      conditionOnDispatch: 'new',
      conditionNotes: "",
      expiryDate: "",
      batchNumber: "",
      serialNumbers: ""
    }
  ]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Fix hydration mismatch for date min value
  const [minDate, setMinDate] = useState("");

  // Load data on mount
  useEffect(() => {
    loadInitialData();
    // Set min date on client side to avoid hydration mismatch
    setMinDate(new Date().toISOString().split('T')[0]);
  }, []);

  const loadInitialData = async () => {
    setInitialLoading(true);
    try {
      console.log("Loading initial data for direct shipment form...");
      
      // Load items and warehouses from API
      const [itemsResponse, warehousesResponse] = await Promise.all([
        itemsApi.getItems(1, 100), // Get first 100 items
        warehousesApi.getWarehouses(1, 100) // Get first 100 warehouses
      ]);

      console.log("Items response:", itemsResponse);
      console.log("Warehouses response:", warehousesResponse);

      if (itemsResponse.success && itemsResponse.data?.items) {
        setItems(itemsResponse.data.items);
        console.log("Loaded", itemsResponse.data.items.length, "items");
      } else {
        console.error("Failed to load items:", itemsResponse.error);
        toast.error("Failed to load items: " + (itemsResponse.error?.message || "Unknown error"));
      }

      if (warehousesResponse.success && warehousesResponse.data?.warehouses) {
        setWarehouses(warehousesResponse.data.warehouses);
        console.log("Loaded", warehousesResponse.data.warehouses.length, "warehouses");
      } else {
        console.error("Failed to load warehouses:", warehousesResponse.error);
        toast.error("Failed to load warehouses: " + (warehousesResponse.error?.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
      toast.error("Failed to load form data: " + error.message);
    } finally {
      setInitialLoading(false);
    }
  };

  const validateForm = (): { isValid: boolean; errors: Record<string, string> } => {
    const newErrors: Record<string, string> = {};

    if (!warehouseId || warehouseId === 0) newErrors.warehouseId = "Warehouse is required";
    if (!schoolId || schoolId === 0) newErrors.schoolId = "School is required";
    if (!authorizationReason.trim()) newErrors.authorizationReason = "Authorization reason is required";
    
    // Validate items
    shipmentItems.forEach((item, index) => {
      if (!item.itemId || item.itemId === 0) newErrors[`item-${index}-itemId`] = "Item is required";
      if (item.quantityShipped == null || item.quantityShipped <= 0) newErrors[`item-${index}-quantityShipped`] = "Quantity must be greater than 0";
      
      // Check availability if we have the data
      if (item.availableQuantity !== undefined && (item.quantityShipped ?? 0) > item.availableQuantity) {
        newErrors[`item-${index}-quantityShipped`] = `Cannot ship ${item.quantityShipped} items. Only ${item.availableQuantity} available in warehouse.`;
      }
    });

    if (shipmentItems.length === 0) {
      newErrors.items = "At least one item is required";
    }

    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateForm();
    if (!validation.isValid) {
      const errorCount = Object.keys(validation.errors).length;
      toast.error(`Please fix ${errorCount} validation error${errorCount > 1 ? 's' : ''}`);
      
      // Scroll to first error
      const firstErrorElement = document.querySelector('.border-red-500');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);
    try {
      const createRequest: CreateDirectShipmentRequest = {
        warehouseId,
        schoolId,
        shipmentType,
        priorityLevel,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        authorizationReason,
        transportMethod: transportMethod || undefined,
        deliveryInstructions: deliveryInstructions || undefined,
        notes: notes || undefined,
        items: shipmentItems.map(item => ({
          itemId: item.itemId,
          quantityShipped: (item.quantityShipped as number),
          conditionOnDispatch: item.conditionOnDispatch || undefined,
          conditionNotes: item.conditionNotes || undefined,
          expiryDate: item.expiryDate || undefined,
          batchNumber: item.batchNumber || undefined,
          serialNumbers: item.serialNumbers || undefined,
        }))
      };

      // Create direct shipment via API
      console.log("Sending direct shipment request:", createRequest);
      const response = await directShipmentsApi.createDirectShipment(createRequest);
      
      if (response.success) {
        toast.success("Direct shipment created successfully!");
        onSuccess?.();
      } else {
        console.error("API response error:", response.error);
        toast.error(response.error?.message || "Failed to create direct shipment");
      }
    } catch (error) {
      console.error("Error creating direct shipment:", error);
      console.error("Error response:", error.response);
      console.error("Error response data:", error.response?.data);
      
      // Enhanced error handling
      if (error.response?.data?.error?.message) {
        toast.error(`Server error: ${error.response.data.error.message}`);
      } else if (error.response?.data?.message) {
        toast.error(`Server error: ${error.response.data.message}`);
      } else if (error.response?.status === 500) {
        toast.error("Internal server error. Please check if all required data exists in the database.");
      } else if (error.message) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error("Failed to create direct shipment");
      }
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    const newCounter = itemCounter + 1;
    setItemCounter(newCounter);
    setShipmentItems([
      ...shipmentItems,
      {
        id: `item-${newCounter}`,
        itemId: 0,
        quantityShipped: null,
        conditionOnDispatch: 'new',
        conditionNotes: "",
        expiryDate: "",
        batchNumber: "",
        serialNumbers: ""
      }
    ]);
  };

  const removeItem = (id: string) => {
    if (shipmentItems.length > 1) {
      setShipmentItems(shipmentItems.filter(item => item.id !== id));
    }
  };

  const updateItem = async (id: string, field: keyof ShipmentItem, value: any) => {
    setShipmentItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Update item details when itemId changes
        if (field === 'itemId') {
          const selectedItem = items.find(i => i.id === value);
          if (selectedItem) {
            updatedItem.itemName = selectedItem.name;
            updatedItem.itemCode = selectedItem.code;
            updatedItem.unitOfMeasure = selectedItem.unitOfMeasure;
            // Don't set standard cost here - we'll get warehouse-specific data
          }
          
          // Fetch warehouse-specific item details if both warehouse and item are selected
          if (warehouseId > 0 && value > 0) {
            fetchWarehouseItemDetails(id, warehouseId, value);
          }
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const fetchWarehouseItemDetails = async (itemFormId: string, warehouseId: number, itemId: number) => {
    try {
      console.log(`Fetching warehouse item details for warehouse ${warehouseId}, item ${itemId}`);
      
      const response = await directShipmentsApi.getWarehouseItemDetails(warehouseId, itemId);
      
      if (response.success && response.data) {
        console.log('Warehouse item details:', response.data);
        
        // Update the item with warehouse-specific data
        setShipmentItems(prev => prev.map(item => {
          if (item.id === itemFormId) {
            const updatedItem = { ...item };
            
            // Auto-populate fields if data is available
            updatedItem.availableQuantity = response.data.availableQuantity;
            
            // unit cost intentionally omitted in UI
            
            if (response.data.batchNumber) {
              updatedItem.batchNumber = response.data.batchNumber;
            }
            
            if (response.data.expiryDate) {
              updatedItem.expiryDate = response.data.expiryDate;
            }
            
            if (response.data.conditionStatus) {
              updatedItem.conditionOnDispatch = response.data.conditionStatus.toLowerCase() as 'new' | 'good' | 'fair' | 'damaged';
            }
            
            return updatedItem;
          }
          return item;
        }));
        
        // Show a subtle toast about auto-population
        const populatedFields = [];
        // do not include unit cost in auto-populated notice
        if (response.data.batchNumber) populatedFields.push('batch number');
        if (response.data.expiryDate) populatedFields.push('expiry date');
        
        if (populatedFields.length > 0) {
          toast.success(`Auto-populated: ${populatedFields.join(', ')} from warehouse records`);
        }
      }
    } catch (error) {
      console.error('Error fetching warehouse item details:', error);
      // Silently fail - this is an enhancement, not critical functionality
    }
  };

  const refreshItemDetailsForWarehouse = async (newWarehouseId: number) => {
    if (newWarehouseId <= 0) {
      setWarehouseItems([]);
      return;
    }
    
    try {
      // Fetch inventory details for all items in this warehouse
      const warehouseItemsPromises = items.map(async (item) => {
        try {
          const response = await directShipmentsApi.getWarehouseItemDetails(newWarehouseId, item.id);
          if (response.success && response.data) {
            return {
              ...item,
              availableQuantity: response.data.availableQuantity,
              batchNumber: response.data.batchNumber,
              expiryDate: response.data.expiryDate
            };
          }
        } catch (error) {
          // Silently handle items not available in this warehouse
        }
        return {
          ...item,
          availableQuantity: 0
        };
      });
      
      const warehouseItemsData = await Promise.all(warehouseItemsPromises);
      setWarehouseItems(warehouseItemsData);
    } catch (error) {
      console.error('Error fetching warehouse inventory:', error);
      // Fall back to basic items without inventory data
      setWarehouseItems(items.map(item => ({ ...item, availableQuantity: 0 })));
    }
    
    // Update existing selected items with new availability data
    const itemsToRefresh = shipmentItems.filter(item => item.itemId > 0);
    for (const item of itemsToRefresh) {
      await fetchWarehouseItemDetails(item.id, newWarehouseId, item.itemId);
    }
  };

  const selectedShipmentType = SHIPMENT_TYPES.find(type => type.value === shipmentType);
  const selectedPriorityLevel = PRIORITY_LEVELS.find(level => level.value === priorityLevel);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 lg:space-y-6 ${isMobile ? 'px-0' : ''}`}>
      {/* Validation Error Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 lg:p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-red-600`} />
            <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-red-800`}>
              Please fix the following errors:
            </h3>
          </div>
          <ul className={`${isMobile ? 'text-xs' : 'text-sm'} text-red-700 space-y-1`}>
            {Object.entries(errors).map(([key, message]) => (
              <li key={key} className="flex items-start space-x-1">
                <span>•</span>
                <span>{message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={`grid grid-cols-1 ${isMobile ? 'space-y-4' : 'lg:grid-cols-2'} gap-4 lg:gap-6`}>
        {/* Warehouse and School Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <WarehouseIcon className="h-5 w-5" />
              <span>Origin & Destination</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="warehouse" className={`${isMobile ? 'text-sm' : ''}`}>Origin Warehouse *</Label>
              <Select 
                value={warehouseId > 0 ? warehouseId.toString() : ""} 
                onValueChange={(value) => {
                  const newWarehouseId = parseInt(value);
                  setWarehouseId(newWarehouseId);
                  // Refresh item details for already selected items
                  refreshItemDetailsForWarehouse(newWarehouseId);
                }}
              >
                <SelectTrigger className={`mt-1.5 ${errors.warehouseId ? 'border-red-500' : ''} ${isMobile ? 'h-12' : ''}`}>
                  <SelectValue placeholder="Select warehouse">
                    {warehouseId > 0 && warehouses.length > 0 && (() => {
                      const selectedWarehouse = warehouses.find(w => w.id === warehouseId);
                      return selectedWarehouse ? (
                        <div className="flex flex-col">
                          <span className="font-medium">{selectedWarehouse.name}</span>
                          <span className="text-xs text-muted-foreground">{selectedWarehouse.location}</span>
                        </div>
                      ) : null;
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {warehouses.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Loading warehouses...
                    </div>
                  ) : (
                    warehouses.map(warehouse => (
                      <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{warehouse.name}</span>
                          <span className="text-xs text-muted-foreground">{warehouse.location}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.warehouseId && <p className="text-sm text-red-600 mt-1">{errors.warehouseId}</p>}
            </div>

            <SchoolSelector
              selectedSchoolId={schoolId}
              onSchoolChange={(id, school) => {
                setSchoolId(id);
                setSelectedSchool(school);
              }}
              error={errors.schoolId}
              required
            />
          </CardContent>
        </Card>

        {/* Shipment Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Truck className="h-5 w-5" />
              <span>Shipment Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Shipment Type *</Label>
              <Select value={shipmentType} onValueChange={(value: ShipmentType) => setShipmentType(value)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHIPMENT_TYPES.map(type => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4" />
                          <div className="flex flex-col">
                            <span className="font-medium">{type.label}</span>
                            <span className="text-xs text-muted-foreground">{type.description}</span>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedShipmentType && (
                <Badge className={`mt-2 ${selectedShipmentType.color}`}>
                  {selectedShipmentType.label}
                </Badge>
              )}
            </div>

            <div>
              <Label>Priority Level *</Label>
              <Select value={priorityLevel} onValueChange={(value: PriorityLevel) => setPriorityLevel(value)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{level.label}</span>
                        <span className="text-xs text-muted-foreground">{level.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPriorityLevel && (
                <Badge className={`mt-2 ${selectedPriorityLevel.color}`}>
                  {selectedPriorityLevel.label}
                </Badge>
              )}
            </div>

            <div>
              <Label htmlFor="expectedDeliveryDate">Expected Delivery Date</Label>
              <Input
                id="expectedDeliveryDate"
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                min={minDate}
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Authorization and Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Authorization & Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="authorizationReason">Authorization Reason *</Label>
            <Textarea
              id="authorizationReason"
              value={authorizationReason}
              onChange={(e) => setAuthorizationReason(e.target.value)}
              placeholder="Explain why this direct shipment is necessary..."
              className={`mt-1.5 ${errors.authorizationReason ? 'border-red-500' : ''}`}
              rows={3}
            />
            {errors.authorizationReason && <p className="text-sm text-red-600 mt-1">{errors.authorizationReason}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="transportMethod">Transport Method</Label>
              <Input
                id="transportMethod"
                value={transportMethod}
                onChange={(e) => setTransportMethod(e.target.value)}
                placeholder="e.g., Government truck, Private carrier"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="deliveryInstructions">Delivery Instructions</Label>
              <Input
                id="deliveryInstructions"
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="Special delivery instructions"
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes or special requirements..."
              rows={2}
              className="mt-1.5"
            />
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Shipment Items</span>
            </div>
            <Button type="button" onClick={addItem} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shipmentItems.map((item, index) => (
              <div key={item.id} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {shipmentItems.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className={`grid grid-cols-1 ${isMobile ? 'space-y-4' : 'md:grid-cols-3'} gap-4`}>
                  <div className={`${isMobile ? '' : 'md:col-span-2'}`}>
                    <Label className={`${isMobile ? 'text-sm' : ''}`}>Item *</Label>
                    <Select
                      value={item.itemId.toString()}
                      onValueChange={(value) => updateItem(item.id, 'itemId', parseInt(value))}
                    >
                      <SelectTrigger className={`mt-1.5 ${errors[`item-${index}-itemId`] ? 'border-red-500' : ''} ${isMobile ? 'h-12' : ''}`}>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {(warehouseId > 0 ? warehouseItems : items).map(availableItem => {
                          const showAvailability = warehouseId > 0 && 'availableQuantity' in availableItem;
                          const availableQty = showAvailability ? (availableItem as ItemWithInventory).availableQuantity : undefined;
                          
                          return (
                            <SelectItem key={availableItem.id} value={availableItem.id.toString()}>
                              <div className="flex flex-col">
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-medium">{availableItem.name}</span>
                                  {showAvailability && (
                                    <Badge variant="outline" className={`ml-2 text-xs ${
                                      (availableQty || 0) > 0 
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : 'bg-red-50 text-red-700 border-red-200'
                                    }`}>
                                      {availableQty || 0} available
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {availableItem.code} - {availableItem.category}
                                  {showAvailability && availableQty === 0 && (
                                    <span className="text-red-600 ml-1">(Out of stock)</span>
                                  )}
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {errors[`item-${index}-itemId`] && (
                      <p className="text-sm text-red-600 mt-1">{errors[`item-${index}-itemId`]}</p>
                    )}
                  </div>

                  <div>
                    <Label className={`${isMobile ? 'text-sm' : ''}`}>Quantity Shipped *</Label>
                    <Input
                      type="number"
                      value={item.quantityShipped == null ? '' : item.quantityShipped}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          updateItem(item.id, 'quantityShipped', null);
                        } else {
                          const parsed = parseInt(value, 10);
                          updateItem(item.id, 'quantityShipped', isNaN(parsed) ? null : parsed);
                        }
                      }}
                      onKeyDown={(e) => {
                        // Block characters not valid for integer quantities
                        if (["e","E","+","-","."].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onBlur={(e) => {
                        const v = e.target.value;
                        if (v === '') return;
                        let n = parseInt(v, 10);
                        if (isNaN(n) || n < 1) n = 1;
                        const max = item.availableQuantity ?? undefined;
                        if (max !== undefined && n > max) n = max;
                        updateItem(item.id, 'quantityShipped', n);
                      }}
                      min="1"
                      step="1"
                      inputMode="numeric"
                      placeholder="Enter quantity"
                      max={item.availableQuantity || undefined}
                      className={`mt-1.5 ${errors[`item-${index}-quantityShipped`] ? 'border-red-500' : ''} ${isMobile ? 'h-12' : ''}`}
                    />
                    {item.availableQuantity !== undefined && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Available in warehouse: {item.availableQuantity}
                      </p>
                    )}
                    {errors[`item-${index}-quantityShipped`] && (
                      <p className="text-sm text-red-600 mt-1">{errors[`item-${index}-quantityShipped`]}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Batch Number</Label>
                    <Input
                      value={item.batchNumber}
                      onChange={(e) => updateItem(item.id, 'batchNumber', e.target.value)}
                      placeholder="Batch/Lot number"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      value={item.expiryDate}
                      onChange={(e) => updateItem(item.id, 'expiryDate', e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label>Item Notes</Label>
                  <Textarea
                    value={item.conditionNotes}
                    onChange={(e) => updateItem(item.id, 'conditionNotes', e.target.value)}
                    placeholder="Notes about this item's condition, handling, etc."
                    rows={2}
                    className="mt-1.5"
                  />
                </div>
              </div>
            ))}
          </div>
          {errors.items && <p className="text-sm text-red-600 mt-2">{errors.items}</p>}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-end space-x-4'}`}>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className={`${isMobile ? 'w-full h-12' : ''}`}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={loading} 
          className={`bg-green-600 hover:bg-green-700 ${isMobile ? 'w-full h-12' : ''}`}
        >
          {loading ? "Creating..." : isMobile ? "Create Shipment" : "Create Direct Shipment"}
        </Button>
      </div>
    </form>
  );
}

export default DirectShipmentForm;
