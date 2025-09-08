import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Image, ImageBackground, StyleSheet, Text, View } from "react-native";

// app/index.tsx
const bg   = require("../assets/images/splash-bg.jpg");
const logo = require("../assets/images/logo.jpg");


export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    const timer = setTimeout(() => router.replace("/login"), 1500);
    return () => clearTimeout(timer);
  }, [fadeAnim]);

  return (
    <ImageBackground source={bg} style={styles.background} resizeMode="cover">
      <View style={styles.overlay}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brandText}>PlantSHOP</Text>
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
