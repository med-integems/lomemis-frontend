import axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from "axios";
import { ApiResponse } from "@/types";
import { toast } from "sonner";

// Extend AxiosRequestConfig to include metadata
declare module "axios" {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: number;
      requestId: string;
      [key: string]: any;
    };
  }
}

// Create axios instance with base configuration
const getBaseURL = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl.endsWith("/api") ? envUrl : `${envUrl}/api`;
  }
  return "http://localhost:3001/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  // Do not set a global Content-Type. Let Axios infer it based on payload.
});

// Export axios instance for modules that need direct access
export { api };

// Enhanced queue for storing failed requests with better typing
interface QueuedRequest {
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
  config: AxiosRequestConfig;
}

let failedQueue: QueuedRequest[] = [];
let isRefreshing = false;

// Request ID generation utility
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Enhanced request interceptor with request ID tracking
api.interceptors.request.use(
  (config) => {
    // Add request ID for tracking
    const requestId = generateRequestId();
    config.headers = config.headers || {};
    config.headers["X-Request-ID"] = requestId;

    // Add timestamp for request timing
    config.metadata = {
      ...config.metadata,
      startTime: Date.now(),
      requestId,
    };

    // Ensure proper Content-Type for multipart requests
    try {
      const method = (config.method || 'GET').toString().toUpperCase();
      if (method === 'GET') {
        if (config.headers) delete (config.headers as any)["Content-Type"];
      } else if (typeof window !== 'undefined' && config.data instanceof FormData) {
        if (config.headers) delete (config.headers as any)["Content-Type"];
      } else {
        config.headers = config.headers || {};
        if (!('Content-Type' in config.headers)) {
          (config.headers as any)["Content-Type"] = "application/json";
        }
      }
    } catch {}

    // Add auth token
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request for debugging (only in development)
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[API Request] ${config.method?.toUpperCase()} ${config.url}`,
        {
          requestId,
          headers: config.headers,
          data: config.data,
        }
      );
    }

    return config;
  },
  (error) => {
    // Don't log request errors in development to reduce noise
    return Promise.reject(error);
  }
);

// Enhanced queue processing with better error handling
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else {
      // Update the config with new token and retry
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      resolve(api(config));
    }
  });

  failedQueue = [];
};

// Lightweight in-memory cache for council id -> name lookups
const councilNameCache: Record<number, string> = {};
let councilsLoadPromise: Promise<void> | null = null;

const ensureCouncilNamesLoaded = async () => {
  if (councilsLoadPromise) return councilsLoadPromise;
  councilsLoadPromise = (async () => {
    try {
      // Try to load up to 1000 councils (adjustable without breaking callers)
      const res = await localCouncilsApi.getLocalCouncils(1, 1000);
      const list = (res as any)?.data?.councils || [];
      for (const c of list) {
        if (c && typeof c.id === 'number' && typeof c.name === 'string') {
          councilNameCache[c.id] = c.name;
        }
      }
    } catch {
      // Silent failure: cache remains as-is
    }
  })();
  return councilsLoadPromise;
};

const getCouncilNameById = async (id: number | null | undefined): Promise<string | undefined> => {
  if (!id) return undefined;
  if (councilNameCache[id]) return councilNameCache[id];
  await ensureCouncilNamesLoaded();
  return councilNameCache[id];
};

// Network retry logic with exponential backoff
const retryRequest = async (
  config: AxiosRequestConfig,
  retryCount: number = 0
): Promise<any> => {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second

  if (retryCount >= maxRetries) {
    throw new Error(`Request failed after ${maxRetries} retries`);
  }

  // Calculate delay with exponential backoff and jitter
  const delay = baseDelay * Math.pow(2, retryCount) + Math.random() * 1000;

  await new Promise((resolve) => setTimeout(resolve, delay));

  try {
    return await api(config);
  } catch (error: any) {
    // Only retry on network errors or 5xx server errors
    const shouldRetry =
      !error?.response ||
      (error?.response?.status >= 500 && error?.response?.status < 600) ||
      error?.code === "ECONNABORTED" ||
      error?.code === "ERR_NETWORK";

    if (shouldRetry) {
      console.warn(
        `[API Retry] Attempt ${retryCount + 1}/${maxRetries} for ${config.url}`,
        error?.message
      );
      return retryRequest(config, retryCount + 1);
    }

    throw error;
  }
};

// Enhanced response interceptor with comprehensive error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === "development" && response.config.metadata) {
      const duration = Date.now() - response.config.metadata.startTime;
      console.log(`[API Response] ${response.status} ${response.config.url}`, {
        requestId: response.config.metadata.requestId,
        duration: `${duration}ms`,
        data: response.data,
      });
    }

    // Validate response format
    if (
      response.data &&
      typeof response.data === "object" &&
      !response.data.hasOwnProperty("success")
    ) {
      console.warn("[API Warning] Non-standard response format:", {
        url: response.config.url,
        data: response.data,
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Log error details (but be completely silent about auth errors)
    if (process.env.NODE_ENV === "development") {
      const isAuthError =
        error.response?.status === 401 ||
        error.response?.status === 403 ||
        (error.response?.data as any)?.error?.code === "MISSING_TOKEN" ||
        (error.response?.data as any)?.error?.message?.includes(
          "Access token required"
        ) ||
        error.message?.includes("token") ||
        error.message?.includes("authentication");

      // In production, optionally log only critical server errors
      if (!isAuthError && error.response?.status && error.response.status >= 500) {
        try {
          const url = originalRequest?.url || "unknown";
          const method = (originalRequest?.method || "unknown").toString().toUpperCase();
          const status = error.response?.status || "unknown";
          const message = error.message || "Unknown error";
          let responsePreview: string | undefined;
          try {
            const data: any = (error.response as any)?.data;
            if (data !== undefined) {
              const raw = typeof data === "string" ? data : JSON.stringify(data);
              responsePreview = raw.length > 400 ? raw.slice(0, 400) + "…" : raw;
            }
          } catch {}
          const summary = `${status} ${method} ${url} - ${message}`;
          if (responsePreview) {
            console.error("[Critical API Error]", summary, `Response: ${responsePreview}`);
          } else {
            console.error("[Critical API Error]", summary);
          }
        } catch (logError) {
          // Silent fallback
        }
      }
    }

    // Handle 401 errors with enhanced token refresh logic
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue the request with enhanced queue
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve,
            reject,
            config: originalRequest,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh token
        const refreshToken = localStorage.getItem("refresh_token");
        const sessionToken = localStorage.getItem("session_id");

        if (refreshToken) {
          const refreshResponse = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            {
              refreshToken,
              sessionToken,
            },
            { timeout: 10000 } // Shorter timeout for refresh requests
          );

          if (
            refreshResponse.data.success &&
            refreshResponse.data.data?.accessToken
          ) {
            const { accessToken, refreshToken: newRefreshToken } =
              refreshResponse.data.data;
            localStorage.setItem("auth_token", accessToken);
            localStorage.setItem("refresh_token", newRefreshToken);

            api.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${accessToken}`;

            // Process queue with new token
            processQueue(null, accessToken);

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          } else {
            throw new Error("Invalid refresh response format");
          }
        } else {
          throw new Error("No refresh token available");
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect
        processQueue(refreshError, null);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("session_id");

        if (typeof window !== "undefined") {
          // Use a more graceful redirect
          setTimeout(() => {
            window.location.href = "/login";
          }, 100);
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle network errors and 5xx errors with enhanced retry logic
    if (
      (!error.response ||
        (error.response.status >= 500 && error.response.status < 600)) &&
      originalRequest &&
      !originalRequest._retryHandled
    ) {
      originalRequest._retryHandled = true;

      try {
        return await retryRequest(originalRequest);
      } catch (retryError) {
        // If retry fails, continue with normal error handling
        console.warn("[API Retry Failed]", retryError.message);
      }
    }

    // Enhanced error message extraction and handling
    const errorMessage = getErrorMessage(error);
    const errorCode = getErrorCode(error);

    // Don't show toast notifications for certain status codes or error types
    const silentErrors = [401, 403, 422];
    const silentErrorCodes = [
      "VALIDATION_ERROR",
      "UNAUTHORIZED",
      "FORBIDDEN",
      "MISSING_TOKEN",
    ];

    // In development, be more silent about authentication errors
    const isDevelopment = process.env.NODE_ENV === "development";
    const isAuthError =
      silentErrors.includes(error.response?.status || 0) ||
      silentErrorCodes.includes(errorCode) ||
      errorMessage.includes("token") ||
      errorMessage.includes("authentication") ||
      errorMessage.includes("Access token required");

    // Only show toast errors for server errors (500+)
    if (!isAuthError && error.response?.status >= 500) {
      toast.error(errorMessage);
    }

    // Enhance error object with additional context
    const enhancedError = {
      ...error,
      requestId: originalRequest?.metadata?.requestId,
      timestamp: new Date().toISOString(),
      errorCode,
      isRetryable: isRetryableError(error),
    };

    return Promise.reject(enhancedError);
  }
);

// Helper function to extract meaningful error messages
const getErrorMessage = (error: AxiosError): string => {
  if (error.response?.data) {
    const data = error.response.data as any;
    if (data.error?.message) {
      return data.error.message;
    }
    if (data.message) {
      return data.message;
    }
  }

  if (error.response?.status) {
    switch (error.response.status) {
      case 400:
        return "Invalid request. Please check your input.";
      case 401:
        return "Authentication required. Please log in.";
      case 403:
        return "You don't have permission to perform this action.";
      case 404:
        return "The requested resource was not found.";
      case 409:
        return "A conflict occurred. The resource may already exist.";
      case 422:
        return "Validation failed. Please check your input.";
      case 429:
        return "Too many requests. Please try again later.";
      case 500:
        return "Server error. Please try again later.";
      case 503:
        return "Service temporarily unavailable. Please try again later.";
      default:
        return `Request failed with status ${error.response.status}`;
    }
  }

  if (error.code === "ECONNABORTED") {
    return "Request timeout. Please try again.";
  }

  if (error.code === "ERR_NETWORK") {
    return "Network error. Please check your connection.";
  }

  return "An unexpected error occurred. Please try again.";
};

// Helper function to extract error codes
const getErrorCode = (error: AxiosError): string => {
  if (error.response?.data) {
    const data = error.response.data as any;
    if (data.error?.code) {
      return data.error.code;
    }
  }

  if (error.response?.status) {
    switch (error.response.status) {
      case 400:
        return "BAD_REQUEST";
      case 401:
        return "UNAUTHORIZED";
      case 403:
        return "FORBIDDEN";
      case 404:
        return "NOT_FOUND";
      case 409:
        return "CONFLICT";
      case 422:
        return "VALIDATION_ERROR";
      case 429:
        return "RATE_LIMITED";
      case 500:
        return "INTERNAL_SERVER_ERROR";
      case 503:
        return "SERVICE_UNAVAILABLE";
      default:
        return "HTTP_ERROR";
    }
  }

  if (error.code === "ECONNABORTED") {
    return "TIMEOUT_ERROR";
  }

  if (error.code === "ERR_NETWORK") {
    return "NETWORK_ERROR";
  }

  return "UNKNOWN_ERROR";
};

// Helper function to determine if an error is retryable
const isRetryableError = (error: AxiosError): boolean => {
  // Network errors are retryable
  if (!error.response) {
    return true;
  }

  // 5xx server errors are retryable
  if (error.response.status >= 500 && error.response.status < 600) {
    return true;
  }

  // Rate limiting is retryable
  if (error.response.status === 429) {
    return true;
  }

  // Timeout errors are retryable
  if (error.code === "ECONNABORTED") {
    return true;
  }

  return false;
};

// Dashboard API functions
export const dashboardApi = {
  getKPIData: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("/dashboard/kpi");
    return response.data;
  },

  getInventoryChartData: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("/dashboard/inventory-charts");
    return response.data;
  },

  getEnhancedChartData: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("/dashboard/enhanced-charts");
    return response.data;
  },

  getDirectShipmentStatistics: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("/dashboard/direct-shipments/statistics");
    return response.data;
  },

  getRecentActivity: async (limit = 10): Promise<ApiResponse<any>> => {
    const response = await api.get(`/dashboard/activity?limit=${limit}`);
    return response.data;
  },

  getGeographicDistribution: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("/dashboard/geographic");
    return response.data;
  },

  getInventoryAlerts: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("/dashboard/alerts");
    return response.data;
  },

  getPerformanceMetrics: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("/dashboard/performance");
    return response.data;
  },

  getChartData: async (
    chartType: string,
    period?: string
  ): Promise<ApiResponse<any>> => {
    const periodParam = period ? `?period=${period}` : "";
    const response = await api.get(
      `/dashboard/charts/${chartType}${periodParam}`
    );
    return response.data;
  },

  getRealTimeInventoryStats: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("/dashboard/inventory/realtime");
    return response.data;
  },

  getEnhancedGeographicDistribution: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("/dashboard/geographic/enhanced");
    return response.data;
  },
};

// National Inventory API functions
export const nationalInventoryApi = {
  getNationalInventory: async (
    page: number = 1,
    limit: number = 50,
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      ),
    });
    const response = await api.get(`/national-inventory?${params}`);
    return response.data;
  },

  getNationalInventorySummary: async (
    page: number = 1,
    limit: number = 50,
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      ),
    });
    const response = await api.get(`/national-inventory/summary?${params}`);
    return response.data;
  },

  getInventoryMovements: async (
    page: number = 1,
    limit: number = 50,
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      ),
    });
    const response = await api.get(`/national-inventory/movements?${params}`);
    return response.data;
  },

  getLowStockItems: async (
    page: number = 1,
    limit: number = 50
  ): Promise<ApiResponse<any>> => {
    const response = await api.get(
      `/national-inventory/low-stock?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  getInventoryStatistics: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("/national-inventory/statistics");
    return response.data;
  },

  performStockAdjustment: async (adjustmentData: {
    itemId: number;
    warehouseId: number;
    adjustmentType: "INCREASE" | "DECREASE" | "SET";
    quantity: number;
    reason: string;
    notes?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post(
      "/national-inventory/stock-adjustment",
      adjustmentData
    );
    return response.data;
  },

  performStockTransfer: async (transferData: {
    itemId: number;
    fromWarehouseId: number;
    toWarehouseId: number;
    quantity: number;
    reason: string;
    notes?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post(
      "/national-inventory/stock-transfer",
      transferData
    );
    return response.data;
  },

  updateMinimumStockLevel: async (updateData: {
    itemId: number;
    minimumStockLevel: number;
    notes?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.put(
      "/national-inventory/minimum-stock-level",
      updateData
    );
    return response.data;
  },

  performInventoryAudit: async (auditData: {
    itemId: number;
    warehouseId: number;
    systemQuantity: number;
    actualQuantity: number;
    reason: string;
    notes?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post(
      "/national-inventory/inventory-audit",
      auditData
    );
    return response.data;
  },
};

// Stock Receipt API functions
export const stockReceiptApi = {
  createStockReceipt: async (receiptData: any): Promise<ApiResponse<any>> => {
    const response = await api.post("/stock-receipts", receiptData);
    return response.data;
  },
  
  getReceiptAttachments: async (
    receiptId: number
  ): Promise<ApiResponse<any>> => {
    const response = await api.get(`/stock-receipts/${receiptId}/attachments`);
    return response.data;
  },

  deleteAttachment: async (
    attachmentId: number
  ): Promise<ApiResponse<any>> => {
    const response = await api.delete(`/stock-receipts/attachments/${attachmentId}`);
    return response.data;
  },

  uploadQualityCheckPhotos: async (
    qualityCheckId: number,
    files: File[],
    onUploadProgress?: (progress: number) => void
  ): Promise<ApiResponse<any>> => {
    const form = new FormData();
    files.forEach((file) => form.append('photos', file));
    const response = await api.post(`/stock-receipts/quality-checks/${qualityCheckId}/photos`, form, {
      // Do NOT set Content-Type; let the browser set the multipart boundary
      onUploadProgress: (evt) => {
        if (onUploadProgress && evt.total) {
          onUploadProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      }
    });
    return response.data;
  },
  
  uploadReceiptAttachment: async (
    receiptId: number,
    file: File,
    attachmentType: 'INVOICE' | 'PURCHASE_ORDER' | 'DELIVERY_NOTE' | 'PHOTO' | 'OTHER' = 'DELIVERY_NOTE',
    onUploadProgress?: (progress: number) => void
  ): Promise<ApiResponse<any>> => {
    const form = new FormData();
    form.append('file', file);
    if (attachmentType) form.append('attachmentType', attachmentType);

    const response = await api.post(`/stock-receipts/${receiptId}/attachments`, form, {
      // Do NOT set Content-Type; let the browser set the multipart boundary
      onUploadProgress: (evt) => {
        if (onUploadProgress && evt.total) {
          onUploadProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      }
    });
    return response.data;
  },

  getStockReceipts: async (
    page: number = 1,
    limit: number = 10,
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      ),
    });
    const response = await api.get(`/stock-receipts?${params}`);
    return response.data;
  },

  getStockReceiptById: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.get(`/stock-receipts/${id}`);
    return response.data;
  },

  validateReceipt: async (
    id: number,
    validationData: { status: string; discrepancyNotes?: string }
  ): Promise<ApiResponse<any>> => {
    const response = await api.put(
      `/stock-receipts/${id}/validate`,
      validationData
    );
    return response.data;
  },

  createQualityCheck: async (
    qualityCheckData: any
  ): Promise<ApiResponse<any>> => {
    const response = await api.post(
      "/stock-receipts/quality-checks",
      qualityCheckData
    );
    return response.data;
  },

  getQualityChecksByReceipt: async (
    receiptId: number
  ): Promise<ApiResponse<any>> => {
    const response = await api.get(
      `/stock-receipts/${receiptId}/quality-checks`
    );
    return response.data;
  },

  performBulkQualityCheck: async (
    receiptId: number,
    qualityChecks: any[]
  ): Promise<ApiResponse<any>> => {
    const response = await api.post(
      `/stock-receipts/${receiptId}/bulk-quality-check`,
      {
        qualityChecks,
      }
    );
    return response.data;
  },

  getReceiptStatistics: async (
    filters: {
      warehouseId?: number;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<ApiResponse<any>> => {
    const entries = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== "")
      .map(([k, v]) => [k, String(v)] as [string, string]);
    const params = new URLSearchParams(Object.fromEntries(entries));
    const response = await api.get(`/stock-receipts/statistics?${params}`);
    return response.data;
  },

  getReceiptAuditTrail: async (
    receiptId: number
  ): Promise<ApiResponse<any>> => {
    const response = await api.get(`/stock-receipts/${receiptId}/audit-trail`);
    return response.data;
  },
};

// Items API functions
export const itemsApi = {
  getItems: async (
    page: number = 1,
    limit: number = 50,
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      ),
    });
    const response = await api.get(`/items?${params}`);
    return response.data;
  },
};

// Warehouses API functions
export const warehousesApi = {
  getWarehouses: async (
    page: number = 1,
    limit: number = 50,
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      ),
    });
    const response = await api.get(`/warehouses?${params}`);
    return response.data;
  },
};

// Council Inventory API functions - matches backend /lc-inventory routes
export const councilInventoryApi = {
  getCouncilInventory: async (
    page: number = 1,
    limit: number = 50,
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    // Get the current user's localCouncilId or use filters.councilId
    const councilId = filters.councilId || (await getCurrentUserCouncilId());

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([key, value]) =>
            key !== "councilId" && value !== undefined && value !== ""
        )
      ),
    });

    const endpoint = councilId
      ? `/lc-inventory/council/${councilId}?${params}`
      : `/lc-inventory?${params}`;

    const response = await api.get(endpoint);
    return response.data;
  },
  
  // Update council-scoped minimum stock level for an item
  updateCouncilMinimumStockLevel: async (
    councilId: number,
    updateData: {
      itemId: number;
      minimumStockLevel: number;
      notes?: string;
    }
  ): Promise<ApiResponse<any>> => {
    const { itemId, minimumStockLevel, notes } = updateData;
    const response = await api.put(
      `/lc-inventory/council/${councilId}/item/${itemId}/minimum-stock-level`,
      { minimumStockLevel, notes }
    );
    return response.data;
  },

  getCouncilInventorySummary: async (
    councilId?: number
  ): Promise<ApiResponse<any>> => {
    const targetCouncilId = councilId || (await getCurrentUserCouncilId());
    if (!targetCouncilId) {
      throw new Error("Council ID is required to fetch inventory summary");
    }
    const response = await api.get(
      `/lc-inventory/council/${targetCouncilId}/summary`
    );
    return response.data;
  },

  getCouncilItemInventory: async (
    councilId: number,
    itemId: number
  ): Promise<ApiResponse<any>> => {
    const response = await api.get(
      `/lc-inventory/council/${councilId}/item/${itemId}`
    );
    return response.data;
  },

  getCouncilStockMovements: async (
    page: number = 1,
    limit: number = 50,
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const councilId = filters.councilId || (await getCurrentUserCouncilId());
    if (!councilId) {
      return {
        success: false,
        error: {
          code: "NO_COUNCIL_ACCESS",
          message: "Access denied: User is not assigned to a Local Council",
          timestamp: new Date().toISOString(),
        },
      };
    }

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([key, value]) =>
            key !== "councilId" && value !== undefined && value !== ""
        )
      ),
    });
    const response = await api.get(
      `/lc-inventory/council/${councilId}/movements?${params}`
    );
    const data = response.data;
    try {
      // Normalize councilName for every movement
      if (data?.success && data?.data?.movements && Array.isArray(data.data.movements)) {
        const fallbackName = await getCouncilNameById(councilId);
        data.data.movements = data.data.movements.map((m: any) => {
          if (!m?.councilName) {
            const nameFromId = m?.councilId ? councilNameCache[m.councilId] : undefined;
            return { ...m, councilName: nameFromId || fallbackName || m?.councilName || '—' };
          }
          return m;
        });
      }
    } catch {
      // Non-fatal: return original structure
    }
    return data;
  },

  getCouncilItemStockMovements: async (
    councilId: number,
    itemId: number,
    page: number = 1,
    limit: number = 50,
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      ),
    });
    const response = await api.get(
      `/lc-inventory/council/${councilId}/item/${itemId}/movements?${params}`
    );
    const data = response.data;
    try {
      if (data?.success && data?.data?.movements && Array.isArray(data.data.movements)) {
        const fallbackName = await getCouncilNameById(councilId);
        data.data.movements = data.data.movements.map((m: any) => {
          if (!m?.councilName) {
            const nameFromId = m?.councilId ? councilNameCache[m.councilId] : undefined;
            return { ...m, councilName: nameFromId || fallbackName || m?.councilName || '—' };
          }
          return m;
        });
      }
    } catch {
      // Ignore normalization errors
    }
    return data;
  },

  getCouncilStockMovementSummary: async (
    councilId?: number,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<any>> => {
    const targetCouncilId = councilId || (await getCurrentUserCouncilId());
    if (!targetCouncilId) {
      throw new Error("Council ID is required to fetch stock movement summary");
    }

    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await api.get(
      `/lc-inventory/council/${targetCouncilId}/movements/summary?${params}`
    );
    return response.data;
  },

  // NEW Production Features - Dashboard & KPIs
  getDashboardKPIs: async (councilId?: number): Promise<ApiResponse<any>> => {
    const targetCouncilId = councilId || (await getCurrentUserCouncilId());
    if (!targetCouncilId) {
      return {
        success: false,
        error: {
          code: "NO_COUNCIL_ACCESS",
          message:
            "Access denied: User is not assigned to a Local Council or council not specified",
          timestamp: new Date().toISOString(),
        },
      };
    }
    const response = await api.get(
      `/lc-inventory/council/${targetCouncilId}/dashboard/kpis`
    );
    return response.data;
  },

  getPerformanceMetrics: async (
    councilId?: number
  ): Promise<ApiResponse<any>> => {
    const targetCouncilId = councilId || (await getCurrentUserCouncilId());
    if (!targetCouncilId) {
      throw new Error("Council ID is required to fetch performance metrics");
    }
    const response = await api.get(
      `/lc-inventory/council/${targetCouncilId}/performance/metrics`
    );
    return response.data;
  },

  // NEW Production Features - Shipment Receipt Confirmation
  confirmShipmentReceipt: async (confirmationData: {
    shipmentId: number;
    localCouncilId: number;
    receivedItems: Array<{
      itemId: number;
      quantityShipped: number;
      quantityReceived: number;
      condition: string;
      notes?: string;
    }>;
    hasDiscrepancies: boolean;
    discrepancyNotes?: string;
    photos?: string[];
    receiptDocumentUrl?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post(
      "/lc-inventory/shipments/confirm-receipt",
      confirmationData
    );
    return response.data;
  },

  // NEW Production Features - Stock Alerts
  getStockAlerts: async (
    councilId?: number,
    alertLevel?: "info" | "warning" | "critical"
  ): Promise<ApiResponse<any>> => {
    const targetCouncilId = councilId || (await getCurrentUserCouncilId());
    if (!targetCouncilId) {
      throw new Error("Council ID is required to fetch stock alerts");
    }

    const params = new URLSearchParams();
    if (alertLevel) params.append("alertLevel", alertLevel);

    const response = await api.get(
      `/lc-inventory/council/${targetCouncilId}/alerts?${params}`
    );
    return response.data;
  },

  acknowledgeStockAlert: async (
    alertId: number,
    notes?: string
  ): Promise<ApiResponse<any>> => {
    const response = await api.put(
      `/lc-inventory/alerts/${alertId}/acknowledge`,
      { notes }
    );
    return response.data;
  },

  // NEW Production Features - Distribution Templates
  createDistributionTemplate: async (templateData: {
    localCouncilId: number;
    templateName: string;
    description?: string;
    templateType: "regular" | "emergency" | "seasonal" | "custom";
    targetSchools: number[];
    templateItems: Array<{
      itemId: number;
      quantityPerSchool: number;
      allocationMethod: string;
    }>;
    distributionFrequency:
      | "one_time"
      | "weekly"
      | "monthly"
      | "quarterly"
      | "yearly";
  }): Promise<ApiResponse<any>> => {
    const response = await api.post(
      "/lc-inventory/distribution-templates",
      templateData
    );
    return response.data;
  },

  getDistributionTemplates: async (
    councilId?: number,
    isActive?: boolean
  ): Promise<ApiResponse<any>> => {
    const targetCouncilId = councilId || (await getCurrentUserCouncilId());
    if (!targetCouncilId) {
      throw new Error("Council ID is required to fetch distribution templates");
    }

    const params = new URLSearchParams();
    if (isActive !== undefined) params.append("isActive", isActive.toString());

    const response = await api.get(
      `/lc-inventory/council/${targetCouncilId}/distribution-templates?${params}`
    );
    return response.data;
  },

  // NEW Production Features - Notifications
  getNotifications: async (
    councilId?: number,
    isRead?: boolean,
    limit: number = 50
  ): Promise<ApiResponse<any>> => {
    const targetCouncilId = councilId || (await getCurrentUserCouncilId());
    if (!targetCouncilId) {
      throw new Error("Council ID is required to fetch notifications");
    }

    const params = new URLSearchParams();
    if (isRead !== undefined) params.append("isRead", isRead.toString());
    params.append("limit", limit.toString());

    const response = await api.get(
      `/lc-inventory/council/${targetCouncilId}/notifications?${params}`
    );
    return response.data;
  },

  markNotificationAsRead: async (
    notificationId: number
  ): Promise<ApiResponse<any>> => {
    const response = await api.put(
      `/lc-inventory/notifications/${notificationId}/read`
    );
    return response.data;
  },
};

// Helper function to get current user profile with role info
const getCurrentUserProfile = async (): Promise<{
  localCouncilId: number | null;
  role: string;
  roleName: string;
  isSuperAdmin: boolean;
  isLCOfficer: boolean;
} | null> => {
  try {
    const response = await api.get("/auth/profile");
    const user = response.data?.data;
    if (!user) return null;

    return {
      localCouncilId: user.localCouncilId || null,
      role: user.role || "",
      roleName: user.roleName || "",
      isSuperAdmin: user.roleName === "Super Administrator",
      isLCOfficer: user.roleName === "Local Council M&E Officer",
    };
  } catch (error) {
    // Silent error handling for user profile fetch
    return null;
  }
};

// Helper function to get current user's council ID (backward compatibility)
const getCurrentUserCouncilId = async (): Promise<number | null> => {
  const profile = await getCurrentUserProfile();
  return profile?.localCouncilId || null;
};

// Shipment API functions
export const shipmentsApi = {
  getShipments: async (
    page: number = 1,
    limit: number = 50,
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      ),
    });
    const response = await api.get(`/shipments?${params}`);
    return response.data;
  },

  getShipmentById: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.get(`/shipments/${id}`);
    return response.data;
  },

  createShipment: async (shipmentData: any): Promise<ApiResponse<any>> => {
    const response = await api.post("/shipments", shipmentData);
    return response.data;
  },

  dispatchShipment: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.put(`/shipments/${id}/dispatch`);
    return response.data;
  },

  confirmShipmentReceipt: async (
    id: number,
    receiptData: any
  ): Promise<ApiResponse<any>> => {
    const response = await api.put(`/shipments/${id}/receive`, receiptData);
    return response.data;
  },

  updateShipmentStatus: async (
    id: number,
    statusData: any
  ): Promise<ApiResponse<any>> => {
    const response = await api.put(`/shipments/${id}/status`, statusData);
    return response.data;
  },

  getShipmentStatusHistory: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.get(`/shipments/${id}/status-history`);
    return response.data;
  },
  
  getShipmentAttachments: async (id: number): Promise<ApiResponse<any[]>> => {
    const response = await api.get(`/shipments/${id}/attachments`);
    return response.data;
  },
  
  getShipmentSummary: async (
    filters: { councilId?: number; startDate?: string; endDate?: string } = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams();
    if (filters.councilId) params.append('councilId', String(filters.councilId));
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    const response = await api.get(`/shipments/summary?${params}`);
    return response.data;
  },

  resolveShipmentDiscrepancy: async (
    id: number,
    resolutionData: any
  ): Promise<ApiResponse<any>> => {
    const response = await api.put(
      `/shipments/${id}/resolve-discrepancy`,
      resolutionData
    );
    return response.data;
  },
};

// In-app Notifications API (Notification Center)
export const notificationsApi = {
  // List current user's notifications (paginated)
  list: async (
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false,
    filters: { category?: string; priority?: 'low'|'medium'|'high'|'critical'; type?: string; search?: string; dismissed?: boolean } = {}
  ): Promise<ApiResponse<{
    notifications: any[];
    total: number;
    unreadCount: number;
  }>> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(Math.min(limit, 100)),
      unreadOnly: String(unreadOnly),
    });
    if (filters.category) params.append('category', filters.category);
    if (filters.priority) params.append('priority', String(filters.priority));
    if (filters.type) params.append('type', filters.type);
    if (filters.search) params.append('search', filters.search);
    if (typeof filters.dismissed === 'boolean') params.append('dismissed', String(filters.dismissed));
    const response = await api.get(`/notifications?${params.toString()}`);
    return response.data;
  },

  // Unread count
  unreadCount: async (): Promise<ApiResponse<{ unreadCount: number }>> => {
    const response = await api.get(`/notifications/unread-count`);
    return response.data;
  },

  // Statistics for notification badges/filters
  stats: async (): Promise<ApiResponse<{ total: number; unread: number; byPriority: Record<string, number>; byCategory: Record<string, number>; }>> => {
    const response = await api.get(`/notifications/stats`);
    return response.data;
  },

  // Mark one notification as read
  markAsRead: async (notificationId: number): Promise<ApiResponse<any>> => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async (): Promise<ApiResponse<any>> => {
    const response = await api.put(`/notifications/mark-all-read`);
    return response.data;
  },

  // Dismiss (delete) a notification
  dismiss: async (notificationId: number): Promise<ApiResponse<any>> => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Dismiss all notifications
  dismissAll: async (): Promise<ApiResponse<any>> => {
    // Prefer a dedicated endpoint if available; fallback to bulk delete route
    try {
      const response = await api.delete(`/notifications/dismiss-all`);
      return response.data;
    } catch (e) {
      const response = await api.delete(`/notifications`);
      return (response as any).data;
    }
  },

  // Get categories (for filters)
  categories: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get(`/notifications/categories`);
    return response.data;
  },

  // Get user preferences
  getPreferences: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get(`/notifications/preferences`);
    return response.data;
  },

  // Update user preferences
  updatePreferences: async (
    preferences: Array<{
      notificationType: string;
      inAppEnabled?: boolean;
      emailEnabled?: boolean;
      smsEnabled?: boolean;
      escalationEnabled?: boolean;
    }>
  ): Promise<ApiResponse<any>> => {
    const response = await api.put(`/notifications/preferences`, { preferences });
    return response.data;
  },
};

// Direct Shipment API functions
export const directShipmentsApi = {
  createDirectShipment: async (
    shipmentData: any
  ): Promise<ApiResponse<any>> => {
    const response = await api.post("/direct-shipments", shipmentData);
    return response.data;
  },

  getDirectShipments: async (
    page: number = 1,
    limit: number = 10,
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      ),
    });
    const response = await api.get(`/direct-shipments?${params}`);
    return response.data;
  },

  getDirectShipmentById: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.get(`/direct-shipments/${id}`);
    return response.data;
  },

  updateDirectShipmentStatus: async (
    id: number,
    statusData: any
  ): Promise<ApiResponse<any>> => {
    const response = await api.put(
      `/direct-shipments/${id}/status`,
      statusData
    );
    return response.data;
  },

  dispatchDirectShipment: async (
    id: number,
    dispatchData: any = {}
  ): Promise<ApiResponse<any>> => {
    const response = await api.post(
      `/direct-shipments/${id}/dispatch`,
      dispatchData
    );
    return response.data;
  },

  confirmDirectShipmentReceipt: async (
    id: number,
    receiptData: any
  ): Promise<ApiResponse<any>> => {
    const response = await api.post(
      `/direct-shipments/${id}/confirm-receipt`,
      receiptData
    );
    return response.data;
  },

  getDirectShipmentSummary: async (
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams();
    Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== "")
      .forEach(([key, value]) => params.append(key, String(value)));

    const response = await api.get(
      `/direct-shipments/summary/statistics?${params}`
    );
    return response.data;
  },

  getDirectShipmentsForSchool: async (
    schoolId: number,
    page: number = 1,
    limit: number = 10,
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      ),
    });
    const response = await api.get(
      `/direct-shipments/school/${schoolId}?${params}`
    );
    return response.data;
  },

  getDirectShipmentsFromWarehouse: async (
    warehouseId: number,
    page: number = 1,
    limit: number = 10,
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      ),
    });
    const response = await api.get(
      `/direct-shipments/warehouse/${warehouseId}?${params}`
    );
    return response.data;
  },

  getWarehouseItemDetails: async (
    warehouseId: number,
    itemId: number
  ): Promise<
    ApiResponse<{
      availableQuantity: number;
      unitCost?: number;
      batchNumber?: string;
      expiryDate?: string;
      conditionStatus?: string;
      lastReceiptDate?: string;
    }>
  > => {
    const response = await api.get(
      `/direct-shipments/warehouse/${warehouseId}/item/${itemId}/details`
    );
    return response.data;
  },
};

// Distribution API functions
export const distributionsApi = {
  getDistributions: async (
    page: number = 1,
    limit: number = 50,
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      ),
    });
    const response = await api.get(`/distributions?${params}`);
    return response.data;
  },

  getDistributionById: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.get(`/distributions/${id}`);
    return response.data;
  },

  createDistribution: async (
    distributionData: any
  ): Promise<ApiResponse<any>> => {
    const response = await api.post("/distributions", distributionData);
    return response.data;
  },

  confirmDistributionReceipt: async (
    id: number,
    confirmationData: any
  ): Promise<ApiResponse<any>> => {
    const response = await api.put(
      `/distributions/${id}/confirm`,
      confirmationData
    );
    return response.data;
  },

  getDistributionsByCouncil: async (
    councilId: number,
    page: number = 1,
    limit: number = 50,
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      ),
    });
    const response = await api.get(
      `/distributions/council/${councilId}?${params}`
    );
    return response.data;
  },

  getDistributionsBySchool: async (
    schoolId: number,
    page: number = 1,
    limit: number = 50,
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      ),
    });
    const response = await api.get(
      `/distributions/school/${schoolId}?${params}`
    );
    return response.data;
  },

  getPendingDistributionsForSchool: async (
    schoolId: number,
    page: number = 1,
    limit: number = 50
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await api.get(
      `/distributions/school/${schoolId}/pending?${params}`
    );
    return response.data;
  },

  getDistributionStatusHistory: async (
    id: number
  ): Promise<ApiResponse<any>> => {
    const response = await api.get(`/distributions/${id}/status-history`);
    return response.data;
  },

  updateDistributionStatus: async (
    id: number,
    statusData: any
  ): Promise<ApiResponse<any>> => {
    const response = await api.put(`/distributions/${id}/status`, statusData);
    return response.data;
  },

  resolveDistributionDiscrepancy: async (
    id: number,
    resolutionData: any
  ): Promise<ApiResponse<any>> => {
    const response = await api.put(
      `/distributions/${id}/resolve-discrepancy`,
      resolutionData
    );
    return response.data;
  },

  getDistributionSummary: async (
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams();
    Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== "")
      .forEach(([key, value]) => params.append(key, String(value)));

    const response = await api.get(`/distributions/summary?${params}`);
    return response.data;
  },

  markDistributionAsSent: async (
    id: number,
    data?: { notes?: string }
  ): Promise<ApiResponse<any>> => {
    const response = await api.put(`/distributions/${id}/send`, data || {});
    return response.data;
  },
};

// School Inventory & Receipts API functions
export const schoolInventoryApi = {
  getSchoolInventory: async (
    schoolId: number,
    page: number = 1,
    limit: number = 100,
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      ),
    });
    const response = await api.get(`/schools/${schoolId}/inventory?${params}`);
    return response.data;
  },

  getPendingReceipts: async (schoolId: number): Promise<ApiResponse<any>> => {
    const response = await api.get(`/schools/${schoolId}/receipts/pending`);
    return response.data;
  },

  getReceiptDetails: async (receiptId: number): Promise<ApiResponse<any>> => {
    const response = await api.get(`/schools/receipts/${receiptId}`);
    return response.data;
  },

  confirmReceipt: async (
    receiptId: number,
    confirmationData: any
  ): Promise<ApiResponse<any>> => {
    const response = await api.post(
      `/schools/receipts/${receiptId}/confirm`,
      confirmationData
    );
    return response.data;
  },

  getSchoolInventoryReport: async (
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const entries = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== "")
      .map(([k, v]) => [k, String(v)] as [string, string]);
    const params = new URLSearchParams(Object.fromEntries(entries));
    const response = await api.get(`/schools/reports/inventory?${params}`);
    return response.data;
  },

  getSchoolUtilizationReport: async (
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const entries2 = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== "")
      .map(([k, v]) => [k, String(v)] as [string, string]);
    const params = new URLSearchParams(Object.fromEntries(entries2));
    const response = await api.get(`/schools/reports/utilization?${params}`);
    return response.data;
  },

  getSchoolDistributionReport: async (
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const entries3 = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== "")
      .map(([k, v]) => [k, String(v)] as [string, string]);
    const params = new URLSearchParams(Object.fromEntries(entries3));
    const response = await api.get(`/schools/reports/distributions?${params}`);
    return response.data;
  },

  getSchoolPerformanceReport: async (
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const entries4 = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== "")
      .map(([k, v]) => [k, String(v)] as [string, string]);
    const params = new URLSearchParams(Object.fromEntries(entries4));
    const response = await api.get(`/schools/reports/performance?${params}`);
    return response.data;
  },
};

// Schools API functions
export const schoolsApi = {
  getSchools: async (
    page: number = 1,
    limit: number = 50,
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      ),
    });
    const response = await api.get(`/schools?${params}`);
    return response.data;
  },

  getSchoolsByCouncil: async (
    councilId: number,
    page: number = 1,
    limit: number = 100
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      councilId: councilId.toString(),
    });
    const response = await api.get(`/schools?${params}`);
    return response.data;
  },
};

// Local Councils API functions
export const localCouncilsApi = {
  getLocalCouncils: async (
    page: number = 1,
    limit: number = 50,
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      ),
    });
    const response = await api.get(`/councils?${params}`);
    return response.data;
  },
};

// Alias for backward compatibility  
export const councilsApi = localCouncilsApi;

// User Management API functions
export const usersApi = {
  getUsers: async (
    page: number = 1,
    limit: number = 50,
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      ),
    });
    const response = await api.get(`/users?${params}`);
    return response.data;
  },

  getUserById: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (userData: any): Promise<ApiResponse<any>> => {
    const response = await api.post("/users", userData);
    return response.data;
  },

  updateUser: async (id: number, userData: any): Promise<ApiResponse<any>> => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  activateUser: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.put(`/users/${id}/activate`);
    return response.data;
  },

  deactivateUser: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.put(`/users/${id}/deactivate`);
    return response.data;
  },

  // Permanent delete (Super Admin only)
  hardDeleteUser: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  getCurrentUser: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("/auth/profile");
    return response.data;
  },

  updateCurrentUser: async (userData: any): Promise<ApiResponse<any>> => {
    const response = await api.put("/auth/profile", userData);
    return response.data;
  },

  changePassword: async (passwordData: any): Promise<ApiResponse<any>> => {
    const response = await api.put("/auth/change-password", passwordData);
    return response.data;
  },
};

// Admin API functions for master data management
export const adminApi = {
  // Items management
  getItems: async (
    page: number = 1,
    limit: number = 50,
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      ),
    });
    const response = await api.get(`/items?${params}`);
    return response.data;
  },

  createItem: async (itemData: any): Promise<ApiResponse<any>> => {
    const response = await api.post("/items", itemData);
    return response.data;
  },

  updateItem: async (id: number, itemData: any): Promise<ApiResponse<any>> => {
    const response = await api.put(`/items/${id}`, itemData);
    return response.data;
  },

  deleteItem: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.patch(`/items/${id}/deactivate`);
    return response.data;
  },

  activateItem: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.patch(`/items/${id}/activate`);
    return response.data;
  },

  // Permanent delete (Super Admin only)
  hardDeleteItem: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.delete(`/items/${id}`);
    return response.data;
  },

  getItemStats: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.get(`/items/${id}/stats`);
    return response.data;
  },

  bulkUpdateItems: async (
    updates: Array<{ id: number; data: any }>
  ): Promise<ApiResponse<any>> => {
    const response = await api.patch("/items/bulk-update", { updates });
    return response.data;
  },

  // Schools management
  createSchool: async (schoolData: any): Promise<ApiResponse<any>> => {
    const response = await api.post("/schools", schoolData);
    return response.data;
  },

  updateSchool: async (
    id: number,
    schoolData: any
  ): Promise<ApiResponse<any>> => {
    const response = await api.put(`/schools/${id}`, schoolData);
    return response.data;
  },

  deleteSchool: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.patch(`/schools/${id}/deactivate`);
    return response.data;
  },

  activateSchool: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.patch(`/schools/${id}/activate`);
    return response.data;
  },

  getSchoolStats: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.get(`/schools/${id}/stats`);
    return response.data;
  },

  getSchoolsWithDistributionSummary: async (
    councilId?: number
  ): Promise<ApiResponse<any>> => {
    const params = councilId ? `?councilId=${councilId}` : "";
    const response = await api.get(`/schools/summary/distributions${params}`);
    return response.data;
  },

  bulkUpdateSchoolCouncilAssignment: async (
    schoolIds: number[],
    newCouncilId: number
  ): Promise<ApiResponse<any>> => {
    const response = await api.patch(
      "/schools/bulk-update/council-assignment",
      {
        schoolIds,
        newCouncilId,
      }
    );
    return response.data;
  },

  // Local Councils management
  createLocalCouncil: async (councilData: any): Promise<ApiResponse<any>> => {
    const response = await api.post("/councils", councilData);
    return response.data;
  },

  updateLocalCouncil: async (
    id: number,
    councilData: any
  ): Promise<ApiResponse<any>> => {
    const response = await api.put(`/councils/${id}`, councilData);
    return response.data;
  },

  deleteLocalCouncil: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.patch(`/councils/${id}/deactivate`);
    return response.data;
  },

  activateLocalCouncil: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.patch(`/councils/${id}/activate`);
    return response.data;
  },

  // Permanent delete (Super Admin only)
  hardDeleteLocalCouncil: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.delete(`/councils/${id}`);
    return response.data;
  },

  getLocalCouncilStats: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.get(`/councils/${id}/stats`);
    return response.data;
  },

  getDistrictsByRegion: async (region: string): Promise<ApiResponse<any>> => {
    const response = await api.get(
      `/councils/regions/${encodeURIComponent(region)}/districts`
    );
    return response.data;
  },

  // Warehouses management
  createWarehouse: async (warehouseData: any): Promise<ApiResponse<any>> => {
    const response = await api.post("/warehouses", warehouseData);
    return response.data;
  },

  updateWarehouse: async (
    id: number,
    warehouseData: any
  ): Promise<ApiResponse<any>> => {
    const response = await api.put(`/warehouses/${id}`, warehouseData);
    return response.data;
  },

  deleteWarehouse: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.patch(`/warehouses/${id}/deactivate`);
    return response.data;
  },

  activateWarehouse: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.patch(`/warehouses/${id}/activate`);
    return response.data;
  },

  // Permanent delete (Super Admin only)
  hardDeleteWarehouse: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.delete(`/warehouses/${id}`);
    return response.data;
  },

  getWarehouseStats: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.get(`/warehouses/${id}/stats`);
    return response.data;
  },

  getWarehousesWithInventory: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("/warehouses/summary/inventory");
    return response.data;
  },

  // Statistics endpoints
  getSystemStatistics: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("/admin/statistics");
    return response.data;
  },

  getUserStatistics: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("/admin/statistics/users");
    return response.data;
  },

  getSchoolStatistics: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("/admin/statistics/schools");
    return response.data;
  },

  getLocalCouncilStatistics: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("/admin/statistics/councils");
    return response.data;
  },

  getItemStatistics: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("/admin/statistics/items");
    return response.data;
  },
};

export default api;

// Reports API functions
export const reportsApi = {
  // Generate a report
  generateReport: async (config: {
    type: string;
    title?: string;
    description?: string;
    filters?: any;
    exportFormat?: "excel" | "csv";
    includeCharts?: boolean;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post("/reports/generate", config);
    return response.data;
  },

  // Preview a report (limited data)
  previewReport: async (config: {
    type: string;
    filters?: any;
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post("/reports/preview", config);
    return response.data;
  },

  // Validate report configuration
  validateReportConfig: async (config: any): Promise<ApiResponse<any>> => {
    const response = await api.post("/reports/validate", config);
    return response.data;
  },

  // Get available report templates
  getReportTemplates: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("/reports/templates");
    return response.data;
  },

  // Get specific report template
  getReportTemplate: async (templateId: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/reports/templates/${templateId}`);
    return response.data;
  },

  // Generate report from template
  generateTemplateReport: async (
    templateId: string,
    config: {
      filters?: any;
      exportFormat?: "excel" | "csv";
      includeCharts?: boolean;
    }
  ): Promise<ApiResponse<any>> => {
    const response = await api.post(
      `/reports/templates/${templateId}/generate`,
      config
    );
    return response.data;
  },

  // Get available filters for a report type
  getReportFilters: async (reportType: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/reports/filters/${reportType}`);
    return response.data;
  },

  // Get report categories
  getReportCategories: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("/reports/categories");
    return response.data;
  },

  // Get report generation history
  getReportHistory: async (
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<any>> => {
    const response = await api.get(
      `/reports/history?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Download export file
  downloadExport: async (filename: string): Promise<Blob> => {
    const response = await api.get(`/reports/exports/${filename}`, {
      responseType: "blob",
    });
    return response.data;
  },

  // Execute custom query
  executeCustomQuery: async (query: {
    name: string;
    description?: string;
    fields: string[];
    filters: any[];
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    // Convert custom query to backend format
    const config = {
      type: "custom",
      title: query.name,
      description: query.description,
      customQuery: {
        sql: buildCustomQuerySQL(query),
        params: extractQueryParams(query),
      },
      limit: query.limit || 100,
    };

    return await this.generateReport(config);
  },

  // Save custom query template
  saveCustomQuery: async (query: {
    name: string;
    description?: string;
    fields: string[];
    filters: any[];
  }): Promise<ApiResponse<any>> => {
    // This would typically save to a user_report_templates table
    // For now, we'll simulate success
    return {
      success: true,
      data: {
        id: Date.now().toString(),
        name: query.name,
        saved: true,
      },
    };
  },

  // Export report in specific format
  exportReport: async (
    reportId: string,
    format: "excel" | "csv"
  ): Promise<ApiResponse<any>> => {
    // This would typically trigger an async export job
    // For now, we'll simulate the job creation
    return {
      success: true,
      data: {
        jobId: Date.now().toString(),
        status: "pending",
        format,
        reportId,
      },
    };
  },

  // Get export job status
  getExportJobStatus: async (jobId: string): Promise<ApiResponse<any>> => {
    // This would check the status of an export job
    return {
      success: true,
      data: {
        jobId,
        status: "completed",
        downloadUrl: `/api/reports/exports/report-${jobId}.csv`,
      },
    };
  },

  // Alias for getReportTemplates for backward compatibility
  getTemplates: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("/reports/templates");
    return response.data;
  },
};

// Helper functions for custom query building
const buildCustomQuerySQL = (query: {
  fields: string[];
  filters: any[];
}): string => {
  // This is a simplified version - in production, you'd want more sophisticated query building
  const fieldMappings: Record<string, string> = {
    item_name: "i.name",
    item_category: "i.category",
    warehouse_name: "w.name",
    stock_quantity: "wi.quantity_on_hand",
    shipment_status: "s.status",
    council_name: "lc.name",
    school_name: "sch.name",
    created_at: "created_at",
    updated_at: "updated_at",
  };

  const selectedFields = query.fields
    .map((field) => fieldMappings[field] || field)
    .join(", ");

  let sql = `SELECT ${selectedFields} FROM items i`;

  // Add joins based on selected fields
  if (query.fields.some((f) => f.includes("warehouse"))) {
    sql += " LEFT JOIN warehouse_inventory wi ON i.id = wi.item_id";
    sql += " LEFT JOIN warehouses w ON wi.warehouse_id = w.id";
  }

  if (query.fields.some((f) => f.includes("shipment"))) {
    sql += " LEFT JOIN shipment_items si ON i.id = si.item_id";
    sql += " LEFT JOIN shipments s ON si.shipment_id = s.id";
  }

  if (query.fields.some((f) => f.includes("council"))) {
    sql += " LEFT JOIN local_councils lc ON s.destination_council_id = lc.id";
  }

  if (query.fields.some((f) => f.includes("school"))) {
    sql += " LEFT JOIN schools sch ON 1=1"; // This would need proper join logic
  }

  // Add WHERE conditions
  if (query.filters && query.filters.length > 0) {
    const conditions = query.filters
      .map((filter) => {
        const field = fieldMappings[filter.field] || filter.field;
        switch (filter.operator) {
          case "equals":
            return `${field} = ?`;
          case "not_equals":
            return `${field} != ?`;
          case "greater_than":
            return `${field} > ?`;
          case "less_than":
            return `${field} < ?`;
          case "contains":
            return `${field} LIKE ?`;
          case "between":
            return `${field} BETWEEN ? AND ?`;
          default:
            return `${field} = ?`;
        }
      })
      .join(" AND ");

    if (conditions) {
      sql += ` WHERE ${conditions}`;
    }
  }

  return sql;
};

const extractQueryParams = (query: { filters: any[] }): any[] => {
  const params: any[] = [];

  if (query.filters) {
    query.filters.forEach((filter) => {
      if (filter.operator === "between" && Array.isArray(filter.value)) {
        params.push(...filter.value);
      } else if (filter.operator === "contains") {
        params.push(`%${filter.value}%`);
      } else {
        params.push(filter.value);
      }
    });
  }

  return params;
};

// Warehouse Reports API functions
export const warehouseReportsApi = {
  getWarehouseOverview: async (
    filters: {
      warehouseId?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams();
    Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== "")
      .forEach(([key, value]) => params.append(key, String(value)));

    const response = await api.get(`/warehouses/reports/overview?${params}`);
    return response.data;
  },

  getWarehouseInventoryReport: async (
    filters: {
      warehouseId?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams();
    Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== "")
      .forEach(([key, value]) => params.append(key, String(value)));

    const response = await api.get(`/warehouses/reports/inventory?${params}`);
    return response.data;
  },

  getWarehouseShipmentReport: async (
    filters: {
      warehouseId?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams();
    Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== "")
      .forEach(([key, value]) => params.append(key, String(value)));

    const response = await api.get(`/warehouses/reports/shipments?${params}`);
    return response.data;
  },

  getWarehouseReceiptsReport: async (
    filters: {
      warehouseId?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams();
    Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== "")
      .forEach(([key, value]) => params.append(key, String(value)));

    const response = await api.get(`/warehouses/reports/receipts?${params}`);
    return response.data;
  },

  getWarehousePerformanceMetrics: async (
    filters: {
      warehouseId?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams();
    Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== "")
      .forEach(([key, value]) => params.append(key, String(value)));

    const response = await api.get(`/warehouses/reports/performance?${params}`);
    return response.data;
  },

  exportWarehouseReport: async (
    filters: {
      warehouseId?: string;
      startDate?: string;
      endDate?: string;
      format?: "excel" | "csv";
      reportType?: string;
    } = {}
  ): Promise<ApiResponse<any>> => {
    const response = await api.post("/warehouses/reports/export", filters);
    return response.data;
  },
};

// School Reports API functions
export const schoolReportsApi = {
  getSchoolOverview: async (
    filters: {
      schoolId?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams();
    Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== "")
      .forEach(([key, value]) => params.append(key, String(value)));

    const response = await api.get(`/schools/reports/overview?${params}`);
    return response.data;
  },

  getSchoolInventoryReport: async (
    filters: {
      schoolId?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams();
    Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== "")
      .forEach(([key, value]) => params.append(key, String(value)));

    const response = await api.get(`/schools/reports/inventory?${params}`);
    return response.data;
  },

  getSchoolDistributionReport: async (
    filters: {
      schoolId?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
    } = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams();
    Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== "")
      .forEach(([key, value]) => params.append(key, String(value)));

    const response = await api.get(`/schools/reports/distributions?${params}`);
    return response.data;
  },

  getSchoolUtilizationReport: async (
    filters: {
      schoolId?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams();
    Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== "")
      .forEach(([key, value]) => params.append(key, String(value)));

    const response = await api.get(`/schools/reports/utilization?${params}`);
    return response.data;
  },

  getSchoolPerformanceReport: async (
    filters: {
      schoolId?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams();
    Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== "")
      .forEach(([key, value]) => params.append(key, String(value)));

    const response = await api.get(`/schools/reports/performance?${params}`);
    return response.data;
  },

  exportSchoolReport: async (
    filters: {
      schoolId?: string;
      startDate?: string;
      endDate?: string;
      format?: "pdf"; // School reports export as PDF
      reportType?: string;
    } = {}
  ): Promise<ApiResponse<any>> => {
    const payload = { ...filters } as any;
    if (!payload.format) payload.format = "pdf";
    // Coerce any legacy values to pdf for compatibility
    if (payload.format !== "pdf") payload.format = "pdf";
    const response = await api.post("/schools/reports/export", payload);
    return response.data;
  },
};

// School Utilization API functions
export const schoolUtilizationApi = {
  getUtilizationStats: async (
    schoolId: number,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await api.get(`/schools/${schoolId}/utilization/stats?${params}`);
    return response.data;
  },

  getUtilizationTransactions: async (
    schoolId: number,
    page: number = 1,
    limit: number = 20,
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      ),
    });
    const response = await api.get(`/schools/${schoolId}/utilization?${params}`);
    return response.data;
  },

  recordUtilization: async (
    schoolId: number,
    utilizationData: any
  ): Promise<ApiResponse<any>> => {
    const response = await api.post(`/schools/${schoolId}/utilization`, utilizationData);
    return response.data;
  },

  getItemsNeedingReorder: async (schoolId: number): Promise<ApiResponse<any>> => {
    const response = await api.get(`/schools/${schoolId}/utilization/reorder-needed`);
    return response.data;
  },

  updateReorderPoints: async (schoolId: number): Promise<ApiResponse<any>> => {
    const response = await api.put(`/schools/${schoolId}/utilization/reorder-points`);
    return response.data;
  },

  getUtilizationForecast: async (
    schoolId: number,
    itemId: number,
    forecastDays: number = 30
  ): Promise<ApiResponse<any>> => {
    const response = await api.get(
      `/schools/${schoolId}/utilization/forecast/${itemId}?days=${forecastDays}`
    );
    return response.data;
  },

  getTransactionTypes: async (): Promise<ApiResponse<any>> => {
    // Backend route is `/api/transaction-types` under the utilization router
    const response = await api.get('/transaction-types');
    return response.data;
  },
};

// Audit Log API functions
export const auditApi = {
  getAuditLogs: async (
    page: number = 1,
    limit: number = 50,
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      ),
    });
    const response = await api.get(`/audit-logs?${params}`);
    return response.data;
  },

  getAuditLogsForRecord: async (
    tableName: string,
    recordId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await api.get(
      `/audit-logs/record/${tableName}/${recordId}?${params}`
    );
    return response.data;
  },

  getAuditLogsForUser: async (
    userId: number,
    page: number = 1,
    limit: number = 50
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await api.get(`/audit-logs/user/${userId}?${params}`);
    return response.data;
  },
};

// Statistics API functions for dynamic stat cards
export const statisticsApi = {
  // Warehouse statistics
  getWarehouseStats: async (): Promise<
    ApiResponse<{
      totalItems: number;
      activeShipments: number;
      pendingReceipts: number;
      localCouncils: number;
    }>
  > => {
    const response = await api.get("/admin/statistics");
    return response.data;
  },

  // Council statistics
  getCouncilStats: async (): Promise<
    ApiResponse<{
      totalSchools: number;
      activeStudents: number;
      localCouncils: number;
      distributions: number;
    }>
  > => {
    const response = await api.get("/admin/statistics/councils");
    return response.data;
  },

  // School statistics
  getSchoolStats: async (
    schoolId?: number
  ): Promise<
    ApiResponse<{
      mySchool: string;
      inventoryItems: number;
      pendingReceipts: number;
      students: number;
    }>
  > => {
    const response = await api.get("/admin/statistics/schools");
    return response.data;
  },

  // Inventory statistics
  getInventoryStats: async (): Promise<
    ApiResponse<{
      totalItems: number;
      lowStockItems: number;
      totalValue: number;
      warehouses: number;
    }>
  > => {
    const response = await api.get("/national-inventory/statistics");
    return response.data;
  },

  // Get statistics for current user's context (role-based)
  getContextualStats: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("/dashboard/kpi");
    return response.data;
  },

  // School-specific inventory stats (for school cards)
  getSchoolInventoryStats: async (
    schoolId: number
  ): Promise<
    ApiResponse<{
      totalItems: number;
      totalValue: number;
      lowStockItems: number;
      outOfStockItems: number;
      recentTransactions: number;
      pendingReceipts: number;
    }>
  > => {
    const response = await api.get(`/schools/${schoolId}/inventory/stats`);
    return response.data;
  },
};

// School Import API
export const schoolImportApi = {
  uploadImport: async (
    file: File,
    options: { dryRun?: boolean; authoritative?: boolean } = {}
  ): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("dryRun", String(options.dryRun || false));
    formData.append("authoritative", String(options.authoritative || false));

    const response = await api.post("/school-imports/upload", formData);
    return response.data;
  },

  getImportStatus: async (importRunId: number): Promise<ApiResponse<any>> => {
    const response = await api.get(`/school-imports/${importRunId}/status`);
    return response.data;
  },

  getImportRows: async (
    importRunId: number,
    page: number = 1,
    pageSize: number = 50,
    filters: any = {}
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== "" && value !== "ALL"
        )
      ),
    });

    const response = await api.get(
      `/school-imports/${importRunId}/rows?${params}`
    );
    return response.data;
  },

  resolveCouncil: async (
    importRunId: number,
    resolveData: {
      stagingRowIds: number[];
      councilId: number;
      createAlias?: boolean;
      aliasName?: string;
    }
  ): Promise<ApiResponse<any>> => {
    const response = await api.post(
      `/school-imports/${importRunId}/resolve-council`,
      resolveData
    );
    return response.data;
  },

  commitImport: async (
    importRunId: number,
    commitData: { confirmOverwrites?: boolean } = {}
  ): Promise<ApiResponse<any>> => {
    const response = await api.post(
      `/school-imports/${importRunId}/commit`,
      commitData
    );
    return response.data;
  },

  cancelImport: async (importRunId: number): Promise<ApiResponse<any>> => {
    const response = await api.post(`/school-imports/${importRunId}/cancel`);
    return response.data;
  },

  rollbackImport: async (importRunId: number): Promise<ApiResponse<any>> => {
    const response = await api.post(`/school-imports/${importRunId}/rollback`);
    return response.data;
  },

  getCouncilHierarchy: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("/school-imports/council-hierarchy");
    return response.data;
  },

  getRecentImports: async (limit: number = 10): Promise<ApiResponse<any>> => {
    const response = await api.get(`/school-imports/recent?limit=${limit}`);
    return response.data;
  },
};
