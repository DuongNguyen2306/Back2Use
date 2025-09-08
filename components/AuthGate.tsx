import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthProvider";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();

  if (!state.isHydrated) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (state.bypassAuth || state.isAuthenticated) return children as any;
  return <Redirect href="/login" />;
}


