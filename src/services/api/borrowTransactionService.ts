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

  // Get customer borrow transaction detail
  getCustomerDetail: async (transactionId: string): Promise<any> => {
    try {
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

      const endpoint = `${API_ENDPOINTS.BORROW_TRANSACTIONS.CUSTOMER_DETAIL}/${transactionId}`;

      const response = await apiClient.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: REQUEST_TIMEOUT,
      });

      return response.data;
    } catch (error: any) {
      // Silently handle errors - don't log to console.error to avoid UI error display
      console.log('⚠️ Error getting customer transaction detail (silently handled):', error?.response?.status);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to get transaction detail';
      throw new Error(errorMessage);
    }
  },

  // Get business borrow transaction history
  getBusinessHistory: async (params?: {
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

      const endpoint = `${API_ENDPOINTS.BORROW_TRANSACTIONS.BUSINESS_HISTORY}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      console.log('🔍 Getting business borrow history:', {
        endpoint,
        params,
      });

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
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to get business borrow history';
      throw new Error(errorMessage);
    }
  },

  // Get business pending transactions
  getBusinessPending: async (): Promise<any> => {
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

      const endpoint = '/borrow-transactions/business-pending';

      const response = await apiClient.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: REQUEST_TIMEOUT,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error getting business pending transactions:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to get business pending transactions';
      throw new Error(errorMessage);
    }
  },

  // Confirm borrow transaction
  confirm: async (transactionId: string): Promise<any> => {
    try {
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

      const endpoint = `${API_ENDPOINTS.BORROW_TRANSACTIONS.CONFIRM}/${transactionId}`;

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
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to confirm transaction';
      throw new Error(errorMessage);
    }
  },

  // Cancel borrow transaction (business)
  cancel: async (transactionId: string): Promise<any> => {
    try {
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

      const endpoint = `${API_ENDPOINTS.BORROW_TRANSACTIONS.CUSTOMER_CANCEL}/${transactionId}`;

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
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to cancel transaction';
      throw new Error(errorMessage);
    }
  },

  // Extend borrow duration (customer)
  extend: async (transactionId: string, additionalDays: number): Promise<any> => {
    try {
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

      const endpoint = `${API_ENDPOINTS.BORROW_TRANSACTIONS.CUSTOMER_EXTEND}/${transactionId}`;

      console.log('🔍 Extending borrow transaction:', {
        transactionId,
        additionalDays,
        endpoint,
      });

      const response = await apiClient.patch(endpoint, {
        additionalDays,
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: REQUEST_TIMEOUT,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error extending borrow transaction:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to extend borrow duration';
      throw new Error(errorMessage);
    }
  },

  // Get damage policy
  getDamagePolicy: async (): Promise<any> => {
    try {
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

      const response = await apiClient.get(API_ENDPOINTS.BORROW_TRANSACTIONS.DAMAGE_POLICY, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: REQUEST_TIMEOUT,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error getting damage policy:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to get damage policy';
      throw new Error(errorMessage);
    }
  },

  // Check return (POST /borrow-transactions/{serialNumber}/check)
  checkReturn: async (serialNumber: string, checkData: {
    frontImage?: any;
    frontIssue?: string;
    backImage?: any;
    backIssue?: string;
    leftImage?: any;
    leftIssue?: string;
    rightImage?: any;
    rightIssue?: string;
    topImage?: any;
    topIssue?: string;
    bottomImage?: any;
    bottomIssue?: string;
  }): Promise<any> => {
    try {
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

      const endpoint = `${API_ENDPOINTS.BORROW_TRANSACTIONS.RETURN_CHECK}/${serialNumber}/check`;

      // Create FormData for multipart/form-data
      const formData = new FormData();
      if (checkData.frontImage) {
        formData.append('frontImage', {
          uri: checkData.frontImage,
          type: 'image/jpeg',
          name: 'front.jpg',
        } as any);
      }
      if (checkData.frontIssue) {
        formData.append('frontIssue', checkData.frontIssue);
      }
      if (checkData.backImage) {
        formData.append('backImage', {
          uri: checkData.backImage,
          type: 'image/jpeg',
          name: 'back.jpg',
        } as any);
      }
      if (checkData.backIssue) {
        formData.append('backIssue', checkData.backIssue);
      }
      if (checkData.leftImage) {
        formData.append('leftImage', {
          uri: checkData.leftImage,
          type: 'image/jpeg',
          name: 'left.jpg',
        } as any);
      }
      if (checkData.leftIssue) {
        formData.append('leftIssue', checkData.leftIssue);
      }
      if (checkData.rightImage) {
        formData.append('rightImage', {
          uri: checkData.rightImage,
          type: 'image/jpeg',
          name: 'right.jpg',
        } as any);
      }
      if (checkData.rightIssue) {
        formData.append('rightIssue', checkData.rightIssue);
      }
      if (checkData.topImage) {
        formData.append('topImage', {
          uri: checkData.topImage,
          type: 'image/jpeg',
          name: 'top.jpg',
        } as any);
      }
      if (checkData.topIssue) {
        formData.append('topIssue', checkData.topIssue);
      }
      if (checkData.bottomImage) {
        formData.append('bottomImage', {
          uri: checkData.bottomImage,
            type: 'image/jpeg',
          name: 'bottom.jpg',
        } as any);
      }
      if (checkData.bottomIssue) {
        formData.append('bottomIssue', checkData.bottomIssue);
      }

      const response = await apiClient.post(endpoint, formData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: REQUEST_TIMEOUT,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error checking return:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to check return';
      throw new Error(errorMessage);
    }
  },

  // Confirm return (POST /borrow-transactions/{serialNumber}/confirm)
  confirmReturn: async (serialNumber: string, confirmData: {
    note?: string;
    damageFaces?: any[];
    tempImages?: any;
    totalDamagePoints?: number;
    finalCondition?: string;
  }): Promise<any> => {
    try {
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

      const endpoint = `${API_ENDPOINTS.BORROW_TRANSACTIONS.RETURN_CONFIRM}/${serialNumber}/confirm`;

      const response = await apiClient.post(endpoint, confirmData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: REQUEST_TIMEOUT,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error confirming return:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to confirm return';
      throw new Error(errorMessage);
    }
  },
};

export default borrowTransactionsApi;

