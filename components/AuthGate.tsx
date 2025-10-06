import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthProvider";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  
  console.log("🔐 AuthGate state:", {
    isHydrated: state.isHydrated,
    isAuthenticated: state.isAuthenticated,
    role: state.role,
    bypassAuth: state.bypassAuth
  });

  if (!state.isHydrated) {
    console.log("🔐 AuthGate: Not hydrated yet, showing loading");
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (state.isAuthenticated) {
    console.log("🔐 AuthGate: ✅ User is authenticated, allowing access to protected content");
    return children as any;
  }
  
  console.log("🔐 AuthGate: ❌ User not authenticated, redirecting to login");
  return <Redirect href="/auth/login" />;
}


