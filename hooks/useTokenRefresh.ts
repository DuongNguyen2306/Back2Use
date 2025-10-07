import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthProvider';

export const useTokenRefresh = () => {
  const { state, actions } = useAuth();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!state.isAuthenticated || !state.tokenExpiry) {
      return;
    }

    // Clear existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Calculate time until token expires (refresh 1 minute before expiry)
    const timeUntilExpiry = state.tokenExpiry - Date.now();
    const refreshTime = Math.max(timeUntilExpiry - 60000, 0); // 1 minute before expiry

    console.log(`Token will refresh in ${Math.round(refreshTime / 1000)} seconds`);

    // Set timeout to refresh token
    refreshTimeoutRef.current = setTimeout(async () => {
      console.log('Auto-refreshing token...');
      const success = await actions.refreshToken();
      if (!success) {
        console.log('Auto token refresh failed');
      }
    }, refreshTime);

    // Cleanup function
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [state.isAuthenticated, state.tokenExpiry, actions.refreshToken]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);
};
