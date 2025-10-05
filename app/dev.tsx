import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { testApiConnection, testAuthEndpoints } from "../lib/api/test-connection";
import { API_BASE_URL } from "../lib/constants";

export default function DevScreen() {
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);
  const [endpointStatus, setEndpointStatus] = useState<any>(null);

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const isConnected = await testApiConnection();
      setConnectionStatus(isConnected);
      
      if (isConnected) {
        const endpoints = await testAuthEndpoints();
        setEndpointStatus(endpoints);
        Alert.alert("Success", "API connection successful!");
      } else {
        Alert.alert("Error", "Cannot connect to API server");
      }
    } catch (error) {
      console.error("Connection test error:", error);
      Alert.alert("Error", "Connection test failed");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0F4D3A" />
        </TouchableOpacity>
        <Text style={styles.title}>Developer Tools</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Configuration</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Base URL:</Text>
            <Text style={styles.infoValue}>{API_BASE_URL}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection Test</Text>
          <TouchableOpacity
            style={[styles.testButton, isTesting && styles.disabledButton]}
            onPress={handleTestConnection}
            disabled={isTesting}
          >
            <Ionicons name="wifi" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>
              {isTesting ? "Testing..." : "Test API Connection"}
            </Text>
          </TouchableOpacity>

          {connectionStatus !== null && (
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>Connection Status:</Text>
              <Text style={[
                styles.statusValue,
                connectionStatus ? styles.successText : styles.errorText
              ]}>
                {connectionStatus ? "✅ Connected" : "❌ Failed"}
              </Text>
            </View>
          )}

          {endpointStatus && (
            <View style={styles.endpointCard}>
              <Text style={styles.endpointTitle}>Auth Endpoints:</Text>
              <View style={styles.endpointItem}>
                <Text style={styles.endpointLabel}>Login:</Text>
                <Text style={[
                  styles.endpointStatus,
                  endpointStatus.login ? styles.successText : styles.errorText
                ]}>
                  {endpointStatus.login ? "✅" : "❌"}
                </Text>
              </View>
              <View style={styles.endpointItem}>
                <Text style={styles.endpointLabel}>Register:</Text>
                <Text style={[
                  styles.endpointStatus,
                  endpointStatus.register ? styles.successText : styles.errorText
                ]}>
                  {endpointStatus.register ? "✅" : "❌"}
                </Text>
              </View>
              <View style={styles.endpointItem}>
                <Text style={styles.endpointLabel}>Forgot Password:</Text>
                <Text style={[
                  styles.endpointStatus,
                  endpointStatus.forgotPassword ? styles.successText : styles.errorText
                ]}>
                  {endpointStatus.forgotPassword ? "✅" : "❌"}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/auth/login")}
          >
            <Ionicons name="log-in" size={20} color="#0F4D3A" />
            <Text style={styles.actionButtonText}>Go to Login</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/(protected)/customer")}
          >
            <Ionicons name="person" size={20} color="#0F4D3A" />
            <Text style={styles.actionButtonText}>Go to Customer Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F4D3A",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#374151",
    fontFamily: "monospace",
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F4D3A",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  testButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  statusCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  successText: {
    color: "#16a34a",
  },
  errorText: {
    color: "#dc2626",
  },
  endpointCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  endpointTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  endpointItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  endpointLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  endpointStatus: {
    fontSize: 16,
    fontWeight: "600",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  actionButtonText: {
    color: "#0F4D3A",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
});