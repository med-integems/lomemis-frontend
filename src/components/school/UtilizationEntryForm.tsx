'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Calendar, Package, Users, BookOpen, MapPin, Clock, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api, schoolInventoryApi } from "@/lib/api";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";

interface UtilizationEntryFormProps {
  schoolId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  preselectedItemId?: number;
  preselectedQuantity?: number;
}

interface TransactionType {
  value: string;
  label: string;
  description: string;
}

interface SchoolItem {
  id: number;
  name: string;
  category: string;
  current_quantity: number;
  unit: string;
}

const UtilizationEntryForm: React.FC<UtilizationEntryFormProps> = ({
  schoolId,
  onSuccess,
  onCancel,
  preselectedItemId,
  preselectedQuantity
}) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([]);
  const [recipientTypes, setRecipientTypes] = useState<string[]>([]);
  const [gradeLevels, setGradeLevels] = useState<string[]>([]);
  // Subject field removed from UI
  const [academicPeriods, setAcademicPeriods] = useState<string[]>([]);
  const [schoolItems, setSchoolItems] = useState<SchoolItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SchoolItem | null>(null);
  const [error, setError] = useState<string>('');

  const [formData, setFormData] = useState({
    item_id: preselectedItemId || '',
    transaction_type: '',
    quantity_used: preselectedQuantity || '',
    grade_level: '',
    // subject removed
    classroom_id: '',
    academic_period: '',
    recipient_type: '',
    recipient_count: '',
    expected_usage_period: '',
    reason: ''
  });

  useEffect(() => {
    loadFormMetadata();
    loadSchoolItems();
  }, []);

  // Ensure preselected item is reflected if provided/changes
  useEffect(() => {
    if (preselectedItemId) {
      setFormData(prev => ({ ...prev, item_id: preselectedItemId }));
    }
  }, [preselectedItemId]);

  useEffect(() => {
    if (formData.item_id) {
      const item = schoolItems.find(item => item.id === parseInt(formData.item_id.toString()));
      setSelectedItem(item || null);
    }
  }, [formData.item_id, schoolItems]);

  const loadFormMetadata = async () => {
    try {
      // Backend route is mounted at /api and exposes /transaction-types
      const response = await api.get('/transaction-types');
      const data = response.data?.data || response.data; // support both wrapped and legacy
      
      setTransactionTypes(data.transaction_types || []);
      setRecipientTypes(data.recipient_types?.map((rt: any) => rt.value) || []);
      setGradeLevels(data.grade_levels || []);
      // subjects removed from UI
      setAcademicPeriods(data.academic_periods || []);
    } catch (error) {
      console.error('Error loading form metadata:', error);
      toast.error('Failed to load form options');
    }
  };

  const loadSchoolItems = async () => {
    try {
      const result = await schoolInventoryApi.getSchoolInventory(schoolId, 1, 100);
      if (result.success && result.data) {
        const items = result.data.items.map((item: any) => ({
          id: item.itemId,
          name: item.itemName,
          category: item.itemCategory,
          current_quantity: item.currentQuantity,
          unit: item.unitOfMeasure,
        })) as SchoolItem[];
        setSchoolItems(items.filter((it) => it.current_quantity > 0));
      } else {
        setSchoolItems([]);
      }
    } catch (error) {
      console.error('Error loading school items:', error);
      toast.error('Failed to load school inventory');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.item_id || !formData.transaction_type || !formData.quantity_used) {
      return 'Please fill in all required fields (Item, Transaction Type, and Quantity)';
    }

    const quantity = parseInt(formData.quantity_used.toString());
    if (isNaN(quantity) || quantity <= 0) {
      return 'Please enter a valid quantity greater than 0';
    }

    if (selectedItem && quantity > selectedItem.current_quantity) {
      return `Insufficient stock. Available: ${selectedItem.current_quantity}, Requested: ${quantity}`;
    }

    if (formData.recipient_count) {
      const recipientCount = parseInt(formData.recipient_count.toString());
      if (isNaN(recipientCount) || recipientCount <= 0) {
        return 'Please enter a valid recipient count greater than 0';
      }
    }

    if (formData.expected_usage_period) {
      const period = parseInt(formData.expected_usage_period.toString());
      if (isNaN(period) || period <= 0) {
        return 'Please enter a valid expected usage period greater than 0';
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

    setLoading(true);
    setError('');

    try {
      const normalize = (v: any) => (v === '' || v === undefined ? undefined : v);
      const submitData = {
        item_id: parseInt(formData.item_id.toString()),
        transaction_type: formData.transaction_type,
        quantity_used: parseInt(formData.quantity_used.toString()),
        grade_level: normalize(formData.grade_level),
        classroom_id: normalize(formData.classroom_id),
        academic_period: normalize(formData.academic_period),
        recipient_type: normalize(formData.recipient_type),
        recipient_count: formData.recipient_count ? parseInt(formData.recipient_count.toString()) : undefined,
        expected_usage_period: formData.expected_usage_period ? parseInt(formData.expected_usage_period.toString()) : undefined,
        reason: normalize(formData.reason),
      } as any;

      await api.post(`/schools/${schoolId}/utilization`, submitData);
      
      toast.success('Material utilization recorded successfully');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error recording utilization:', error);
      const errorMessage = error.response?.data?.error || 'Failed to record material utilization';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeRequiredFields = () => {
    if (!formData.transaction_type) return [];
    
    const distributionTypes = ['STUDENT_DISTRIBUTION', 'CLASSROOM_ALLOCATION', 'STAFF_ALLOCATION'];
    if (distributionTypes.includes(formData.transaction_type)) {
      return ['grade_level', 'recipient_type'];
    }
    
    return [];
  };

  const requiredFields = getTransactionTypeRequiredFields();

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Record Material Utilization
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="item_id" className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  Item *
                </Label>
                <Select value={formData.item_id.toString()} onValueChange={(value) => handleInputChange('item_id', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select an item" />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolItems.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.name} ({item.current_quantity} {item.unit} available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="transaction_type" className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  Transaction Type *
                </Label>
                <Select value={formData.transaction_type} onValueChange={(value) => handleInputChange('transaction_type', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                  <SelectContent>
                    {transactionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity_used" className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Quantity Used *
                </Label>
                <Input
                  id="quantity_used"
                  type="number"
                  min="1"
                  max={selectedItem?.current_quantity || undefined}
                  value={formData.quantity_used}
                  onChange={(e) => handleInputChange('quantity_used', e.target.value)}
                  placeholder="Enter quantity"
                  className="mt-1"
                />
                {selectedItem && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Available: {selectedItem.current_quantity} {selectedItem.unit}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="reason">
                  Reason/Notes
                </Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  placeholder="Optional explanation for this usage..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Context Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="grade_level" className={`flex items-center gap-1 ${requiredFields.includes('grade_level') ? 'text-red-600' : ''}`}>
                  <BookOpen className="h-4 w-4" />
                  Class {requiredFields.includes('grade_level') && '*'}
                </Label>
                <Select value={formData.grade_level} onValueChange={(value) => handleInputChange('grade_level', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeLevels.map((grade) => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedItem && (
                <p className="text-xs text-muted-foreground -mt-2">
                  Available now: {selectedItem.current_quantity} {selectedItem.unit}
                </p>
              )}

              

              <div>
                <Label htmlFor="recipient_type" className={`flex items-center gap-1 ${requiredFields.includes('recipient_type') ? 'text-red-600' : ''}`}>
                  <User className="h-4 w-4" />
                  Recipient Type {requiredFields.includes('recipient_type') && '*'}
                </Label>
                <Select value={formData.recipient_type} onValueChange={(value) => handleInputChange('recipient_type', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select recipient type" />
                  </SelectTrigger>
                  <SelectContent>
                    {recipientTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="recipient_count">
                  <Users className="h-4 w-4 inline mr-1" />
                  Number of Recipients
                </Label>
                <Input
                  id="recipient_count"
                  type="number"
                  min="1"
                  value={formData.recipient_count}
                  onChange={(e) => handleInputChange('recipient_count', e.target.value)}
                  placeholder="e.g., 30 students"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="classroom_id">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Classroom/Location
                  </Label>
                  <Input
                    id="classroom_id"
                    value={formData.classroom_id}
                    onChange={(e) => handleInputChange('classroom_id', e.target.value)}
                    placeholder="e.g., Room 101"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="academic_period">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Academic Period
                  </Label>
                  <Select value={formData.academic_period} onValueChange={(value) => handleInputChange('academic_period', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicPeriods.map((period) => (
                        <SelectItem key={period} value={period}>{period}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="expected_usage_period">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Expected Usage Period (days)
                </Label>
                <Input
                  id="expected_usage_period"
                  type="number"
                  min="1"
                  value={formData.expected_usage_period}
                  onChange={(e) => handleInputChange('expected_usage_period', e.target.value)}
                  placeholder="e.g., 30"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4 border-t">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Recording...' : 'Record Utilization'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default UtilizationEntryForm;
