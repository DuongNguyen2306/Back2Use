import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS, REQUEST_TIMEOUT } from '../../constants/api';
import {
  BusinessFormHistoryResponse,
  BusinessProfileResponse,
    BusinessRegisterRequest,
    BusinessRegisterResponse,
    GetAllBusinessesResponse,
    MaterialCreateRequest,
    MaterialItem,
    NearbyBusinessesResponse,
  PaginatedResponse
} from '../../types/business.types';
import { apiCall, apiClient } from './client';

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
export interface MaterialRequestCreateRequest {
  materialName: string;
  description?: string;
}

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
  createRequest: async (payload: MaterialRequestCreateRequest) => {
    // Fallback to hardcoded endpoint if CREATE_REQUEST is not defined (for cache issues)
    let endpoint = API_ENDPOINTS.MATERIALS?.CREATE_REQUEST;
    
    // Debug logging
    console.log('🔍 Material Request Debug:', {
      hasMaterials: !!API_ENDPOINTS.MATERIALS,
      materialsKeys: API_ENDPOINTS.MATERIALS ? Object.keys(API_ENDPOINTS.MATERIALS) : 'N/A',
      createRequestValue: endpoint,
      allEndpoints: API_ENDPOINTS,
    });
    
    // Use fallback if endpoint is undefined, null, or empty
    if (!endpoint || endpoint.trim() === '') {
      endpoint = '/materials/material-requests';
      console.log('⚠️ Using fallback endpoint:', endpoint);
    }
    
    console.log('🔍 Final endpoint:', endpoint);
    console.log('🔍 Payload:', payload);
    
    return apiCall<any>(endpoint, {
      method: 'POST',
      data: payload,
    });
  },
  getMyRequests: async (params: { status?: 'pending' | 'approved' | 'rejected'; page?: number; limit?: number } = {}) => {
    const { status, page = 1, limit = 10 } = params;
    return apiCall<any>(API_ENDPOINTS.MATERIALS.MY_REQUESTS, {
      method: 'GET',
      params: { status, page, limit },
    });
  },
};

// Product Groups
export interface ProductGroup {
  _id: string;
  materialId?: string | null;
  businessId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface ProductGroupsResponse {
  statusCode: number;
  message: string;
  data: ProductGroup[];
}

export interface CreateProductGroupRequest {
  materialId: string;
  name: string;
  description?: string;
  image?: any; // File for multipart/form-data
}

export interface CreateProductGroupResponse {
  statusCode: number;
  message: string;
  data: ProductGroup;
}

export const productGroupsApi = {
  getAll: async (params?: { page?: number; limit?: number }): Promise<ProductGroupsResponse> => {
    const { page = 1, limit = 10 } = params || {};
    return apiCall<ProductGroupsResponse>(API_ENDPOINTS.PRODUCT_GROUPS.GET_ALL, {
      method: 'GET',
      params: { page, limit },
    });
  },
  create: async (data: CreateProductGroupRequest): Promise<CreateProductGroupResponse> => {
    const formData = new FormData();
    formData.append('materialId', data.materialId);
    formData.append('name', data.name);
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.image) {
      formData.append('image', data.image as any);
    }
    const response = await apiCall<any>(API_ENDPOINTS.PRODUCT_GROUPS.CREATE, {
      method: 'POST',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Backend trả về: { data: {...}, message: "...", statusCode: 200 }
    // Trả về response.data để giống Redux slice (payload.data || payload)
    return response.data || response;
  },
};

// Product Sizes
export interface ProductSize {
  _id: string;
  productGroupId: string;
  sizeName: string;
  basePrice: number;
  weight: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSizesResponse {
  statusCode: number;
  message: string;
  data: ProductSize[];
}

export interface CreateProductSizeRequest {
  productGroupId: string;
  sizeName: string;
  basePrice: number;
  weight: number;
  description?: string;
}

export interface CreateProductSizeResponse {
  statusCode: number;
  message: string;
  data: ProductSize;
}

export const productSizesApi = {
  getAll: async (productGroupId: string): Promise<ProductSizesResponse> => {
    return apiCall<ProductSizesResponse>(API_ENDPOINTS.PRODUCT_SIZES.GET_ALL, {
      method: 'GET',
      params: { productGroupId },
    });
  },
  create: async (data: CreateProductSizeRequest): Promise<ProductSize> => {
    const response = await apiCall<any>(API_ENDPOINTS.PRODUCT_SIZES.CREATE, {
      method: 'POST',
      data,
    });
    // Backend trả về: { data: {...}, message: "...", statusCode: 200 }
    // Trả về response.data để giống Redux slice (payload.data || payload)
    return response.data || response;
  },
};

// Products
export interface CreateProductsRequest {
  productSizeId: string;
  productGroupId: string;
  amount: number;
}

export interface CreateProductsResponse {
  statusCode: number;
  message: string;
  data: {
    products: any[];
    qrCodes: string[];
  };
}

export interface Product {
  _id: string;
  productSizeId: string;
  productGroupId: string;
  qrCode: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  statusCode: number;
  message: string;
  data: Product[];
}

export interface ScanProductResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data: {
    product?: Product;
    qrCode?: string;
    serialNumber?: string;
    status?: string;
    reuseCount?: number;
    transaction?: any;
    lateInfo?: any;
  } | Product;
}

export const productsApi = {
  getAll: async (productGroupId: string, params?: { page?: number; limit?: number; status?: string; search?: string }): Promise<ProductsResponse> => {
    const { page = 1, limit = 100, status, search } = params || {};
    const queryParams: any = { page, limit };
    if (status) queryParams.status = status;
    if (search) queryParams.search = search;
    return apiCall<ProductsResponse>(`${API_ENDPOINTS.PRODUCTS.GET_ALL}/${productGroupId}`, {
      method: 'GET',
      params: queryParams,
    });
  },
  create: async (data: CreateProductsRequest): Promise<CreateProductsResponse> => {
    return apiCall<CreateProductsResponse>(API_ENDPOINTS.PRODUCTS.CREATE, {
      method: 'POST',
      data,
    });
  },
  scan: async (serialNumber: string): Promise<ScanProductResponse> => {
    // Đảm bảo endpoint được định nghĩa đúng
    const scanEndpoint = API_ENDPOINTS.PRODUCTS?.SCAN || '/products/scan';
    // URL encode the serial number to handle special characters (e.g., Vietnamese characters)
    const encodedSerialNumber = encodeURIComponent(serialNumber);
    const endpoint = `${scanEndpoint}/${encodedSerialNumber}`;
    console.log('🔍 Scanning QR with endpoint:', endpoint, 'serialNumber:', serialNumber, 'encoded:', encodedSerialNumber);
    console.log('🔍 API_ENDPOINTS.PRODUCTS:', API_ENDPOINTS.PRODUCTS);
    
    try {
      return await apiCall<ScanProductResponse>(endpoint, {
        method: 'GET',
      });
    } catch (error: any) {
      // Silently handle 404 errors - return a response object instead of throwing
      if (error?.response?.status === 404) {
        console.log('⚠️ Product not found (404) - returning empty response');
        return {
          success: false,
          statusCode: 404,
          message: 'Product not found',
          data: {} as any,
        };
      }
      // Re-throw other errors
      throw error;
    }
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
  data: SubscriptionPackage[] | {
    subscriptions?: SubscriptionPackage[];
  };
}

export interface BuySubscriptionRequest { 
  subscriptionId: string;
  autoRenew?: boolean;
}
export interface BuySubscriptionResponse { statusCode: number; message: string; data?: any; }
export interface ActivateTrialResponse { statusCode: number; message: string; data?: any; }

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
  activateTrial: async (): Promise<ActivateTrialResponse> => {
    return apiCall<ActivateTrialResponse>(API_ENDPOINTS.SUBSCRIPTIONS.ACTIVATE_TRIAL, {
      method: 'POST',
    });
  },
};

// Businesses
export interface BusinessDetailResponse {
  statusCode: number;
  message: string;
  data: {
    business: Business;
    productGroups: Array<{
      _id: string;
      materialId?: any;
      businessId: string;
      name: string;
      description?: string;
      imageUrl?: string;
      isDeleted: boolean;
      createdAt: string;
      updatedAt: string;
      __v?: number;
    }>;
  };
}

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
  getById: async (businessId: string): Promise<BusinessDetailResponse> => {
    // Use GET_ALL endpoint with ID appended, since GET_BY_ID might not be defined
    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_ALL}/${businessId}`;
    console.log('🔍 Getting business by ID:', businessId);
    console.log('🔍 Endpoint:', endpoint);
    return apiCall<BusinessDetailResponse>(endpoint, {
      method: 'GET',
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
      // Silently handle 403 errors (Access denied - role mismatch)
      if (error?.response?.status === 403) {
        console.log('⚠️ Access denied (403) - silently handled');
        throw new Error('ACCESS_DENIED_403'); // Custom error for silent handling
      }
      
      // Only log non-403 errors
      if (error?.response?.status !== 403) {
      console.error('Error fetching business profile:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        retriesLeft: retries
      });
      }
      
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
  updateProfile: async (updates: UpdateBusinessProfileRequest): Promise<BusinessProfileResponse> => {
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

    try {
      console.log('🔄 Updating business profile with:', updates);
      console.log('🔗 Endpoint:', API_ENDPOINTS.BUSINESSES.UPDATE_PROFILE);
      
      if (!API_ENDPOINTS.BUSINESSES.UPDATE_PROFILE) {
        throw new Error('UPDATE_PROFILE endpoint is not defined');
      }
      
      const endpoint = API_ENDPOINTS.BUSINESSES.UPDATE_PROFILE;
      console.log('🔗 Full endpoint URL:', endpoint);
      
      const response = await apiClient({
        method: 'PATCH',
        url: endpoint,
        data: updates,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        timeout: REQUEST_TIMEOUT,
      });

      console.log('📥 Update profile response status:', response.status);
      console.log('📥 Update profile response data:', response.data);

      const result = response.data;
      
      if (result.statusCode === 200 && result.data) {
        console.log('✅ Business profile updated successfully');
        return result;
      } else {
        throw new Error(result.message || 'Failed to update business profile');
      }
    } catch (error: any) {
      console.error('Error updating business profile:', error);
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please check your connection and try again.');
      }
      throw new Error(`Failed to update business profile: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    }
  },
};

export default {
  businessApi,
  materialsApi,
  subscriptionsApi,
  businessesApi,
  productGroupsApi,
  productSizesApi,
  productsApi,
};