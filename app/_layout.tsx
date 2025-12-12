import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../context/AuthProvider";
import { CartProvider } from "../context/CartProvider";
import { NotificationProvider } from "../context/NotificationProvider";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}