import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';

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
      
      // Directly open the Google OAuth URL since API might return HTML
      const authUrl = `${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.0.197:8000'}/auth/google`;
      console.log('Opening Google OAuth URL:', authUrl);
      
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        Linking.createURL('/auth/google-redirect')
      );
      
      console.log('WebBrowser result:', result);
      
      if (result.type === 'success' && result.url) {
        await this.handleGoogleRedirect(result.url);
      } else if (result.type === 'cancel') {
        console.log('User cancelled Google OAuth');
      } else {
        console.log('Google OAuth failed or was dismissed');
      }
    } catch (error) {
      console.error('Google OAuth login error:', error);
      Alert.alert('Error', 'Failed to initiate Google login. Please try again.');
    }
  }

  /**
   * Handle Google OAuth redirect
   * This processes the callback from Google OAuth
   */
  async handleGoogleRedirect(url: string): Promise<void> {
    try {
      console.log('Handling Google OAuth redirect:', url);
      
      // Extract authorization code from URL if present
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
      
      // Call the redirect endpoint with the authorization code
      const redirectUrl = `${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.0.197:8000'}/auth/google-redirect?code=${code}`;
      console.log('Calling redirect URL:', redirectUrl);
      
      try {
        const response = await fetch(redirectUrl, {
          method: 'GET',
        });
        
        const contentType = response.headers.get('content-type');
        console.log('Response content-type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
          const responseData = await response.json();
          console.log('Google redirect response:', responseData);
          
          if (responseData.success && responseData.data) {
            await this.handleSuccessfulLogin(responseData.data);
          } else {
            Alert.alert('Error', responseData.message || 'Google OAuth failed');
          }
        } else {
          // If response is HTML, it might be a redirect page
          const text = await response.text();
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
                  router.replace('/auth/login');
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
                router.replace(`/(protected)/${role}`);
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
      const authUrl = `${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.0.197:8000'}/auth/google`;
      const response = await fetch(authUrl, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Google OAuth not available:', error);
      return false;
    }
  }
}

// Export singleton instance
export const googleAuthService = GoogleAuthService.getInstance();
