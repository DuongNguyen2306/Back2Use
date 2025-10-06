import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Image, ImageBackground, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthProvider";

// app/index.tsx
const bg   = require("../assets/images/splash-bg.jpg");
const logo = require("../assets/images/logo.jpg");


export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { state } = useAuth();

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      console.log("🚀 SplashScreen: Checking auth state:", {
        isHydrated: state.isHydrated,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
        bypassAuth: state.bypassAuth
      });
      
      // Only redirect after hydration is complete
      if (state.isHydrated) {
        if (state.isAuthenticated && state.role) {
          const dest = state.role === "customer" ? "/(protected)/customer" : state.role === "business" ? "/(protected)/business" : "/(protected)/admin";
          console.log("🚀 SplashScreen: User authenticated, redirecting to:", dest);
          router.replace(dest);
        } else {
          // No authentication found, go to welcome screen
          console.log("🚀 SplashScreen: No authentication, redirecting to welcome");
          router.replace("/welcome");
        }
      } else {
        console.log("🚀 SplashScreen: Not hydrated yet, waiting...");
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [fadeAnim, state.isAuthenticated, state.role, state.isHydrated]);

  return (
    <ImageBackground source={bg} style={styles.background} resizeMode="cover">
      <View style={styles.overlay}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brandText}>Back2Use</Text>
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.35)", justifyContent: "center", alignItems: "center" },
  content: { alignItems: "center" },
  logo: { width: 120, height: 120, marginBottom: 16, borderRadius: 12 },
  brandText: { fontSize: 32, fontWeight: "bold", color: "#FFFFFF", letterSpacing: 1 },
});
