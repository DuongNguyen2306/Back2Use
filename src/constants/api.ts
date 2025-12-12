// API Configuration Constants
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://back-2-use.up.railway.app';

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
    EDIT_AVATAR: '/users/edit-avatar', // PUT /users/edit-avatar
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
    GET_BY_ID: '/businesses', // GET /businesses/{id}
    PROFILE: '/businesses/profile', // GET /businesses/profile
    UPDATE_PROFILE: '/businesses/profile', // PATCH /businesses/profile
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
        RETRY_PAYMENT: '/wallets/transactions/{transactionId}/retry', // POST
      },
      WALLET_TRANSACTIONS: {
        GET_MY: '/wallet-transactions/my', // GET ?typeGroup=&direction=&page=&limit=
      },
  MATERIALS: {
    CREATE: '/materials', // POST
    LIST_APPROVED: '/materials', // GET ?page=&limit= (returns approved materials)
    LIST_MY: '/materials/my', // GET ?status=&page=&limit=
    CREATE_REQUEST: '/materials/material-requests', // POST - Create material request
    MY_REQUESTS: '/materials/my-request', // GET ?status=&page=&limit= - Get my material requests
  },
  SUBSCRIPTIONS: {
    GET_ALL: '/subscriptions', // GET
    BUY: '/businesses/buy-subscription', // POST
    ACTIVATE_TRIAL: '/businesses/activate-trial', // POST
    TOGGLE_AUTO_RENEW: '/businesses/subscription', // PATCH /businesses/subscription/{id}/auto-renew
  },
  PRODUCTS: {
    GET_BY_ID: '/products', // GET /products/{id}
    GET_ALL: '/products/group', // GET /products/group/{productGroupId}?page=&limit=&status=&search=
    GET_CUSTOMER: '/products/customer', // GET /products/customer/{productGroupId}?page=&limit=
    CREATE: '/products', // POST /products
    UPDATE: '/products', // PATCH /products/{id}
    SCAN: '/products/scan', // GET /products/scan/{serialNumber}
  },
  PRODUCT_GROUPS: {
    GET_ALL: '/product-groups', // GET /product-groups?limit=&page=
    CREATE: '/product-groups', // POST /product-groups
  },
  PRODUCT_SIZES: {
    GET_ALL: '/product-sizes', // GET /product-sizes?productGroupId=
    CREATE: '/product-sizes', // POST /product-sizes
  },
  BORROW_TRANSACTIONS: {
    CREATE: '/borrow-transactions', // POST /borrow-transactions
    GET_MY: '/borrow-transactions/my', // GET /borrow-transactions/my
    CUSTOMER_HISTORY: '/borrow-transactions/customer-history', // GET /borrow-transactions/customer-history
    CUSTOMER_DETAIL: '/borrow-transactions/customer', // GET /borrow-transactions/customer/{id}
    BUSINESS_HISTORY: '/borrow-transactions/business', // GET /borrow-transactions/business
    BUSINESS_DETAIL: '/borrow-transactions/business', // GET /borrow-transactions/business/{id}
    CONFIRM: '/borrow-transactions/confirm', // PATCH /borrow-transactions/confirm/{id}
    CUSTOMER_CANCEL: '/borrow-transactions/customer/cancel', // PATCH /borrow-transactions/customer/cancel/{id}
    CUSTOMER_EXTEND: '/borrow-transactions/customer/extend', // PATCH /borrow-transactions/customer/extend/{id}
    DAMAGE_POLICY: '/borrow-transactions/damage-policy', // GET /borrow-transactions/damage-policy
    RETURN_CHECK: '/borrow-transactions/{serialNumber}/check', // POST /borrow-transactions/{serialNumber}/check
    RETURN_CONFIRM: '/borrow-transactions/{serialNumber}/confirm', // POST /borrow-transactions/{serialNumber}/confirm
  },
  STAFF: {
    GET_ALL: '/staffs', // GET /staffs?search=&status=&limit=&page=
    GET_BY_ID: '/staffs', // GET /staffs/{id}
    PROFILE: '/staffs/profile', // GET /staffs/profile
    CREATE: '/staffs', // POST /staffs
    UPDATE: '/staffs', // PATCH /staffs/{id}
    DELETE: '/staffs', // DELETE /staffs/{id}
  },
  LEADERBOARD: {
    MONTHLY: '/monthly-leaderboards', // GET /monthly-leaderboards?month=&year=&page=&limit=
  },
  NOTIFICATIONS: {
    GET_ALL: '/notifications', // GET /notifications
    GET_BY_ID: '/notifications', // GET /notifications/{id}
    CREATE: '/notifications', // POST /notifications
    UPDATE: '/notifications', // PATCH /notifications/{id}
    DELETE: '/notifications', // DELETE /notifications/{id}
    MARK_AS_READ: '/notifications', // PATCH /notifications/{id}/read
    GET_BY_RECEIVER: '/notifications/receiver', // GET /notifications/receiver/{receiverId}
    DELETE_BY_RECEIVER: '/notifications/receiver', // DELETE /notifications/receiver/{receiverId}
  },
  VOUCHERS: {
    GET_ALL: '/customer/vouchers', // GET /customer/vouchers
    GET_MY: '/customer/vouchers/my', // GET /customer/vouchers/my
    REDEEM: '/customer/vouchers/redeem', // POST /customer/vouchers/redeem
  },
  BUSINESS_VOUCHERS: {
    CREATE: '/business-vouchers', // POST /business-vouchers
    UPDATE: '/business-vouchers', // PATCH /business-vouchers/{businessVoucherId}
    GET_MY: '/business-vouchers/my', // GET /business-vouchers/my
    GET_VOUCHER_CODES: '/business-vouchers', // GET /business-vouchers/{businessVoucherId}/voucher-codes
    GET_BY_CODE_ID: '/business-vouchers/voucher-codes', // GET /business-vouchers/voucher-codes/{voucherCodeId}
    USE_VOUCHER_CODE: '/business-vouchers/voucher-codes/use', // POST /business-vouchers/voucher-codes/use
  },
  FEEDBACK: {
    CREATE: '/feedback', // POST /feedback
    GET_MY: '/feedback/my-feedbacks', // GET /feedback/my-feedbacks?page=&limit=
    GET_BY_BUSINESS: '/feedback/business', // GET /feedback/business/{businessId}?page=&limit=&rating=
    UPDATE: '/feedback', // PATCH /feedback/{id}
    DELETE: '/feedback', // DELETE /feedback/{id}
  },
} as const;

// Request timeout (in milliseconds)
export const REQUEST_TIMEOUT = 30000; // 30 seconds for file uploads

// Default headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
} as const;

