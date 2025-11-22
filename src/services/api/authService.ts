import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';
import {
  ChangePasswordRequest,
  ChangePasswordResponse,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ResendOTPResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  SwitchRoleRequest,
  SwitchRoleResponse,
  VerifyOTPRequest,
  VerifyOTPResponse
} from '../../types/auth.types';
import { apiCall } from './client';

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
      method: 'PATCH',
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

