import { Stack } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AuthGate from "../../components/AuthGate";

export default function ProtectedLayout() {
  return (
    <AuthGate>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </AuthGate>
  );
}


