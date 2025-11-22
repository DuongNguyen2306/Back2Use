// API Configuration Constants
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.0.199:8000';

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
    SWITCH_ROLE: '/auth/switch-role',
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
  BUSINESSES: {
    NEARBY: '/businesses/nearby',
    HISTORY: '/businesses/history-business-form',
    GET_ALL: '/businesses',
    PROFILE: '/businesses/profile',
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
      WALLET: {
        DEPOSIT: '/wallets/{walletId}/deposit', // POST
        WITHDRAW: '/wallets/{walletId}/withdraw', // POST
        GET_BY_ID: '/wallets/{walletId}', // GET
      },
      WALLET_TRANSACTIONS: {
        GET_MY: '/wallet-transactions/my', // GET ?typeGroup=&direction=&page=&limit=
      },
  MATERIALS: {
    CREATE: '/materials', // POST
    LIST_APPROVED: '/materials/approved', // GET ?page=&limit=
    LIST_MY: '/materials/my', // GET ?status=&page=&limit=
  },
  SUBSCRIPTIONS: {
    GET_ALL: '/subscriptions', // GET
    BUY: '/businesses/buy-subscription', // POST
  },
  PRODUCTS: {
    GET_BY_ID: '/products', // GET /products/{id}
  },
  BORROW_TRANSACTIONS: {
    CREATE: '/borrow-transactions', // POST /borrow-transactions
    GET_MY: '/borrow-transactions/my', // GET /borrow-transactions/my
  },
} as const;

// Request timeout (in milliseconds)
export const REQUEST_TIMEOUT = 30000; // 30 seconds for file uploads

// Default headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
} as const;

