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
      const serverMessage = error.response?.data?.message || error.message || 'Unknown error';
      
      // Handle specific error cases with user-friendly messages
      if (serverMessage.toLowerCase().includes('maximum concurrent') || 
          serverMessage.toLowerCase().includes('limit reached')) {
        throw new Error(serverMessage); // Use server message directly for limit errors
      }
      
      throw new Error(`Failed to create borrow transaction: ${serverMessage}`);
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

  // Get business borrow transaction history
  getBusinessHistory: async (params?: {
    status?: string;
    productName?: string;
    serialNumber?: string;
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
      if (params?.serialNumber) queryParams.append('serialNumber', params.serialNumber);
      if (params?.borrowTransactionType) queryParams.append('borrowTransactionType', params.borrowTransactionType);
      if (params?.page) queryParams.append('page', String(params.page));
      if (params?.limit) queryParams.append('limit', String(params.limit));

      const endpoint = `${API_ENDPOINTS.BORROW_TRANSACTIONS.BUSINESS_HISTORY}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await apiClient.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: REQUEST_TIMEOUT,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error getting business borrow history:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to get borrow history';
      throw new Error(errorMessage);
    }
  },

  // Confirm borrow transaction (Business)
  confirm: async (transactionId: string): Promise<any> => {
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

      // Use direct string to avoid undefined issues
      const confirmEndpoint = API_ENDPOINTS.BORROW_TRANSACTIONS.CONFIRM || '/borrow-transactions/confirm';
      const endpoint = `${confirmEndpoint}/${transactionId}`;
      console.log('🔍 Confirm endpoint:', endpoint);
      console.log('🔍 Transaction ID:', transactionId);
      console.log('🔍 CONFIRM constant:', API_ENDPOINTS.BORROW_TRANSACTIONS.CONFIRM);

      const response = await apiClient.patch(endpoint, {}, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: REQUEST_TIMEOUT,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error confirming borrow transaction:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to confirm borrow transaction';
      throw new Error(errorMessage);
    }
  },

  // Cancel borrow transaction (Customer)
  cancel: async (transactionId: string): Promise<any> => {
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

      // Use direct string to avoid undefined issues
      const cancelEndpoint = API_ENDPOINTS.BORROW_TRANSACTIONS.CUSTOMER_CANCEL || '/borrow-transactions/customer/cancel';
      const endpoint = `${cancelEndpoint}/${transactionId}`;
      console.log('🔍 Cancel endpoint:', endpoint);
      console.log('🔍 Transaction ID:', transactionId);
      console.log('🔍 CUSTOMER_CANCEL constant:', API_ENDPOINTS.BORROW_TRANSACTIONS.CUSTOMER_CANCEL);

      const response = await apiClient.patch(endpoint, {}, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: REQUEST_TIMEOUT,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error canceling borrow transaction:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to cancel borrow transaction';
      throw new Error(errorMessage);
    }
  },

  // Process return check - POST /borrow-transactions/{serialNumber}/return-check
  processReturnCheck: async (
    serialNumber: string,
    returnData: {
      condition: string; // 'good' | 'damaged' | etc.
      note: string;
      images?: string[]; // Array of image URIs or base64
    }
  ): Promise<any> => {
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

      // Use direct string to avoid undefined issues
      const returnCheckEndpoint = API_ENDPOINTS.BORROW_TRANSACTIONS.RETURN_CHECK || '/borrow-transactions';
      const endpoint = `${returnCheckEndpoint}/${serialNumber}/return-check`;
      console.log('🔍 Process return check endpoint:', endpoint);
      console.log('🔍 Serial number:', serialNumber);
      console.log('🔍 Return data:', { condition: returnData.condition, note: returnData.note, imagesCount: returnData.images?.length || 0 });

      // Create FormData for multipart/form-data
      const formData = new FormData();
      formData.append('condition', returnData.condition);
      formData.append('note', returnData.note);
      
      // Append images if provided
      if (returnData.images && returnData.images.length > 0) {
        returnData.images.forEach((imageUri, index) => {
          // Convert image URI to file format for FormData
          const imageFile = {
            uri: imageUri,
            type: 'image/jpeg',
            name: `return_image_${index}.jpg`,
          } as any;
          formData.append('images', imageFile);
        });
      }

      const response = await apiClient.post(endpoint, formData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: REQUEST_TIMEOUT * 2, // Longer timeout for file uploads
      });

      return response.data;
    } catch (error: any) {
      console.error('Error processing return check:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to process return check';
      throw new Error(errorMessage);
    }
  },
};

export default borrowTransactionsApi;

