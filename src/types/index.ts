// User and Authentication Types
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  localCouncilId?: number;
  warehouseId?: number;
  schoolId?: number;
  district?: string;
  localCouncilName?: string;
  warehouseName?: string;
  schoolName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole =
  | "super_admin"
  | "system_admin"
  | "national_manager"
  | "lc_officer"
  | "district_officer"
  | "school_rep"
  | "view_only";

// Navigation Types
export interface NavigationItem {
  title: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  roles: (UserRole | "all")[];
  items?: NavigationItem[];
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;
    timestamp: string;
  };
}

// Common Entity Types (will be expanded in future tasks)
export interface Item {
  id: number;
  name: string;
  code: string;
  description?: string;
  category?: string;
  unitOfMeasure: string;
  standardCost?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: number;
  name: string;
  location?: string;
  address?: string;
  managerName?: string;
  contactPhone?: string;
  contactEmail?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseRequest {
  name: string;
  location?: string;
  address?: string;
  managerName?: string;
  contactPhone?: string;
  contactEmail?: string;
  isActive?: boolean;
}

export interface UpdateWarehouseRequest {
  name?: string;
  location?: string;
  address?: string;
  managerName?: string;
  contactPhone?: string;
  contactEmail?: string;
  isActive?: boolean;
}

export interface WarehouseFilters {
  search?: string;
  isActive?: boolean;
}

export interface LocalCouncil {
  id: number;
  name: string;
  code?: string;
  region?: string;
  district?: string;
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface School {
  id: number;
  name: string;
  code?: string;
  emisCode?: string;
  localCouncilId: number;
  address?: string;
  town?: string;
  section?: string;
  chiefdom?: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  principalName?: string;
  contactPhone?: string;
  contactEmail?: string;
  schoolType: "PRIMARY" | "SECONDARY" | "COMBINED";
  enrollmentCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  localCouncilName?: string;
}

// National Inventory Types
export interface NationalInventoryItem {
  itemId: number;
  itemName: string;
  itemCode: string;
  itemDescription?: string;
  category?: string;
  unitOfMeasure: string;
  warehouseId: number;
  warehouseName: string;
  quantityOnHand: number;
  reservedQuantity: number;
  availableQuantity: number;
  minimumStockLevel: number;
  lastUpdated: string;
  isLowStock: boolean;
}

export interface NationalInventorySummary {
  itemId: number;
  itemName: string;
  itemCode: string;
  itemDescription?: string;
  category?: string;
  unitOfMeasure: string;
  totalQuantityOnHand: number;
  totalReservedQuantity: number;
  totalAvailableQuantity: number;
  minimumStockLevel: number;
  warehouseCount: number;
  isLowStock: boolean;
  warehouses: {
    warehouseId: number;
    warehouseName: string;
    quantityOnHand: number;
    reservedQuantity: number;
    availableQuantity: number;
    lastUpdated: string;
  }[];
}

export interface InventoryMovementHistory {
  transactionId: number;
  transactionType: string;
  itemId: number;
  itemName: string;
  itemCode: string;
  warehouseId: number;
  warehouseName: string;
  quantity: number;
  referenceType: string;
  referenceId: number;
  referenceNumber?: string;
  userId: number;
  userName: string;
  notes?: string;
  transactionDate: string;
}

// Stock Receipt Types
export type SupplierType =
  | "GOVERNMENT"
  | "NGO"
  | "CHARITY"
  | "INTERNATIONAL_DONOR"
  | "PRIVATE_COMPANY"
  | "INDIVIDUAL_DONOR"
  | "OTHER";
export type ReceiptStatus = "DRAFT" | "RECEIVED" | "VALIDATED" | "DISCREPANCY";
export type ConditionStatus = "NEW" | "GOOD" | "FAIR" | "DAMAGED";
export type QualityStatus = "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "DAMAGED";

export interface StockReceipt {
  id: number;
  warehouseId: number;
  receiptNumber: string;
  supplierName?: string;
  supplierContact?: string;
  supplierType?: SupplierType;
  supplierOrganization?: string;
  supplierAddress?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  deliveryReference?: string;
  supplierNotes?: string;
  status?: ReceiptStatus;
  validationDate?: string;
  validatedBy?: number;
  discrepancyNotes?: string;
  receiptDate: string;
  totalItems: number;
  notes?: string;
  receivedBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockReceiptItem {
  id: number;
  receiptId: number;
  itemId: number;
  quantityReceived: number;
  unitCost?: number;
  totalCost?: number;
  expiryDate?: string;
  batchNumber?: string;
  notes?: string;
  conditionStatus?: ConditionStatus;
  qualityChecked?: boolean;
  inspectorNotes?: string;
}

export interface CreateStockReceiptRequest {
  warehouseId: number;
  supplierName?: string;
  supplierContact?: string;
  supplierType?: SupplierType;
  supplierOrganization?: string;
  supplierAddress?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  deliveryReference?: string;
  supplierNotes?: string;
  receiptDate: Date | string;
  notes?: string;
  items: CreateStockReceiptItemRequest[];
}

export interface CreateStockReceiptItemRequest {
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

export interface QualityCheck {
  id: number;
  receiptId: number;
  itemId: number;
  quantityChecked: number;
  qualityStatus: QualityStatus;
  conditionNotes?: string;
  inspectorId: number;
  inspectionDate: string;
  photosCount?: number;
  correctiveAction?: string;
  createdAt: string;
  updatedAt: string;
  itemName: string;
  itemCode: string;
  inspectorName: string;
  receiptNumber: string;
}

export interface CreateQualityCheckRequest {
  receiptId: number;
  itemId: number;
  quantityChecked: number;
  qualityStatus: QualityStatus;
  conditionNotes?: string;
  photosCount?: number;
  correctiveAction?: string;
}

export interface ValidateReceiptRequest {
  receiptId: number;
  status: ReceiptStatus;
  discrepancyNotes?: string;
}

export interface StockReceiptWithDetails extends StockReceipt {
  warehouseName: string;
  receivedByName: string;
  validatedByName?: string;
  items: StockReceiptItemWithDetails[];
}

export interface StockReceiptItemWithDetails extends StockReceiptItem {
  itemName: string;
  itemCode: string;
  unitOfMeasure: string;
}

// Attachments (frontend)
export type AttachmentType = 'INVOICE' | 'PURCHASE_ORDER' | 'DELIVERY_NOTE' | 'PHOTO' | 'QUALITY_PHOTO' | 'OTHER';

export interface ReceiptAttachment {
  id: number;
  receiptId: number;
  originalName: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  attachmentType: AttachmentType;
  uploadedBy: number;
  uploadedAt: string;
  downloadUrl?: string;
}

// Pagination and Filter Types
export interface PaginatedResponse<T> {
  items?: T[];
  receipts?: StockReceiptWithDetails[];
  movements?: InventoryMovementHistory[] | CouncilStockMovement[];
  inventory?: CouncilInventoryItem[];
  shipments?: ShipmentWithDetails[] | ShipmentSummary[];
  distributions?: DistributionWithDetails[];
  directShipments?: DirectShipmentWithDetails[];
  total: number;
  page: number;
  limit: number;
}

export interface NationalInventoryFilters {
  search?: string;
  category?: string;
  warehouseId?: number;
  lowStockOnly?: boolean;
  itemId?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface InventoryMovementFilters {
  itemId?: number;
  warehouseId?: number;
  transactionType?: string;
  referenceType?: string;
  startDate?: string;
  endDate?: string;
  userId?: number;
}

export interface StockReceiptFilters {
  warehouseId?: number;
  supplierName?: string;
  supplierType?: SupplierType;
  status?: ReceiptStatus;
  startDate?: string;
  endDate?: string;
  receivedBy?: number;
  validatedBy?: number;
}

// Council Inventory Types
export interface CouncilInventoryItem {
  itemId: number;
  itemName: string;
  itemCode: string;
  itemDescription?: string;
  category?: string;
  unitOfMeasure: string;
  councilId: number;
  councilName: string;
  quantityOnHand: number;
  reservedQuantity: number;
  availableQuantity: number;
  minimumStockLevel: number;
  lastUpdated: string;
  isLowStock: boolean;
}

export interface CouncilStockMovement {
  transactionId: number;
  transactionType: "SHIPMENT_RECEIVED" | "DISTRIBUTION" | "ADJUSTMENT";
  itemId: number;
  itemName: string;
  itemCode: string;
  councilId: number;
  councilName: string;
  quantity: number;
  balanceAfter: number;
  referenceType: "SHIPMENT" | "DISTRIBUTION" | "ADJUSTMENT";
  referenceId: number;
  referenceNumber?: string;
  userId: number;
  userName: string;
  notes?: string;
  transactionDate: string;
}

export interface CouncilInventoryFilters {
  search?: string;
  category?: string;
  councilId?: number;
  lowStockOnly?: boolean;
  itemId?: number;
}

export interface CouncilMovementFilters {
  itemId?: number;
  councilId?: number;
  transactionType?: string;
  referenceType?: string;
  startDate?: string;
  endDate?: string;
  userId?: number;
}

// Shipment Types
export interface Shipment {
  id: number;
  shipmentNumber: string;
  originWarehouseId: number;
  destinationCouncilId: number;
  status: "DRAFT" | "IN_TRANSIT" | "RECEIVED" | "DISCREPANCY";
  dispatchDate?: string;
  expectedArrivalDate?: string;
  actualArrivalDate?: string;
  totalItems: number;
  notes?: string;
  discrepancyNotes?: string;
  createdBy: number;
  dispatchedBy?: number;
  receivedBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentItem {
  id: number;
  shipmentId: number;
  itemId: number;
  quantityShipped: number;
  quantityReceived?: number;
  discrepancyQuantity?: number;
  notes?: string;
}

export interface CreateShipmentRequest {
  originWarehouseId: number;
  destinationCouncilId: number;
  expectedArrivalDate?: string;
  notes?: string;
  items: CreateShipmentItemRequest[];
}

export interface CreateShipmentItemRequest {
  itemId: number;
  quantityShipped: number;
  notes?: string;
}

export interface ConfirmReceiptRequest {
  actualArrivalDate?: string;
  items: ReceiptItemRequest[];
  discrepancyNotes?: string;
}

export interface ReceiptItemRequest {
  itemId: number;
  quantityReceived: number;
  notes?: string;
}

export interface UpdateStatusRequest {
  status: "IN_TRANSIT" | "RECEIVED" | "DISCREPANCY";
  notes?: string;
}

export interface ShipmentWithDetails extends Shipment {
  originWarehouseName: string;
  destinationCouncilName: string;
  createdByName: string;
  dispatchedByName?: string;
  receivedByName?: string;
  items: ShipmentItemWithDetails[];
}

export interface ShipmentItemWithDetails extends ShipmentItem {
  itemName: string;
  itemCode: string;
  unitOfMeasure: string;
}

export interface ShipmentSummary {
  id: number;
  shipmentNumber: string;
  originWarehouseName: string;
  destinationCouncilName: string;
  status: string;
  dispatchDate?: string;
  expectedArrivalDate?: string;
  totalItems: number;
  createdAt: string;
}

export interface ShipmentFilters {
  status?: string;
  originWarehouseId?: number;
  destinationCouncilId?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// Distribution Types
export interface Distribution {
  id: number;
  distributionNumber: string;
  localCouncilId: number;
  schoolId: number;
  status: "CREATED" | "CONFIRMED" | "DISCREPANCY";
  distributionDate: string;
  confirmationDate?: string;
  totalItems: number;
  notes?: string;
  discrepancyNotes?: string;
  createdBy: number;
  confirmedBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DistributionItem {
  id: number;
  distributionId: number;
  itemId: number;
  quantityDistributed: number;
  quantityConfirmed?: number;
  discrepancyQuantity?: number;
  notes?: string;
}

export interface CreateDistributionRequest {
  localCouncilId: number;
  schoolId: number;
  distributionDate: string;
  notes?: string;
  items: CreateDistributionItemRequest[];
}

export interface CreateDistributionItemRequest {
  itemId: number;
  quantityDistributed: number;
  notes?: string;
}

export interface UpdateDistributionRequest {
  status?: "CREATED" | "CONFIRMED" | "DISCREPANCY";
  confirmationDate?: string;
  discrepancyNotes?: string;
  items?: UpdateDistributionItemRequest[];
}

export interface UpdateDistributionItemRequest {
  itemId: number;
  quantityConfirmed: number;
  notes?: string;
}

export interface DistributionWithDetails extends Distribution {
  localCouncilName: string;
  schoolName: string;
  schoolCode?: string;
  councilName: string;
  createdByName: string;
  confirmedByName?: string;
  distributedByName?: string;
  confirmedDate?: string;
  items: DistributionItemWithDetails[];
}

export interface DistributionItemWithDetails extends DistributionItem {
  itemName: string;
  itemCode: string;
  unitOfMeasure: string;
}

export interface DistributionFilters {
  localCouncilId?: number;
  schoolId?: number;
  schoolType?: "PRIMARY" | "SECONDARY" | "COMBINED";
  status?: "CREATED" | "CONFIRMED" | "DISCREPANCY";
  startDate?: string;
  endDate?: string;
  createdBy?: number;
  search?: string;
}

export interface DistributionSummary {
  totalDistributions: number;
  confirmedDistributions: number;
  pendingDistributions: number;
  discrepancyDistributions: number;
  totalItemsDistributed: number;
  totalSchoolsServed: number;
}

// Direct Shipment Types
export type ShipmentStatus =
  | "pending"
  | "dispatched"
  | "in_transit"
  | "delivered"
  | "confirmed"
  | "cancelled";
export type ShipmentType =
  | "emergency"
  | "special_program"
  | "direct_allocation"
  | "pilot_program"
  | "disaster_relief";
export type PriorityLevel = "low" | "normal" | "high" | "urgent" | "critical";

export interface DirectShipment {
  id: number;
  referenceNumber: string;
  warehouseId: number;
  schoolId: number;
  status: ShipmentStatus;
  shipmentType: ShipmentType;
  priorityLevel: PriorityLevel;
  dispatchDate?: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  dispatchUserId?: number;
  receivingUserId?: number;
  authorizedBy: number;
  authorizationReason: string;
  transportMethod?: string;
  trackingNumber?: string;
  deliveryInstructions?: string;
  notes?: string;
  totalItems: number;
  createdAt: string;
  updatedAt: string;
}

export interface DirectShipmentItem {
  id: number;
  directShipmentId: number;
  itemId: number;
  quantityShipped: number;
  quantityReceived?: number;
  unitCost?: number;
  conditionOnDispatch?: string;
  conditionOnReceipt?: string;
  conditionNotes?: string;
  expiryDate?: string;
  batchNumber?: string;
  serialNumbers?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DirectShipmentWithDetails extends DirectShipment {
  warehouseName: string;
  schoolName: string;
  schoolCode: string;
  authorizedByName: string;
  dispatchUserName?: string;
  receivingUserName?: string;
  items: DirectShipmentItemWithDetails[];
}

export interface DirectShipmentItemWithDetails extends DirectShipmentItem {
  itemName: string;
  itemCode: string;
  itemCategory?: string;
  unitOfMeasure: string;
}

export interface CreateDirectShipmentRequest {
  warehouseId: number;
  schoolId: number;
  shipmentType: ShipmentType;
  priorityLevel: PriorityLevel;
  expectedDeliveryDate?: string;
  authorizationReason: string;
  transportMethod?: string;
  deliveryInstructions?: string;
  notes?: string;
  items: CreateDirectShipmentItemRequest[];
}

export interface CreateDirectShipmentItemRequest {
  itemId: number;
  quantityShipped: number;
  unitCost?: number;
  conditionOnDispatch?: string;
  conditionNotes?: string;
  expiryDate?: string;
  batchNumber?: string;
  serialNumbers?: string;
}

export interface UpdateDirectShipmentStatusRequest {
  status: ShipmentStatus;
  dispatchDate?: string;
  actualDeliveryDate?: string;
  transportMethod?: string;
  trackingNumber?: string;
  notes?: string;
}

export interface ConfirmDirectShipmentReceiptRequest {
  actualDeliveryDate: string;
  receivingUserId?: number;
  notes?: string;
  items: ConfirmDirectShipmentItemRequest[];
}

export interface ConfirmDirectShipmentItemRequest {
  itemId: number;
  quantityReceived: number;
  conditionOnReceipt?: string;
  conditionNotes?: string;
}

export interface DirectShipmentFilters {
  warehouseId?: number;
  schoolId?: number;
  status?: ShipmentStatus;
  shipmentType?: ShipmentType;
  priorityLevel?: PriorityLevel;
  authorizedBy?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface DirectShipmentSummary {
  totalShipments: number;
  pendingShipments: number;
  dispatchedShipments: number;
  inTransitShipments: number;
  deliveredShipments: number;
  confirmedShipments: number;
  totalItemsShipped: number;
  averageDeliveryTime?: number;
  shipmentsByType: Record<ShipmentType, number>;
  shipmentsByPriority: Record<PriorityLevel, number>;
}

// School Import Types
export interface SchoolImportUploadOptions {
  dryRun?: boolean;
  authoritative?: boolean;
}

export interface SchoolImportUploadResult {
  importRunId: number;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  totalRows: number;
  previewRows: SchoolStagingRowRecord[];
  estimatedDuration: string;
}

export interface ImportRunRecord {
  id: number;
  importType: "SCHOOLS_BULK" | "SCHOOLS_UPDATE";
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  fileHash: string;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  errorRows: number;
  status: "UPLOADED" | "PROCESSING" | "READY_FOR_REVIEW" | "READY_TO_COMMIT" | "COMMITTED" | "CANCELLED" | "FAILED" | "ROLLED_BACK";
  dryRun: boolean;
  authoritative: boolean;
  errorSummary?: any;
  validationSummary?: any;
  startedBy: number;
  startedAt: string;
  completedAt?: string;
}

export interface SchoolStagingRowRecord {
  id: number;
  importRunId: number;
  fileRowNumber: number;
  region?: string;
  district?: string;
  council?: string;
  chiefdom?: string;
  section?: string;
  town?: string;
  schoolType?: string;
  schoolName?: string;
  emisCode?: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  rawPayload: Record<string, unknown>;
  normalizedPayload?: Record<string, unknown>;
  mappedCouncilId?: number;
  matchType: "NONE" | "EXACT" | "ALIAS" | "FUZZY" | "MANUAL";
  matchConfidence?: number;
  matchSourceAliasId?: number;
  validationStatus: "PENDING" | "VALID" | "ERROR" | "REQUIRES_REVIEW";
  validationErrors?: Array<Record<string, unknown>>;
  reviewNotes?: string;
  reviewedBy?: number;
  reviewedAt?: string;
  isDuplicate: boolean;
  isGeoOutlier: boolean;
  actionTaken: "NONE" | "INSERTED" | "UPDATED" | "SKIPPED";
  schoolId?: number;
  createdAt: string;
}

export interface ImportStatusSummary {
  importRun: ImportRunRecord;
  progress: {
    processed: number;
    successful: number;
    errors: number;
    total: number;
    percentage: number;
  };
  validationSummary: {
    validRows: number;
    errorRows: number;
    reviewRequiredRows: number;
  };
  councilMappingSummary: {
    exactMatches: number;
    aliasMatches: number;
    fuzzyMatches: number;
    manualMatches: number;
    unchecked: number;
  };
}

export interface ImportRowsFilters {
  status?: "PENDING" | "VALID" | "ERROR" | "REQUIRES_REVIEW";
  matchMethod?: "NONE" | "EXACT" | "ALIAS" | "FUZZY" | "MANUAL";
  hasErrors?: boolean;
}

export interface ImportRowsResponse {
  rows: SchoolStagingRowRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CouncilHierarchy {
  regions: Array<{
    name: string;
    districts: Array<{
      name: string;
      councils: Array<{
        id: number;
        name: string;
        code: string;
      }>;
    }>;
  }>;
}

export interface ResolveCouncilRequest {
  stagingRowIds: number[];
  councilId: number;
  createAlias?: boolean;
  aliasName?: string;
}

export interface ResolveCouncilResponse {
  rows: SchoolStagingRowRecord[];
}

export interface CommitImportRequest {
  confirmOverwrites?: boolean;
}

export interface CommitImportResponse {
  inserted: number;
  updated: number;
  skipped: number;
}

export interface CancelImportResponse {
  success: boolean;
}

export interface RollbackImportResponse {
  reverted: number;
}
