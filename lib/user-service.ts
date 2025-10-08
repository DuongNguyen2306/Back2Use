import { API_BASE_URL, API_ENDPOINTS, DEFAULT_HEADERS, REQUEST_TIMEOUT } from './constants';

// User interface based on API response
export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'customer' | 'business' | 'admin';
  isActive: boolean;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
  phone?: string;
  avatar?: string;
  address?: string;
  yob?: string; // year of birth
}

// Update profile request interface
export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  avatar?: string;
  address?: string;
  yob?: string;
}

// API Response interface
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Get user by ID
export const getUserById = async (userId: string, token: string): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER.GET_BY_ID}/${userId}`, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const user: User = await response.json();
    return user;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw new Error(`Failed to fetch user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get current user profile - GET /users/me
export const getCurrentUserProfile = async (token: string): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<User> = await response.json();
    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to get user profile');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    throw new Error(`Failed to fetch user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Update user profile - POST /users/edit-profile
export const updateUserProfile = async (updates: UpdateProfileRequest, token: string): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/edit-profile`, {
      method: 'POST',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<User> = await response.json();
    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to update user profile');
    }

    return result.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error(`Failed to update user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
