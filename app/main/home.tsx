import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<"home" | "about" | "contact">("home");

  const handleGetStarted = () => {
    router.push("/auth/login");
  };

  const handleLearnMore = () => {
    Alert.alert("Learn More", "More information about Back2Use will be available soon!");
  };

  return (
    <ImageBackground
      source={{ uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/splash-bg.jpg-0cgAaCzoZKCdOb8naNxHzXRdZGseCS.jpeg" }}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image source={require("../../assets/images/logo.jpg")} style={styles.logo} resizeMode="contain" />
              <Text style={styles.brandText}>Back2Use</Text>
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Welcome to Back2Use</Text>
            <Text style={styles.subtitle}>
              Your sustainable shopping companion. Track, return, and reuse items with ease.
            </Text>

            <View style={styles.features}>
              <View style={styles.featureItem}>
                <Text style={styles.featureTitle}>🛍️ Smart Shopping</Text>
                <Text style={styles.featureText}>Track your purchases and manage returns efficiently</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Text style={styles.featureTitle}>♻️ Sustainable Living</Text>
                <Text style={styles.featureText}>Promote reuse and reduce waste in your community</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Text style={styles.featureTitle}>📱 Easy Management</Text>
                <Text style={styles.featureText}>Simple interface for both customers and businesses</Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryButton} onPress={handleLearnMore}>
                <Text style={styles.secondaryButtonText}>Learn More</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject as any, backgroundColor: "rgba(0,0,0,0.15)" },
  container: { flex: 1, backgroundColor: "transparent" },
  scrollContent: { flexGrow: 1, padding: 20 },
  header: { paddingTop: 20, paddingBottom: 20, alignItems: "center" },
  logoContainer: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  logo: { width: 80, height: 80, borderRadius: 15, marginRight: 15 },
  brandText: { fontSize: 32, fontWeight: "bold", color: "#FFFFFF", textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  content: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 28, fontWeight: "bold", color: "#FFFFFF", textAlign: "center", marginBottom: 16, textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  subtitle: { fontSize: 18, color: "#FFFFFF", textAlign: "center", marginBottom: 40, lineHeight: 24, textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  features: { marginBottom: 40, width: "100%" },
  featureItem: { backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 15, padding: 20, marginBottom: 15, alignItems: "center" },
  featureTitle: { fontSize: 18, fontWeight: "bold", color: "#0F4D3A", marginBottom: 8 },
  featureText: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 20 },
  buttonContainer: { width: "100%", gap: 15 },
  primaryButton: { backgroundColor: "#0F4D3A", borderRadius: 25, paddingVertical: 15, alignItems: "center" },
  primaryButtonText: { fontSize: 18, fontWeight: "bold", color: "#FFFFFF" },
  secondaryButton: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 25, paddingVertical: 15, alignItems: "center", borderWidth: 2, borderColor: "#FFFFFF" },
  secondaryButtonText: { fontSize: 18, fontWeight: "bold", color: "#FFFFFF" },
});
