"use client";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
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
import { useAuth } from "../context/AuthProvider";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { actions } = useAuth();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (!agreedToTerms) {
      Alert.alert("Error", "Please agree to the terms and conditions");
      return;
    }
    // Demo accounts routing by role
    const normalized = email.trim().toLowerCase();
    const isDemoPassword = password === "password123";
    let role: "customer" | "business" | "admin" = "customer";
    if (normalized === "staff@greencafe.com") role = "business";
    if (normalized === "admin@back2use.com") role = "admin";

    if (
      normalized === "john.customer@example.com" ||
      normalized === "staff@greencafe.com" ||
      normalized === "admin@back2use.com"
    ) {
      if (!isDemoPassword) {
        Alert.alert("Error", "Invalid demo credentials. Password is password123");
        return;
      }
    }

    await actions.signIn({ role });
    const dest = role === "customer" ? "/(protected)/customer" : role === "business" ? "/(protected)/business" : "/(protected)/admin";
    router.replace(dest);
  };
  const enterAsGuest = async () => {
    await actions.enableBypass("customer");
    router.replace("/(protected)/customer");
  };

  const handleTermsPress = (type: "agreement" | "privacy") => {
    Alert.alert(
      type === "agreement" ? "User Agreement" : "Privacy Policy",
      `${type === "agreement" ? "User Agreement" : "Privacy Policy"} content would be displayed here.`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Image source={require("../assets/images/logo.jpg")} style={styles.logo} resizeMode="contain" />
            <Text style={styles.brandText}>Back2Use</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.title}>Sign in to your account</Text>

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

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

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

            <TouchableOpacity style={[styles.signInButton, !agreedToTerms && styles.disabledButton]} onPress={handleSignIn} disabled={!agreedToTerms}>
              <Text style={styles.signInButtonText}>Sign in</Text>
            </TouchableOpacity>

            <Text style={styles.dividerText}>other way to sign in</Text>

            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-google" size={24} color="#4285F4" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-facebook" size={24} color="#1877F2" />
              </TouchableOpacity>
            </View>

            <View style={styles.demoPanel}>
              <Text style={styles.demoTitle}>Demo Accounts:</Text>
              <Text style={styles.demoLine}><Text style={styles.demoBold}>Customer:</Text> john.customer@example.com</Text>
              <Text style={styles.demoLine}><Text style={styles.demoBold}>Staff:</Text> staff@greencafe.com</Text>
              <Text style={styles.demoLine}><Text style={styles.demoBold}>Admin:</Text> admin@back2use.com</Text>
              <Text style={styles.demoLine}><Text style={styles.demoBold}>Password:</Text> password123</Text>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/register")}>
                <Text style={styles.footerLink}>Create Account</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={enterAsGuest} style={{ alignSelf: "center", marginTop: 12 }}>
              <Text style={{ color: "#0F4D3A", fontSize: 12, fontWeight: "600" }}>Enter as guest</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 20 },
  header: { alignItems: "center", marginTop: 40, marginBottom: 32 },
  logo: { width: 80, height: 80, marginBottom: 12 },
  brandText: { fontSize: 24, fontWeight: "bold", color: "#0F4D3A" },
  formCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24, borderWidth: 1, borderColor: "#E5E7EB" },
  title: { fontSize: 24, fontWeight: "bold", color: "#111827", textAlign: "center", marginBottom: 32 },
  fieldContainer: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "600", color: "#374151", marginBottom: 8 },
  input: { height: 48, backgroundColor: "#F3F4F6", borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 14, fontSize: 16, color: "#374151" },
  passwordContainer: { position: "relative" },
  passwordInput: { height: 48, backgroundColor: "#F3F4F6", borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 14, paddingRight: 50, fontSize: 16, color: "#374151" },
  eyeButton: { position: "absolute", right: 14, top: 14, padding: 4 },
  forgotPassword: { alignSelf: "flex-end", marginBottom: 24 },
  forgotPasswordText: { fontSize: 14, color: "#0F4D3A", fontWeight: "500" },
  termsContainer: { flexDirection: "row", alignItems: "flex-start", marginBottom: 24 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: "#E5E7EB", backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", marginRight: 12, marginTop: 2 },
  checkedCheckbox: { backgroundColor: "#0F4D3A", borderColor: "#0F4D3A" },
  termsTextContainer: { flex: 1, flexDirection: "row", flexWrap: "wrap" },
  termsText: { fontSize: 14, color: "#6B7280", lineHeight: 20 },
  termsLink: { fontSize: 14, color: "#0F4D3A", fontWeight: "500", lineHeight: 20 },
  signInButton: { height: 54, backgroundColor: "#0F4D3A", borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  disabledButton: { opacity: 0.6 },
  signInButtonText: { fontSize: 18, fontWeight: "bold", color: "#FFFFFF" },
  dividerText: { fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 20 },
  socialContainer: { flexDirection: "row", justifyContent: "center", gap: 16, marginBottom: 32 },
  socialButton: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  demoPanel: { padding: 12, backgroundColor: "#F3F4F6", borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 20 },
  demoTitle: { fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 6 },
  demoLine: { fontSize: 13, color: "#374151", marginBottom: 2 },
  demoBold: { fontWeight: "700" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { fontSize: 14, color: "#6B7280" },
  footerLink: { fontSize: 14, color: "#0F4D3A", fontWeight: "600" },
});


