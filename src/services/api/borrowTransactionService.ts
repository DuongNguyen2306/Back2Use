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
      // Silently handle 400 errors (validation errors) - don't log to console
      const isValidationError = error.response?.status === 400;
      
      if (!isValidationError) {
        console.error('Error creating borrow transaction:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          response: error.response?.data,
          status: error.response?.status,
          url: error.config?.url
        });
      }
      
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

  // Get customer borrow transaction detail by ID
  getCustomerDetail: async (id: string): Promise<any> => {
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

      if (!id) {
        throw new Error('Transaction ID is required');
      }

      const endpoint = `${API_ENDPOINTS.BORROW_TRANSACTIONS.CUSTOMER_DETAIL}/${id}`;

      const response = await apiClient.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: REQUEST_TIMEOUT,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error getting customer borrow transaction detail:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to get transaction detail';
      throw new Error(errorMessage);
    }
  },

  // Get business borrow transaction history
  // Get monthly transactions for chart
  getMonthlyTransactions: async (params?: { year?: number }): Promise<any> => {
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

      const { year = new Date().getFullYear(), type, status } = params || {};
      const queryParams = new URLSearchParams();
      queryParams.append('year', String(year));
      if (type) queryParams.append('type', type);
      if (status) queryParams.append('status', status);
      const endpoint = `${API_ENDPOINTS.BORROW_TRANSACTIONS.MONTHLY}?${queryParams.toString()}`;

      const response = await apiClient.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        timeout: REQUEST_TIMEOUT,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error getting monthly transactions:', error);
      throw error;
    }
  },
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

  // Get business borrow transaction detail by ID
  getBusinessDetail: async (id: string): Promise<any> => {
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

      if (!id) {
        throw new Error('Transaction ID is required');
      }

      const endpoint = `${API_ENDPOINTS.BORROW_TRANSACTIONS.BUSINESS_DETAIL}/${id}`;

      const response = await apiClient.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: REQUEST_TIMEOUT,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error getting business borrow transaction detail:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to get transaction detail';
      throw new Error(errorMessage);
    }
  },

  // Cancel customer borrow transaction - PATCH /borrow-transactions/customer/cancel/{id}
  cancel: async (id: string): Promise<any> => {
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

      if (!id) {
        throw new Error('Transaction ID is required');
      }

      const endpoint = `${API_ENDPOINTS.BORROW_TRANSACTIONS.CUSTOMER_CANCEL}/${id}`;

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

  // Confirm borrow transaction - PATCH /borrow-transactions/confirm/{id}
  confirmBorrow: async (id: string): Promise<any> => {
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

      if (!id) {
        throw new Error('Transaction ID is required');
      }

      const endpoint = `${API_ENDPOINTS.BORROW_TRANSACTIONS.CONFIRM}/${id}`;

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

  // Check return - POST /borrow-transactions/{serialNumber}/check
  checkReturn: async (serialNumber: string, checkData: any): Promise<any> => {
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

      if (!serialNumber) {
        throw new Error('Serial number is required');
      }

      const endpoint = API_ENDPOINTS.BORROW_TRANSACTIONS.RETURN_CHECK.replace('{serialNumber}', serialNumber);
      
      console.log('🔍 Check Return - Endpoint:', endpoint);
      console.log('🔍 Check Return - Serial Number:', serialNumber);
      console.log('🔍 Check Return - Check Data:', JSON.stringify(checkData, null, 2));

      // Create FormData for multipart/form-data request
      const formData = new FormData();

      // Map faces to API field names (note: API has typos like "backlssue" and "rightlssue")
      // Based on API docs, field names are lowercase for images and issues
      const faceFieldMap: Record<string, { image: string; issue: string }> = {
        front:  { image: 'frontImage',  issue: 'frontIssue' },
        back:   { image: 'backImage',   issue: 'backIssue' },    // ĐÃ SỬA
        left:   { image: 'leftImage',   issue: 'leftIssue' },
        right:  { image: 'rightImage',  issue: 'rightIssue' },   // ĐÃ SỬA
        top:    { image: 'topImage',    issue: 'topIssue' },
        bottom: { image: 'bottomImage', issue: 'bottomIssue' },
      };

      // Add images and issues for each face
      // API requires all fields to be present
      let imageCount = 0;
      let issueCount = 0;
      
      Object.keys(faceFieldMap).forEach((face) => {
        const fieldNames = faceFieldMap[face];
        const imageKey = `${face}Image` as keyof typeof checkData;
        const issueKey = `${face}Issue` as keyof typeof checkData;

        // Add image - only append if exists and is valid
        const imageUri = checkData[imageKey];
        if (imageUri && 
            typeof imageUri === 'string' && 
            imageUri.trim() !== '' && 
            imageUri !== 'null' &&
            !imageUri.startsWith('data:')) {
          // For React Native FormData, append file with proper format
          // Use file:// prefix if needed for local files
          const fileUri = imageUri.startsWith('file://') ? imageUri : 
                         imageUri.startsWith('/') ? `file://${imageUri}` : imageUri;
          
          formData.append(fieldNames.image, {
            uri: fileUri,
            type: 'image/jpeg',
            name: `${face}.jpg`,
          } as any);
          imageCount++;
          console.log(`📷 Added ${face} image:`, fileUri);
        }

        // Add issue (always required by API)
        const issue = checkData[issueKey] || '';
        formData.append(fieldNames.issue, typeof issue === 'string' ? issue : String(issue));
        issueCount++;
        console.log(`📝 Added ${face} issue:`, issue || '(empty)');
      });
      
      console.log(`📦 FormData prepared: ${imageCount} images, ${issueCount} issues`);

      console.log('📤 Sending FormData to:', endpoint);

      // For FormData, let axios automatically set Content-Type with boundary
      // Don't manually set 'Content-Type' header
      const response = await apiClient.post(endpoint, formData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          // Let axios set Content-Type automatically for FormData
        },
        timeout: REQUEST_TIMEOUT,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error checking return:', error);
      
      // Silently handle 404 "Material not found" errors
      if (error?.response?.status === 404) {
        const errorMessage = error?.response?.data?.message || error?.message || '';
        if (errorMessage.toLowerCase().includes('material not found') || 
            errorMessage.toLowerCase().includes('not found')) {
          // Silently handle - don't show to user
          console.warn('⚠️ Material not found (404) - silently handled');
          throw new Error('MATERIAL_NOT_FOUND');
        }
      }
      
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to check return';
      throw new Error(errorMessage);
    }
  },

  // Confirm return - POST /borrow-transactions/{serialNumber}/confirm
  confirmReturn: async (serialNumber: string, confirmData: any): Promise<any> => {
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

      if (!serialNumber) {
        throw new Error('Serial number is required');
      }

      const endpoint = `${API_ENDPOINTS.BORROW_TRANSACTIONS.RETURN_CONFIRM.replace('{serialNumber}', serialNumber)}`;

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

  // Extend borrow duration - PATCH /borrow-transactions/customer/extend/{id}
  extend: async (id: string, additionalDays: number): Promise<any> => {
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

      if (!id) {
        throw new Error('Transaction ID is required');
      }

      if (!additionalDays || additionalDays <= 0) {
        throw new Error('Additional days must be greater than 0');
      }

      const endpoint = `${API_ENDPOINTS.BORROW_TRANSACTIONS.CUSTOMER_EXTEND}/${id}`;

      const response = await apiClient.patch(endpoint, { additionalDays }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: REQUEST_TIMEOUT,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error extending borrow transaction:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to extend borrow transaction';
      throw new Error(errorMessage);
    }
  },

  // Get damage policy - GET /borrow-transactions/damage-policy
  getDamagePolicy: async (): Promise<any> => {
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

      const endpoint = API_ENDPOINTS.BORROW_TRANSACTIONS.DAMAGE_POLICY;

      const response = await apiClient.get(endpoint, {
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
};

export default borrowTransactionsApi;

