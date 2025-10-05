// API Configuration for Back2Use
import { API_BASE_URL, API_ENDPOINTS, DEFAULT_HEADERS, REQUEST_TIMEOUT } from '../constants';

// Types for API requests and responses
export interface RegisterRequest {
  name: string;
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
  email: string;
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

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// Generic API call function
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = DEFAULT_HEADERS;

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    const response = await fetch(url, {
      ...config,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection and try again.');
      }
      throw error;
    }
    
    throw new Error('Network error. Please check your connection and try again.');
  }
}

// Auth API functions
export const authApi = {
  // Register a new user
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    return apiCall<RegisterResponse>(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Login user
  login: async (loginData: LoginRequest): Promise<LoginResponse> => {
    return apiCall<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<ForgotPasswordResponse> => {
    return apiCall<ForgotPasswordResponse>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Activate account with OTP
  activateAccount: async (otpData: VerifyOTPRequest): Promise<VerifyOTPResponse> => {
    return apiCall<VerifyOTPResponse>('/auth/active-account', {
      method: 'POST',
      body: JSON.stringify(otpData),
    });
  },

  // Resend OTP
  resendOTP: async (email: string): Promise<ResendOTPResponse> => {
    return apiCall<ResendOTPResponse>('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Reset password with OTP
  resetPassword: async (resetData: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
    return apiCall<ResetPasswordResponse>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(resetData),
    });
  },

  // Google OAuth login (web)
  googleLogin: async (): Promise<GoogleOAuthResponse> => {
    return apiCall<GoogleOAuthResponse>('/auth/google', {
      method: 'GET',
    });
  },

  // Google OAuth redirect (web)
  googleRedirect: async (): Promise<GoogleOAuthResponse> => {
    return apiCall<GoogleOAuthResponse>('/auth/google-redirect', {
      method: 'GET',
    });
  },
};

// Export the base URL for other uses
export { API_BASE_URL };

