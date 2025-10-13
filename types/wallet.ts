export interface PaymentMethod {
  id: string;
  name: string;
  type: 'bank_account' | 'credit_card' | 'debit_card';
  isDefault: boolean;
  last4?: string;
  expiryDate?: string;
}

export interface Wallet {
  id: string;
  balance: number;
  currency: string;
  paymentMethods: PaymentMethod[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  type: 'add_funds' | 'withdraw' | 'receive' | 'return';
  description: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  walletId: string;
}
