export interface BusinessRegisterRequest {
  businessName: string;
  businessLogo?: any;
  businessType: string;
  businessMail: string;
  businessAddress: string;
  businessPhone: string;
  taxCode: string;
  openTime: string; // HH:mm format
  closeTime: string; // HH:mm format
  foodSafetyCertUrl?: any;
  businessLicenseFile?: any;
}

export interface BusinessRegisterResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    storeName: string;
    storeMail: string;
    status: string;
  };
}

export interface NearbyBusiness {
  _id: string;
  userId: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessType: string;
  openTime: string;
  closeTime: string;
  businessLogoUrl?: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  createdAt: string;
  updatedAt: string;
  distance: number;
  role: string;
  isActive: boolean;
  isBlocked: boolean;
}

export interface NearbyBusinessesResponse {
  statusCode: number;
  message: string;
  data: NearbyBusiness[];
  total: number;
  currentPage: number;
  totalPages: number;
}

// Business without distance (for GET all businesses)
export interface Business {
  _id: string;
  id?: string; // Some APIs return both _id and id
  userId: string;
  businessFormId?: string;
  businessMail?: string;
  taxCode?: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessType: string;
  openTime: string;
  closeTime: string;
  businessLogoUrl?: string;
  foodSafetyCertUrl?: string;
  businessLicenseUrl?: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  co2Reduced?: number;
  ecoPoints?: number;
  averageRating?: number;
  totalReviews?: number;
  createdAt: string;
  updatedAt: string;
  role?: string | string[];
  isActive?: boolean;
  isBlocked?: boolean;
}

export interface GetAllBusinessesResponse {
  statusCode: number;
  message: string;
  data: Business[];
  total?: number;
  currentPage?: number;
  totalPages?: number;
}

export interface MaterialCreateRequest {
  materialName: string;
  maximumReuse?: number;
  description?: string;
}

export interface MaterialItem {
  _id: string;
  materialName: string;
  maximumReuse?: number;
  description?: string;
  status?: 'approved' | 'pending' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}

export interface BusinessFormHistory {
  _id: string;
  customerId: string;
  businessMail: string;
  businessName: string;
  taxCode: string;
  businessAddress: string;
  businessPhone: string;
  businessType: string;
  openTime: string;
  closeTime: string;
  businessLogoUrl?: string;
  FoodSafetyCertUrl?: string;
  businessLicenseUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface BusinessFormHistoryResponse {
  statusCode: number;
  message: string;
  data: BusinessFormHistory[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  statusCode?: number;
  message?: string;
  data?: {
    docs?: T[];
    items?: T[];
    totalDocs?: number;
    total?: number;
    page?: number;
    limit?: number;
  };
  success?: boolean;
}

// Business Profile (for GET /businesses/profile)
export interface BusinessProfileUser {
  _id: string;
  username: string;
  email: string;
}

export interface ProductGroup {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  businessId?: string;
  materialId?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BusinessProfile {
  _id: string;
  businessFormId: string;
  userId: BusinessProfileUser;
  businessMail: string;
  businessName: string;
  taxCode: string;
  businessAddress: string;
  businessPhone: string;
  businessType: string;
  openTime: string;
  closeTime: string;
  businessLogoUrl?: string;
  foodSafetyCertUrl?: string;
  businessLicenseUrl?: string;
  status: 'active' | 'inactive' | 'blocked';
  ecoPoints: number;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  // Additional fields from API
  productGroups?: ProductGroup[];
  co2Reduced?: number;
  averageRating?: number;
  totalReviews?: number;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface BusinessWallet {
  _id: string;
  userId: string;
  type: 'business' | 'customer';
  availableBalance: number;
  holdingBalance: number;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface BusinessProfileResponse {
  statusCode: number;
  message: string;
  data: {
    business: BusinessProfile;
    activeSubscription: any[];
    wallet: BusinessWallet;
  };
}

