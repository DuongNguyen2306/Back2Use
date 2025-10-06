import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Role = "customer" | "business" | "admin";

type AuthState = {
  isAuthenticated: boolean;
  role: Role | null;
  bypassAuth: boolean;
  isHydrated: boolean;
};

const STORAGE_KEYS = {
  BYPASS: "AUTH_BYPASS",
  ROLE: "AUTH_ROLE",
  AUTH: "AUTH_IS_AUTHENTICATED",
};

export function useAuthCore() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    bypassAuth: false,
    isHydrated: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const [bypassStr, roleStr, authStr] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.BYPASS),
          AsyncStorage.getItem(STORAGE_KEYS.ROLE),
          AsyncStorage.getItem(STORAGE_KEYS.AUTH),
        ]);
        
        console.log("Loading auth state from storage:", {
          bypassStr,
          roleStr,
          authStr
        });
        
        // Clear all auth data for security (force fresh start)
        await Promise.all([
          AsyncStorage.removeItem(STORAGE_KEYS.BYPASS),
          AsyncStorage.removeItem(STORAGE_KEYS.ROLE),
          AsyncStorage.removeItem(STORAGE_KEYS.AUTH),
        ]);
        
        console.log("Cleared all auth data from storage");
        
        setState((prev) => ({
          ...prev,
          bypassAuth: false,
          role: null,
          isAuthenticated: false,
          isHydrated: true,
        }));
        
        console.log("Set fresh auth state:", {
          bypassAuth: false,
          role: null,
          isAuthenticated: false,
          isHydrated: true
        });
      } catch (error) {
        console.error("Error loading auth state:", error);
        setState((prev) => ({ ...prev, isHydrated: true }));
      }
    })();
  }, []);

  const persist = useCallback(async (next: Partial<AuthState>) => {
    if (next.bypassAuth !== undefined) {
      await AsyncStorage.setItem(STORAGE_KEYS.BYPASS, String(next.bypassAuth));
    }
    if (next.role !== undefined) {
      if (next.role) await AsyncStorage.setItem(STORAGE_KEYS.ROLE, next.role);
      else await AsyncStorage.removeItem(STORAGE_KEYS.ROLE);
    }
    if (next.isAuthenticated !== undefined) {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH, String(next.isAuthenticated));
    }
  }, []);

  const signIn = useCallback(async ({ role }: { role?: Role } = {}) => {
    const next: Partial<AuthState> = {
      isAuthenticated: true,
      role: role ?? "customer",
      bypassAuth: false,
    };
    console.log("signIn called with role:", role);
    console.log("Setting auth state:", next);
    setState((prev) => ({ ...prev, ...next }));
    await persist(next);
    console.log("Auth state persisted");
  }, [persist]);

  const signOut = useCallback(async () => {
    const next: Partial<AuthState> = {
      isAuthenticated: false,
      role: null,
      bypassAuth: false,
    };
    setState((prev) => ({ ...prev, ...next }));
    await persist(next);
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

  return useMemo(() => ({ state, actions: { signIn, signOut, enableBypass, disableBypass } }), [state, signIn, signOut, enableBypass, disableBypass]);
}


