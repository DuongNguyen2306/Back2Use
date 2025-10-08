import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";

export type Role = "customer" | "business" | "admin";

type AuthState = {
  isAuthenticated: boolean;
  role: Role | null;
  isHydrated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: number | null;
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
    // TODO: Implement real token refresh API call
    console.log("Token refresh not implemented yet - using refreshToken:", refreshToken);
    return null;
  } catch (error) {
    console.error("Error refreshing token:", error);
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

export function useAuthCore() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    isHydrated: false,
    accessToken: null,
    refreshToken: null,
    tokenExpiry: null,
  });

  useEffect(() => {
    (async () => {
      try {
        const [roleStr, authStr, accessToken, refreshToken, tokenExpiryStr] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.ROLE),
          AsyncStorage.getItem(STORAGE_KEYS.AUTH),
          AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY),
        ]);
        
        console.log("Loading auth state from storage:", {
          roleStr,
          authStr,
          accessToken: accessToken ? "***" + accessToken.slice(-8) : null,
          refreshToken: refreshToken ? "***" + refreshToken.slice(-8) : null,
          tokenExpiryStr
        });
        
        // Additional logging for refreshToken
        console.log("RefreshToken details:");
        console.log("- Raw value:", refreshToken);
        console.log("- Type:", typeof refreshToken);
        console.log("- Length:", refreshToken?.length || 0);
        
        const isAuthenticated = authStr === "true";
        const role = roleStr as Role | null;
        const tokenExpiry = tokenExpiryStr ? parseInt(tokenExpiryStr) : null;
        
        // Check if token is expired
        const isTokenExpired = tokenExpiry ? Date.now() > tokenExpiry : true;
        console.log("Token expiry check:", {
          currentTime: Date.now(),
          tokenExpiry: tokenExpiry,
          isTokenExpired: isTokenExpired,
          timeUntilExpiry: tokenExpiry ? tokenExpiry - Date.now() : 'No expiry'
        });
        
        console.log("Token validation:", {
          hasAccessToken: !!accessToken,
          accessTokenPrefix: accessToken ? accessToken.substring(0, 10) + '...' : 'None'
        });
        
        if (isAuthenticated && accessToken && !isTokenExpired) {
          // User is authenticated with valid token
          setState((prev) => ({
            ...prev,
            isAuthenticated: true,
            role,
            accessToken,
            refreshToken,
            tokenExpiry,
            isHydrated: true,
          }));
          console.log("Restored authenticated state with token");
        } else if (isAuthenticated && refreshToken && isTokenExpired) {
          // Try to refresh token
          console.log("Token expired, attempting refresh...");
          const refreshed = await refreshAccessToken(refreshToken);
          if (refreshed) {
            setState((prev) => ({
              ...prev,
              isAuthenticated: true,
              role,
              accessToken: refreshed.accessToken,
              refreshToken: refreshed.refreshToken,
              tokenExpiry: refreshed.expiry,
              isHydrated: true,
            }));
            console.log("Token refreshed successfully");
          } else {
            // Refresh failed, sign out
            await clearAuthData();
            setState((prev) => ({
              ...prev,
              isAuthenticated: false,
              role: null,
              accessToken: null,
              refreshToken: null,
              tokenExpiry: null,
              isHydrated: true,
            }));
            console.log("Token refresh failed, signed out");
          }
        } else {
          // No valid auth data - clear everything and require login
          await clearAuthData();
          setState((prev) => ({
            ...prev,
            isAuthenticated: false,
            role: null,
            accessToken: null,
            refreshToken: null,
            tokenExpiry: null,
            isHydrated: true,
          }));
          console.log("No valid auth data found, cleared all auth data");
        }
      } catch (error) {
        console.error("Error loading auth state:", error);
        setState((prev) => ({ ...prev, isHydrated: true }));
      }
    })();
  }, []);

  const persist = useCallback(async (next: Partial<AuthState>) => {
    console.log("Persisting auth state:", {
      isAuthenticated: next.isAuthenticated,
      role: next.role,
      accessToken: next.accessToken ? '***' + next.accessToken.slice(-8) : null,
      refreshToken: next.refreshToken ? '***' + next.refreshToken.slice(-8) : null,
      tokenExpiry: next.tokenExpiry
    });
    
    const promises = [];
    if (next.role !== undefined) {
      if (next.role) {
        promises.push(AsyncStorage.setItem(STORAGE_KEYS.ROLE, next.role));
      } else {
        promises.push(AsyncStorage.removeItem(STORAGE_KEYS.ROLE));
      }
    }
    if (next.isAuthenticated !== undefined) {
      promises.push(AsyncStorage.setItem(STORAGE_KEYS.AUTH, String(next.isAuthenticated)));
    }
    if (next.accessToken !== undefined) {
      if (next.accessToken) {
        promises.push(AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, next.accessToken));
      } else {
        promises.push(AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN));
      }
    }
    if (next.refreshToken !== undefined) {
      if (next.refreshToken && next.refreshToken !== null) {
        console.log("Saving refreshToken to storage:", '***' + next.refreshToken.slice(-8));
        promises.push(AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, next.refreshToken));
      } else {
        console.log("Removing refreshToken from storage");
        promises.push(AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN));
      }
    }
    if (next.tokenExpiry !== undefined) {
      if (next.tokenExpiry) {
        promises.push(AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, String(next.tokenExpiry)));
      } else {
        promises.push(AsyncStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY));
      }
    }
    
    await Promise.all(promises);
    console.log("Auth state persisted successfully");
  }, []);

  // signIn function removed - only use signInWithTokens for real tokens

  const signInWithTokens = useCallback(async ({ 
    accessToken, 
    refreshToken, 
    role, 
    tokenExpiry 
  }: { 
    accessToken: string; 
    refreshToken?: string | null; 
    role?: Role; 
    tokenExpiry?: number;
  }) => {
    console.log("signInWithTokens called with:");
    console.log("- accessToken:", accessToken ? '***' + accessToken.slice(-8) : 'None');
    console.log("- refreshToken:", refreshToken ? '***' + refreshToken.slice(-8) : 'None');
    console.log("- role:", role);
    console.log("- tokenExpiry:", tokenExpiry);
    
    // Ensure refreshToken is properly handled
    const finalRefreshToken = refreshToken || null;
    console.log("- finalRefreshToken:", finalRefreshToken ? '***' + finalRefreshToken.slice(-8) : 'null');
    
    const next: Partial<AuthState> = {
      isAuthenticated: true,
      role: role ?? "customer",
      accessToken,
      refreshToken: finalRefreshToken,
      tokenExpiry: tokenExpiry || (Date.now() + 15 * 60 * 1000), // 15 minutes default
    };
    console.log("Setting auth state with real tokens");
    setState((prev) => ({ ...prev, ...next }));
    await persist(next);
    console.log("Real auth tokens persisted successfully");
  }, [persist]);

  const signOut = useCallback(async () => {
    const next: Partial<AuthState> = {
      isAuthenticated: false,
      role: null,
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
    };
    setState((prev) => ({ ...prev, ...next }));
    await persist(next);
    console.log("User signed out, all tokens cleared");
  }, [persist]);

  // Bypass mode removed - only real authentication allowed

  const refreshToken = useCallback(async () => {
    if (!state.refreshToken) {
      console.log("No refresh token available");
      return false;
    }

    console.log("Attempting to refresh token...");
    const newTokens = await refreshAccessToken(state.refreshToken);
    
    if (newTokens) {
      const next: Partial<AuthState> = {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        tokenExpiry: newTokens.expiry,
      };
      setState((prev) => ({ ...prev, ...next }));
      await persist(next);
      console.log("Token refreshed successfully");
      return true;
    } else {
      console.log("Token refresh failed, signing out");
      await signOut();
      return false;
    }
  }, [state.refreshToken, persist, signOut]);

  const isTokenExpired = useCallback(() => {
    if (!state.tokenExpiry) return true;
    return Date.now() > state.tokenExpiry;
  }, [state.tokenExpiry]);

  return useMemo(() => ({ 
    state, 
    actions: { 
      signInWithTokens,
      signOut, 
      refreshToken,
      isTokenExpired,
      clearFakeTokens
    } 
  }), [state, signInWithTokens, signOut, refreshToken, isTokenExpired]);
}


