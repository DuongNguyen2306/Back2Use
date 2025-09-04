import { ReactNode } from "react";
import { Platform, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function MobileLayout({ children, title = "BC2U", showHeader = true }:{
  children: ReactNode; title?: string; showHeader?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const isNative = Platform.OS !== "web";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {showHeader && (
        <SafeAreaView style={[styles.headerSafe, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {isNative && <View style={styles.badge}><Text style={styles.badgeText}>Native</Text></View>}
          </View>
        </SafeAreaView>
      )}
      <View style={[styles.content, { paddingBottom: insets.bottom }]}>{children}</View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerSafe: { backgroundColor: "rgba(255,255,255,0.95)", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb" },
  header: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  badge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: "rgba(37,99,235,0.1)", borderRadius: 6 },
  badgeText: { fontSize: 12, color: "#2563eb", fontWeight: "600" },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 }
});
