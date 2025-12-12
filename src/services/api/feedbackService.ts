import { API_ENDPOINTS } from '../../constants/api';
import { apiCall } from './client';

// ============================================================================
// FEEDBACK TYPES
// ============================================================================

export interface Feedback {
  _id: string;
  borrowTransactionId: string;
  customerId: string | {
    _id: string;
    fullName: string;
    email?: string;
    avatar?: string;
  };
  businessId: string | {
    _id: string;
    businessName: string;
    businessLogoUrl?: string;
  };
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeedbackRequest {
  borrowTransactionId: string;
  rating: number; // 1-5
  comment?: string;
}

export interface UpdateFeedbackRequest {
  rating?: number;
  comment?: string;
}

export interface FeedbackResponse {
  statusCode: number;
  message: string;
  data: Feedback;
}

export interface FeedbacksResponse {
  statusCode: number;
  message: string;
  data: Feedback[] | {
    items: Feedback[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  total?: number;
  currentPage?: number;
  totalPages?: number;
}

// ============================================================================
// FEEDBACK API
// ============================================================================

export const feedbackApi = {
  // Create feedback for a business after return (Customer only)
  create: async (data: CreateFeedbackRequest): Promise<FeedbackResponse> => {
    return apiCall<FeedbackResponse>(API_ENDPOINTS.FEEDBACK.CREATE, {
      method: 'POST',
      data,
    });
  },

  // Get feedbacks by current customer
  getMy: async (params?: {
    page?: number;
    limit?: number;
    rating?: number; // Filter by rating (1-5) or undefined = all
  }): Promise<FeedbacksResponse> => {
    const { page = 1, limit = 1000, rating } = params || {};
    const queryParams: any = { page, limit };
    if (rating) queryParams.rating = rating;
    
    return apiCall<FeedbacksResponse>(API_ENDPOINTS.FEEDBACK.GET_MY, {
      method: 'GET',
      params: queryParams,
    });
  },

  // Get feedbacks by business ID (Public/Business)
  getByBusiness: async (
    businessId: string,
    params?: {
      page?: number;
      limit?: number;
      rating?: number; // Filter by rating (1-5) or empty = all
    }
  ): Promise<FeedbacksResponse> => {
    const { page = 1, limit = 10, rating } = params || {};
    const queryParams: any = { page, limit };
    if (rating) queryParams.rating = rating;
    
    return apiCall<FeedbacksResponse>(`${API_ENDPOINTS.FEEDBACK.GET_BY_BUSINESS}/${businessId}`, {
      method: 'GET',
      params: queryParams,
    });
  },

  // Update feedback (customer only)
  update: async (id: string, data: UpdateFeedbackRequest): Promise<FeedbackResponse> => {
    return apiCall<FeedbackResponse>(`${API_ENDPOINTS.FEEDBACK.UPDATE}/${id}`, {
      method: 'PATCH',
      data,
    });
  },

  // Delete feedback (customer only)
  delete: async (id: string): Promise<{ statusCode: number; message: string }> => {
    return apiCall<{ statusCode: number; message: string }>(`${API_ENDPOINTS.FEEDBACK.DELETE}/${id}`, {
      method: 'DELETE',
    });
  },
};

export default feedbackApi;

