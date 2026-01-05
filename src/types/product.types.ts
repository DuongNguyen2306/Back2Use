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

export interface ProductBusiness {
  _id: string;
  businessName: string;
  businessLogoUrl?: string;
}

export interface Product {
  _id: string;
  serialNumber: string;
  productGroupId: ProductGroup;
  productSizeId: ProductSize;
  businessId: ProductBusiness | string;
  status: 'available' | 'borrowed' | 'maintenance' | 'retired' | 'non-available';
  condition?: string;
  images?: string[];
  qrCode?: string;
  reuseCount?: number;
  lastConditionImages?: {
    frontImage?: string;
    backImage?: string;
    leftImage?: string;
    rightImage?: string;
    topImage?: string;
    bottomImage?: string;
    _id?: string;
  };
  lastDamageFaces?: Array<{
    face: string;
    issue: string;
    _id?: string;
  }>;
  lastConditionNote?: string;
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
  type?: 'online' | 'at_store'; // Optional: 'online' = mượn online (quét QR trước), 'at_store' = mượn trực tiếp tại cửa hàng
  singleUseProductId?: string; // Optional: ID của single-use product để tính CO2
}

export interface BorrowTransaction {
  _id: string;
  productId: Product | string;
  businessId: ProductBusiness | string;
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
 
