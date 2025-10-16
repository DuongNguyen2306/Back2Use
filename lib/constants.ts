// API Configuration Constants
export const API_BASE_URL = 'http://172.16.22.147:8000';

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
    CHANGE_PASSWORD: '/auth/change-password', // Thử endpoint auth
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
  PAYMENTS: {
    VNPAY_CREATE: '/vnpay/create',
  },
  MATERIALS: {
    CREATE: '/materials', // POST
    LIST_APPROVED: '/materials/approved', // GET ?page=&limit=
    LIST_MY: '/materials/my', // GET ?status=&page=&limit=
  },
} as const;

// Request timeout (in milliseconds)
export const REQUEST_TIMEOUT = 30000; // 30 seconds for file uploads

// Default headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
} as const;
