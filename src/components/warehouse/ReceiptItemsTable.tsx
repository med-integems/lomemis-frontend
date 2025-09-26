"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Package, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export type ConditionStatus = 'NEW' | 'GOOD' | 'FAIR' | 'DAMAGED';

export interface ReceiptItem {
  itemId: number;
  quantityReceived: number;
  unitCost?: number;
  expiryDate?: string;
  batchNumber?: string;
  notes?: string;
  conditionStatus?: ConditionStatus;
  qualityChecked?: boolean;
  inspectorNotes?: string;
}

export interface Item {
  id: number;
  name: string;
  code: string;
  unitOfMeasure: string;
  category?: string;
}

interface ReceiptItemsTableProps {
  items: ReceiptItem[];
  availableItems: Item[];
  onChange: (items: ReceiptItem[]) => void;
  className?: string;
}

const CONDITION_STATUSES: { value: ConditionStatus; label: string; color: string; icon: any }[] = [
  { value: 'NEW', label: 'New', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'GOOD', label: 'Good', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  { value: 'FAIR', label: 'Fair', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  { value: 'DAMAGED', label: 'Damaged', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
];

export function ReceiptItemsTable({
  items,
  availableItems,
  onChange,
  className = ""
}: ReceiptItemsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const addItem = () => {
    const newItem: ReceiptItem = {
      itemId: 0,
      quantityReceived: 0,
      unitCost: 0,
      expiryDate: "",
      batchNumber: "",
      notes: "",
      conditionStatus: 'NEW',
      qualityChecked: false,
      inspectorNotes: ""
    };
    onChange([...items, newItem]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      onChange(items.filter((_, i) => i !== index));
    } else {
      toast.error("At least one item is required");
    }
  };

  const updateItem = (index: number, field: keyof ReceiptItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    onChange(updatedItems);
  };

  const toggleRowExpansion = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const getItemInfo = (itemId: number) => {
    return availableItems.find(item => item.id === itemId);
  };

  const getConditionInfo = (status?: ConditionStatus) => {
    return CONDITION_STATUSES.find(s => s.value === status) || CONDITION_STATUSES[0];
  };

  const validateItem = (item: ReceiptItem, index: number) => {
    const errors: string[] = [];
    
    if (!item.itemId || item.itemId === 0) {
      errors.push("Item must be selected");
    }
    
    if (!item.quantityReceived || item.quantityReceived <= 0) {
      errors.push("Quantity must be greater than 0");
    }
    
    // Check for duplicate items
    const duplicateIndex = items.findIndex((otherItem, otherIndex) => 
      otherIndex !== index && otherItem.itemId === item.itemId && item.itemId > 0
    );
    
    if (duplicateIndex !== -1) {
      errors.push("Duplicate item (already added)");
    }
    
    return errors;
  };

  const getTotalValue = () => {
    return items.reduce((total, item) => {
      const cost = item.unitCost || 0;
      const quantity = item.quantityReceived || 0;
      return total + (cost * quantity);
    }, 0);
  };

  const getTotalQuantity = () => {
    return items.reduce((total, item) => total + (item.quantityReceived || 0), 0);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Receipt Items ({items.length})
          </CardTitle>
          <Button
            type="button"
            onClick={addItem}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
        
        {/* Summary Stats */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Total Items: {items.length}</span>
          <span>Total Quantity: {getTotalQuantity().toLocaleString()}</span>
          <span>Total Value: Le {getTotalValue().toLocaleString()}</span>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {items.map((item, index) => {
            const itemInfo = getItemInfo(item.itemId);
            const conditionInfo = getConditionInfo(item.conditionStatus);
            const errors = validateItem(item, index);
            const isExpanded = expandedRows.has(index);
            
            return (
              <Card key={index} className={`border ${errors.length > 0 ? 'border-red-200' : 'border-gray-200'}`}>
                <CardContent className="p-4">
                  {/* Main Row */}
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                    {/* Item Selection */}
                    <div className="md:col-span-2">
                      <Label>Item *</Label>
                      <Select
                        value={item.itemId.toString()}
                        onValueChange={(value) => updateItem(index, 'itemId', parseInt(value))}
                      >
                        <SelectTrigger className={errors.some(e => e.includes('Item')) ? 'border-red-300' : ''}>
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Select Item</SelectItem>
                          {availableItems.map((availableItem) => (
                            <SelectItem key={availableItem.id} value={availableItem.id.toString()}>
                              <div className="flex flex-col">
                                <span>{availableItem.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {availableItem.code} • {availableItem.unitOfMeasure}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quantity */}
                    <div>
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantityReceived || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateItem(index, 'quantityReceived', parseInt(value) || 0);
                        }}
                        className={errors.some(e => e.includes('Quantity')) ? 'border-red-300' : ''}
                        placeholder="0"
                      />
                    </div>

                    {/* Unit Cost */}
                    <div>
                      <Label>Unit Cost (Le)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitCost || ""}
                        onChange={(e) => updateItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>

                    {/* Condition Status */}
                    <div>
                      <Label>Condition</Label>
                      <Select
                        value={item.conditionStatus || 'NEW'}
                        onValueChange={(value) => updateItem(index, 'conditionStatus', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITION_STATUSES.map((status) => {
                            const Icon = status.icon;
                            return (
                              <SelectItem key={status.value} value={status.value}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  {status.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRowExpansion(index)}
                      >
                        {isExpanded ? 'Less' : 'More'}
                      </Button>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Item Info and Errors */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {itemInfo && (
                      <Badge variant="secondary">
                        {itemInfo.name} ({itemInfo.code})
                      </Badge>
                    )}
                    
                    <Badge className={conditionInfo.color} variant="secondary">
                      {conditionInfo.label}
                    </Badge>

                    {item.qualityChecked && (
                      <Badge className="bg-green-100 text-green-800" variant="secondary">
                        Quality Checked
                      </Badge>
                    )}

                    {errors.map((error, errorIndex) => (
                      <Badge key={errorIndex} variant="destructive">
                        {error}
                      </Badge>
                    ))}
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Batch Number</Label>
                        <Input
                          value={item.batchNumber || ""}
                          onChange={(e) => updateItem(index, 'batchNumber', e.target.value)}
                          placeholder="Batch/Lot number"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Expiry Date</Label>
                        <Input
                          type="date"
                          value={item.expiryDate || ""}
                          onChange={(e) => updateItem(index, 'expiryDate', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label>Item Notes</Label>
                        <Textarea
                          value={item.notes || ""}
                          onChange={(e) => updateItem(index, 'notes', e.target.value)}
                          placeholder="Notes about this item"
                          rows={2}
                          className="mt-1"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label>Inspector Notes</Label>
                        <Textarea
                          value={item.inspectorNotes || ""}
                          onChange={(e) => updateItem(index, 'inspectorNotes', e.target.value)}
                          placeholder="Quality inspection notes"
                          rows={2}
                          className="mt-1"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`quality-checked-${index}`}
                          checked={item.qualityChecked || false}
                          onChange={(e) => updateItem(index, 'qualityChecked', e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={`quality-checked-${index}`}>Quality Checked</Label>
                      </div>
                    </div>
                  )}

                  {/* Item Summary */}
                  {item.itemId > 0 && item.quantityReceived > 0 && (
                    <div className="mt-3 text-sm text-muted-foreground">
                      Total: {item.quantityReceived.toLocaleString()} × Le {(item.unitCost || 0).toLocaleString()} = 
                      <span className="font-medium ml-1">
                        Le {((item.quantityReceived || 0) * (item.unitCost || 0)).toLocaleString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary Footer */}
        {items.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {items.length} items • {getTotalQuantity().toLocaleString()} total quantity
              </div>
              <div className="text-lg font-semibold">
                Total Value: Le {getTotalValue().toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ReceiptItemsTable;