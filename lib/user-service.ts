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
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER.GET_BY_ID}/${userId}`, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const user: User = await response.json();
    return user;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your connection and try again.');
    }
    throw new Error(`Failed to fetch user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// No more fake token logic - only use real tokens from server

// Get current user profile - GET /users/me
export const getCurrentUserProfile = async (token: string): Promise<User> => {
  try {
    console.log('getCurrentUserProfile called with token:', token ? '***' + token.slice(-8) : 'None');
    console.log('Token length:', token?.length || 0);
    
    if (!token) {
      throw new Error('No access token provided');
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Handle the actual API response structure from the server
    if (result.statusCode === 200 && result.data && result.data.user) {
      return result.data.user;
    } else {
      throw new Error(result.message || 'Failed to get user profile');
    }
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your connection and try again.');
    }
    throw new Error(`Failed to fetch user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Update user profile - POST /users/edit-profile
export const updateUserProfile = async (updates: UpdateProfileRequest, token: string): Promise<User> => {
  try {
    console.log('🔄 updateUserProfile called with:', {
      updates,
      tokenPreview: token ? '***' + token.slice(-8) : 'None',
      tokenLength: token?.length || 0
    });
    
    if (!token) {
      throw new Error('No access token provided');
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const requestBody = JSON.stringify(updates);
    console.log('📤 Sending request to:', `${API_BASE_URL}${API_ENDPOINTS.USER.UPDATE_PROFILE}`);
    console.log('📤 Request body:', requestBody);
    console.log('📤 Headers:', {
      ...DEFAULT_HEADERS,
      'Authorization': `Bearer ${token}`,
    });

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER.UPDATE_PROFILE}`, {
      method: 'POST',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      body: requestBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response body:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('📥 Response data:', result);
    
    // Handle different possible response structures
    if (result.statusCode === 200) {
      if (result.data && result.data.user) {
        console.log('✅ Profile updated successfully (with user data)');
        return result.data.user;
      } else if (result.message === 'User updated successfully') {
        // If response only has success message, fetch updated user data
        console.log('✅ Profile updated successfully (fetching updated data)');
        const updatedUser = await getCurrentUserProfile(token);
        return updatedUser;
      } else {
        console.log('❌ Unexpected response structure:', result);
        throw new Error(result.message || 'Failed to update user profile');
      }
    } else {
      console.log('❌ Invalid response structure:', result);
      throw new Error(result.message || 'Failed to update user profile');
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your connection and try again.');
    }
    throw new Error(`Failed to update user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
