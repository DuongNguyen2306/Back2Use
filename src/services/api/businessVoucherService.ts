import { API_ENDPOINTS } from '../../constants/api';
import { apiCall } from './client';

// ============================================================================
// BUSINESS VOUCHER TYPES
// ============================================================================

export interface BusinessVoucherCode {
  _id: string;
  voucherId: string;
  voucherType?: string;
  businessId?: string;
  redeemedBy?: string;
  fullCode: string;
  status: 'redeemed' | 'used' | 'expired';
  redeemedAt?: string;
  qrCode?: string;
  createdAt?: string;
  updatedAt?: string;
  voucherInfo?: {
    _id: string;
    customName: string;
    customDescription: string;
    discountPercent: number;
    baseCode: string;
    rewardPointCost?: number;
    maxUsage?: number;
    redeemedCount?: number;
    startDate: string;
    endDate: string;
    status: string;
  };
  businessInfo?: {
    _id: string;
    businessName: string;
    businessAddress?: string;
    businessPhone?: string;
    openTime?: string;
    closeTime?: string;
    businessLogoUrl?: string;
  };
}

export interface GetVoucherCodeResponse {
  statusCode: number;
  message: string;
  data: BusinessVoucherCode;
}

export interface UseVoucherCodeRequest {
  code: string;
}

export interface UseVoucherCodeResponse {
  statusCode: number;
  message: string;
  data?: {
    success: boolean;
    voucher?: BusinessVoucherCode;
  };
}

// ============================================================================
// BUSINESS VOUCHER API
// ============================================================================

export interface BusinessVoucher {
  _id: string;
  businessId: string;
  customName: string;
  customDescription: string;
  discountPercent: number;
  baseCode: string;
  rewardPointCost?: number;
  maxUsage?: number;
  redeemedCount?: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusinessVoucherRequest {
  customName: string;
  customDescription: string;
  discountPercent: number;
  baseCode: string;
  rewardPointCost?: number;
  maxUsage?: number;
  startDate: string;
  endDate: string;
}

export interface UpdateBusinessVoucherRequest {
  customName?: string;
  customDescription?: string;
  discountPercent?: number;
  rewardPointCost?: number;
  maxUsage?: number;
  startDate?: string;
  endDate?: string;
  status?: 'active' | 'inactive';
}

export interface BusinessVoucherResponse {
  statusCode: number;
  message: string;
  data: BusinessVoucher;
}

export interface BusinessVouchersListResponse {
  statusCode: number;
  message: string;
  data: BusinessVoucher[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface VoucherCode {
  _id: string;
  voucherId: string;
  fullCode: string;
  status: 'active' | 'redeemed' | 'used' | 'expired';
  redeemedBy?: string;
  redeemedAt?: string;
  usedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VoucherCodesResponse {
  statusCode: number;
  message: string;
  data: VoucherCode[];
  total?: number;
}

export const businessVoucherApi = {
  // Create business voucher - POST /business-vouchers
  create: async (data: CreateBusinessVoucherRequest): Promise<BusinessVoucherResponse> => {
    return apiCall<BusinessVoucherResponse>(API_ENDPOINTS.BUSINESS_VOUCHERS.CREATE, {
      method: 'POST',
      data,
    });
  },

  // Update business voucher - PATCH /business-vouchers/{businessVoucherId}
  update: async (businessVoucherId: string, data: UpdateBusinessVoucherRequest): Promise<BusinessVoucherResponse> => {
    const endpoint = `${API_ENDPOINTS.BUSINESS_VOUCHERS.UPDATE}/${businessVoucherId}`;
    return apiCall<BusinessVoucherResponse>(endpoint, {
      method: 'PATCH',
      data,
    });
  },

  // Get my business vouchers - GET /business-vouchers/my
  getMy: async (params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'inactive' | 'expired';
  }): Promise<BusinessVouchersListResponse> => {
    const { page = 1, limit = 100, status } = params || {};
    const queryParams: any = { page, limit };
    if (status) queryParams.status = status;
    return apiCall<BusinessVouchersListResponse>(API_ENDPOINTS.BUSINESS_VOUCHERS.GET_MY, {
      method: 'GET',
      params: queryParams,
    });
  },

  // Get voucher codes - GET /business-vouchers/{businessVoucherId}/voucher-codes
  getVoucherCodes: async (businessVoucherId: string, params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'redeemed' | 'used' | 'expired';
  }): Promise<VoucherCodesResponse> => {
    const endpoint = `${API_ENDPOINTS.BUSINESS_VOUCHERS.GET_VOUCHER_CODES}/${businessVoucherId}/voucher-codes`;
    const { page = 1, limit = 100, status } = params || {};
    const queryParams: any = { page, limit };
    if (status) queryParams.status = status;
    return apiCall<VoucherCodesResponse>(endpoint, {
      method: 'GET',
      params: queryParams,
    });
  },

  // Get voucher code by ID - GET /business-vouchers/voucher-codes/{voucherCodeId}
  getVoucherByCodeId: async (voucherCodeId: string): Promise<GetVoucherCodeResponse> => {
    const endpoint = `${API_ENDPOINTS.BUSINESS_VOUCHERS.GET_BY_CODE_ID}/${voucherCodeId}`;
    return apiCall<GetVoucherCodeResponse>(endpoint, {
      method: 'GET',
    });
  },

  // Use voucher code - POST /business-vouchers/voucher-codes/use
  useVoucherCode: async (code: string): Promise<UseVoucherCodeResponse> => {
    return apiCall<UseVoucherCodeResponse>(API_ENDPOINTS.BUSINESS_VOUCHERS.USE_VOUCHER_CODE, {
      method: 'POST',
      data: { code },
    });
  },
};

export default businessVoucherApi;


