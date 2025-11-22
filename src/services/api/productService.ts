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
      
      if (result.statusCode === 200 && result.data) {
        return result;
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
};

export default productsApi;

