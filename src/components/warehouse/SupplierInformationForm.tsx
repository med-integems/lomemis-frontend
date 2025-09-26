"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, Phone, MapPin, FileText, Info } from "lucide-react";

export type SupplierType =
  | "GOVERNMENT"
  | "NGO"
  | "CHARITY"
  | "INTERNATIONAL_DONOR"
  | "PRIVATE_COMPANY"
  | "INDIVIDUAL_DONOR"
  | "OTHER";

export interface SupplierInformation {
  supplierName?: string;
  supplierContact?: string;
  supplierType?: SupplierType;
  supplierOrganization?: string;
  supplierAddress?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  deliveryReference?: string;
  supplierNotes?: string;
}

interface SupplierInformationFormProps {
  value: SupplierInformation;
  onChange: (value: SupplierInformation) => void;
  className?: string;
  onAttachmentChange?: (file: File | null) => void;
  attachmentFileName?: string;
  requireDeliveryReference?: boolean;
  requireAttachment?: boolean;
}

const SUPPLIER_TYPES: {
  value: SupplierType;
  label: string;
  description: string;
  color: string;
}[] = [
  {
    value: "GOVERNMENT",
    label: "Government Supplier",
    description: "Government procurement and official suppliers",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "NGO",
    label: "NGO",
    description: "Non-governmental organizations",
    color: "bg-green-100 text-green-800",
  },
  {
    value: "CHARITY",
    label: "Charitable Organization",
    description: "Charitable foundations and organizations",
    color: "bg-purple-100 text-purple-800",
  },
  {
    value: "INTERNATIONAL_DONOR",
    label: "International Donor",
    description: "International aid organizations and donors",
    color: "bg-orange-100 text-orange-800",
  },
  {
    value: "PRIVATE_COMPANY",
    label: "Private Company",
    description: "Private sector suppliers and companies",
    color: "bg-gray-100 text-gray-800",
  },
  {
    value: "INDIVIDUAL_DONOR",
    label: "Individual Donor",
    description: "Individual donations and contributions",
    color: "bg-pink-100 text-pink-800",
  },
  {
    value: "OTHER",
    label: "Other",
    description: "Other types of suppliers or sources",
    color: "bg-yellow-100 text-yellow-800",
  },
];

export function SupplierInformationForm({
  value,
  onChange,
  className = "",
  onAttachmentChange,
  attachmentFileName,
  requireDeliveryReference = false,
  requireAttachment = false,
}: SupplierInformationFormProps) {
  const handleFieldChange = (
    field: keyof SupplierInformation,
    newValue: string
  ) => {
    onChange({
      ...value,
      [field]: newValue || undefined,
    });
  };

  const getSupplierTypeInfo = (type?: SupplierType) => {
    return SUPPLIER_TYPES.find((t) => t.value === type);
  };

  const selectedTypeInfo = getSupplierTypeInfo(value.supplierType);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Supplier Information
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter details about the supplier or source of the materials. All
          fields are optional but recommended for better tracking.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Supplier Type - Most Important Field */}
        <div>
          <Label htmlFor="supplierType" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Supplier Type
          </Label>
          <Select
            value={value.supplierType || ""}
            onValueChange={(newValue) =>
              handleFieldChange("supplierType", newValue)
            }
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Select supplier type" />
            </SelectTrigger>
            <SelectContent>
              {SUPPLIER_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <Badge className={type.color} variant="secondary">
                      {type.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {type.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTypeInfo && (
            <div className="mt-2">
              <Badge className={selectedTypeInfo.color} variant="secondary">
                {selectedTypeInfo.label}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedTypeInfo.description}
              </p>
            </div>
          )}
        </div>

        {/* Basic Supplier Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="supplierName">Organization Short Name</Label>
            <Input
              id="supplierName"
              value={value.supplierName || ""}
              onChange={(e) =>
                handleFieldChange("supplierName", e.target.value)
              }
              placeholder="e.g., EduBooks SL, MEST, UNICEF"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Common or abbreviated name used for the organization
            </p>
          </div>

          <div>
            <Label htmlFor="supplierOrganization">Organization Full Name</Label>
            <Input
              id="supplierOrganization"
              value={value.supplierOrganization || ""}
              onChange={(e) =>
                handleFieldChange("supplierOrganization", e.target.value)
              }
              placeholder="e.g., Educational Books Sierra Leone Limited"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Complete legal or official name of the organization
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="supplierEmail" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="supplierEmail"
              type="email"
              value={value.supplierEmail || ""}
              onChange={(e) =>
                handleFieldChange("supplierEmail", e.target.value)
              }
              placeholder="supplier@example.com"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="supplierPhone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number
            </Label>
            <Input
              id="supplierPhone"
              type="tel"
              value={value.supplierPhone || ""}
              onChange={(e) =>
                handleFieldChange("supplierPhone", e.target.value)
              }
              placeholder="+232 XX XXX XXXX"
              className="mt-1"
            />
          </div>
        </div>

        {/* Legacy Contact Field for backwards compatibility */}
        <div>
          <Label htmlFor="supplierContact">Primary Contact</Label>
          <Input
            id="supplierContact"
            value={value.supplierContact || ""}
            onChange={(e) =>
              handleFieldChange("supplierContact", e.target.value)
            }
            placeholder="Primary contact person or method"
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Main contact person or preferred contact method
          </p>
        </div>

        {/* Address */}
        <div>
          <Label htmlFor="supplierAddress" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Address
          </Label>
          <Textarea
            id="supplierAddress"
            value={value.supplierAddress || ""}
            onChange={(e) =>
              handleFieldChange("supplierAddress", e.target.value)
            }
            placeholder="Enter complete address"
            rows={2}
            className="mt-1"
          />
        </div>

        {/* Delivery Reference + Attachment */}
        <div>
          <Label
            htmlFor="deliveryReference"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {`Delivery Reference${requireDeliveryReference ? ' *' : ''}`}
          </Label>
          <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2 items-start">
            <Input
              id="deliveryReference"
              value={value.deliveryReference || ""}
              onChange={(e) =>
                handleFieldChange("deliveryReference", e.target.value)
              }
              placeholder="PO number, invoice number, or delivery note reference"
              required={requireDeliveryReference}
            />
            {onAttachmentChange && (
              <div>
                <Input
                  id="deliveryAttachment"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => onAttachmentChange(e.target.files?.[0] || null)}
                  required={requireAttachment}
                />
                {attachmentFileName && (
                  <p className="text-xs text-muted-foreground mt-1 truncate" title={attachmentFileName}>
                    Selected: {attachmentFileName}
                  </p>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {requireDeliveryReference || requireAttachment
              ? 'Purchase order, invoice, or delivery note reference number. Attach the delivery note (PDF/JPG/PNG/WebP, max 10MB).'
              : 'Purchase order, invoice, or delivery note reference number. Optionally attach a PDF or image.'}
          </p>
        </div>

        {/* Additional Notes */}
        <div>
          <Label htmlFor="supplierNotes">Additional Notes</Label>
          <Textarea
            id="supplierNotes"
            value={value.supplierNotes || ""}
            onChange={(e) => handleFieldChange("supplierNotes", e.target.value)}
            placeholder="Any additional information about the supplier or delivery"
            rows={3}
            className="mt-1"
          />
        </div>

        {/* Information Panel */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">
                Flexible Supplier Management
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                This system supports materials from various sources including
                government suppliers, NGO donations, charitable organizations,
                international donors, and individual contributions. All fields
                are optional but help maintain better records and
                accountability.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SupplierInformationForm;
