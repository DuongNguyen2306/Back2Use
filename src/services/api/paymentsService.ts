import { API_ENDPOINTS } from '../../constants/api';
import { apiCall } from './client';

export const paymentsApi = {
  createVnPay: async (payload: { amount: number; orderInfo: string; returnUrl?: string; }): Promise<{ payUrl: string } & Record<string, any>> => {
    return apiCall<any>(API_ENDPOINTS.PAYMENTS.VNPAY_CREATE, { method: 'POST', data: payload });
  },
  depositToWallet: async (walletId: string, amount: number): Promise<{ payUrl?: string } & Record<string, any>> => {
    return apiCall<any>(`/wallets/${walletId}/deposit`, { method: 'POST', data: { amount } });
  },
};

export default { paymentsApi };
