import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "../context/AuthProvider";
import { router } from "expo-router";

export default function DevSwitcher() {
  const { actions } = useAuth();

  const enter = async (role: "customer" | "business" | "admin") => {
    await actions.enableBypass(role);
    router.replace(role === "customer" ? "/(protected)/customer" : role === "business" ? "/(protected)/business" : "/(protected)/admin");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Role Switcher (DEV)</Text>
      <TouchableOpacity style={styles.primary} onPress={() => enter("customer")}><Text style={styles.primaryText}>Enter as Customer</Text></TouchableOpacity>
      <TouchableOpacity style={styles.primary} onPress={() => enter("business")}><Text style={styles.primaryText}>Enter as Business</Text></TouchableOpacity>
      <TouchableOpacity style={styles.primary} onPress={() => enter("admin")}><Text style={styles.primaryText}>Enter as Admin</Text></TouchableOpacity>

      <View style={{ height: 16 }} />
      <TouchableOpacity style={styles.secondary} onPress={async () => { await actions.disableBypass(); }}>
        <Text style={styles.secondaryText}>Disable bypass</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondary} onPress={async () => { await actions.signOut(); router.replace("/login"); }}>
        <Text style={styles.secondaryText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "800", color: "#0F4D3A", marginBottom: 16 },
  primary: { height: 54, borderRadius: 28, backgroundColor: "#0F4D3A", alignSelf: "stretch", alignItems: "center", justifyContent: "center", marginVertical: 6 },
  primaryText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  secondary: { height: 48, borderRadius: 24, borderColor: "#E5E7EB", borderWidth: 1, alignSelf: "stretch", alignItems: "center", justifyContent: "center", marginVertical: 6, backgroundColor: "#F9FAFB" },
  secondaryText: { color: "#111827", fontWeight: "600" },
});


