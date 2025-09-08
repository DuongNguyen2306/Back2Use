import { StyleSheet, Text, View } from "react-native";
import MobileLayout from "../components/MobileLayout";
import MobileOptimizedCustomerApp from "../components/MobileOptimizedCustomerApp";
import NativeQRScanner from "../components/NativeQRScanner";

export default function HomeScreen() {
  return (
    <MobileLayout>
      <View style={styles.container}>
        <Text style={styles.welcomeText}>Welcome to Back2Use!</Text>
        <MobileOptimizedCustomerApp />
        <NativeQRScanner />
      </View>
    </MobileLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  welcomeText: { fontSize: 24, fontWeight: "bold", color: "#0F4D3A", textAlign: "center", marginBottom: 20 },
});


