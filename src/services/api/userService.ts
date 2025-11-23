import { API_BASE_URL, API_ENDPOINTS, REQUEST_TIMEOUT } from '../../constants/api';
import { UpdateProfileRequest, UploadAvatarResponse, User } from '../../types/auth.types';
import { apiClient } from './client';

// ============================================================================
// USER API
// ============================================================================

// Helper function to get current access token with auto refresh
let getCurrentAccessToken: (() => Promise<string | null>) | null = null;

export const setTokenProvider = (tokenProvider: () => Promise<string | null>) => {
  getCurrentAccessToken = tokenProvider;
};

// Get user by ID
export const getUserById = async (userId: string, token: string): Promise<User> => {
  try {
    const response = await apiClient.get(`${API_ENDPOINTS.USER.GET_BY_ID}/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      timeout: REQUEST_TIMEOUT,
    });

    return response.data;
  } catch (error: any) {
    console.error('Error fetching user by ID:', error);
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection and try again.');
    }
    throw new Error(`Failed to fetch user: ${error.response?.data?.message || error.message || 'Unknown error'}`);
  }
};

// Get current user profile with auto refresh token
export const getCurrentUserProfileWithAutoRefresh = async (): Promise<User> => {
  if (!getCurrentAccessToken) {
    throw new Error('Token provider not set. Call setTokenProvider first.');
  }

  const token = await getCurrentAccessToken();
  if (!token) {
    throw new Error('No valid access token available');
  }

  return getCurrentUserProfile(token);
};

// Get current user profile - GET /users/me
export const getCurrentUserProfile = async (token: string): Promise<User> => {
  try {
    console.log('getCurrentUserProfile called with token:', token ? '***' + token.slice(-8) : 'None');
    console.log('Token length:', token?.length || 0);
    console.log('API Base URL:', API_BASE_URL);
    
    if (!token) {
      throw new Error('No access token provided');
    }

    const response = await apiClient.get('/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      timeout: REQUEST_TIMEOUT,
    });

    const result = response.data;
    
    if (result.statusCode === 200 && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to get user profile');
    }
  } catch (error: any) {
    console.error('Error fetching current user profile:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    });
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection and try again.');
    }
    
    if (error.message === 'Network Error') {
      throw new Error('Network error. Please check your internet connection and server status.');
    }
    
    throw new Error(`Failed to fetch user profile: ${error.response?.data?.message || error.message || 'Unknown error'}`);
  }
};

// Update user profile with auto refresh token
export const updateUserProfileWithAutoRefresh = async (updates: UpdateProfileRequest): Promise<User> => {
  if (!getCurrentAccessToken) {
    throw new Error('Token provider not set. Call setTokenProvider first.');
  }

  const token = await getCurrentAccessToken();
  if (!token) {
    throw new Error('No valid access token available');
  }

  return updateUserProfile(updates, token);
};

// Upload avatar with auto refresh token
export const uploadAvatarWithAutoRefresh = async (imageUri: string): Promise<UploadAvatarResponse> => {
  if (!getCurrentAccessToken) {
    throw new Error('Token provider not set. Call setTokenProvider first.');
  }

  const token = await getCurrentAccessToken();
  if (!token) {
    throw new Error('No valid access token available');
  }

  return uploadAvatar(imageUri, token);
};

// Upload avatar - PUT /users/edit-avatar
export const uploadAvatar = async (imageUri: string, token: string): Promise<UploadAvatarResponse> => {
  try {
    console.log('📸 uploadAvatar called with:', {
      imageUri,
      tokenPreview: token ? '***' + token.slice(-8) : 'None',
      tokenLength: token?.length || 0
    });
    
    if (!token) {
      throw new Error('No access token provided');
    }

    if (!imageUri) {
      throw new Error('No image provided');
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('avatar', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    } as any);

    console.log('📤 Sending avatar upload request to:', API_ENDPOINTS.USER.EDIT_AVATAR);

    const response = await apiClient.put(API_ENDPOINTS.USER.EDIT_AVATAR, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 seconds for file upload
    });

    console.log('📥 Avatar upload response status:', response.status);
    console.log('📥 Avatar upload response data:', response.data);

    const result = response.data;
    
    // Handle both 200 and 201 status codes
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Avatar uploaded successfully');
      // Try to extract avatarUrl from different response structures
      const avatarUrl = result?.data?.avatarUrl || 
                       result?.data?.avatar || 
                       result?.avatarUrl || 
                       result?.avatar ||
                       (typeof result === 'string' ? result : '');
      
      return {
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          avatarUrl: avatarUrl
        }
      };
    } else {
      console.log('❌ Unexpected response structure:', result);
      throw new Error(result.message || 'Failed to upload avatar');
    }
  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
    });
    if (error.code === 'ECONNABORTED') {
      throw new Error('Upload timeout. Please check your connection and try again.');
    }
    throw new Error(`Failed to upload avatar: ${error.response?.data?.message || error.message || 'Unknown error'}`);
  }
};

// Update user profile - PUT /users/edit-profile
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

    console.log('📤 Sending request to:', `${API_ENDPOINTS.USER.UPDATE_PROFILE}`);
    console.log('📤 Request body:', updates);

    const response = await apiClient.put(API_ENDPOINTS.USER.UPDATE_PROFILE, updates, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      timeout: REQUEST_TIMEOUT,
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response data:', response.data);

    const result = response.data;
    
    if (result.statusCode === 200) {
      if (result.data && result.data.user) {
        console.log('✅ Profile updated successfully (with user data)');
        return result.data.user;
      } else if (result.data) {
        console.log('✅ Profile updated successfully (with data)');
        return result.data;
      } else if (result.message === 'Profile updated' || result.message === 'User updated successfully') {
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
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection and try again.');
    }
    throw new Error(`Failed to update user profile: ${error.response?.data?.message || error.message || 'Unknown error'}`);
  }
};

// Test Profile API
export const testProfileAPI = async (token: string) => {
  console.log('🧪 Testing Profile API...');
  
  try {
    console.log('📡 Testing GET /users/me...');
    const userProfile = await getCurrentUserProfile(token);
    console.log('✅ User Profile:', userProfile);
    
    console.log('📡 Testing POST /users/edit-profile...');
    const updateData: UpdateProfileRequest = {
      name: "Nguyễn Văn Test",
      phone: "0987654321",
      address: "123 Test Street, Hanoi",
      yob: "1990-01-01"
    };
    
    const updatedProfile = await updateUserProfile(updateData, token);
    console.log('✅ Updated Profile:', updatedProfile);
    
    return {
      success: true,
      originalProfile: userProfile,
      updatedProfile: updatedProfile
    };
    
  } catch (error) {
    console.error('❌ API Test Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const useProfileAPI = () => {
  const testAPI = async (token: string) => {
    return await testProfileAPI(token);
  };
  
  return { testAPI };
};

