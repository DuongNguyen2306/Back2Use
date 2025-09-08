import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AuthGate from "../../components/AuthGate";
import { useAuth } from "../../context/AuthProvider";

export default function ProtectedLayout() {
  const { actions } = useAuth();
  const insets = useSafeAreaInsets();
  return (
    <AuthGate>
      <View style={{ flex: 1 }}>
        <View style={{ position: "absolute", top: insets.top + 8, right: 8, left: 8, zIndex: 10, flexDirection: "row", justifyContent: "space-between" }} pointerEvents="box-none">
          <Pressable
            onPress={async () => { await actions.signOut(); await actions.disableBypass(); router.replace("/login"); }}
            style={{ padding: 6 }}
            hitSlop={8}
          >
            <Ionicons name="log-out-outline" size={22} color="#0F4D3A" />
          </Pressable>
          {__DEV__ && (
            <Pressable
              onPress={() => router.push("/dev")}
              style={{ padding: 6 }}
              hitSlop={8}
            >
              <Ionicons name="construct" size={22} color="#0F4D3A" />
            </Pressable>
          )}
        </View>
        <View style={{ flex: 1, paddingTop: insets.top + 44 }}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </View>
    </AuthGate>
  );
}


