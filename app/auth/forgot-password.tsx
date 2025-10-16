import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { authApi } from "../../lib/api";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Sending forgot password request for email:", email.trim());
      const response = await authApi.forgotPassword(email.trim());
      console.log("Forgot password response:", JSON.stringify(response, null, 2));
      
      // Check for success - handle different response formats
      const isSuccess = response.success || 
                       (response.message && response.message.toLowerCase().includes("sent")) ||
                       (response.statusCode && response.statusCode === 200) ||
                       (response.statusCode && response.statusCode === 201);
      
      // Special case: if message contains "OTP" and "sent", treat as success even if success=false
      const isOtpSent = response.message && 
                        response.message.toLowerCase().includes("otp") && 
                        response.message.toLowerCase().includes("sent");
      
      if (isSuccess || isOtpSent) {
        Alert.alert(
          "Success", 
          "OTP for password reset sent to your email",
          [
            {
              text: "OK",
              onPress: () => router.push({
                pathname: "/auth/verify-otp",
                params: { email: email.trim(), type: "reset-password" }
              })
            }
          ]
        );
      } else {
        // If response has a message but success is false, still show the message
        const errorMessage = response.message || "Failed to send reset instructions";
        Alert.alert("Error", errorMessage);
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      Alert.alert("Error", "Failed to send reset instructions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{ uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/splash-bg.jpg-0cgAaCzoZKCdOb8naNxHzXRdZGseCS.jpeg" }}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.topHeader}>
              <View style={styles.logoContainer}>
                <Image source={require("../../assets/images/logo.jpg")} style={styles.logo} resizeMode="contain" />
                <Text style={styles.brandText}>Back2Use</Text>
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.title}>Forgot Password</Text>
              <Text style={styles.subtitle}>Enter your email address and we'll send you instructions to reset your password.</Text>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email address"
                  placeholderTextColor="#6B7280"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity 
                style={[styles.resetButton, isLoading && styles.disabledButton]} 
                onPress={handleForgotPassword} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.resetButtonText}>Send Reset Instructions</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Remember your password? </Text>
                <TouchableOpacity onPress={() => router.replace("/auth/login")}>
                  <Text style={styles.footerLink}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject as any, backgroundColor: "rgba(0,0,0,0.15)" },
  container: { flex: 1, backgroundColor: "transparent" },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 20 },
  topHeader: { paddingTop: 8, paddingBottom: 12, alignItems: "flex-start" },
  logoContainer: { flexDirection: "row", alignItems: "center" },
  logo: { width: 120, height: 120, borderRadius: 20, marginRight: 0 },
  brandText: { fontSize: 28, fontWeight: "bold", color: "#FFFFFF", textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3, includeFontPadding: false, marginLeft: -32, marginTop: 14 },
  formCard: { backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 20, padding: 24, borderWidth: 1, borderColor: "#E5E7EB", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6, marginTop: 8 },
  title: { fontSize: 24, fontWeight: "bold", color: "#111827", textAlign: "center", marginBottom: 16 },
  subtitle: { fontSize: 16, color: "#6B7280", textAlign: "center", marginBottom: 32, lineHeight: 22 },
  fieldContainer: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: "600", color: "#374151", marginBottom: 8 },
  input: { height: 48, backgroundColor: "rgba(255,255,255,0.55)", borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 14, fontSize: 16, color: "#374151" },
  resetButton: { height: 54, backgroundColor: "#0F4D3A", borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  disabledButton: { opacity: 0.6 },
  resetButtonText: { fontSize: 18, fontWeight: "bold", color: "#FFFFFF" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { fontSize: 14, color: "#6B7280" },
  footerLink: { fontSize: 14, color: "#0F4D3A", fontWeight: "600" },
});
