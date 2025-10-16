// "use client"; // (không cần trong Expo RN, bạn có thể xóa dòng này)

import { Ionicons } from "@expo/vector-icons";
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
import { useAuth } from "../../context/AuthProvider";
import { authApi, LoginRequest } from "../../lib/api";
import { googleAuthService } from "../../lib/google-auth-service";

type Role = "customer" | "business" | "admin";


export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { actions } = useAuth();

  const handleSignIn = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (!agreedToTerms) {
      Alert.alert("Error", "Please agree to the terms and conditions");
      return;
    }

    setIsLoading(true);
    try {
      const loginData: LoginRequest = {
        username: username.trim(),
        password,
      };

      const response = await authApi.login(loginData);
      console.log("API Response:", JSON.stringify(response, null, 2));
      console.log("Response statusCode:", response.statusCode);
      console.log("Response data:", response.data);
      console.log("Response user:", response.data?.user);
      console.log("Response role:", response.data?.user?.role);
      
      // Check if login was successful (statusCode 200)
      if (response.statusCode === 200) {
        console.log("Login successful");
        console.log("Access token:", response.data?.accessToken ? "***" + response.data.accessToken.slice(-8) : "None");
        console.log("Refresh token:", response.data?.refreshToken ? "***" + response.data.refreshToken.slice(-8) : "None");
        console.log("Full response.data:", JSON.stringify(response.data, null, 2));
        
        // Sign in with real tokens from API - role will be decoded from JWT token
        await actions.signInWithTokens({
          accessToken: response.data?.accessToken || "",
          refreshToken: response.data?.refreshToken || null,
          // Role will be decoded from JWT token automatically
          tokenExpiry: response.data?.tokenExpiry ? new Date(response.data.tokenExpiry).getTime() : undefined
        });
        console.log("Auth state with real tokens completed");
        
        // Navigate based on role - will be determined by JWT token decode
        // For now, navigate to customer dashboard as default
        // The actual role will be available in the auth context after JWT decode
        const destination = "/(protected)/customer";
        console.log("Navigating to:", destination, "(role will be determined by JWT token)");
        
        try {
          router.replace(destination);
          console.log("Navigation command sent");
        } catch (navError) {
          console.error("Navigation error:", navError);
          // Fallback navigation
          setTimeout(() => {
            console.log("Fallback navigation attempt");
            router.push(destination);
          }, 1000);
        }
      } else {
        Alert.alert("Error", response.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Login failed. Please check your credentials and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Guest mode removed - only real authentication allowed

  const handleTermsPress = (type: "agreement" | "privacy") => {
    Alert.alert(
      type === "agreement" ? "User Agreement" : "Privacy Policy",
      `${type === "agreement" ? "User Agreement" : "Privacy Policy"} content would be displayed here.`
    );
  };

  const handleGoogleLogin = async () => {
    try {
      console.log('Starting Google login...');
      await googleAuthService.initiateGoogleLogin();
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('Error', 'Failed to login with Google. Please try again.');
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
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => router.push("/welcome")}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.logoContainer}>
                <Image source={require("../../assets/images/logo.jpg")} style={styles.logo} resizeMode="contain" />
                <Text style={styles.brandText}>Back2Use</Text>
              </View>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.formCard}>
            <Text style={styles.title}>Sign in to your account</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor="#6B7280"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#6B7280"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push("/auth/forgot-password")}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={[styles.checkbox, agreedToTerms && styles.checkedCheckbox]}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
              >
                {agreedToTerms && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </TouchableOpacity>
              <View style={styles.termsTextContainer}>
                <Text style={styles.termsText}>I've read and agreed to </Text>
                <TouchableOpacity onPress={() => handleTermsPress("agreement")}>
                  <Text style={styles.termsLink}>User Agreement</Text>
                </TouchableOpacity>
                <Text style={styles.termsText}> and </Text>
                <TouchableOpacity onPress={() => handleTermsPress("privacy")}>
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.signInButton, (!agreedToTerms || isLoading) && styles.disabledButton]}
              onPress={handleSignIn}
              disabled={!agreedToTerms || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.signInButtonText}>Sign in</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.dividerText2}>other way to sign in</Text>

            <View style={styles.socialContainer2}>
              <TouchableOpacity style={styles.socialButton2} onPress={handleGoogleLogin}>
                <Ionicons name="logo-google" size={24} color="#4285F4" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton2} onPress={() => Alert.alert("Facebook Sign-In", "Facebook login will be available soon!")}>
                <Ionicons name="logo-facebook" size={24} color="#1877F2" />
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.replace("/auth/register")}>
                <Text style={styles.footerLink}>Create Account</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.businessFooter}>
              <Text style={styles.businessFooterText}>Are you a business owner? </Text>
              <TouchableOpacity onPress={() => router.push("/auth/business-register")}>
                <Text style={styles.businessFooterLink}>Register Business</Text>
              </TouchableOpacity>
            </View>

            {/* Guest mode removed - only real authentication allowed */}
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
  topHeader: { 
    paddingTop: 8, 
    paddingBottom: 12, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between" 
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  logoContainer: { flexDirection: "row", alignItems: "center" },
  placeholder: { width: 40 },
  logo: { width: 120, height: 120, borderRadius: 20, marginRight: 0 },
  brandText: { fontSize: 30, fontWeight: "bold", color: "#FFFFFF", textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3, includeFontPadding: false, marginLeft: -32, marginTop: 14},
  formCard: { backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 20, padding: 24, borderWidth: 1, borderColor: "#E5E7EB", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6, marginTop: 8 },
  title: { fontSize: 24, fontWeight: "bold", color: "#111827", textAlign: "center", marginBottom: 32 },
  fieldContainer: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "600", color: "#374151", marginBottom: 8 },
  input: {
    height: 48,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#374151",
  },
  passwordContainer: { position: "relative" },
  passwordInput: {
    height: 48,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingRight: 50,
    fontSize: 16,
    color: "#374151",
  },
  dividerText2: { fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 20 },
  socialContainer2: { flexDirection: "row", justifyContent: "center", gap: 16, marginBottom: 32 },
  socialButton2: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.7)" },
  eyeButton: { position: "absolute", right: 14, top: 14, padding: 4 },
  forgotPassword: { alignSelf: "flex-end", marginBottom: 24 },
  forgotPasswordText: { fontSize: 14, color: "#0F4D3A", fontWeight: "500" },
  termsContainer: { flexDirection: "row", alignItems: "flex-start", marginBottom: 24 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  checkedCheckbox: { backgroundColor: "#0F4D3A", borderColor: "#0F4D3A" },
  termsTextContainer: { flex: 1, flexDirection: "row", flexWrap: "wrap" },
  termsText: { fontSize: 14, color: "#6B7280", lineHeight: 20 },
  termsLink: { fontSize: 14, color: "#0F4D3A", fontWeight: "500", lineHeight: 20 },
  signInButton: { height: 54, backgroundColor: "#0F4D3A", borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  disabledButton: { opacity: 0.6 },
  signInButtonText: { fontSize: 18, fontWeight: "bold", color: "#FFFFFF" },
  dividerText: { fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 20 },
  socialContainer: { flexDirection: "row", justifyContent: "center", gap: 16, marginBottom: 32 },
  socialButton: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.7)" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { fontSize: 14, color: "#6B7280" },
  footerLink: { fontSize: 14, color: "#0F4D3A", fontWeight: "600" },
  businessFooter: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 12 },
  businessFooterText: { fontSize: 14, color: "#6B7280" },
  businessFooterLink: { fontSize: 14, color: "#0F4D3A", fontWeight: "600" },
});
