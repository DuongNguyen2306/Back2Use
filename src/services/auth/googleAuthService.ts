import { API_BASE_URL } from '@/constants/api';
import apiClient from '@/services/api/client';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';

export class GoogleAuthService {
  private static instance: GoogleAuthService;
  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) GoogleAuthService.instance = new GoogleAuthService();
    return GoogleAuthService.instance;
  }

  private getBaseUrl(): string {
    // Use centralized API_BASE_URL from constants
    return API_BASE_URL;
  }

  async initiateGoogleLogin(): Promise<void> {
    try {
      console.log('Initiating Google OAuth login...');
      const apiBaseUrl = this.getBaseUrl();
      const deviceId = `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const deviceName = 'Back2Use Mobile App';
      const authUrl = `${apiBaseUrl}/auth/google?device_id=${deviceId}&device_name=${encodeURIComponent(deviceName)}`;
      console.log('Opening Google OAuth URL:', authUrl);
      const redirectUri = `${apiBaseUrl}/auth/google-redirect`;
      console.log('Redirect URI:', redirectUri);

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      console.log('WebBrowser result:', result);
      if (result.type === 'success' && result.url) {
        await this.handleGoogleRedirect(result.url);
      } else if (result.type === 'cancel') {
        console.log('User cancelled Google OAuth');
      } else {
        Alert.alert('Error', 'Google OAuth failed. Please try again.');
      }
    } catch (error) {
      console.error('Google OAuth login error:', error);
      Alert.alert('Error', 'Failed to initiate Google login. Please try again.');
    }
  }

  async handleGoogleRedirect(url: string): Promise<void> {
    try {
      console.log('Handling Google OAuth redirect:', url);
      if (!url.includes('/auth/google-redirect')) {
        Alert.alert('Error', 'Unexpected redirect URL received');
        return;
      }
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');
      const error = urlObj.searchParams.get('error');
      if (error) {
        Alert.alert('Error', `Google OAuth error: ${error}`);
        return;
      }
      if (!code) {
        Alert.alert('Error', 'No authorization code received from Google');
        return;
      }
      console.log('Processing OAuth code via backend...');
      const response = await apiClient.get(`/auth/google-redirect?code=${code}`);
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        const responseData = response.data;
        if (responseData.success && responseData.data) {
          await this.handleSuccessfulLogin(responseData.data);
        } else {
          Alert.alert('Error', responseData.message || 'Google OAuth failed');
        }
      } else {
        Alert.alert('Success', 'Google OAuth completed successfully! Please check your email for login details.', [
          { text: 'OK', onPress: () => setTimeout(() => router.replace('/auth/login'), 100) },
        ]);
      }
    } catch (err) {
      console.error('Google OAuth redirect error:', err);
      Alert.alert('Error', 'Failed to process Google OAuth redirect. Please try again.');
    }
  }

  private async handleSuccessfulLogin(data: any): Promise<void> {
    try {
      const { accessToken, refreshToken, user } = data;
      if (accessToken && user) {
        const role = user.role || 'customer';
        
        // Block admin login on mobile
        if (role === 'admin') {
          console.log("❌ Google login: Admin user detected on mobile - blocking access");
          Alert.alert(
            'Admin Access Restricted',
            'Admin accounts cannot be accessed on mobile devices. Please log in on the web platform.',
            [
              {
                text: 'OK',
                onPress: () => {
                  router.replace('/auth/login');
                }
              }
            ],
            { cancelable: false }
          );
          return;
        }
        
        Alert.alert('Success', `Welcome ${user.name || user.email}! You have been logged in successfully.`, [
          {
            text: 'OK',
            onPress: () => setTimeout(() => router.replace(`/(protected)/${role}`), 100),
          },
        ]);
      } else {
        Alert.alert('Error', 'Failed to get user data from Google OAuth');
      }
    } catch (e) {
      console.error('Handle successful login error:', e);
      Alert.alert('Error', 'Failed to process login data. Please try again.');
    }
  }
}

export const googleAuthService = GoogleAuthService.getInstance();
