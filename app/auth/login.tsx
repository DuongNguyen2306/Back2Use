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

type Role = "customer" | "business" | "admin";


export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(true); // Set to true by default to show form immediately
  const { actions } = useAuth();

  const handleSignIn = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (!agreedToTerms) {
      Alert.alert("Error", "Please agree to the terms and conditions");
      return;
    }

    setIsLoading(true);
    try {
      const result = await actions.login(username.trim(), password);
      console.log("Login result:", result);

      // Redirect based on user role (only customer and business allowed on mobile)
      // Admin is already blocked in useAuth.ts, so we won't get here if role is admin
      const role = result?.role || 'customer';
      const destination = role === 'business' 
        ? "/(protected)/business" 
        : "/(protected)/customer";
      
      console.log("🚀 Login successful, redirecting to:", destination);
      
      try {
        router.replace(destination);
      } catch (navError) {
        router.push(destination);
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Login failed. Please check your credentials and try again.";
      
      // Silently handle "SERVER_UNAVAILABLE" errors - don't log or show alert
      const isServerUnavailable = errorMessage === 'SERVER_UNAVAILABLE' || 
                                  errorMessage.toLowerCase().includes('server unavailable');
      
      if (isServerUnavailable) {
        // Silently handle - don't log or show alert
        return;
      }
      
      // Check if error is about admin access restriction
      if (errorMessage.includes("Admin accounts cannot be accessed on mobile") || 
          errorMessage.includes("admin") || 
          errorMessage.toLowerCase().includes("admin")) {
        // Show specific alert for admin access restriction in Vietnamese
        Alert.alert(
          "Không thể đăng nhập",
          "Tài khoản Admin không thể đăng nhập trên ứng dụng di động. Vui lòng đăng nhập trên nền tảng web.",
          [
            {
              text: "OK",
              onPress: () => {
                // Clear form
                setUsername("");
                setPassword("");
                setAgreedToTerms(false);
              }
            }
          ],
          { cancelable: false }
        );
      } else {
        // Show error alert for all other errors including invalid credentials
        Alert.alert("Error", errorMessage);
      }
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



  return (
    <ImageBackground
      source={{ uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/splash-bg.jpg-0cgAaCzoZKCdOb8naNxHzXRdZGseCS.jpeg" }}
      style={styles.bg}
      resizeMode="cover"
      onLoad={() => setImageLoaded(true)}
      onError={(error) => {
        console.error('ImageBackground load error:', error);
        setImageLoaded(true); // Show form even if image fails to load
      }}
    >
      <View style={styles.overlay} />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "padding"} 
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          enabled={true}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            alwaysBounceVertical={false}
            contentInsetAdjustmentBehavior="automatic"
          >
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

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.replace("/auth/register")}>
                <Text style={styles.footerLink}>Create Account</Text>
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
  scrollContent: { 
    flexGrow: 1, 
    padding: 20, 
    paddingBottom: 40,
  },
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
  formCard: { 
    backgroundColor: "rgba(255,255,255,0.95)", // Tăng opacity để rõ hơn
    borderRadius: 20, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: "#E5E7EB", 
    shadowColor: "#000", 
    shadowOpacity: 0.15, // Tăng shadow để nổi bật hơn
    shadowRadius: 12, 
    shadowOffset: { width: 0, height: 6 }, 
    elevation: 8, // Tăng elevation
    marginTop: 8,
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    zIndex: 10,
    minHeight: 400, // Đảm bảo có chiều cao tối thiểu
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#111827", textAlign: "center", marginBottom: 32 },
  fieldContainer: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "600", color: "#374151", marginBottom: 8 },
  input: {
    height: 48,
    backgroundColor: "#FFFFFF", // Đổi thành màu trắng solid để rõ hơn
    borderRadius: 12,
    borderWidth: 1.5, // Tăng border width
    borderColor: "#D1D5DB", // Border rõ hơn
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#111827", // Màu chữ đậm hơn
  },
  passwordContainer: { position: "relative" },
  passwordInput: {
    height: 48,
    backgroundColor: "#FFFFFF", // Đổi thành màu trắng solid để rõ hơn
    borderRadius: 12,
    borderWidth: 1.5, // Tăng border width
    borderColor: "#D1D5DB", // Border rõ hơn
    paddingHorizontal: 14,
    paddingRight: 50,
    fontSize: 16,
    color: "#111827", // Màu chữ đậm hơn
  },
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
  // WebView styles
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: '#4285F4',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  webViewCloseButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  webViewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  webViewLoadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  webViewErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  webViewErrorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  webViewErrorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  webViewErrorButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  webViewErrorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
