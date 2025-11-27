import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS, REQUEST_TIMEOUT } from '../../constants/api';
import {
  CreateBorrowTransactionRequest,
  CreateBorrowTransactionResponse
} from '../../types/product.types';
import { apiClient } from './client';

// Helper function to get current access token with auto refresh
let getCurrentAccessToken: (() => Promise<string | null>) | null = null;

export const setBorrowTransactionTokenProvider = (tokenProvider: () => Promise<string | null>) => {
  getCurrentAccessToken = tokenProvider;
};

export const borrowTransactionsApi = {
  // Create borrow transaction - POST /borrow-transactions
  create: async (
    borrowDto: CreateBorrowTransactionRequest,
    token?: string
  ): Promise<CreateBorrowTransactionResponse> => {
    try {
      console.log('createBorrowTransaction called with data:', {
        productId: borrowDto.productId,
        businessId: borrowDto.businessId,
        depositValue: borrowDto.depositValue,
        durationInDays: borrowDto.durationInDays,
        type: borrowDto.type,
      });
      
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
          accessToken = await AsyncStorage.getItem('ACCESS_TOKEN') || undefined;
        } catch (error) {
          console.warn('Error getting token from AsyncStorage:', error);
        }
      }

      if (!accessToken) {
        throw new Error('No access token available. Please log in first.');
      }

      const response = await apiClient.post(
        API_ENDPOINTS.BORROW_TRANSACTIONS.CREATE,
        borrowDto,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: REQUEST_TIMEOUT,
        }
      );

      const result = response.data;
      
      if ((result.statusCode === 201 || result.statusCode === 200) && result.data) {
        return result;
      } else {
        throw new Error(result.message || 'Failed to create borrow transaction');
      }
    } catch (error: any) {
      console.error('Error creating borrow transaction:', error);
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
      
      // Return server error message if available
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      throw new Error(`Failed to create borrow transaction: ${errorMessage}`);
    }
  },

  // Create borrow transaction with auto refresh token
  createWithAutoRefresh: async (
    borrowDto: CreateBorrowTransactionRequest
  ): Promise<CreateBorrowTransactionResponse> => {
    return borrowTransactionsApi.create(borrowDto);
  },

  // Get customer borrow transaction history
  getCustomerHistory: async (params?: {
    status?: string;
    productName?: string;
    borrowTransactionType?: string;
    page?: number;
    limit?: number;
  }): Promise<any> => {
    try {
      // Get token
      let accessToken: string | undefined;
      if (getCurrentAccessToken) {
        try {
          accessToken = await getCurrentAccessToken() || undefined;
        } catch (error) {
          console.warn('Error getting token from provider:', error);
        }
      }

      if (!accessToken) {
        try {
          accessToken = await AsyncStorage.getItem('ACCESS_TOKEN') || undefined;
        } catch (error) {
          console.warn('Error getting token from AsyncStorage:', error);
        }
      }

      if (!accessToken) {
        throw new Error('No access token available. Please log in first.');
      }

      // Build query params
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.productName) queryParams.append('productName', params.productName);
      if (params?.borrowTransactionType) queryParams.append('borrowTransactionType', params.borrowTransactionType);
      if (params?.page) queryParams.append('page', String(params.page));
      if (params?.limit) queryParams.append('limit', String(params.limit));

      const endpoint = `${API_ENDPOINTS.BORROW_TRANSACTIONS.CUSTOMER_HISTORY}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await apiClient.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: REQUEST_TIMEOUT,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error getting customer borrow history:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to get borrow history';
      throw new Error(errorMessage);
    }
  },
};

export default borrowTransactionsApi;

