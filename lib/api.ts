import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS, DEFAULT_HEADERS, REQUEST_TIMEOUT } from '../src/constants/api';

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
    // Only log successful responses for debugging (can be disabled in production)
    if (__DEV__) {
      console.log('✅ API Response:', response.status, response.config.url);
    }
    return response;
  },
  async (error) => {
    // Only log error details if it's not a network error or in dev mode
    const isNetworkError = !error.response && error.request;
    if (__DEV__ || !isNetworkError) {
      console.log('❌ API Error:', error.response?.status || 'Network Error', error.config?.url);
      // Comment để tránh hiển thị error details trên UI
      // if (error.response?.data) {
      //   console.log('Error details:', error.response.data);
      // }
    }
    
    // Do NOT auto-clear tokens here. Let the auth flow decide how to handle 401.
    // This avoids race conditions where tokens are valid/just refreshed.
    return Promise.reject(error);
  }
);

// ============================================================================
// TYPES
// ============================================================================

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  statusCode: number;
  message: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    user?: {
      _id?: string;
      email?: string;
      name?: string;
      role?: string;
      isActive?: boolean;
      isBlocked?: boolean;
    };
  };
  // Legacy support
  success?: boolean;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
  role?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface VerifyOTPRequest {
  otp: string;
  email?: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  data?: {
    verified: boolean;
  };
}

export interface ResendOTPRequest {
  email: string;
}

export interface ResendOTPResponse {
  success: boolean;
  message: string;
  statusCode?: number;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export interface SwitchRoleRequest {
  role: 'customer' | 'business';
}

export interface SwitchRoleResponse {
  statusCode: number;
  message: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    user?: {
      _id?: string;
      email?: string;
      name?: string;
      role?: string;
      isActive?: boolean;
      isBlocked?: boolean;
    };
  };
  success?: boolean;
}

export interface GoogleOAuthResponse {
  success: boolean;
  message: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    user?: {
      _id?: string;
      email?: string;
      name?: string;
      role?: string;
      isActive?: boolean;
      isBlocked?: boolean;
    };
  };
}

export interface BusinessRegisterRequest {
  businessName: string;
  businessLogo?: any;
  businessType: string;
  businessMail: string;
  businessAddress: string;
  businessPhone: string;
  taxCode: string;
  foodSafetyCertUrl?: any;
  businessLicenseFile?: any;
}

export interface BusinessRegisterResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    storeName: string;
    storeMail: string;
    status: string;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// User interface
export interface User {
  _id?: string;
  email: string;
  name?: string;
  fullName?: string;
  role?: 'customer' | 'business' | 'admin';
  isActive?: boolean;
  isBlocked?: boolean;
  createdAt?: string;
  updatedAt?: string;
  phone?: string;
  avatar?: string;
  address?: string;
  yob?: string;
  rewardPoints?: number;
  legitPoints?: number;
  wallet?: {
    _id: string;
    balance: number;
  };
}

export interface UpdateProfileRequest {
  name?: string;
  fullName?: string;
  phone?: string;
  avatar?: string;
  address?: string;
  yob?: string;
}

export interface UploadAvatarResponse {
  success: boolean;
  message: string;
  data?: {
    avatarUrl: string;
  };
}

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
    console.error('API call failed:', error);
    
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
// AUTH API
// ============================================================================

export const authApi = {
  // Register a new user
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    return apiCall<RegisterResponse>(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      data: userData,
    });
  },

  // Login user
  login: async (loginData: LoginRequest): Promise<LoginResponse> => {
    return apiCall<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      data: loginData,
    });
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<ForgotPasswordResponse> => {
    return apiCall<ForgotPasswordResponse>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      method: 'POST',
      data: { email },
    });
  },

  // Activate account with OTP
  activateAccount: async (otpData: VerifyOTPRequest): Promise<VerifyOTPResponse> => {
    return apiCall<VerifyOTPResponse>('/auth/active-account', {
      method: 'POST',
      data: otpData,
    });
  },

  // Resend OTP
  resendOTP: async (email: string): Promise<ResendOTPResponse> => {
    return apiCall<ResendOTPResponse>('/auth/resend-otp', {
      method: 'POST',
      data: { email },
    });
  },

  // Reset password with OTP
  resetPassword: async (resetData: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
    return apiCall<ResetPasswordResponse>('/auth/reset-password', {
      method: 'POST',
      data: resetData,
    });
  },

  // Google OAuth login - redirect to Google
  googleLogin: async (): Promise<string> => {
    return `${API_BASE_URL}/auth/google`;
  },

  // Google OAuth callback - handle response from Google
  googleCallback: async (code: string, state?: string): Promise<LoginResponse> => {
    return apiCall<LoginResponse>('/auth/google/callback', {
      method: 'POST',
      data: { code, state },
    });
  },

  // Refresh access token
  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    return apiCall<LoginResponse>(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
      method: 'POST',
      data: { refreshToken },
    });
  },

  // Change password
  changePassword: async (passwordData: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
    console.log('🔐 ===== CHANGE PASSWORD REQUEST START =====');
    console.log('🔐 Endpoint:', API_ENDPOINTS.USER.CHANGE_PASSWORD);
    console.log('🔐 Data:', { ...passwordData, oldPassword: '***', newPassword: '***', confirmNewPassword: '***' });
    
    // Check token before making request
    try {
      const token = await AsyncStorage.getItem('ACCESS_TOKEN');
      console.log('🔐 Token check before change password:', token ? 'Present' : 'Missing');
      if (token) {
        console.log('🔐 Token preview:', token.substring(0, 20) + '...');
      }
    } catch (error) {
      console.error('🔐 Error checking token:', error);
    }
    
    console.log('🔐 ===== CHANGE PASSWORD REQUEST END =====');
    
    try {
      const response = await apiCall<ChangePasswordResponse>(API_ENDPOINTS.USER.CHANGE_PASSWORD, {
        method: 'PUT',
        data: passwordData,
      });
      
      console.log('🔐 Change password response:', response);
      return response;
    } catch (error: any) {
      console.log('🔐 Change password error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  // Switch role
  switchRole: async (roleData: SwitchRoleRequest): Promise<SwitchRoleResponse> => {
    console.log('🔄 ===== SWITCH ROLE REQUEST START =====');
    console.log('🔄 Endpoint:', API_ENDPOINTS.AUTH.SWITCH_ROLE);
    console.log('🔄 Data:', roleData);
    
    try {
      const response = await apiCall<SwitchRoleResponse>(API_ENDPOINTS.AUTH.SWITCH_ROLE, {
        method: 'POST',
        data: roleData,
      });
      
      console.log('🔄 Switch role response:', response);
      return response;
    } catch (error: any) {
      console.log('🔄 Switch role error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },
};

// ============================================================================
// BUSINESS API
// ============================================================================

export const businessApi = {
  // Register a new business
  register: async (businessData: BusinessRegisterRequest): Promise<BusinessRegisterResponse> => {
    const formData = new FormData();
    
    formData.append('businessName', businessData.businessName);
    formData.append('businessType', businessData.businessType);
    formData.append('businessMail', businessData.businessMail);
    formData.append('businessAddress', businessData.businessAddress);
    formData.append('businessPhone', businessData.businessPhone);
    formData.append('taxCode', businessData.taxCode);
    
    if (businessData.businessLogo) {
      formData.append('businessLogo', {
        uri: businessData.businessLogo.uri,
        type: businessData.businessLogo.type || 'image/jpeg',
        name: businessData.businessLogo.name || 'business_logo.jpg',
      } as any);
    }
    
    if (businessData.foodSafetyCertUrl) {
      formData.append('foodSafetyCertUrl', {
        uri: businessData.foodSafetyCertUrl.uri,
        type: businessData.foodSafetyCertUrl.type || 'image/jpeg',
        name: businessData.foodSafetyCertUrl.name || 'food_safety_cert.jpg',
      } as any);
    }
    
    if (businessData.businessLicenseFile) {
      formData.append('businessLicenseFile', {
        uri: businessData.businessLicenseFile.uri,
        type: businessData.businessLicenseFile.type || 'image/jpeg',
        name: businessData.businessLicenseFile.name || 'business_license.jpg',
      } as any);
    }

    return apiCall<BusinessRegisterResponse>('/businesses/form', {
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// ============================================================================
// USER API
// ============================================================================

// Helper function to get current access token with auto refresh
let getCurrentAccessToken: (() => Promise<string | null>) | null = null;

export const setTokenProvider = (tokenProvider: () => Promise<string | null>) => {
  getCurrentAccessToken = tokenProvider;
};

// ============================================================================
// MATERIALS API
// ============================================================================

export interface MaterialCreateRequest {
  materialName: string;
  maximumReuse?: number;
  description?: string;
}

export interface MaterialItem {
  _id: string;
  materialName: string;
  maximumReuse?: number;
  description?: string;
  status?: 'approved' | 'pending' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  statusCode?: number;
  message?: string;
  data?: {
    docs?: T[];
    items?: T[];
    totalDocs?: number;
    total?: number;
    page?: number;
    limit?: number;
  };
  success?: boolean;
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
};

// ============================================================================
// SUBSCRIPTIONS API
// ============================================================================

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
  data: {
    subscriptions: SubscriptionPackage[];
  };
}

export interface BuySubscriptionRequest {
  subscriptionId: string;
}

export interface BuySubscriptionResponse {
  statusCode: number;
  message: string;
  data?: any;
}

export const subscriptionsApi = {
  getAll: async (): Promise<SubscriptionsResponse> => {
    return apiCall<SubscriptionsResponse>(API_ENDPOINTS.SUBSCRIPTIONS.GET_ALL, {
      method: 'GET',
    });
  },
  buy: async (payload: BuySubscriptionRequest): Promise<BuySubscriptionResponse> => {
    return apiCall<BuySubscriptionResponse>(API_ENDPOINTS.SUBSCRIPTIONS.BUY, {
      method: 'POST',
      data: payload,
    });
  },
};

// ============================================================================
// WALLET API
// ============================================================================

export interface WalletDetails {
  _id: string;
  balance: number;
  transactions?: any[];
}

export const walletApi = {
  // Get wallet by ID - GET /wallets/{walletId}
  getById: async (walletId: string): Promise<WalletDetails> => {
    return apiCall<WalletDetails>(`/wallets/${walletId}`, {
      method: 'GET',
    });
  },
  
  // Get wallet details with auto refresh token
  getByIdWithAutoRefresh: async (walletId: string): Promise<WalletDetails> => {
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

    return walletApi.getById(walletId);
  },

  // Deposit money into wallet - POST /wallets/{walletId}/deposit
  deposit: async (walletId: string, amount: number): Promise<{ url?: string; payUrl?: string } & Record<string, any>> => {
    const endpoint = API_ENDPOINTS.WALLET.DEPOSIT.replace('{walletId}', walletId);
    console.log('🔗 Deposit endpoint:', endpoint);
    return apiCall<any>(endpoint, {
      method: 'POST',
      data: { amount },
    });
  },

  // Withdraw money from wallet - POST /wallets/{walletId}/withdraw
  withdraw: async (walletId: string, amount: number): Promise<WalletDetails> => {
    const endpoint = API_ENDPOINTS.WALLET.WITHDRAW.replace('{walletId}', walletId);
    console.log('🔗 Withdraw endpoint:', endpoint);
    return apiCall<WalletDetails>(endpoint, {
      method: 'POST',
      data: { amount },
    });
  },
};

export interface WalletTransaction {
  _id: string;
  walletId: string;
  userId: string;
  amount: number;
  transactionType: 'deposit' | 'withdraw' | 'subscription_fee' | 'borrow_deposit' | 'return_refund';
  direction: 'in' | 'out';
  status: 'processing' | 'completed' | 'failed';
  description: string;
  referenceType: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface WalletTransactionsResponse {
  statusCode: number;
  message: string;
  data: WalletTransaction[];
}

export const walletTransactionsApi = {
  // Get my wallet transactions - GET /wallet-transactions/my
  getMy: async (params?: {
    walletType?: 'customer' | 'business';
    typeGroup?: 'personal' | 'deposit_refund';
    direction?: 'in' | 'out';
    page?: number;
    limit?: number;
  }): Promise<WalletTransactionsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.walletType) queryParams.append('walletType', params.walletType);
    if (params?.typeGroup) queryParams.append('typeGroup', params.typeGroup);
    if (params?.direction) queryParams.append('direction', params.direction);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const endpoint = `${API_ENDPOINTS.WALLET_TRANSACTIONS.GET_MY}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('🔗 Get transactions endpoint:', endpoint);
    console.log('🔗 Request params:', params);
    
    return apiCall<WalletTransactionsResponse>(endpoint, {
      method: 'GET',
    });
  },
};

// ============================================================================
// PAYMENTS API (VNPay)
// ============================================================================

export const paymentsApi = {
  // Create a VNPay payment and receive payUrl
  createVnPay: async (payload: {
    amount: number; // in VND
    orderInfo: string;
    returnUrl?: string; // optional override
  }): Promise<{ payUrl: string } & Record<string, any>> => {
    return apiCall<any>(API_ENDPOINTS.PAYMENTS.VNPAY_CREATE, {
      method: 'POST',
      data: payload,
    });
  },
  // Deposit money into a wallet via VNPay: POST /wallets/{walletId}/deposit { amount }
  depositToWallet: async (walletId: string, amount: number): Promise<{ payUrl?: string } & Record<string, any>> => {
    return apiCall<any>(`/wallets/${walletId}/deposit`, {
      method: 'POST',
      data: { amount },
    });
  },
};

// Get user by ID
export const getUserById = async (userId: string, token: string): Promise<User> => {
  try {
    const response = await apiClient.get(`${API_ENDPOINTS.USER.GET_BY_ID}/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      timeout: REQUEST_TIMEOUT,
    });

    return response.data;
  } catch (error: any) {
    console.error('Error fetching user by ID:', error);
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection and try again.');
    }
    throw new Error(`Failed to fetch user: ${error.response?.data?.message || error.message || 'Unknown error'}`);
  }
};

// Get current user profile with auto refresh token
export const getCurrentUserProfileWithAutoRefresh = async (): Promise<User> => {
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

  return getCurrentUserProfile(token);
};

// Get current user profile - GET /users/me
export const getCurrentUserProfile = async (token: string, retries = 2): Promise<User> => {
  try {
    // Only log in dev mode to reduce console spam
    if (__DEV__) {
      console.log('getCurrentUserProfile called with token:', token ? '***' + token.slice(-8) : 'None');
      console.log('Token length:', token?.length || 0);
      console.log('API Base URL:', API_BASE_URL);
    }
    
    if (!token) {
      throw new Error('No access token provided');
    }

    // Use longer timeout for user profile (60 seconds)
    const PROFILE_TIMEOUT = 60000;

    const response = await apiClient.get('/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      timeout: PROFILE_TIMEOUT,
    });

    const result = response.data;
    
    if (result.statusCode === 200 && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to get user profile');
    }
  } catch (error: any) {
    // Determine if this is a network error
    const isNetworkError = error.code === 'ECONNABORTED' || 
                          error.message === 'Network Error' || 
                          !error.response ||
                          error.message?.toLowerCase().includes('network') ||
                          error.message?.toLowerCase().includes('timeout') ||
                          error.message?.toLowerCase().includes('connection');
    
    // Only log detailed error if it's not a network error or if retries are exhausted
    if (!isNetworkError || retries === 0) {
      console.error('Error fetching current user profile:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        retriesLeft: retries
      });
    } else {
      // Log network error with less detail to avoid spam
      console.warn(`⚠️ Network error fetching user profile (${retries} retries left):`, error.message);
    }
    
    // Retry logic for timeout or network errors
    if (retries > 0 && isNetworkError) {
      console.log(`🔄 Retrying getCurrentUserProfile... (${retries} retries left)`);
      // Wait 2 seconds before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
      return getCurrentUserProfile(token, retries - 1);
    }
    
    // After all retries exhausted, throw appropriate error
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection and try again.');
    }
    
    if (isNetworkError) {
      // Check if it's a network error (no response from server)
      if (!error.response && error.request) {
        throw new Error('Network error. Please check your internet connection and server status.');
      }
      // If we have a response but it's an error, use the message from response
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Network error. Please check your internet connection and server status.');
    }
    
    // Handle HTTP errors (401, 403, 500, etc.)
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }
    
    if (error.response?.status === 403) {
      throw new Error('Access forbidden. You do not have permission to access this resource.');
    }
    
    if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    throw new Error(`Failed to fetch user profile: ${error.response?.data?.message || error.message || 'Unknown error'}`);
  }
};

// Update user profile with auto refresh token
export const updateUserProfileWithAutoRefresh = async (updates: UpdateProfileRequest): Promise<User> => {
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

  return updateUserProfile(updates, token);
};

// Upload avatar with auto refresh token
export const uploadAvatarWithAutoRefresh = async (imageUri: string): Promise<UploadAvatarResponse> => {
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

  return uploadAvatar(imageUri, token);
};

// Upload avatar - PUT /users/edit-avatar
export const uploadAvatar = async (imageUri: string, token: string): Promise<UploadAvatarResponse> => {
  try {
    console.log('📸 uploadAvatar called with:', {
      imageUri,
      tokenPreview: token ? '***' + token.slice(-8) : 'None',
      tokenLength: token?.length || 0
    });
    
    if (!token) {
      throw new Error('No access token provided');
    }

    if (!imageUri) {
      throw new Error('No image provided');
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('avatar', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    } as any);

    console.log('📤 Sending avatar upload request to:', API_ENDPOINTS.USER.EDIT_AVATAR);

    const response = await apiClient.put(API_ENDPOINTS.USER.EDIT_AVATAR, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 seconds for file upload
    });

    console.log('📥 Avatar upload response status:', response.status);
    console.log('📥 Avatar upload response data:', response.data);

    const result = response.data;
    
    // Handle both 200 and 201 status codes
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Avatar uploaded successfully');
      // Try to extract avatarUrl from different response structures
      const avatarUrl = result?.data?.avatarUrl || 
                       result?.data?.avatar || 
                       result?.avatarUrl || 
                       result?.avatar ||
                       (typeof result === 'string' ? result : '');
      
      return {
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          avatarUrl: avatarUrl
        }
      };
    } else {
      console.log('❌ Unexpected response structure:', result);
      throw new Error(result.message || 'Failed to upload avatar');
    }
  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
    });
    if (error.code === 'ECONNABORTED') {
      throw new Error('Upload timeout. Please check your connection and try again.');
    }
    throw new Error(`Failed to upload avatar: ${error.response?.data?.message || error.message || 'Unknown error'}`);
  }
};

// Update user profile - PUT /users/edit-profile
export const updateUserProfile = async (updates: UpdateProfileRequest, token: string): Promise<User> => {
  try {
    console.log('🔄 updateUserProfile called with:', {
      updates,
      tokenPreview: token ? '***' + token.slice(-8) : 'None',
      tokenLength: token?.length || 0
    });
    
    if (!token) {
      throw new Error('No access token provided');
    }

    console.log('📤 Sending request to:', `${API_ENDPOINTS.USER.UPDATE_PROFILE}`);
    console.log('📤 Request body:', updates);

    const response = await apiClient.put(API_ENDPOINTS.USER.UPDATE_PROFILE, updates, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      timeout: REQUEST_TIMEOUT,
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response data:', response.data);

    const result = response.data;
    
    if (result.statusCode === 200) {
      if (result.data && result.data.user) {
        console.log('✅ Profile updated successfully (with user data)');
        return result.data.user;
      } else if (result.data) {
        console.log('✅ Profile updated successfully (with data)');
        return result.data;
      } else if (result.message === 'Profile updated' || result.message === 'User updated successfully') {
        console.log('✅ Profile updated successfully (fetching updated data)');
        const updatedUser = await getCurrentUserProfile(token);
        return updatedUser;
      } else {
        console.log('❌ Unexpected response structure:', result);
        throw new Error(result.message || 'Failed to update user profile');
      }
    } else {
      console.log('❌ Invalid response structure:', result);
      throw new Error(result.message || 'Failed to update user profile');
    }
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection and try again.');
    }
    throw new Error(`Failed to update user profile: ${error.response?.data?.message || error.message || 'Unknown error'}`);
  }
};

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

// Test Profile API
export const testProfileAPI = async (token: string) => {
  console.log('🧪 Testing Profile API...');
  
  try {
    console.log('📡 Testing GET /users/me...');
    const userProfile = await getCurrentUserProfile(token);
    console.log('✅ User Profile:', userProfile);
    
    console.log('📡 Testing POST /users/edit-profile...');
    const updateData: UpdateProfileRequest = {
      name: "Nguyễn Văn Test",
      phone: "0987654321",
      address: "123 Test Street, Hanoi",
      yob: "1990-01-01"
    };
    
    const updatedProfile = await updateUserProfile(updateData, token);
    console.log('✅ Updated Profile:', updatedProfile);
    
    return {
      success: true,
      originalProfile: userProfile,
      updatedProfile: updatedProfile
    };
    
  } catch (error) {
    console.error('❌ API Test Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const useProfileAPI = () => {
  const testAPI = async (token: string) => {
    return await testProfileAPI(token);
  };
  
  return { testAPI };
};

// ============================================================================
// BUSINESSES API
// ============================================================================

export interface NearbyBusiness {
  _id: string;
  userId: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessType: string;
  openTime: string;
  closeTime: string;
  businessLogoUrl?: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  createdAt: string;
  updatedAt: string;
  distance: number;
  role: string;
  isActive: boolean;
  isBlocked: boolean;
}

export interface NearbyBusinessesResponse {
  statusCode: number;
  message: string;
  data: NearbyBusiness[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export const businessesApi = {
  // Get nearby businesses
  getNearby: async (params: {
    longitude: number;
    latitude: number;
    radius?: number; // in meters, default 2000
    page?: number;
    limit?: number;
  }): Promise<NearbyBusinessesResponse> => {
    const { longitude, latitude, radius = 2000, page = 1, limit = 10 } = params;
    
    return apiCall<NearbyBusinessesResponse>(API_ENDPOINTS.BUSINESSES.NEARBY, {
      method: 'GET',
      params: {
        longitude,
        latitude,
        radius,
        page,
        limit,
      },
    });
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export { API_BASE_URL, apiClient };
export default apiClient;