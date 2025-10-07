import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";

export type Role = "customer" | "business" | "admin";

type AuthState = {
  isAuthenticated: boolean;
  role: Role | null;
  bypassAuth: boolean;
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

// Helper functions
const generateTokens = () => {
  const accessToken = `access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const refreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const expiry = Date.now() + (15 * 60 * 1000); // 15 minutes
  return { accessToken, refreshToken, expiry };
};

const refreshAccessToken = async (refreshToken: string) => {
  try {
    // Simulate API call to refresh token
    console.log("Refreshing token with:", refreshToken);
    
    // Mock API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate 90% success rate
    if (Math.random() > 0.1) {
      const newTokens = generateTokens();
      console.log("Token refresh successful");
      return newTokens;
    } else {
      console.log("Token refresh failed");
      return null;
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
};

const clearAuthData = async () => {
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.BYPASS),
    AsyncStorage.removeItem(STORAGE_KEYS.ROLE),
    AsyncStorage.removeItem(STORAGE_KEYS.AUTH),
    AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
    AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
    AsyncStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY),
  ]);
};

export function useAuthCore() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    bypassAuth: false,
    isHydrated: false,
    accessToken: null,
    refreshToken: null,
    tokenExpiry: null,
  });

  useEffect(() => {
    (async () => {
      try {
        const [bypassStr, roleStr, authStr, accessToken, refreshToken, tokenExpiryStr] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.BYPASS),
          AsyncStorage.getItem(STORAGE_KEYS.ROLE),
          AsyncStorage.getItem(STORAGE_KEYS.AUTH),
          AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY),
        ]);
        
        console.log("Loading auth state from storage:", {
          bypassStr,
          roleStr,
          authStr,
          accessToken: accessToken ? "***" : null,
          refreshToken: refreshToken ? "***" : null,
          tokenExpiryStr
        });
        
        const isAuthenticated = authStr === "true";
        const role = roleStr as Role | null;
        const bypassAuth = bypassStr === "true";
        const tokenExpiry = tokenExpiryStr ? parseInt(tokenExpiryStr) : null;
        
        // Check if token is expired
        const isTokenExpired = tokenExpiry ? Date.now() > tokenExpiry : true;
        
        if (isAuthenticated && accessToken && refreshToken && !isTokenExpired) {
          // User is authenticated with valid token
          setState((prev) => ({
            ...prev,
            isAuthenticated: true,
            role,
            bypassAuth,
            accessToken,
            refreshToken,
            tokenExpiry,
            isHydrated: true,
          }));
          console.log("Restored authenticated state");
        } else if (isAuthenticated && refreshToken && isTokenExpired) {
          // Try to refresh token
          console.log("Token expired, attempting refresh...");
          const refreshed = await refreshAccessToken(refreshToken);
          if (refreshed) {
            setState((prev) => ({
              ...prev,
              isAuthenticated: true,
              role,
              bypassAuth,
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
              bypassAuth: false,
              accessToken: null,
              refreshToken: null,
              tokenExpiry: null,
              isHydrated: true,
            }));
            console.log("Token refresh failed, signed out");
          }
        } else {
          // No valid auth data
          setState((prev) => ({
            ...prev,
            isAuthenticated: false,
            role: null,
            bypassAuth: false,
            accessToken: null,
            refreshToken: null,
            tokenExpiry: null,
            isHydrated: true,
          }));
          console.log("No valid auth data found");
        }
      } catch (error) {
        console.error("Error loading auth state:", error);
        setState((prev) => ({ ...prev, isHydrated: true }));
      }
    })();
  }, []);

  const persist = useCallback(async (next: Partial<AuthState>) => {
    const promises = [];
    
    if (next.bypassAuth !== undefined) {
      promises.push(AsyncStorage.setItem(STORAGE_KEYS.BYPASS, String(next.bypassAuth)));
    }
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
      if (next.refreshToken) {
        promises.push(AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, next.refreshToken));
      } else {
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
  }, []);

  const signIn = useCallback(async ({ role }: { role?: Role } = {}) => {
    const tokens = generateTokens();
    const next: Partial<AuthState> = {
      isAuthenticated: true,
      role: role ?? "customer",
      bypassAuth: false,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiry: tokens.expiry,
    };
    console.log("signIn called with role:", role);
    console.log("Setting auth state with tokens");
    setState((prev) => ({ ...prev, ...next }));
    await persist(next);
    console.log("Auth state with tokens persisted");
  }, [persist]);

  const signOut = useCallback(async () => {
    const next: Partial<AuthState> = {
      isAuthenticated: false,
      role: null,
      bypassAuth: false,
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
    };
    setState((prev) => ({ ...prev, ...next }));
    await persist(next);
    console.log("User signed out, all tokens cleared");
  }, [persist]);

  const enableBypass = useCallback(async (role: Role) => {
    const next: Partial<AuthState> = {
      bypassAuth: true,
      role,
      isAuthenticated: false,
    };
    setState((prev) => ({ ...prev, ...next }));
    await persist(next);
  }, [persist]);

  const disableBypass = useCallback(async () => {
    const next: Partial<AuthState> = { bypassAuth: false };
    setState((prev) => ({ ...prev, ...next }));
    await persist(next);
  }, [persist]);

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
      signIn, 
      signOut, 
      enableBypass, 
      disableBypass, 
      refreshToken,
      isTokenExpired 
    } 
  }), [state, signIn, signOut, enableBypass, disableBypass, refreshToken, isTokenExpired]);
}


