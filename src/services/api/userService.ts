import { API_BASE_URL, API_ENDPOINTS, REQUEST_TIMEOUT } from '../../constants/api';
import { UpdateProfileRequest, UploadAvatarResponse, User } from '../../types/auth.types';
import { apiClient } from './client';

// Leaderboard Types
export interface LeaderboardEntry {
  _id: string;
  customerId: {
    _id: string;
    fullName?: string;
    phone?: string;
    address?: string;
    yob?: string;
  };
  month: number;
  year: number;
  rankingPoints: number;
  rank: number;
  lockedAt: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface MonthlyLeaderboardResponse {
  statusCode: number;
  message: string;
  data: LeaderboardEntry[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export interface GetMonthlyLeaderboardParams {
  month?: number; // 1-12
  year?: number;
  rankMin?: number;
  rankMax?: number;
  minPoints?: number;
  maxPoints?: number;
  page?: number;
  limit?: number;
}

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
    console.log('📥 Avatar upload response data (full):', JSON.stringify(response.data, null, 2));
    console.log('📥 Avatar upload response data (type):', typeof response.data);
    console.log('📥 Avatar upload response data (keys):', response.data ? Object.keys(response.data) : 'null');

    const result = response.data;
    
    // Handle both 200 and 201 status codes
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Avatar uploaded successfully');
      
      // Try to extract avatarUrl from different response structures
      // Check multiple possible paths
      let avatarUrl = '';
      
      // Path 1: result.data.avatarUrl
      if (result?.data?.avatarUrl) {
        avatarUrl = result.data.avatarUrl;
        console.log('✅ Found avatarUrl at: result.data.avatarUrl');
      }
      // Path 2: result.data.avatar
      else if (result?.data?.avatar) {
        avatarUrl = result.data.avatar;
        console.log('✅ Found avatarUrl at: result.data.avatar');
      }
      // Path 3: result.avatarUrl
      else if (result?.avatarUrl) {
        avatarUrl = result.avatarUrl;
        console.log('✅ Found avatarUrl at: result.avatarUrl');
      }
      // Path 4: result.avatar
      else if (result?.avatar) {
        avatarUrl = result.avatar;
        console.log('✅ Found avatarUrl at: result.avatar');
      }
      // Path 5: result is a string (direct URL)
      else if (typeof result === 'string') {
        avatarUrl = result;
        console.log('✅ Found avatarUrl as direct string');
      }
      // Path 6: result.data is a string
      else if (typeof result?.data === 'string') {
        avatarUrl = result.data;
        console.log('✅ Found avatarUrl at: result.data (string)');
      }
      // Path 7: Check if result has statusCode 200 and data nested
      else if (result?.statusCode === 200 && result?.data) {
        if (typeof result.data === 'string') {
          avatarUrl = result.data;
          console.log('✅ Found avatarUrl at: result.data (statusCode 200)');
        } else if (result.data.avatarUrl) {
          avatarUrl = result.data.avatarUrl;
          console.log('✅ Found avatarUrl at: result.data.avatarUrl (statusCode 200)');
        } else if (result.data.avatar) {
          avatarUrl = result.data.avatar;
          console.log('✅ Found avatarUrl at: result.data.avatar (statusCode 200)');
        }
      }
      
      console.log('🔍 Extracted avatarUrl:', avatarUrl || 'NOT FOUND');
      
      // If avatarUrl not found in response, try to fetch from user profile
      // This handles cases where server updates avatar but doesn't return URL in response
      if (!avatarUrl) {
        console.log('⚠️ Avatar URL not in response, fetching updated user profile...');
        try {
          console.log('🔄 Attempting to fetch updated user profile...');
          const updatedUser = await getCurrentUserProfile(token);
          if (updatedUser?.avatar) {
            avatarUrl = updatedUser.avatar;
            console.log('✅ Found avatarUrl from user profile:', avatarUrl);
          } else {
            console.log('⚠️ Avatar not found in user profile either. Upload may have succeeded but avatar not set.');
          }
        } catch (profileError) {
          console.error('❌ Failed to fetch user profile:', profileError);
          // Don't throw error here - upload may have succeeded
        }
      }
      
      // Even if we can't get the URL, the upload might have succeeded
      // So we return success and let the caller fetch the updated profile
      if (!avatarUrl) {
        console.log('⚠️ Avatar URL not found, but upload may have succeeded. Returning success with empty URL.');
        console.log('📋 Full response structure:', JSON.stringify(result, null, 2));
        // Return success with empty URL - caller should fetch updated profile
        return {
          success: true,
          message: 'Avatar uploaded successfully (please refresh to see changes)',
          data: {
            avatarUrl: '' // Empty URL indicates caller should fetch updated profile
          }
        };
      }
      
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

    // Decode token to check role
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('🔍 Token payload:', {
          role: payload.role,
          userId: payload.userId || payload.sub || payload.id,
          exp: payload.exp,
        });
      }
    } catch (e) {
      console.warn('⚠️ Could not decode token:', e);
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

// ============================================================================
// LEADERBOARD API
// ============================================================================

// Get monthly leaderboard - GET /monthly-leaderboards
export const getMonthlyLeaderboard = async (
  params?: GetMonthlyLeaderboardParams,
  token?: string
): Promise<MonthlyLeaderboardResponse> => {
  try {
    // Get token if not provided
    let accessToken = token;
    if (!accessToken && getCurrentAccessToken) {
      try {
        accessToken = await getCurrentAccessToken() || undefined;
      } catch (error) {
        console.warn('Error getting token from provider:', error);
      }
    }

    // Fallback: Get token from AsyncStorage
    if (!accessToken) {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        accessToken = await AsyncStorage.getItem('ACCESS_TOKEN') || undefined;
      } catch (error) {
        console.warn('Error getting token from AsyncStorage:', error);
      }
    }

    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Build query parameters
    const queryParams: Record<string, any> = {};
    if (params?.month !== undefined) queryParams.month = params.month;
    if (params?.year !== undefined) queryParams.year = params.year;
    if (params?.rankMin !== undefined) queryParams.rankMin = params.rankMin;
    if (params?.rankMax !== undefined) queryParams.rankMax = params.rankMax;
    if (params?.minPoints !== undefined) queryParams.minPoints = params.minPoints;
    if (params?.maxPoints !== undefined) queryParams.maxPoints = params.maxPoints;
    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.limit !== undefined) queryParams.limit = params.limit;

    const response = await apiClient.get(API_ENDPOINTS.LEADERBOARD.MONTHLY, {
      headers,
      params: queryParams,
      timeout: REQUEST_TIMEOUT,
    });

    const result = response.data;
    
    // Log chi tiết để debug
    console.log('📡 Monthly Leaderboard API Response:', JSON.stringify(result, null, 2));
    console.log('📡 Response type check:', {
      isObject: typeof result === 'object',
      hasStatusCode: 'statusCode' in result,
      statusCode: result?.statusCode,
      hasData: 'data' in result,
      dataType: Array.isArray(result?.data) ? 'array' : typeof result?.data,
      dataLength: Array.isArray(result?.data) ? result.data.length : 'N/A',
    });

    // Kiểm tra và xử lý response
    if (result && result.statusCode === 200) {
      // Đảm bảo data là mảng
      const dataArray = Array.isArray(result.data) ? result.data : [];
      
      console.log('📡 Processed data array length:', dataArray.length);
      
      return {
        statusCode: result.statusCode,
        message: result.message || 'Get monthly leaderboard successfully',
        data: dataArray,
        total: result.total ?? dataArray.length,
        currentPage: result.currentPage ?? 1,
        totalPages: result.totalPages ?? 1,
      };
    } else {
      const errorMsg = result?.message || 'Failed to get monthly leaderboard';
      console.error('❌ Leaderboard API error:', errorMsg, result);
      throw new Error(errorMsg);
    }
  } catch (error: any) {
    console.error('Error fetching monthly leaderboard:', error);
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

    throw new Error(
      `Failed to fetch monthly leaderboard: ${error.response?.data?.message || error.message || 'Unknown error'}`
    );
  }
};

// Get monthly leaderboard with auto refresh token
export const getMonthlyLeaderboardWithAutoRefresh = async (
  params?: GetMonthlyLeaderboardParams
): Promise<MonthlyLeaderboardResponse> => {
  return getMonthlyLeaderboard(params);
};

// Leaderboard API object for easy access
export const leaderboardApi = {
  getMonthly: getMonthlyLeaderboardWithAutoRefresh,
  getMonthlyWithParams: getMonthlyLeaderboard,
};

