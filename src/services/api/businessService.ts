import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS, REQUEST_TIMEOUT } from '../../constants/api';
import {
    BusinessRegisterRequest,
    BusinessRegisterResponse,
    BusinessFormHistory,
    BusinessFormHistoryResponse,
    Business,
    GetAllBusinessesResponse,
    MaterialCreateRequest,
    MaterialItem,
    NearbyBusinessesResponse,
    PaginatedResponse,
    BusinessProfileResponse,
} from '../../types/business.types';
import { apiCall } from './client';
import { apiClient } from './client';

// Helper function to get current access token with auto refresh
let getCurrentAccessToken: (() => Promise<string | null>) | null = null;

export const setBusinessTokenProvider = (tokenProvider: () => Promise<string | null>) => {
  getCurrentAccessToken = tokenProvider;
};

// Business registration
export const businessApi = {
  register: async (businessData: BusinessRegisterRequest): Promise<BusinessRegisterResponse> => {
    const formData = new FormData();

    formData.append('businessName', businessData.businessName);
    formData.append('businessType', businessData.businessType);
    formData.append('businessMail', businessData.businessMail);
    formData.append('businessAddress', businessData.businessAddress);
    formData.append('businessPhone', businessData.businessPhone);
    formData.append('taxCode', businessData.taxCode);
    formData.append('openTime', businessData.openTime);
    formData.append('closeTime', businessData.closeTime);

    if (businessData.businessLogo) {
      formData.append('businessLogo', businessData.businessLogo as any);
    }
    if (businessData.foodSafetyCertUrl) {
      formData.append('foodSafetyCertUrl', businessData.foodSafetyCertUrl as any);
    }
    if (businessData.businessLicenseFile) {
      formData.append('businessLicenseFile', businessData.businessLicenseFile as any);
    }

    return apiCall<BusinessRegisterResponse>('/businesses/form', {
      method: 'POST',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getHistory: async (params?: { status?: string; page?: number; limit?: number }): Promise<BusinessFormHistoryResponse> => {
    const { status, page = 1, limit = 10 } = params || {};
    return apiCall<BusinessFormHistoryResponse>(API_ENDPOINTS.BUSINESSES.HISTORY, {
      method: 'GET',
      params: { status, page, limit },
    });
  },
};

// Materials
export const materialsApi = {
  create: async (payload: MaterialCreateRequest) => {
    return apiCall<any>(API_ENDPOINTS.MATERIALS.CREATE, {
      method: 'POST',
      data: payload,
    });
  },
  listApproved: async (page = 1, limit = 10): Promise<PaginatedResponse<MaterialItem>> => {
    return apiCall<PaginatedResponse<MaterialItem>>(API_ENDPOINTS.MATERIALS.LIST_APPROVED, {
      method: 'GET',
      params: { page, limit },
    });
  },
  listMy: async (params: { status?: 'pending' | 'rejected'; page?: number; limit?: number } = {}): Promise<PaginatedResponse<MaterialItem>> => {
    const { status, page = 1, limit = 10 } = params;
    return apiCall<PaginatedResponse<MaterialItem>>(API_ENDPOINTS.MATERIALS.LIST_MY, {
      method: 'GET',
      params: { status, page, limit },
    });
  },
};

// Subscriptions
export interface SubscriptionPackage {
  _id: string;
  name: string;
  price: number;
  durationInDays: number;
  isActive: boolean;
  isTrial: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionsResponse {
  statusCode: number;
  message: string;
  data: { subscriptions: SubscriptionPackage[] };
}

export interface BuySubscriptionRequest { subscriptionId: string; }
export interface BuySubscriptionResponse { statusCode: number; message: string; data?: any; }

export const subscriptionsApi = {
  getAll: async (): Promise<SubscriptionsResponse> => {
    return apiCall<SubscriptionsResponse>(API_ENDPOINTS.SUBSCRIPTIONS.GET_ALL, { method: 'GET' });
  },
  buy: async (payload: BuySubscriptionRequest): Promise<BuySubscriptionResponse> => {
    return apiCall<BuySubscriptionResponse>(API_ENDPOINTS.SUBSCRIPTIONS.BUY, {
      method: 'POST',
      data: payload,
    });
  },
};

// Businesses
export const businessesApi = {
  getNearby: async (params: { longitude: number; latitude: number; radius?: number; page?: number; limit?: number; }): Promise<NearbyBusinessesResponse> => {
    const { longitude, latitude, radius = 2000, page = 1, limit = 10 } = params;
    return apiCall<NearbyBusinessesResponse>(API_ENDPOINTS.BUSINESSES.NEARBY, {
      method: 'GET',
      params: { longitude, latitude, radius, page, limit },
    });
  },
  getAll: async (params?: { page?: number; limit?: number }): Promise<GetAllBusinessesResponse> => {
    const { page = 1, limit = 10 } = params || {};
    return apiCall<GetAllBusinessesResponse>(API_ENDPOINTS.BUSINESSES.GET_ALL, {
      method: 'GET',
      params: { page, limit },
    });
  },
  getProfile: async (): Promise<BusinessProfileResponse> => {
    return apiCall<BusinessProfileResponse>(API_ENDPOINTS.BUSINESSES.PROFILE, {
      method: 'GET',
    });
  },
  getProfileWithToken: async (token: string, retries = 2): Promise<BusinessProfileResponse> => {
    try {
      console.log('getBusinessProfile called with token:', token ? '***' + token.slice(-8) : 'None');
      
      if (!token) {
        throw new Error('No access token provided');
      }

      // Use longer timeout for business profile (60 seconds)
      const PROFILE_TIMEOUT = 60000;

      const response = await apiClient.get(API_ENDPOINTS.BUSINESSES.PROFILE, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        timeout: PROFILE_TIMEOUT,
      });

      const result = response.data;
      
      if (result.statusCode === 200 && result.data) {
        return result;
      } else {
        throw new Error(result.message || 'Failed to get business profile');
      }
    } catch (error: any) {
      console.error('Error fetching business profile:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        retriesLeft: retries
      });
      
      // Retry logic for timeout or network errors
      if (retries > 0 && (error.code === 'ECONNABORTED' || error.message === 'Network Error' || !error.response)) {
        console.log(`🔄 Retrying getBusinessProfile... (${retries} retries left)`);
        // Wait 2 seconds before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        return businessesApi.getProfileWithToken(token, retries - 1);
      }
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please check your connection and try again.');
      }
      
      if (error.message === 'Network Error') {
        throw new Error('Network error. Please check your internet connection and server status.');
      }
      
      throw new Error(`Failed to fetch business profile: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    }
  },
  getProfileWithAutoRefresh: async (): Promise<BusinessProfileResponse> => {
    let token: string | null = null;
    
    // Try to get token from token provider first (supports auto refresh)
    if (getCurrentAccessToken) {
      try {
        token = await getCurrentAccessToken();
      } catch (error) {
        console.warn('Error getting token from provider:', error);
      }
    }
    
    // Fallback: Get token directly from AsyncStorage if provider not available
    if (!token) {
      try {
        token = await AsyncStorage.getItem('ACCESS_TOKEN');
      } catch (error) {
        console.warn('Error getting token from AsyncStorage:', error);
      }
    }
    
    if (!token) {
      throw new Error('No valid access token available');
    }

    return businessesApi.getProfileWithToken(token);
  },
};

export default {
  businessApi,
  materialsApi,
  subscriptionsApi,
  businessesApi,
};
