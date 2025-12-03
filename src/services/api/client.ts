import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL, DEFAULT_HEADERS, REQUEST_TIMEOUT } from '../../constants/api';

// ============================================================================
// JWT UTILITIES
// ============================================================================

// Function to decode JWT token
export const decodeJWT = (token: string) => {
  try {
    // JWT token has 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token format');
    }
    
    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if needed
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode base64
    const decodedPayload = atob(paddedPayload);
    
    // Parse JSON
    const parsedPayload = JSON.parse(decodedPayload);
    
    return parsedPayload;
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

// Function to get role from JWT token
export const getRoleFromToken = (token: string): string | null => {
  const payload = decodeJWT(token);
  return payload?.role || null;
};

// Function to get user ID from JWT token
export const getUserIdFromToken = (token: string): string | null => {
  const payload = decodeJWT(token);
  return payload?._id || payload?.id || null;
};

// ============================================================================
// AXIOS CONFIGURATION
// ============================================================================

// Tạo instance axios với cấu hình mặc định
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor để thêm token vào header
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('ACCESS_TOKEN');
      console.log('🔑 Token from AsyncStorage:', token ? 'Present' : 'Missing');
      console.log('🌐 Making request to:', config.url);
      console.log('📝 Request method:', config.method?.toUpperCase());
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Token added to request headers');
        console.log('🔐 Authorization header:', `Bearer ${token.substring(0, 20)}...`);
      } else {
        console.log('❌ No token found, request will be unauthorized');
        console.log('⚠️ This request will likely fail with 401');
      }
    } catch (error) {
      console.error('Error getting token from AsyncStorage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý lỗi chung
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    // Silently handle 502 errors (server unavailable) - don't log them
    if (error.response?.status === 502) {
      // Don't log 502 errors - they're handled silently
      return Promise.reject(error);
    }
    
    // Check for specific errors that should be handled silently
    const errorMessage = error.response?.data?.message || '';
    const isProductGroupLimitError = errorMessage.toLowerCase().includes('product group limit') || 
                                    errorMessage.toLowerCase().includes('allows 0 product groups') ||
                                    errorMessage.toLowerCase().includes('upgrade your subscription');
    
    // Only log errors that are not user-facing (avoid logging expected errors like validation)
    // Don't log product group limit errors - they're handled in UI with proper messages
    if (error.response?.status && error.response.status >= 500 && !isProductGroupLimitError) {
      console.log('❌ API Error:', error.response?.status, error.config?.url);
      console.log('Error details:', error.response?.data);
    }
    
    // Do NOT auto-clear tokens here. Let the auth flow decide how to handle 401.
    // This avoids race conditions where tokens are valid/just refreshed.
    return Promise.reject(error);
  }
);

// ============================================================================
// GENERIC API CALL FUNCTION
// ============================================================================

async function apiCall<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    data?: any;
    headers?: Record<string, string>;
    params?: Record<string, any>;
  } = {}
): Promise<T> {
  console.log('🚀 API Call:', {
    endpoint,
    method: options.method || 'GET',
    hasData: !!options.data,
    hasHeaders: !!options.headers
  });
  
  try {
    const response = await apiClient({
      url: endpoint,
      method: options.method || 'GET',
      data: options.data,
      headers: {
        ...DEFAULT_HEADERS,
        ...options.headers,
      },
      params: options.params,
      timeout: REQUEST_TIMEOUT,
    });

    return response.data;
  } catch (error: any) {
    // Silently handle 404 and 400 "Invalid product ID" errors for product scan endpoint
    if (endpoint.includes('/products/scan/')) {
      const is404 = error.response?.status === 404;
      const is400InvalidId = error.response?.status === 400 && 
                             (error.response?.data?.message?.toLowerCase().includes('invalid product') ||
                              error.response?.data?.message?.toLowerCase().includes('product id'));
      
      if (is404 || is400InvalidId) {
        console.log('⚠️ Product scan error (404/400) - silently handled');
        // Return a response object instead of throwing
        return {
          success: false,
          statusCode: error.response?.status || 404,
          message: error.response?.data?.message || 'Product not found',
          data: {} as any,
        } as T;
      }
    }
    
    // Silently handle 502 errors (server unavailable) - don't log them
    if (error.response?.status === 502) {
      // Don't log 502 errors - they're handled silently
      throw new Error('SERVER_UNAVAILABLE');
    }
    
    // Check for specific errors that should be handled silently
    const errorMessage = error.response?.data?.message || '';
    const isProductGroupLimitError = errorMessage.toLowerCase().includes('product group limit') || 
                                    errorMessage.toLowerCase().includes('allows 0 product groups') ||
                                    errorMessage.toLowerCase().includes('upgrade your subscription');
    
    // Only log server errors (500+), not validation errors (400)
    // This prevents error toasts from showing for expected validation errors
    // Don't log product group limit errors - they're handled in UI with proper messages
    if (error.response?.status && error.response.status >= 500 && !isProductGroupLimitError) {
      console.error('API call failed (server error):', error);
    } else if (!error.response) {
      // Network errors - log but don't show toast
      console.log('API call failed (network error):', error.message);
    }
    
    if (error.response) {
      const errorMessage = error.response.data?.message || `HTTP error! status: ${error.response.status}`;
      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error('Network error. Please check your connection and try again.');
    } else {
      throw new Error(error.message || 'An unexpected error occurred.');
    }
  }
}

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

export const testApiConnection = async (): Promise<boolean> => {
  try {
    await apiClient.post('/auth/login', {
      email: 'test@test.com',
      password: 'test'
    });
    return true;
  } catch (error: any) {
    if (error.response?.status === 401) {
      return true;
    }
    console.error('API connection test failed:', error);
    return false;
  }
};

export const testAuthEndpoints = async () => {
  const results = {
    login: false,
    register: false,
    forgotPassword: false,
  };

  try {
    try {
      await apiClient.post('/auth/login', {});
    } catch (error: any) {
      results.login = error.response?.status === 400;
    }

    try {
      await apiClient.post('/auth/register', {});
    } catch (error: any) {
      results.register = error.response?.status === 400;
    }

    try {
      await apiClient.post('/auth/forgot-password', {});
    } catch (error: any) {
      results.forgotPassword = error.response?.status === 400;
    }

  } catch (error) {
    console.error('Auth endpoints test failed:', error);
  }

  return results;
};

export { API_BASE_URL, apiCall, apiClient };
export default apiClient;

