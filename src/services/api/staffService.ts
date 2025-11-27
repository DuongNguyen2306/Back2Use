import { API_ENDPOINTS } from '../../constants/api';
import { apiCall } from './client';

// ============================================================================
// STAFF TYPES
// ============================================================================

export interface Staff {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffRequest {
  businessId: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface CreateStaffResponse {
  statusCode: number;
  message: string;
  data: Staff;
}

export interface StaffListResponse {
  statusCode: number;
  message: string;
  data: Staff[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export interface DeleteStaffResponse {
  statusCode: number;
  message: string;
}

// ============================================================================
// STAFF API
// ============================================================================

export const staffApi = {
  // Get all staff members with pagination, search, and status filter
  getAll: async (params?: { 
    search?: string; 
    status?: string; 
    page?: number; 
    limit?: number 
  }): Promise<StaffListResponse> => {
    const { search, status, page = 1, limit = 100 } = params || {};
    const queryParams: any = { page, limit };
    if (search) queryParams.search = search;
    if (status) queryParams.status = status;
    
    return apiCall<StaffListResponse>(API_ENDPOINTS.STAFF.GET_ALL, {
      method: 'GET',
      params: queryParams,
    });
  },

  // Get staff by ID
  getById: async (staffId: string): Promise<CreateStaffResponse> => {
    const endpoint = `${API_ENDPOINTS.STAFF.GET_BY_ID}/${staffId}`;
    return apiCall<CreateStaffResponse>(endpoint, {
      method: 'GET',
    });
  },

  // Create a new staff member (requires businessId)
  create: async (data: CreateStaffRequest): Promise<CreateStaffResponse> => {
    return apiCall<CreateStaffResponse>(API_ENDPOINTS.STAFF.CREATE, {
      method: 'POST',
      data,
    });
  },

  // Update staff member
  update: async (staffId: string, data: Partial<CreateStaffRequest & { status?: string }>): Promise<CreateStaffResponse> => {
    const endpoint = `${API_ENDPOINTS.STAFF.UPDATE}/${staffId}`;
    return apiCall<CreateStaffResponse>(endpoint, {
      method: 'PATCH',
      data,
    });
  },

  // Delete a staff member (soft remove - sets status to removed)
  delete: async (staffId: string): Promise<DeleteStaffResponse> => {
    const endpoint = `${API_ENDPOINTS.STAFF.DELETE}/${staffId}`;
    return apiCall<DeleteStaffResponse>(endpoint, {
      method: 'DELETE',
    });
  },
};

