import { API_ENDPOINTS } from '../../constants/api';
import { apiCall } from './client';

export interface WalletDetails {
  _id: string;
  balance: number;
  transactions?: any[];
}

export const walletApi = {
  getById: async (walletId: string): Promise<WalletDetails> => {
    return apiCall<WalletDetails>(`/wallets/${walletId}`, { method: 'GET' });
  },
  deposit: async (walletId: string, amount: number): Promise<{ url?: string; payUrl?: string } & Record<string, any>> => {
    const endpoint = API_ENDPOINTS.WALLET.DEPOSIT.replace('{walletId}', walletId);
    return apiCall<any>(endpoint, { method: 'POST', data: { amount } });
  },
  withdraw: async (walletId: string, amount: number): Promise<WalletDetails> => {
    const endpoint = API_ENDPOINTS.WALLET.WITHDRAW.replace('{walletId}', walletId);
    return apiCall<WalletDetails>(endpoint, { method: 'POST', data: { amount } });
  },
};

export interface WalletTransaction {
  _id: string;
  walletId: string;
  userId: string;
  amount: number;
  transactionType: 'deposit' | 'withdraw' | 'subscription_fee' | 'borrow_deposit' | 'return_refund';
  direction: 'in' | 'out';
  status: 'processing' | 'completed' | 'failed';
  description: string;
  referenceType: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface WalletTransactionsResponse {
  statusCode: number;
  message: string;
  data: WalletTransaction[];
}

export const walletTransactionsApi = {
  getMy: async (params?: { walletType?: 'customer' | 'business'; typeGroup?: 'personal' | 'deposit_refund'; direction?: 'in' | 'out'; page?: number; limit?: number; }): Promise<WalletTransactionsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.walletType) queryParams.append('walletType', params.walletType);
    if (params?.typeGroup) queryParams.append('typeGroup', params.typeGroup);
    if (params?.direction) queryParams.append('direction', params.direction);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    const endpoint = `${API_ENDPOINTS.WALLET_TRANSACTIONS.GET_MY}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiCall<WalletTransactionsResponse>(endpoint, { method: 'GET' });
  },
};

export default { walletApi, walletTransactionsApi };
