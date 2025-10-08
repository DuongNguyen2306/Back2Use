import { getCurrentUserProfile, updateUserProfile, UpdateProfileRequest } from '../user-service';

// Test API functions
export const testProfileAPI = async (token: string) => {
  console.log('🧪 Testing Profile API...');
  
  try {
    // Test GET /users/me
    console.log('📡 Testing GET /users/me...');
    const userProfile = await getCurrentUserProfile(token);
    console.log('✅ User Profile:', userProfile);
    
    // Test POST /users/edit-profile
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

// Example usage in a component
export const useProfileAPI = () => {
  const testAPI = async (token: string) => {
    return await testProfileAPI(token);
  };
  
  return { testAPI };
};
