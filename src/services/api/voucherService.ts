import { API_ENDPOINTS } from '../../constants/api';
import { apiCall } from './client';

// ============================================================================
// VOUCHER TYPES
// ============================================================================

export interface Voucher {
  _id: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  code: string;
  validFrom: string;
  validUntil: string;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MyVoucher extends Voucher {
  isUsed: boolean;
  usedAt?: string;
  redeemedAt?: string;
}

export interface VouchersResponse {
  statusCode: number;
  message: string;
  data: {
    items: Voucher[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MyVouchersResponse {
  statusCode: number;
  message: string;
  data: {
    items: MyVoucher[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RedeemVoucherRequest {
  voucherId: string;
}

export interface RedeemVoucherResponse {
  statusCode: number;
  message: string;
  data: {
    voucher: MyVoucher;
    success: boolean;
  };
}

// ============================================================================
// VOUCHER API
// ============================================================================

export const voucherApi = {
  // Get all available vouchers - GET /customer/vouchers
  getAll: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<VouchersResponse> => {
    const { page = 1, limit = 100 } = params || {};
    return apiCall<VouchersResponse>(API_ENDPOINTS.VOUCHERS.GET_ALL, {
      method: 'GET',
      params: { page, limit },
    });
  },

  // Get my vouchers - GET /customer/vouchers/my
  getMy: async (params?: {
    page?: number;
    limit?: number;
    isUsed?: boolean;
  }): Promise<MyVouchersResponse> => {
    const { page = 1, limit = 100, isUsed } = params || {};
    const queryParams: any = { page, limit };
    if (isUsed !== undefined) queryParams.isUsed = isUsed;
    return apiCall<MyVouchersResponse>(API_ENDPOINTS.VOUCHERS.GET_MY, {
      method: 'GET',
      params: queryParams,
    });
  },

  // Redeem voucher - POST /customer/vouchers/redeem
  redeem: async (voucherId: string): Promise<RedeemVoucherResponse> => {
    return apiCall<RedeemVoucherResponse>(API_ENDPOINTS.VOUCHERS.REDEEM, {
      method: 'POST',
      data: { voucherId },
    });
  },
};

export default voucherApi;

