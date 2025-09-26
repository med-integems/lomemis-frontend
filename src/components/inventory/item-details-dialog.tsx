"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { NationalInventoryItem } from "@/types";
import { Package, Warehouse, Calendar, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface ItemDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItem: NationalInventoryItem | null;
}

export function ItemDetailsDialog({
  isOpen,
  onClose,
  inventoryItem,
}: ItemDetailsDialogProps) {
  if (!inventoryItem) return null;

  const stockUtilization = Math.round(
    (inventoryItem.reservedQuantity / inventoryItem.quantityOnHand) * 100
  );

  const stockTurnoverRisk = inventoryItem.quantityOnHand <= inventoryItem.minimumStockLevel * 1.2;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      {/* Modal can only be closed via Close button */}
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-500" />
            Item Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Item Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-gray-600">Item Name</Label>
                <p className="font-semibold text-lg text-gray-900">{inventoryItem.itemName}</p>
              </div>
              <div>
                <Label className="text-gray-600">Item Code</Label>
                <p className="font-mono bg-gray-100 px-3 py-2 rounded text-sm">{inventoryItem.itemCode}</p>
              </div>
              {inventoryItem.category && (
                <div>
                  <Label className="text-gray-600">Category</Label>
                  <div className="mt-1">
                    <Badge variant="secondary" className="text-sm">{inventoryItem.category}</Badge>
                  </div>
                </div>
              )}
              <div>
                <Label className="text-gray-600">Unit of Measure</Label>
                <p className="font-medium">{inventoryItem.unitOfMeasure}</p>
              </div>
              {inventoryItem.itemDescription && (
                <div className="md:col-span-2">
                  <Label className="text-gray-600">Description</Label>
                  <p className="font-medium text-gray-700">{inventoryItem.itemDescription}</p>
                </div>
              )}
            </div>
          </div>

          {/* Warehouse Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Warehouse Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-blue-600">Warehouse</Label>
                <p className="font-semibold text-blue-900">{inventoryItem.warehouseName}</p>
              </div>
              <div>
                <Label className="text-blue-600">Last Updated</Label>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(inventoryItem.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Stock Levels */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-4">Stock Levels</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <Label className="text-green-600">On Hand</Label>
                <p className="font-bold text-2xl text-green-900">
                  {inventoryItem.quantityOnHand.toLocaleString()}
                </p>
                <p className="text-xs text-green-600">{inventoryItem.unitOfMeasure}</p>
              </div>
              <div className="text-center">
                <Label className="text-green-600">Available</Label>
                <p className="font-bold text-2xl text-green-700">
                  {inventoryItem.availableQuantity.toLocaleString()}
                </p>
                <p className="text-xs text-green-600">{inventoryItem.unitOfMeasure}</p>
              </div>
              <div className="text-center">
                <Label className="text-green-600">Reserved</Label>
                <p className="font-bold text-2xl text-orange-600">
                  {inventoryItem.reservedQuantity.toLocaleString()}
                </p>
                <p className="text-xs text-green-600">{inventoryItem.unitOfMeasure}</p>
              </div>
              <div className="text-center">
                <Label className="text-green-600">Minimum Level</Label>
                <p className="font-bold text-2xl text-blue-600">
                  {inventoryItem.minimumStockLevel.toLocaleString()}
                </p>
                <p className="text-xs text-green-600">{inventoryItem.unitOfMeasure}</p>
              </div>
            </div>
          </div>

          {/* Stock Analysis */}
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-800 mb-4">Stock Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-orange-600">Current Status</Label>
                <div className="flex items-center gap-2 mt-1">
                  {inventoryItem.isLowStock ? (
                    <>
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <Badge variant="destructive">Low Stock</Badge>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <Badge variant="default" className="bg-green-100 text-green-800">Normal</Badge>
                    </>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-orange-600">Stock Utilization</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(stockUtilization, 100)}%` }}
                    ></div>
                  </div>
                  <span className="font-medium">{stockUtilization}%</span>
                </div>
                <p className="text-xs text-orange-600 mt-1">Reserved vs On Hand</p>
              </div>
              <div>
                <Label className="text-orange-600">Days Above Minimum</Label>
                <p className="font-medium">
                  {inventoryItem.quantityOnHand > inventoryItem.minimumStockLevel 
                    ? `${Math.floor((inventoryItem.quantityOnHand - inventoryItem.minimumStockLevel) / inventoryItem.minimumStockLevel * 30)} days`
                    : "Below minimum"
                  }
                </p>
              </div>
              <div>
                <Label className="text-orange-600">Restock Risk</Label>
                <div className="flex items-center gap-2 mt-1">
                  {stockTurnoverRisk ? (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <Badge variant="outline" className="text-red-600 border-red-600">High Risk</Badge>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <Badge variant="outline" className="text-green-600 border-green-600">Low Risk</Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {inventoryItem.isLowStock && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Action Required
              </h3>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Stock level is below minimum threshold</li>
                <li>• Consider immediate restocking from other warehouses</li>
                <li>• Review distribution patterns and usage rates</li>
                {inventoryItem.availableQuantity === 0 && (
                  <li className="font-medium">• No available stock for distribution</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}