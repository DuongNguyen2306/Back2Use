// Product Types
export interface ProductSize {
  _id: string;
  name: string;
  depositValue: number;
  rentalPrice?: number;
  description?: string;
}

export interface ProductGroup {
  _id: string;
  name: string;
  description?: string;
  category?: string;
}

export interface Business {
  _id: string;
  businessName: string;
  businessLogoUrl?: string;
}

export interface Product {
  _id: string;
  serialNumber: string;
  productGroupId: ProductGroup;
  productSizeId: ProductSize;
  businessId: Business | string;
  status: 'available' | 'borrowed' | 'maintenance' | 'retired';
  condition?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductResponse {
  statusCode: number;
  message: string;
  data: Product;
  success?: boolean;
}

// Borrow Transaction Types
export interface CreateBorrowTransactionRequest {
  productId: string;
  businessId: string;
  depositValue: number;
  durationInDays: number;
  type: 'online' | 'offline';
}

export interface BorrowTransaction {
  _id: string;
  productId: Product | string;
  businessId: Business | string;
  userId: string;
  depositValue: number;
  durationInDays: number;
  type: 'online' | 'offline';
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  borrowedAt?: string;
  dueDate?: string;
  returnedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBorrowTransactionResponse {
  statusCode: number;
  message: string;
  data: BorrowTransaction;
  success?: boolean;
}

