import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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
import { authApi } from "../../lib/api/apiconfig";

export default function VerifyOTPScreen() {
  const params = useLocalSearchParams();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [email, setEmail] = useState(""); // Email from registration
  const [type, setType] = useState("register"); // "register" or "reset-password"
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (params.email) {
      setEmail(params.email as string);
    }
    if (params.type) {
      setType(params.type as string);
    }
  }, [params.email, params.type]);

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert("Error", "Please enter a valid 6-digit OTP");
      return;
    }

    // For reset password, validate passwords
    if (type === "reset-password") {
      if (!newPassword || !confirmPassword) {
        Alert.alert("Error", "Please enter your new password");
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match");
        return;
      }
      if (newPassword.length < 6) {
        Alert.alert("Error", "Password must be at least 6 characters long");
        return;
      }
    }

    setIsLoading(true);
    try {
      let response;
      
      if (type === "reset-password") {
        // Reset password with OTP
        response = await authApi.resetPassword({
          email,
          otp,
          newPassword,
          confirmNewPassword: confirmPassword
        });
        console.log("Reset password response:", JSON.stringify(response, null, 2));
      } else {
        // Activate account
        response = await authApi.activateAccount({ otp, email });
        console.log("Activate account response:", JSON.stringify(response, null, 2));
      }
      
      // Check for success (either success: true or message contains "successfully")
      const isSuccess = response.success || 
                       (response.message && response.message.toLowerCase().includes("successfully"));
      
      if (isSuccess) {
        const successMessage = type === "reset-password" 
          ? "Password reset successfully! You can now login with your new password."
          : "Account activated successfully! You can now login.";
        
        Alert.alert(
          "Success", 
          successMessage,
          [
            {
              text: "OK",
              onPress: () => router.replace("/auth/login")
            }
          ]
        );
      } else {
        Alert.alert("Error", response.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error(`${type === "reset-password" ? "Reset password" : "Account activation"} error:`, error);
      Alert.alert("Error", `${type === "reset-password" ? "Password reset" : "Account activation"} failed. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    
    setIsLoading(true);
    try {
      if (!email) {
        Alert.alert("Error", "Email not found. Please go back and register again.");
        return;
      }
      
      console.log("Resending OTP for email:", email);
      const response = await authApi.resendOTP(email);
      console.log("Resend OTP response:", JSON.stringify(response, null, 2));
      
      // Check for success (either success: true or statusCode: 201)
      if (response.success || response.statusCode === 201) {
        Alert.alert("Success", "OTP has been resent to your email");
        
        // Start cooldown timer
        setResendCooldown(60);
        const timer = setInterval(() => {
          setResendCooldown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        Alert.alert("Error", response.message || "Failed to resend OTP. Please try again.");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      Alert.alert("Error", "Failed to resend OTP. Please try again.");
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
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.logoContainer}>
                <Image source={require("../../assets/images/logo.jpg")} style={styles.logo} resizeMode="contain" />
                <Text style={styles.brandText}>Back2Use</Text>
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.title}>
                {type === "reset-password" ? "Reset Your Password" : "Verify Your Email"}
              </Text>
              <Text style={styles.subtitle}>
                {type === "reset-password" 
                  ? `We've sent a 6-digit verification code to ${email || "your email address"}. Please enter it below along with your new password.`
                  : `We've sent a 6-digit verification code to ${email || "your email address"}. Please enter it below.`
                }
              </Text>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput
                  style={styles.otpInput}
                  placeholder="000000"
                  placeholderTextColor="#6B7280"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                />
              </View>

              {type === "reset-password" && (
                <>
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>New Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your new password"
                      placeholderTextColor="#6B7280"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Confirm New Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm your new password"
                      placeholderTextColor="#6B7280"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </>
              )}

              <TouchableOpacity
                style={[
                  styles.verifyButton, 
                  (!otp || otp.length !== 6 || isLoading || 
                   (type === "reset-password" && (!newPassword || !confirmPassword))) && styles.disabledButton
                ]}
                onPress={handleVerifyOTP}
                disabled={!otp || otp.length !== 6 || isLoading || 
                          (type === "reset-password" && (!newPassword || !confirmPassword))}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.verifyButtonText}>
                    {type === "reset-password" ? "Reset Password" : "Verify Email"}
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn't receive the code? </Text>
                <TouchableOpacity 
                  onPress={handleResendOTP}
                  disabled={resendCooldown > 0 || isLoading}
                >
                  <Text style={[
                    styles.resendLink,
                    (resendCooldown > 0 || isLoading) && styles.disabledLink
                  ]}>
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  {type === "reset-password" ? "Remember your password? " : "Wrong email address? "}
                </Text>
                <TouchableOpacity onPress={() => 
                  type === "reset-password" 
                    ? router.replace("/auth/login")
                    : router.replace("/auth/register")
                }>
                  <Text style={styles.footerLink}>
                    {type === "reset-password" ? "Back to Sign In" : "Go Back"}
                  </Text>
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
  topHeader: { 
    paddingTop: 8, 
    paddingBottom: 12, 
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  logoContainer: { flexDirection: "row", alignItems: "center" },
  logo: { width: 120, height: 120, borderRadius: 20, marginRight: 0 },
  brandText: { 
    fontSize: 30, 
    fontWeight: "bold", 
    color: "#FFFFFF", 
    textShadowColor: "rgba(0,0,0,0.3)", 
    textShadowOffset: { width: 1, height: 1 }, 
    textShadowRadius: 3, 
    includeFontPadding: false, 
    marginLeft: -32, 
    marginTop: 14
  },
  formCard: { 
    backgroundColor: "rgba(255,255,255,0.7)", 
    borderRadius: 20, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: "#E5E7EB", 
    shadowColor: "#000", 
    shadowOpacity: 0.08, 
    shadowRadius: 12, 
    shadowOffset: { width: 0, height: 6 }, 
    elevation: 6, 
    marginTop: 8 
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#111827", textAlign: "center", marginBottom: 16 },
  subtitle: { 
    fontSize: 16, 
    color: "#6B7280", 
    textAlign: "center", 
    marginBottom: 32,
    lineHeight: 24,
  },
  fieldContainer: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: "600", color: "#374151", marginBottom: 8 },
  otpInput: {
    height: 56,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    fontSize: 24,
    color: "#374151",
    fontWeight: "bold",
    letterSpacing: 4,
  },
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
  verifyButton: { 
    height: 54, 
    backgroundColor: "#0F4D3A", 
    borderRadius: 28, 
    alignItems: "center", 
    justifyContent: "center", 
    marginBottom: 24 
  },
  disabledButton: { opacity: 0.6 },
  verifyButtonText: { fontSize: 18, fontWeight: "bold", color: "#FFFFFF" },
  resendContainer: { 
    flexDirection: "row", 
    justifyContent: "center", 
    alignItems: "center", 
    marginBottom: 24 
  },
  resendText: { fontSize: 14, color: "#6B7280" },
  resendLink: { fontSize: 14, color: "#0F4D3A", fontWeight: "600" },
  disabledLink: { color: "#9CA3AF" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { fontSize: 14, color: "#6B7280" },
  footerLink: { fontSize: 14, color: "#0F4D3A", fontWeight: "600" },
});
