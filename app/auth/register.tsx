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
    View
} from "react-native";
import { useAuth } from "../../context/AuthProvider";
import { authApi, RegisterRequest } from "../../lib/api";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { actions } = useAuth();

  const handleSignUp = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (!agreedToTerms) {
      Alert.alert("Error", "Please agree to the terms and conditions");
      return;
    }

    setIsLoading(true);
    try {
      const userData: RegisterRequest = {
        username,
        email,
        password,
        confirmPassword,
      };

      const response = await authApi.register(userData);
      console.log("Registration response:", JSON.stringify(response, null, 2));
      
      // Check if registration was successful
      const isSuccess = response.success || 
                       (response.message && response.message.toLowerCase().includes("successfully")) ||
                       (response.message && response.message.toLowerCase().includes("registered"));
      
      if (isSuccess) {
        Alert.alert(
          "Success", 
          "Account created successfully! Please check your email for verification code.",
          [
            {
              text: "OK",
              onPress: () => router.replace({
                pathname: "/auth/verify-otp",
                params: { email: email.trim() }
              })
            }
          ]
        );
      } else {
        Alert.alert("Error", response.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert("Error", "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTermsPress = (type: "agreement" | "privacy") => {
    Alert.alert(
      type === "agreement" ? "User Agreement" : "Privacy Policy",
      `${type === "agreement" ? "User Agreement" : "Privacy Policy"} content would be displayed here.`
    );
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
            <Text style={styles.title}>Create new account</Text>

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

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your confirm password"
                  placeholderTextColor="#6B7280"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.termsContainer}>
              <TouchableOpacity style={[styles.checkbox, agreedToTerms && styles.checkedCheckbox]} onPress={() => setAgreedToTerms(!agreedToTerms)}>
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
              style={[styles.signUpButton, (!agreedToTerms || isLoading) && styles.disabledButton]} 
              onPress={handleSignUp} 
              disabled={!agreedToTerms || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.signUpButtonText}>Sign up</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.dividerText}>other way to sign in</Text>

            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialButton} onPress={() => Alert.alert("Google Sign-In")}>
                <Ionicons name="logo-google" size={24} color="#4285F4" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton} onPress={() => Alert.alert("Facebook Sign-In")}>
                <Ionicons name="logo-facebook" size={24} color="#1877F2" />
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
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
  brandText: { fontSize: 28, fontWeight: "bold", color: "#FFFFFF", textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3, includeFontPadding: false, marginLeft: -32, marginTop: 14 },
  formCard: { backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 20, padding: 24, borderWidth: 1, borderColor: "#E5E7EB", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6, marginTop: 8 },
  title: { fontSize: 24, fontWeight: "bold", color: "#111827", textAlign: "center", marginBottom: 32 },
  fieldContainer: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "600", color: "#374151", marginBottom: 8 },
  input: { height: 48, backgroundColor: "rgba(255,255,255,0.55)", borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 14, fontSize: 16, color: "#374151" },
  passwordContainer: { position: "relative" },
  passwordInput: { height: 48, backgroundColor: "rgba(255,255,255,0.55)", borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 14, paddingRight: 50, fontSize: 16, color: "#374151" },
  eyeButton: { position: "absolute", right: 14, top: 14, padding: 4 },
  termsContainer: { flexDirection: "row", alignItems: "flex-start", marginBottom: 24 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: "#E5E7EB", backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", marginRight: 12, marginTop: 2 },
  checkedCheckbox: { backgroundColor: "#0F4D3A", borderColor: "#0F4D3A" },
  termsTextContainer: { flex: 1, flexDirection: "row", flexWrap: "wrap" },
  termsText: { fontSize: 14, color: "#6B7280", lineHeight: 20 },
  termsLink: { fontSize: 14, color: "#0F4D3A", fontWeight: "500", lineHeight: 20 },
  signUpButton: { height: 54, backgroundColor: "#0F4D3A", borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  disabledButton: { opacity: 0.6 },
  signUpButtonText: { fontSize: 18, fontWeight: "bold", color: "#FFFFFF" },
  dividerText: { fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 20 },
  socialContainer: { flexDirection: "row", justifyContent: "center", gap: 16, marginBottom: 32 },
  socialButton: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.7)" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { fontSize: 14, color: "#6B7280" },
  footerLink: { fontSize: 14, color: "#0F4D3A", fontWeight: "600" },
});


