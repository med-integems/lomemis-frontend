// Export system type definitions

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ExportParams {
  filters?: FilterState;
  maxRecords?: number;
  page?: number;
  limit?: number;
}

export interface FilterState {
  searchTerm?: string;
  category?: string;
  status?: string;
  statusFilter?: string;
  supplierTypeFilter?: string;
  warehouseFilter?: string;
  startDate?: string;
  endDate?: string;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  customFilters?: Record<string, any>;
}

export interface UseDataExportOptions<T> {
  // API integration
  apiCall: (params?: ExportParams) => Promise<ApiResponse<T[]>>;
  
  // Data transformation
  filename: string | ((data: T[]) => string);
  headers: string[];
  dataTransform: (data: T[]) => string[][];
  
  // Optional configurations
  filterContext?: FilterState;
  maxRecords?: number;
  chunkSize?: number;
  
  // Callbacks
  onSuccess?: (recordCount: number) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

export interface UseDataExportReturn {
  exportData: (overrideParams?: ExportParams) => Promise<void>;
  isExporting: boolean;
  progress: number;
  error: string | null;
  lastExportCount: number;
  reset: () => void;
}

export interface FilteredExportOptions<T> extends UseDataExportOptions<T> {
  // Get current filter state from component
  getCurrentFilters: () => FilterState;
  
  // Apply filters to data (client-side)
  applyFilters?: (data: T[], filters: FilterState) => T[];
  
  // Pass filters to API (server-side)
  includeFiltersInAPI?: boolean;
}

export interface CSVOptions {
  delimiter?: string;
  lineEnding?: string;
  escapeQuotes?: boolean;
  includeHeaders?: boolean;
  encoding?: 'utf-8' | 'utf-8-bom';
}

export enum ExportErrorType {
  NetworkError = 'network',
  AuthenticationError = 'auth',
  PermissionError = 'permission',
  DataError = 'data',
  ValidationError = 'validation',
  GenerationError = 'generation'
}

export class ExportError extends Error {
  constructor(
    public type: ExportErrorType,
    message: string,
    public recoverable: boolean = false
  ) {
    super(message);
    this.name = 'ExportError';
  }
}

export interface RetryOptions {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
}