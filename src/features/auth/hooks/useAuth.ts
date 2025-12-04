import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { authApi } from "../../../services/api/authService";
import { Role, User } from "../../../types/auth.types";

type AuthState = {
  isAuthenticated: boolean;
  role: Role | null;
  isHydrated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: number | null;
  user: User | null;
};

const STORAGE_KEYS = {
  BYPASS: "AUTH_BYPASS",
  ROLE: "AUTH_ROLE",
  AUTH: "AUTH_IS_AUTHENTICATED",
  ACCESS_TOKEN: "ACCESS_TOKEN",
  REFRESH_TOKEN: "REFRESH_TOKEN",
  TOKEN_EXPIRY: "TOKEN_EXPIRY",
};

// Helper functions - only real token refresh from server

const refreshAccessToken = async (refreshToken: string) => {
  try {
    console.log("🔄 Refreshing access token...");
    const response = await authApi.refreshToken(refreshToken);
    
    // Accept multiple success formats from server
    const successByFlag = (response as any)?.success === true;
    const successByStatus = (response as any)?.statusCode === 200;
    const successByMessage = typeof (response as any)?.message === 'string' && /success|thành công|refreshed/i.test((response as any).message);
    const isSuccess = successByFlag || successByStatus || successByMessage;

    if (isSuccess && (response as any)?.data) {
      const { accessToken, refreshToken: newRefreshToken, user } = (response as any).data;
      
      // Save new tokens
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken || '');
      if (newRefreshToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
      }
      
      // Calculate new expiry time (assuming 1 hour from now)
      const newExpiry = Date.now() + (60 * 60 * 1000); // 1 hour
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, newExpiry.toString());
      
      console.log("✅ Token refreshed successfully");
      return {
        accessToken,
        refreshToken: newRefreshToken || refreshToken,
        expiry: newExpiry,
        user
      };
    } else {
      console.error("❌ Token refresh failed:", (response as any)?.message || 'Unknown message');
      return null;
    }
  } catch (error) {
    console.error("❌ Error refreshing token:", error);
    return null;
  }
};

const clearAuthData = async () => {
  console.log("Clearing auth data");
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.ROLE),
    AsyncStorage.removeItem(STORAGE_KEYS.AUTH),
    AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
    AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
    AsyncStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY),
  ]);
};

const clearFakeTokens = async () => {
  console.log("🧹 Clearing all tokens and forcing logout");
  await clearAuthData();
};

// Check if token is expired or about to expire (within 5 minutes)
const isTokenExpired = (expiry: number | null) => {
  if (!expiry) return true;
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
  return now >= (expiry - fiveMinutes);
};

// Auto refresh token if needed
const checkAndRefreshToken = async (state: AuthState) => {
  if (!state.isAuthenticated || !state.refreshToken || !state.tokenExpiry) {
    return state;
  }

  if (isTokenExpired(state.tokenExpiry)) {
    console.log("⚠️ Token expired or about to expire, refreshing...");
    const refreshResult = await refreshAccessToken(state.refreshToken);
    
    if (refreshResult) {
      return {
        ...state,
        accessToken: refreshResult.accessToken,
        refreshToken: refreshResult.refreshToken,
        tokenExpiry: refreshResult.expiry,
        user: refreshResult.user || state.user,
      };
    } else {
      console.log("❌ Token refresh failed, logging out");
      await clearAuthData();
      return {
        ...state,
        isAuthenticated: false,
        role: null,
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null,
        user: null,
      };
    }
  }

  return state;
};

export function useAuthCore() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    isHydrated: false,
    accessToken: null,
    refreshToken: null,
    tokenExpiry: null,
    user: null,
  });

  // Hydrate auth state from storage on mount
  useEffect(() => {
    const hydrateAuth = async () => {
      try {
        console.log("🔄 Hydrating auth state...");
        
        const [
          storedAuth,
          storedRole,
          storedAccessToken,
          storedRefreshToken,
          storedTokenExpiry,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.AUTH),
          AsyncStorage.getItem(STORAGE_KEYS.ROLE),
          AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY),
        ]);

        console.log("📦 Stored auth data:", {
          auth: storedAuth,
          role: storedRole,
          hasAccessToken: !!storedAccessToken,
          hasRefreshToken: !!storedRefreshToken,
          tokenExpiry: storedTokenExpiry,
        });

        const isAuthenticated = storedAuth === "true";
        const role = storedRole as Role | null;
        const accessToken = storedAccessToken;
        const refreshToken = storedRefreshToken;
        const tokenExpiry = storedTokenExpiry ? parseInt(storedTokenExpiry, 10) : null;

        if (isAuthenticated && accessToken && refreshToken && tokenExpiry) {
          console.log("✅ Found valid auth data, checking token expiry...");
          
          // Check if token needs refresh
          let updatedState = await checkAndRefreshToken({
            isAuthenticated,
            role,
            isHydrated: true,
            accessToken,
            refreshToken,
            tokenExpiry,
            user: null,
          });

          // Refresh user role from backend to ensure we have latest role
          // This is important when business registration was approved while user was offline
          if (updatedState.isAuthenticated && updatedState.accessToken) {
            try {
              const { getCurrentUserProfile } = await import('../../../services/api/userService');
              const userProfile = await getCurrentUserProfile(updatedState.accessToken);
              const backendRole = userProfile?.role as Role;
              
              if (backendRole) {
                // Block admin access on mobile - clear auth if admin
                if (backendRole === 'admin') {
                  console.log("❌ Admin role detected on hydration - clearing auth and blocking access");
                  // Clear auth storage
                  await clearAuthData();
                  // Set state to unauthenticated
                  setState({
                    isAuthenticated: false,
                    role: null,
                    isHydrated: true,
                    accessToken: null,
                    refreshToken: null,
                    tokenExpiry: null,
                    user: null,
                  });
                  return; // Exit early, don't set authenticated state
                }
                
                // Always update role from backend to ensure we have the latest
                if (backendRole !== updatedState.role) {
                  console.log(`🔄 Role updated on hydration! Stored: ${updatedState.role}, Backend: ${backendRole}`);
                } else {
                  console.log(`✅ Role confirmed on hydration: ${backendRole}`);
                }
                // Always update role in storage and state to ensure consistency
                await AsyncStorage.setItem(STORAGE_KEYS.ROLE, backendRole);
                updatedState.role = backendRole;
                updatedState.user = userProfile as User;
              }
            } catch (error) {
              console.error("❌ Error refreshing role on hydration:", error);
              // Continue with stored role if refresh fails
              // But still check if stored role is admin and block it
              if (updatedState.role === 'admin') {
                console.log("❌ Admin role detected in storage on hydration - clearing auth");
                await clearAuthData();
                setState({
                  isAuthenticated: false,
                  role: null,
                  isHydrated: true,
                  accessToken: null,
                  refreshToken: null,
                  tokenExpiry: null,
                  user: null,
                });
                return;
              }
            }
          } else {
            // If we have stored role but no token, check if role is admin
            if (role === 'admin') {
              console.log("❌ Admin role detected in storage but no valid token - clearing auth");
              await clearAuthData();
              setState({
                isAuthenticated: false,
                role: null,
                isHydrated: true,
                accessToken: null,
                refreshToken: null,
                tokenExpiry: null,
                user: null,
              });
              return;
            }
          }

          setState(updatedState);
        } else {
          console.log("❌ No valid auth data found");
          setState({
            isAuthenticated: false,
            role: null,
            isHydrated: true,
            accessToken: null,
            refreshToken: null,
            tokenExpiry: null,
            user: null,
          });
        }
      } catch (error) {
        console.error("❌ Error hydrating auth state:", error);
        setState({
          isAuthenticated: false,
          role: null,
          isHydrated: true,
          accessToken: null,
          refreshToken: null,
          tokenExpiry: null,
          user: null,
        });
      }
    };

    hydrateAuth();
  }, []);

  // Auto refresh token periodically
  useEffect(() => {
    if (!state.isAuthenticated || !state.refreshToken || !state.tokenExpiry) {
      return;
    }

    const interval = setInterval(async () => {
      console.log("🔄 Periodic token check...");
      const updatedState = await checkAndRefreshToken(state);
      if (updatedState !== state) {
        setState(updatedState);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [state.isAuthenticated, state.refreshToken, state.tokenExpiry]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      console.log("🔐 Attempting login...");
      const response = await authApi.login({ username, password });
      
      console.log("📥 Login response:", {
        statusCode: response.statusCode,
        message: response.message,
        hasData: !!response.data,
        hasAccessToken: !!response.data?.accessToken,
        hasUser: !!response.data?.user,
      });

      // Handle different response formats
      let accessToken: string | null = null;
      let refreshToken: string | null = null;
      let user: any = null;
      let role: Role | null = null;

      if (response.data) {
        accessToken = response.data.accessToken || null;
        refreshToken = response.data.refreshToken || null;
        user = response.data.user || null;
        role = user?.role as Role || null;
      }

      // Fallback to legacy format
      if (!accessToken && (response as any).user) {
        user = (response as any).user;
        role = user?.role as Role || null;
        accessToken = (response as any).accessToken || null;
      }

      if (!accessToken) {
        throw new Error(response.message || "No access token received");
      }

      // If role is not in response, try to fetch from user profile
      if (!role && accessToken) {
        try {
          const { getCurrentUserProfile } = await import('../../../services/api/userService');
          const userProfile = await getCurrentUserProfile(accessToken);
          role = userProfile?.role as Role || null;
          user = userProfile;
          console.log("📥 Fetched user profile, role:", role);
        } catch (error) {
          console.error("❌ Error fetching user profile:", error);
          // Continue with role from login response
        }
      }

      // Block admin login on mobile - throw error before saving tokens
      if (role === 'admin') {
        console.log("❌ useAuth: Admin login attempted on mobile - blocking access");
        throw new Error("Tài khoản Admin không thể đăng nhập trên ứng dụng di động. Vui lòng đăng nhập trên nền tảng web.");
      }

      // Calculate token expiry (1 hour from now)
      const tokenExpiry = Date.now() + (60 * 60 * 1000);

      // Save to storage
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.AUTH, "true"),
        AsyncStorage.setItem(STORAGE_KEYS.ROLE, role || ""),
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken || ""),
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, tokenExpiry.toString()),
      ]);

      console.log("✅ Login successful, tokens saved, role:", role);

      setState({
        isAuthenticated: true,
        role,
        isHydrated: true,
        accessToken,
        refreshToken,
        tokenExpiry,
        user: user as User | null,
      });

      return { success: true, user, role };
    } catch (error: any) {
      const errorMessage = error?.message || "Login failed";
      
      // Silently handle "Invalid username or password" errors - don't log
      const isInvalidCredentials = errorMessage.toLowerCase().includes('invalid username') || 
                                   errorMessage.toLowerCase().includes('invalid password') ||
                                   errorMessage.toLowerCase().includes('invalid username or password');
      
      // Silently handle "SERVER_UNAVAILABLE" errors - don't log
      const isServerUnavailable = errorMessage === 'SERVER_UNAVAILABLE' || 
                                  errorMessage.toLowerCase().includes('server unavailable');
      
      if (!isInvalidCredentials && !isServerUnavailable) {
        console.error("❌ Login failed:", error);
      }
      
      throw new Error(errorMessage);
    }
  }, []);

  const register = useCallback(async (userData: any) => {
    try {
      console.log("📝 Attempting registration...");
      const response = await authApi.register(userData);
      
      if (response.success) {
        console.log("✅ Registration successful");
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message || "Registration failed");
      }
    } catch (error: any) {
      console.error("❌ Registration failed:", error);
      throw new Error(error.message || "Registration failed");
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log("🚪 Logging out...");
      await clearAuthData();
      
      setState({
        isAuthenticated: false,
        role: null,
        isHydrated: true,
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null,
        user: null,
      });
      
      console.log("✅ Logout successful");
    } catch (error) {
      console.error("❌ Error during logout:", error);
    }
  }, []);

  const getCurrentAccessToken = useCallback(async () => {
    if (!state.isAuthenticated) {
      return null;
    }

    // Always get the latest token from AsyncStorage to ensure we have the most recent one
    // This is important after role switching
    try {
      const latestToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (latestToken && latestToken !== state.accessToken) {
        console.log('🔄 Token in AsyncStorage differs from state, updating state...');
        // Update state with latest token from storage
        setState(prev => ({
          ...prev,
          accessToken: latestToken,
        }));
        return latestToken;
      }
    } catch (error) {
      console.warn('⚠️ Error getting token from AsyncStorage, using state token:', error);
    }

    // Fallback to state token if AsyncStorage read fails
    if (!state.accessToken) {
      return null;
    }

    // Check if token needs refresh
    if (state.tokenExpiry && isTokenExpired(state.tokenExpiry)) {
      console.log("🔄 Token expired, refreshing...");
      const updatedState = await checkAndRefreshToken(state);
      if (updatedState !== state) {
        setState(updatedState);
        return updatedState.accessToken;
      }
    }

    return state.accessToken;
  }, [state]);

  /**
   * Update role and refresh session
   * Used when business registration is approved
   */
  const updateRole = useCallback(async (newRole: Role) => {
    try {
      console.log(`🔄 Updating role to: ${newRole}`);
      
      // Update role in storage
      await AsyncStorage.setItem(STORAGE_KEYS.ROLE, newRole);
      
      // Update state
      setState(prev => ({
        ...prev,
        role: newRole,
      }));
      
      console.log(`✅ Role updated to: ${newRole}`);
    } catch (error) {
      console.error('❌ Error updating role:', error);
    }
  }, []);

  /**
   * Switch role with new tokens
   * Used when switching between customer and business roles
   */
  const switchRoleWithTokens = useCallback(async (
    newRole: Role,
    accessToken: string,
    refreshToken: string,
    tokenExpiry: number,
    user?: User | null
  ) => {
    try {
      console.log(`🔄 Switching role to: ${newRole} with new tokens`);
      console.log(`🔑 New token preview: ${accessToken.substring(0, 20)}...`);
      
      // Save tokens to storage FIRST (before updating state)
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, tokenExpiry.toString());
      await AsyncStorage.setItem(STORAGE_KEYS.ROLE, newRole);
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      
      console.log(`✅ Tokens saved to AsyncStorage`);
      
      // Verify token was saved correctly
      const savedToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (savedToken !== accessToken) {
        console.error('❌ Token mismatch! Saved token does not match new token');
        throw new Error('Failed to save new token');
      }
      console.log(`✅ Verified token saved correctly`);
      
      // Update state with new tokens and role
      setState(prev => ({
        ...prev,
        role: newRole,
        accessToken: accessToken,
        refreshToken: refreshToken,
        tokenExpiry: tokenExpiry,
        user: user || prev.user,
        isAuthenticated: true,
      }));
      
      console.log(`✅ Auth state updated with new tokens and role: ${newRole}`);
      
      // Small delay to ensure all updates are propagated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log(`✅ Role switched to: ${newRole} with new tokens - COMPLETE`);
    } catch (error) {
      console.error('❌ Error switching role with tokens:', error);
      throw error;
    }
  }, []);

  /**
   * Refresh user profile and update role from backend
   */
  const refreshUserRole = useCallback(async () => {
    try {
      if (!state.isAuthenticated || !state.accessToken) {
        return null;
      }

      // Try to get user profile directly first
      try {
        const { getCurrentUserProfile } = await import('../../../services/api/userService');
        const userProfile = await getCurrentUserProfile(state.accessToken);
        const newRole = userProfile?.role as Role;
        
        if (newRole && newRole !== state.role) {
          console.log(`🔄 Role changed from ${state.role} to ${newRole}`);
          await updateRole(newRole);
          return { role: newRole, user: userProfile };
        }
        
        return { role: newRole, user: userProfile };
      } catch (error) {
        console.error('❌ Error fetching user profile:', error);
      }

      // Fallback: Refresh token to get updated user data
      if (state.refreshToken) {
        const refreshResult = await refreshAccessToken(state.refreshToken);
        
        if (refreshResult && refreshResult.user) {
          const newRole = refreshResult.user.role as Role;
          
          if (newRole && newRole !== state.role) {
            console.log(`🔄 Role changed from ${state.role} to ${newRole}`);
            await updateRole(newRole);
          }
          
          return { role: newRole, user: refreshResult.user };
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error refreshing user role:', error);
      return null;
    }
  }, [state.isAuthenticated, state.accessToken, state.refreshToken, state.role, updateRole]);

  const actions = useMemo(() => ({
    login,
    register,
    logout,
    getCurrentAccessToken,
    updateRole,
    refreshUserRole,
    switchRoleWithTokens,
  }), [login, register, logout, getCurrentAccessToken, updateRole, refreshUserRole, switchRoleWithTokens]);

  return {
    state,
    actions,
  };
}

export type { Role };

