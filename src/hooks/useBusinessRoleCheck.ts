import { useEffect, useState, useRef } from 'react';
import { router, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { businessApi } from '@/services/api/businessService';
import { getCurrentUserProfileWithAutoRefresh } from '@/services/api/userService';
import { useAuth } from '../../context/AuthProvider';

const STORAGE_KEYS = {
  BUSINESS_WELCOME_SHOWN: 'BUSINESS_WELCOME_SHOWN',
  LAST_ROLE_CHECK: 'LAST_ROLE_CHECK',
};

const ROLE_CHECK_INTERVAL = 10000; // Check every 10 seconds when on customer screens
const ROLE_CHECK_DELAY = 2000; // Initial delay of 2 seconds

/**
 * Hook to check if user's business registration has been approved
 * and automatically switch role from customer to business
 */
export function useBusinessRoleCheck() {
  const { state: authState, actions: authActions } = useAuth();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(false);
  const [shouldShowWelcome, setShouldShowWelcome] = useState(false);
  const [hasCheckedOnce, setHasCheckedOnce] = useState(false);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isNavigatingRef = useRef(false);

  /**
   * Check business registration status and update role if approved
   */
  const checkBusinessStatus = async (showWelcome = true) => {
    // Only check if user is currently a customer and authenticated
    if (authState.role !== 'customer' || !authState.isAuthenticated) {
      return false;
    }

    // Don't check if already navigating
    if (isNavigatingRef.current) {
      return false;
    }

    try {
      setIsChecking(true);
      console.log('🔍 Checking business registration status...');

      // Method 1: Check user profile directly (most reliable)
      try {
        const updatedUser = await getCurrentUserProfileWithAutoRefresh();
        
        if (updatedUser.role === 'business') {
          console.log('✅ User role is business! Updating auth state...');
          
          // Update role in auth state
          await authActions.updateRole('business');
          
          // Wait a bit for auth state to update
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Don't set welcome modal flag here - let business dashboard handle it
          // This ensures the modal shows after navigation is complete
          
          // Navigate to business dashboard immediately
          console.log('🚀 Navigating to business dashboard...');
          isNavigatingRef.current = true;
          router.replace('/(protected)/business');
          
          return true;
        }
      } catch (error) {
        console.error('❌ Error fetching user profile:', error);
      }

      // Method 2: Check business registration history as fallback
      try {
        const historyResponse = await businessApi.getHistory({ status: 'approved', page: 1, limit: 1 });
        
        if (historyResponse.data && historyResponse.data.length > 0) {
          const approvedForm = historyResponse.data[0];
          
          if (approvedForm.status === 'approved') {
            console.log('✅ Business registration approved! Refreshing user profile...');
            
            // Refresh user profile to get updated role from backend
            const updatedUser = await getCurrentUserProfileWithAutoRefresh();
            
            if (updatedUser.role === 'business') {
              console.log('✅ User role updated to business, updating auth state...');
              
              // Update role in auth state
              await authActions.updateRole('business');
              
              // Wait a bit for auth state to update
              await new Promise(resolve => setTimeout(resolve, 300));
              
              // Mark that welcome modal should be shown (dashboard will check this)
              const welcomeShown = await AsyncStorage.getItem(STORAGE_KEYS.BUSINESS_WELCOME_SHOWN);
              if (!welcomeShown && showWelcome) {
                // Don't set flag here, let dashboard handle it to ensure it shows after navigation
                // Just ensure the flag is not set yet so dashboard knows to show it
              }
              
              // Navigate to business dashboard immediately
              console.log('🚀 Navigating to business dashboard...');
              isNavigatingRef.current = true;
              router.replace('/(protected)/business');
              
              return true;
            }
          }
        }
      } catch (error: any) {
        // Silently handle 502 errors (server unavailable)
        if (error?.response?.status === 502 || error?.message === 'SERVER_UNAVAILABLE') {
          // Don't log 502 errors
          return false;
        }
        // Silently handle Unauthorized errors (user not authenticated or no permission)
        if (error?.response?.status === 401 || 
            error?.message?.toLowerCase().includes('unauthorized') ||
            error?.message?.toLowerCase().includes('unauthorized')) {
          // Don't log or show Unauthorized errors
          return false;
        }
        console.error('❌ Error checking business history:', error);
      }

      return false;
    } catch (error) {
      console.error('❌ Error checking business status:', error);
      return false;
    } finally {
      setIsChecking(false);
      setHasCheckedOnce(true);
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_ROLE_CHECK, Date.now().toString());
    }
  };

  /**
   * Force refresh user profile and check role
   */
  const refreshUserRole = async () => {
    try {
      if (!authState.isAuthenticated) {
        return;
      }

      // Refresh user role from backend
      const result = await authActions.refreshUserRole();
      
      if (result && result.role === 'business' && authState.role === 'customer') {
        console.log('🔄 Role changed to business! Navigating...');
        
        // Update role in auth state
        await authActions.updateRole('business');
        
        // Wait a bit for auth state to update
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Mark that welcome modal should be shown (dashboard will check this)
        // Don't set flag here, let dashboard handle it to ensure it shows after navigation
        
        // Navigate to business dashboard
        isNavigatingRef.current = true;
        router.replace('/(protected)/business');
      }
    } catch (error) {
      console.error('❌ Error refreshing user role:', error);
    }
  };

  // Auto-check role when on customer screens
  useEffect(() => {
    // Only check if user is customer and on customer screens
    if (authState.role !== 'customer' || !authState.isAuthenticated) {
      return;
    }

    // Only check if on customer screens
    const isOnCustomerScreen = pathname?.includes('/customer');
    if (!isOnCustomerScreen) {
      return;
    }

    // Clear existing interval
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }

    // Initial check after delay
    const initialTimeout = setTimeout(() => {
      checkBusinessStatus(true);
    }, ROLE_CHECK_DELAY);

    // Set up periodic checking
    checkIntervalRef.current = setInterval(() => {
      checkBusinessStatus(true);
    }, ROLE_CHECK_INTERVAL);

    // Cleanup
    return () => {
      clearTimeout(initialTimeout);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [authState.role, authState.isAuthenticated, pathname]);

  // Reset navigation flag when role changes
  useEffect(() => {
    if (authState.role === 'business') {
      isNavigatingRef.current = false;
    }
  }, [authState.role]);

  return {
    checkBusinessStatus,
    refreshUserRole,
    isChecking,
    shouldShowWelcome,
    setShouldShowWelcome,
    hasCheckedOnce,
  };
}

