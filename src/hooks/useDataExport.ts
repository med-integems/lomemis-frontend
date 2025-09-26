"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  UseDataExportOptions,
  UseDataExportReturn,
  ExportParams,
  ExportError,
  ExportErrorType,
  RetryOptions
} from "@/types/export";
import { CSVGenerator, validateCSVData, createFilename } from "@/lib/csv-utils";

// Default retry configuration
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 2,
  retryDelay: 1000,
  backoffMultiplier: 2
};

// Retry utility function
async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = DEFAULT_RETRY_OPTIONS
): Promise<T> {
  let lastError: Error = new Error('Operation failed');
  let delay = options.retryDelay;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === options.maxRetries) {
        break;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= options.backoffMultiplier;
    }
  }

  throw lastError;
}

// Error classification and user-friendly messages
const getErrorMessage = (error: any): { message: string; type: ExportErrorType; recoverable: boolean } => {
  console.log('Processing error in getErrorMessage:', error);
  
  if (error instanceof ExportError) {
    return {
      message: error.message,
      type: error.type,
      recoverable: error.recoverable
    };
  }

  // Handle axios/fetch errors
  if (error?.response) {
    const status = error.response.status;
    const data = error.response.data;
    
    if (status === 401) {
      return {
        message: 'Your session has expired. Please refresh the page and log in again.',
        type: ExportErrorType.AuthenticationError,
        recoverable: false
      };
    }
    
    if (status === 403) {
      return {
        message: 'You do not have permission to export this data.',
        type: ExportErrorType.PermissionError,
        recoverable: false
      };
    }
    
    if (status >= 500) {
      return {
        message: 'Server error occurred. Please try again later.',
        type: ExportErrorType.NetworkError,
        recoverable: true
      };
    }
    
    return {
      message: data?.error?.message || data?.message || `Request failed with status ${status}`,
      type: ExportErrorType.DataError,
      recoverable: true
    };
  }

  // Network errors
  if (error?.code === 'NETWORK_ERROR' || error?.name === 'NetworkError' || error?.message?.includes('fetch') || error?.message?.includes('Failed to fetch')) {
    return {
      message: 'Network connection failed. Please check your connection and try again.',
      type: ExportErrorType.NetworkError,
      recoverable: true
    };
  }

  // Authentication errors
  if (error?.status === 401 || error?.message?.includes('unauthorized') || error?.message?.includes('authentication')) {
    return {
      message: 'Your session has expired. Please refresh the page and log in again.',
      type: ExportErrorType.AuthenticationError,
      recoverable: false
    };
  }

  // Permission errors
  if (error?.status === 403 || error?.message?.includes('permission') || error?.message?.includes('forbidden')) {
    return {
      message: 'You do not have permission to export this data.',
      type: ExportErrorType.PermissionError,
      recoverable: false
    };
  }

  // Handle empty/null errors
  if (!error) {
    return {
      message: 'An unknown error occurred during export. Please check your network connection and try again.',
      type: ExportErrorType.DataError,
      recoverable: true
    };
  }

  // Handle object errors that don't match other patterns
  if (typeof error === 'object') {
    // Try to extract meaningful information from the error object
    if (error.message) {
      return {
        message: error.message,
        type: ExportErrorType.DataError,
        recoverable: true
      };
    }
    
    // Check if it's an empty object
    if (Object.keys(error).length === 0) {
      return {
        message: 'An unknown error occurred during export. Please check your network connection and try again.',
        type: ExportErrorType.DataError,
        recoverable: true
      };
    }
    
    // Try to stringify the error object for debugging
    try {
      const errorString = JSON.stringify(error, null, 2);
      console.error('Complex error object received:', errorString);
      
      // Return a user-friendly message but log the details
      return {
        message: 'An error occurred during export. Please try again or contact support if the issue persists.',
        type: ExportErrorType.DataError,
        recoverable: true
      };
    } catch (stringifyError) {
      console.error('Unable to stringify error object:', error);
      return {
        message: 'An error occurred during export. Please try again or contact support if the issue persists.',
        type: ExportErrorType.DataError,
        recoverable: true
      };
    }
  }

  // Default error
  let message = 'An unexpected error occurred during export.';
  if (typeof error === 'string') {
    message = error;
  } else if (error?.toString && typeof error.toString === 'function') {
    try {
      const stringified = error.toString();
      if (stringified !== '[object Object]') {
        message = stringified;
      }
    } catch (e) {
      // Keep default message if toString fails
    }
  }

  return {
    message,
    type: ExportErrorType.DataError,
    recoverable: true
  };
};

export function useDataExport<T>({
  apiCall,
  filename,
  headers,
  dataTransform,
  filterContext,
  maxRecords = 5000,
  chunkSize = 1000,
  onSuccess,
  onError,
  onProgress
}: UseDataExportOptions<T>): UseDataExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastExportCount, setLastExportCount] = useState(0);

  const updateProgress = useCallback((newProgress: number) => {
    setProgress(newProgress);
    onProgress?.(newProgress);
  }, [onProgress]);

  const exportData = useCallback(async (overrideParams?: ExportParams) => {
    if (isExporting) {
      return; // Prevent concurrent exports
    }

    setIsExporting(true);
    setError(null);
    setProgress(0);

    try {
      updateProgress(10);

      // Prepare API parameters
      const params: ExportParams = {
        maxRecords,
        limit: maxRecords,
        page: 1,
        filters: filterContext,
        ...overrideParams
      };

      updateProgress(20);

      // Fetch data with retry logic
      console.log('Making API call with params:', JSON.stringify(params, null, 2));
      const response = await withRetry(
        async () => {
          try {
            const result = await apiCall(params);
            console.log('API call successful, response:', JSON.stringify(result, null, 2));
            return result;
          } catch (apiError) {
            console.error('API call failed:', JSON.stringify(apiError, Object.getOwnPropertyNames(apiError), 2));
            console.error('API error type:', typeof apiError);
            console.error('API error details:', JSON.stringify({
              message: apiError?.message,
              status: apiError?.status,
              response: apiError?.response?.data || apiError?.response,
              stack: apiError?.stack
            }, null, 2));
            throw apiError;
          }
        },
        {
          ...DEFAULT_RETRY_OPTIONS,
          maxRetries: 2 // Fewer retries for export to avoid long waits
        }
      );

      console.log('API response received successfully:', JSON.stringify(response, null, 2));
      updateProgress(50);

      // Handle different API response structures
      let data: any;
      
      if (!response) {
        console.error('No response received from API');
        throw new ExportError(
          ExportErrorType.DataError,
          'No response received from API',
          true
        );
      }

      // Check if response has the expected structure { success: boolean, data: any }
      if (typeof response === 'object' && 'success' in response) {
        if (!response.success || !response.data) {
          console.error('API response indicates failure:', response);
          throw new ExportError(
            ExportErrorType.DataError,
            response.error?.message || 'API request failed',
            true
          );
        }
        data = response.data;
      } else if (Array.isArray(response)) {
        // Direct array response
        data = response;
      } else if (typeof response === 'object' && response.data) {
        // Response with data property but no success flag
        data = response.data;
      } else {
        // Unknown response structure
        console.error('Unexpected API response structure:', response);
        throw new ExportError(
          ExportErrorType.DataError,
          'Unexpected API response format',
          true
        );
      }

      // Handle nested data structures (common in paginated APIs)
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        console.log('Data is object, looking for array property:', data);
        
        // Common nested properties where actual data arrays might be
        const possibleArrayProps = ['items', 'data', 'results', 'records', 'list', 'inventory', 'distributions'];
        
        for (const prop of possibleArrayProps) {
          if (data[prop] && Array.isArray(data[prop])) {
            console.log(`Found array data in ${prop} property:`, data[prop]);
            data = data[prop];
            break;
          }
        }
        
        // If still not an array, check if it's a single item that should be wrapped
        if (!Array.isArray(data)) {
          console.log('Data is still not an array, treating as single item:', data);
          data = [data];
        }
      }
      updateProgress(60);

      // Validate data
      if (!Array.isArray(data) || data.length === 0) {
        // This is a normal scenario, not an error - just inform the user
        const message = 'No data available to export';
        onError?.(message);
        toast.info(message);
        return; // Exit gracefully without throwing
      }

      // Limit records if necessary
      if (data.length > maxRecords) {
        data = data.slice(0, maxRecords);
        toast.info(`Export limited to ${maxRecords} records`);
      }

      updateProgress(70);

      // Transform data
      let transformedData: string[][];
      try {
        transformedData = dataTransform(data);
      } catch (transformError) {
        throw new ExportError(
          ExportErrorType.ValidationError,
          'Failed to transform data for export',
          true
        );
      }

      updateProgress(80);

      // Validate CSV structure
      const validation = validateCSVData(headers, transformedData);
      if (!validation.isValid) {
        console.warn('CSV validation warnings:', validation.errors);
        // Continue with export but log warnings
      }

      // Generate filename
      const finalFilename = typeof filename === 'function' 
        ? filename(data) 
        : filename;

      updateProgress(90);

      // Generate and download CSV
      const csvContent = CSVGenerator.generate(headers, transformedData, {
        encoding: 'utf-8-bom' // Ensure Excel compatibility
      });

      CSVGenerator.downloadCSV(csvContent, finalFilename);

      updateProgress(100);

      // Success handling
      const recordCount = data.length;
      setLastExportCount(recordCount);
      
      onSuccess?.(recordCount);
      toast.success(`Successfully exported ${recordCount} records`);

    } catch (err: any) {
      // Only log actual errors, not normal "no data" scenarios
      if (err instanceof ExportError && err.message === 'No data available to export') {
        // This was already handled above, but if it somehow gets here, handle gracefully
        const message = 'No data available to export';
        onError?.(message);
        toast.info(message);
        return;
      }
      
      // Log actual errors
      console.error('Export error details:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
      console.error('Error type:', typeof err);
      console.error('Error message:', err instanceof Error ? err.message : String(err));
      
      const errorInfo: any = getErrorMessage(err as any);
      
      setError(errorInfo.message);
      onError?.(errorInfo.message);
      
      toast.error(errorInfo.message);
      
      console.error('Export failed:', JSON.stringify({
        originalError: err,
        errorInfo,
        type: errorInfo.type,
        recoverable: errorInfo.recoverable
      }, Object.getOwnPropertyNames(err), 2));

    } finally {
      setIsExporting(false);
      // Keep progress at 100 if successful, reset to 0 if failed
      if (!error) {
        setTimeout(() => setProgress(0), 2000); // Reset after 2 seconds
      } else {
        setProgress(0);
      }
    }
  }, [
    apiCall,
    filename,
    headers,
    dataTransform,
    filterContext,
    maxRecords,
    isExporting,
    onSuccess,
    onError,
    updateProgress,
    error
  ]);

  const reset = useCallback(() => {
    setError(null);
    setProgress(0);
    setLastExportCount(0);
  }, []);

  return {
    exportData,
    isExporting,
    progress,
    error,
    lastExportCount,
    reset
  };
}

// Filtered export hook that applies client-side filtering
export function useFilteredExport<T>({
  getCurrentFilters,
  applyFilters,
  includeFiltersInAPI = false,
  ...baseOptions
}: UseDataExportOptions<T> & {
  getCurrentFilters: () => import("@/types/export").FilterState;
  applyFilters?: (data: T[], filters: import("@/types/export").FilterState) => T[];
  includeFiltersInAPI?: boolean;
}): UseDataExportReturn {
  
  // Wrap the original API call to handle filtering
  const wrappedApiCall = useCallback(async (params?: ExportParams) => {
    const currentFilters = getCurrentFilters();
    
    if (includeFiltersInAPI) {
      // Pass filters to API
      return baseOptions.apiCall({
        ...params,
        filters: { ...currentFilters, ...params?.filters }
      });
    } else {
      // Apply filters client-side
      const response = await baseOptions.apiCall(params);
      
      if (response && response.success && response.data && applyFilters) {
        // Extract the actual array data from the response (handle nested structures)
        let dataToFilter = response.data;
        
        // Handle nested data structures (same logic as in main export function)
        if (dataToFilter && typeof dataToFilter === 'object' && !Array.isArray(dataToFilter)) {
          console.log('Filtering: Data is object, looking for array property:', dataToFilter);
          
          const possibleArrayProps = ['items', 'data', 'results', 'records', 'list', 'inventory', 'distributions'];
          
          for (const prop of possibleArrayProps) {
            if (dataToFilter[prop] && Array.isArray(dataToFilter[prop])) {
              console.log(`Filtering: Found array data in ${prop} property`);
              dataToFilter = dataToFilter[prop];
              break;
            }
          }
        }
        
        // Only apply filters if we have an array
        if (Array.isArray(dataToFilter)) {
          const filteredData = applyFilters(dataToFilter, currentFilters);
          
          // Reconstruct the response with the filtered data
          if (response.data.items) {
            return {
              ...response,
              data: {
                ...response.data,
                items: filteredData
              }
            };
          } else {
            return {
              ...response,
              data: filteredData
            };
          }
        }
      }
      
      return response;
    }
  }, [baseOptions.apiCall, getCurrentFilters, applyFilters, includeFiltersInAPI]);

  // Use the base export hook with wrapped API call
  return useDataExport({
    ...baseOptions,
    apiCall: wrappedApiCall
  });
}
