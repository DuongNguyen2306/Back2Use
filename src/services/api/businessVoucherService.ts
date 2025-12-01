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

export const businessVoucherApi = {
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

