import { createContext, useContext, useEffect } from "react";
import { useAuthCore, type Role } from "../hooks/useAuth";
import { setTokenProvider } from "../lib/user-service";

type AuthContextType = ReturnType<typeof useAuthCore>;

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const value = useAuthCore();
  
  // Setup token provider for auto refresh
  useEffect(() => {
    setTokenProvider(value.actions.getCurrentAccessToken);
  }, [value.actions.getCurrentAccessToken]);
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export type { Role };


