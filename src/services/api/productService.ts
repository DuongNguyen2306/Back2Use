import { API_ENDPOINTS, REQUEST_TIMEOUT } from '../../constants/api';
import { Product, ProductResponse } from '../../types/product.types';
import { apiClient } from './client';

// Helper function to get current access token with auto refresh
let getCurrentAccessToken: (() => Promise<string | null>) | null = null;

export const setProductTokenProvider = (tokenProvider: () => Promise<string | null>) => {
  getCurrentAccessToken = tokenProvider;
};

export const productsApi = {
  // Get product by ID - GET /products/{id}
  getById: async (productId: string, token?: string): Promise<ProductResponse> => {
    try {
      console.log('getProductById called with productId:', productId);
      
      if (!productId) {
        throw new Error('Product ID is required');
      }

      // Get token if not provided
      let accessToken = token;
      if (!accessToken && getCurrentAccessToken) {
        try {
          accessToken = await getCurrentAccessToken() || undefined;
        } catch (error) {
          console.warn('Error getting token from provider:', error);
        }
      }

      // Fallback: Get token from AsyncStorage
      if (!accessToken) {
        try {
          const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
          accessToken = await AsyncStorage.getItem('ACCESS_TOKEN') || undefined;
        } catch (error) {
          console.warn('Error getting token from AsyncStorage:', error);
        }
      }

      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS.GET_BY_ID}/${productId}`, {
        headers,
        timeout: REQUEST_TIMEOUT,
      });

      const result = response.data;
      console.log('📡 Product API Response:', JSON.stringify(result, null, 2));
      
      // Handle both response formats: { success: true, data: {...} } or { statusCode: 200, data: {...} }
      if ((result.success === true || result.statusCode === 200) && result.data) {
        // Normalize response format to match ProductResponse interface
        return {
          statusCode: result.statusCode || 200,
          message: result.message || 'Success',
          data: result.data,
          success: result.success !== undefined ? result.success : true,
        };
      } else {
        throw new Error(result.message || 'Failed to get product');
      }
    } catch (error: any) {
      console.error('Error fetching product:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please check your connection and try again.');
      }
      
      if (error.message === 'Network Error') {
        throw new Error('Network error. Please check your internet connection and server status.');
      }
      
      throw new Error(`Failed to fetch product: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    }
  },

  // Get product by ID with auto refresh token
  getByIdWithAutoRefresh: async (productId: string): Promise<ProductResponse> => {
    return productsApi.getById(productId);
  },

  // Get products for customer by product group ID - GET /products/customer/{productGroupId}
  getCustomerProducts: async (
    productGroupId: string,
    params?: { page?: number; limit?: number }
  ): Promise<{
    statusCode: number;
    message: string;
    data: {
      products: Product[];
      total: number;
      currentPage: number;
      totalPages: number;
    };
  }> => {
    try {
      console.log('🛒 Getting customer products for productGroupId:', productGroupId);

      // Get token if not provided
      let accessToken: string | undefined;
      if (getCurrentAccessToken) {
        try {
          accessToken = await getCurrentAccessToken() || undefined;
        } catch (error) {
          console.warn('Error getting token from provider:', error);
        }
      }

      // Fallback: Get token from AsyncStorage
      if (!accessToken) {
        try {
          const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
          accessToken = await AsyncStorage.getItem('ACCESS_TOKEN') || undefined;
        } catch (error) {
          console.warn('Error getting token from AsyncStorage:', error);
        }
      }

      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const { page = 1, limit = 100 } = params || {};
      const response = await apiClient.get(
        `${API_ENDPOINTS.PRODUCTS.GET_CUSTOMER}/${productGroupId}`,
        {
          headers,
          params: { page, limit },
          timeout: REQUEST_TIMEOUT,
        }
      );

      const result = response.data;
      console.log('📡 Customer Products API Response:', JSON.stringify(result, null, 2));

      if (result.statusCode === 200 && result.data) {
        return {
          statusCode: result.statusCode,
          message: result.message || 'Products fetched successfully',
          data: {
            products: result.data.products || [],
            total: result.data.total || 0,
            currentPage: result.data.currentPage || page,
            totalPages: result.data.totalPages || 0,
          },
        };
      } else {
        throw new Error(result.message || 'Failed to get customer products');
      }
    } catch (error: any) {
      console.error('Error fetching customer products:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });

      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please check your connection and try again.');
      }

      if (error.message === 'Network Error') {
        throw new Error('Network error. Please check your internet connection and server status.');
      }

      throw new Error(
        `Failed to fetch customer products: ${error.response?.data?.message || error.message || 'Unknown error'}`
      );
    }
  },

  // Update product - PATCH /products/{id}
  update: async (
    productId: string,
    updates: {
      status?: 'available' | 'borrowed' | 'maintenance' | 'retired';
      condition?: string;
      lastConditionNote?: string;
      lastConditionImage?: string;
    },
    token?: string
  ): Promise<ProductResponse> => {
    try {
      console.log('🔄 updateProduct called with productId:', productId, 'updates:', updates);
      
      if (!productId) {
        throw new Error('Product ID is required');
      }

      // Get token if not provided
      let accessToken = token;
      if (!accessToken && getCurrentAccessToken) {
        try {
          accessToken = await getCurrentAccessToken() || undefined;
        } catch (error) {
          console.warn('Error getting token from provider:', error);
        }
      }

      // Fallback: Get token from AsyncStorage
      if (!accessToken) {
        try {
          const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
          accessToken = await AsyncStorage.getItem('ACCESS_TOKEN') || undefined;
        } catch (error) {
          console.warn('Error getting token from AsyncStorage:', error);
        }
      }

      if (!accessToken) {
        throw new Error('Authentication required to update product');
      }

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      };

      const response = await apiClient.patch(
        `${API_ENDPOINTS.PRODUCTS.UPDATE}/${productId}`,
        updates,
        {
          headers,
          timeout: REQUEST_TIMEOUT,
        }
      );

      const result = response.data;
      console.log('📡 Update Product API Response:', JSON.stringify(result, null, 2));
      
      // Handle both response formats
      if ((result.success === true || result.statusCode === 200) && result.data) {
        return {
          statusCode: result.statusCode || 200,
          message: result.message || 'Product updated successfully',
          data: result.data,
          success: result.success !== undefined ? result.success : true,
        };
      } else {
        throw new Error(result.message || 'Failed to update product');
      }
    } catch (error: any) {
      console.error('Error updating product:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please check your connection and try again.');
      }
      
      if (error.message === 'Network Error') {
        throw new Error('Network error. Please check your internet connection and server status.');
      }
      
      throw new Error(
        `Failed to update product: ${error.response?.data?.message || error.message || 'Unknown error'}`
      );
    }
  },
};

export default productsApi;
