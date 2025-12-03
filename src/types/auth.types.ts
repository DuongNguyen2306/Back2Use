export type Role = "customer" | "business" | "admin" | "staff";

export interface User {
  _id?: string;
  email: string;
  name?: string;
  fullName?: string;
  role?: Role;
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
    availableBalance?: number;
  };
}

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

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

