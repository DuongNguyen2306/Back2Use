import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';
import apiClient from './api';

// Google OAuth Service
export class GoogleAuthService {
  private static instance: GoogleAuthService;
  
  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  /**
   * Initiate Google OAuth login
   * This will open the browser to Google OAuth
   */
  async initiateGoogleLogin(): Promise<void> {
    try {
      console.log('Initiating Google OAuth login...');
      
      // Get API base URL from app config
      const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl || 'http://192.168.0.197:8000';
      
      // Generate device info for private IP
      const deviceId = `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const deviceName = 'Back2Use Mobile App';
      
      // Add device parameters to auth URL
      const authUrl = `${apiBaseUrl}/auth/google?device_id=${deviceId}&device_name=${encodeURIComponent(deviceName)}`;
      console.log('Opening Google OAuth URL:', authUrl);
      
      // Use the actual backend redirect URI
      const redirectUri = `${apiBaseUrl}/auth/google-redirect`;
      console.log('Redirect URI:', redirectUri);
      
      // Use the backend OAuth flow
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      );
      
      console.log('WebBrowser result:', result);
      
      if (result.type === 'success' && result.url) {
        await this.handleGoogleRedirect(result.url);
      } else if (result.type === 'cancel') {
        console.log('User cancelled Google OAuth');
      } else {
        console.log('Google OAuth failed or was dismissed');
        Alert.alert('Error', 'Google OAuth failed. Please try again.');
      }
    } catch (error) {
      console.error('Google OAuth login error:', error);
      Alert.alert('Error', 'Failed to initiate Google login. Please try again.');
    }
  }

  /**
   * Handle Google OAuth code
   * This processes the authorization code from Google
   */
  async handleGoogleCode(code: string): Promise<void> {
    try {
      console.log('Handling Google OAuth code:', code);
      
      // Get API base URL from app config
      const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl || 'http://192.168.0.197:8000';
      const processUrl = `${apiBaseUrl}/auth/google-redirect?code=${code}`;
      console.log('Processing OAuth code:', processUrl);
      
      try {
        const response = await apiClient.get(`/auth/google-redirect?code=${code}`);
        
        const contentType = response.headers['content-type'];
        console.log('Response content-type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
          const responseData = response.data;
          console.log('Google OAuth response:', responseData);
          
          if (responseData.success && responseData.data) {
            await this.handleSuccessfulLogin(responseData.data);
          } else {
            Alert.alert('Error', responseData.message || 'Google OAuth failed');
          }
        } else {
          // If response is HTML, it might be a redirect page
          const text = response.data;
          console.log('Response is HTML:', text.substring(0, 200) + '...');
          
          // For now, show a success message since the OAuth flow completed
          Alert.alert(
            'Success',
            'Google OAuth completed successfully! Please check your email for login details.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Navigate to login page to complete the process
                  setTimeout(() => {
                    router.replace('/auth/login');
                  }, 100);
                }
              }
            ]
          );
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        Alert.alert('Error', 'Failed to process Google OAuth. Please try again.');
      }
    } catch (error) {
      console.error('Google OAuth code error:', error);
      Alert.alert('Error', 'Failed to process Google OAuth code. Please try again.');
    }
  }

  /**
   * Handle Google OAuth redirect
   * This processes the callback from Google OAuth
   */
  async handleGoogleRedirect(url: string): Promise<void> {
    try {
      console.log('Handling Google OAuth redirect:', url);
      
      // Check if this is a successful redirect from backend
      if (url.includes('/auth/google-redirect')) {
        // Extract parameters from URL
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
        
        // Call the backend to process the code
        const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl || 'http://192.168.0.197:8000';
        const processUrl = `${apiBaseUrl}/auth/google-redirect?code=${code}`;
        console.log('Processing OAuth code:', processUrl);
        
        try {
          const response = await apiClient.get(`/auth/google-redirect?code=${code}`);
          
          const contentType = response.headers['content-type'];
          console.log('Response content-type:', contentType);
          
          if (contentType && contentType.includes('application/json')) {
            const responseData = response.data;
            console.log('Google OAuth response:', responseData);
            
            if (responseData.success && responseData.data) {
              await this.handleSuccessfulLogin(responseData.data);
            } else {
              Alert.alert('Error', responseData.message || 'Google OAuth failed');
            }
          } else {
            // If response is HTML, it might be a redirect page
            const text = response.data;
            console.log('Response is HTML:', text.substring(0, 200) + '...');
            
            // For now, show a success message since the OAuth flow completed
            Alert.alert(
              'Success',
              'Google OAuth completed successfully! Please check your email for login details.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // Navigate to login page to complete the process
                    setTimeout(() => {
                      router.replace('/auth/login');
                    }, 100);
                  }
                }
              ]
            );
          }
        } catch (fetchError) {
          console.error('Fetch error:', fetchError);
          Alert.alert('Error', 'Failed to process Google OAuth. Please try again.');
        }
      } else {
        console.log('Unexpected redirect URL:', url);
        Alert.alert('Error', 'Unexpected redirect URL received');
      }
    } catch (error) {
      console.error('Google OAuth redirect error:', error);
      Alert.alert('Error', 'Failed to process Google OAuth redirect. Please try again.');
    }
  }

  /**
   * Handle successful Google OAuth login
   */
  private async handleSuccessfulLogin(data: any): Promise<void> {
    try {
      const { accessToken, refreshToken, user } = data;
      
      if (accessToken && user) {
        console.log('Google OAuth successful:', { accessToken, user });
        
        // Determine user role
        const role = user.role || 'customer';
        
        Alert.alert(
          'Success',
          `Welcome ${user.name || user.email}! You have been logged in successfully.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to main app or dashboard
                console.log('User logged in successfully, navigating to:', `/(protected)/${role}`);
                // Delay navigation to ensure app is ready
                setTimeout(() => {
                  router.replace(`/(protected)/${role}`);
                }, 100);
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to get user data from Google OAuth');
      }
    } catch (error) {
      console.error('Handle successful login error:', error);
      Alert.alert('Error', 'Failed to process login data. Please try again.');
    }
  }

  /**
   * Check if Google OAuth is available
   */
  async isGoogleAuthAvailable(): Promise<boolean> {
    try {
      // Test if the Google OAuth endpoint is accessible
      const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl || 'http://192.168.0.197:8000';
      const response = await apiClient.head('/auth/google');
      return response.status === 200;
    } catch (error) {
      console.error('Google OAuth not available:', error);
      return false;
    }
  }
}

// Export singleton instance
export const googleAuthService = GoogleAuthService.getInstance();
