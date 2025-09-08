import { View, Text, StyleSheet } from "react-native";

export default function BusinessDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Business Dashboard</Text>
      <View style={styles.card}><Text style={styles.cardTitle}>Orders Today</Text><Text style={styles.cardValue}>12</Text></View>
      <View style={styles.card}><Text style={styles.cardTitle}>Scans</Text><Text style={styles.cardValue}>34</Text></View>
      <View style={styles.card}><Text style={styles.cardTitle}>Inventory Items</Text><Text style={styles.cardValue}>128</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "800", color: "#0F4D3A", marginBottom: 16 },
  card: { padding: 16, borderRadius: 12, borderColor: "#E5E7EB", borderWidth: 1, marginBottom: 12, backgroundColor: "#F9FAFB" },
  cardTitle: { fontSize: 14, color: "#374151", marginBottom: 6, fontWeight: "600" },
  cardValue: { fontSize: 20, color: "#111827", fontWeight: "700" },
});


