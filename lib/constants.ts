// API Configuration Constants
export const API_BASE_URL = 'http://192.168.0.197:8000';

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
  },
  USER: {
    PROFILE: '/users/me',
    GET_BY_ID: '/users', // GET /users/{id}
    UPDATE_PROFILE: '/users/edit-profile',
    CHANGE_PASSWORD: '/user/change-password',
  },
  BUSINESS: {
    DASHBOARD: '/business/dashboard',
    INVENTORY: '/business/inventory',
    TRANSACTIONS: '/business/transactions',
    ANALYTICS: '/business/analytics',
  },
  CUSTOMER: {
    DASHBOARD: '/customer/dashboard',
    WALLET: '/customer/wallet',
    TRANSACTIONS: '/customer/transactions',
    REWARDS: '/customer/rewards',
    STORES: '/customer/stores',
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    BUSINESSES: '/admin/businesses',
    ANALYTICS: '/admin/analytics',
  },
} as const;

// Request timeout (in milliseconds)
export const REQUEST_TIMEOUT = 30000; // 30 seconds for file uploads

// Default headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
} as const;
