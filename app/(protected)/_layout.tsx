import { Stack } from "expo-router";
import { View } from "react-native";
import AuthGate from "../../components/AuthGate";

export default function ProtectedLayout() {
  console.log("🔒 ProtectedLayout rendered");
  
  return (
    <AuthGate>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </AuthGate>
  );
}


