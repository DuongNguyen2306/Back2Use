import apiClient from '@/services/api/client'; // Sửa đường dẫn cho đúng
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Alert } from 'react-native';

export class GoogleAuthService {
  private static instance: GoogleAuthService;
  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) GoogleAuthService.instance = new GoogleAuthService();
    return GoogleAuthService.instance;
  }

  // Hàm này chỉ nhận token từ LoginScreen và bắn về Backend
  async loginWithBackend(idToken: string) {
    try {
      console.log('🔄 Đang gửi token về Backend...');
      
      // API Backend của bạn
      const response = await apiClient.post('/auth/google-mobile', {
        idToken: idToken,
      });

      if (response.data && response.data.accessToken) {
        // Xử lý lưu token
        const { accessToken, user } = response.data;
        const role = user.role || 'customer';

        if (role === 'admin') {
           Alert.alert("Lỗi", "Admin không được vào Mobile");
           return;
        }

        // Lưu vào Storage (Ví dụ)
        await AsyncStorage.setItem("ACCESS_TOKEN", accessToken);
        // ✅ Đảm bảo role là string
        await AsyncStorage.setItem("AUTH_ROLE", String(role));

        // Điều hướng
        Alert.alert("Thành công", `Chào ${user.fullName}`);
        
        const path = role === 'business' ? '/(protected)/business' : '/(protected)/customer';
        router.replace(path as any);
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể xác thực với Server.');
    }
  }
}

export const googleAuthService = GoogleAuthService.getInstance();