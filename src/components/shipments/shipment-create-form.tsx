"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Minus,
  AlertTriangle,
  Package,
  Save,
  X,
  CheckCircle,
} from "lucide-react";
import {
  shipmentsApi,
  localCouncilsApi,
  warehousesApi,
  nationalInventoryApi,
} from "@/lib/api";
import {
  CreateShipmentRequest,
  CreateShipmentItemRequest,
  LocalCouncil,
  Warehouse,
  NationalInventoryItem,
} from "@/types";
import { useResponsive } from "@/hooks/useResponsive";

interface ShipmentCreateFormProps {
  onShipmentCreated: () => void;
  onCancel: () => void;
}

export function ShipmentCreateForm({
  onShipmentCreated,
  onCancel,
}: ShipmentCreateFormProps) {
  const { isMobile, isTablet } = useResponsive();
  const [formData, setFormData] = useState<CreateShipmentRequest>({
    originWarehouseId: 0,
    destinationCouncilId: 0,
    expectedArrivalDate: "",
    notes: "",
    items: [],
  });

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [councils, setCouncils] = useState<LocalCouncil[]>([]);
  const [availableItems, setAvailableItems] = useState<NationalInventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load warehouses and councils on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [warehousesResponse, councilsResponse] = await Promise.all([
          warehousesApi.getWarehouses(1, 100),
          localCouncilsApi.getLocalCouncils(1, 100),
        ]);

        if (warehousesResponse.success && warehousesResponse.data?.warehouses) {
          setWarehouses(warehousesResponse.data.warehouses);
        }

        if (councilsResponse.success && councilsResponse.data?.councils) {
          setCouncils(councilsResponse.data.councils);
        }
      } catch (error) {
        console.error("Error fetching form data:", error);
        setError("Failed to load form data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Load available items when warehouse is selected
  useEffect(() => {
    if (formData.originWarehouseId) {
      const fetchInventory = async () => {
        try {
          const response = await nationalInventoryApi.getNationalInventory(1, 100, {
            warehouseId: formData.originWarehouseId,
          });

          if (response.success && response.data?.items) {
            setAvailableItems(response.data.items);
          }
        } catch (error) {
          console.error("Error fetching inventory:", error);
        }
      };

      fetchInventory();
    } else {
      setAvailableItems([]);
    }
  }, [formData.originWarehouseId]);

  const handleInputChange = (field: keyof CreateShipmentRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const addItem = () => {
    const newItem: CreateShipmentItemRequest = {
      itemId: 0,
      quantityShipped: "",
      notes: "",
    };
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (
    index: number,
    field: keyof CreateShipmentItemRequest,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const getAvailableQuantity = (itemId: number): number => {
    const inventoryItem = availableItems.find((item) => item.itemId === itemId);
    return inventoryItem?.availableQuantity || 0;
  };

  const getItemName = (itemId: number): string => {
    const inventoryItem = availableItems.find((item) => item.itemId === itemId);
    return inventoryItem ? `${inventoryItem.itemName} (${inventoryItem.itemCode})` : "";
  };

  const validateForm = (): string | null => {
    if (!formData.originWarehouseId) {
      return "Please select an origin warehouse";
    }
    if (!formData.destinationCouncilId) {
      return "Please select a destination council";
    }
    if (formData.items.length === 0) {
      return "Please add at least one item to the shipment";
    }

    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.itemId) {
        return `Please select an item for row ${i + 1}`;
      }
      if (!item.quantityShipped || item.quantityShipped <= 0) {
        return `Please enter a valid quantity for row ${i + 1}`;
      }
      const available = getAvailableQuantity(item.itemId);
      if (item.quantityShipped > available) {
        return `Quantity for ${getItemName(item.itemId)} exceeds available stock (${available})`;
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await shipmentsApi.createShipment(formData);

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onShipmentCreated();
        }, 1500);
      } else {
        setError(response.error?.message || "Failed to create shipment");
      }
    } catch (err) {
      setError("An error occurred while creating the shipment");
      console.error("Create shipment error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-16 w-16 mx-auto text-[#007A33] mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Shipment Created Successfully!
        </h3>
        <p className="text-muted-foreground">
          The shipment has been created and is ready for dispatch.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Shipment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="originWarehouse">Origin Warehouse *</Label>
              <Select
                value={formData.originWarehouseId.toString()}
                onValueChange={(value) =>
                  handleInputChange("originWarehouseId", parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse..." />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name}
                      {warehouse.location && ` - ${warehouse.location}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destinationCouncil">Destination Council *</Label>
              <Select
                value={formData.destinationCouncilId.toString()}
                onValueChange={(value) =>
                  handleInputChange("destinationCouncilId", parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select council..." />
                </SelectTrigger>
                <SelectContent>
                  {councils.map((council) => (
                    <SelectItem key={council.id} value={council.id.toString()}>
                      {council.name} ({council.region})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expectedArrival">Expected Arrival Date</Label>
              <Input
                id="expectedArrival"
                type="date"
                value={formData.expectedArrivalDate}
                onChange={(e) =>
                  handleInputChange("expectedArrivalDate", e.target.value)
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes about this shipment..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Items Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Shipment Items
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              disabled={!formData.originWarehouseId}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!formData.originWarehouseId && (
            <div className="text-center py-8 text-muted-foreground">
              Please select an origin warehouse first to add items
            </div>
          )}

          {formData.originWarehouseId && formData.items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No items added yet. Click "Add Item" to start building your shipment.
            </div>
          )}

          {formData.items.length > 0 && (
            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Item *</Label>
                      <Select
                        value={item.itemId.toString()}
                        onValueChange={(value) =>
                          updateItem(index, "itemId", parseInt(value))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select item..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableItems.map((inventoryItem) => (
                            <SelectItem
                              key={inventoryItem.itemId}
                              value={inventoryItem.itemId.toString()}
                              disabled={inventoryItem.availableQuantity === 0}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>
                                  {inventoryItem.itemName} ({inventoryItem.itemCode})
                                </span>
                                <Badge variant="outline" className="ml-2">
                                  {inventoryItem.availableQuantity} available
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Quantity to Ship *</Label>
                      <Input
                        type="number"
                        min="1"
                        max={getAvailableQuantity(item.itemId)}
                        value={item.quantityShipped}
                        onChange={(e) =>
                          updateItem(index, "quantityShipped", e.target.value === "" ? "" : parseInt(e.target.value) || 0)
                        }
                        placeholder="0"
                      />
                      {item.itemId > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Available: {getAvailableQuantity(item.itemId)}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Input
                        value={item.notes}
                        onChange={(e) => updateItem(index, "notes", e.target.value)}
                        placeholder="Item-specific notes..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className={`flex items-center gap-3 ${isMobile ? 'flex-col-reverse' : 'justify-end'}`}>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className={isMobile ? 'w-full h-12' : ''}
          size={isMobile ? "lg" : "default"}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className={`bg-[#007A33] hover:bg-[#005A25] ${isMobile ? 'w-full h-12' : ''}`}
          size={isMobile ? "lg" : "default"}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Creating...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Create Shipment
            </>
          )}
        </Button>
      </div>
    </form>
  );
}