import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthProvider";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  
  console.log("AuthGate state:", {
    isHydrated: state.isHydrated,
    isAuthenticated: state.isAuthenticated,
    role: state.role,
    bypassAuth: state.bypassAuth
  });

  if (!state.isHydrated) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (state.bypassAuth || state.isAuthenticated) {
    console.log("AuthGate: Allowing access to protected content");
    return children as any;
  }
  
  console.log("AuthGate: Redirecting to login");
  return <Redirect href="/auth/login" />;
}


