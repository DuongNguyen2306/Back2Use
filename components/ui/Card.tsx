import { ReactNode } from "react";
import { StyleSheet, Text, View, ViewProps } from "react-native";

export const Card = ({ children, style }: { children: ReactNode } & ViewProps) => (
  <View style={[styles.card, style]}>{children}</View>
);
export const CardHeader = ({ children, style }: { children: ReactNode } & ViewProps) => (
  <View style={[styles.header, style]}>{children}</View>
);
export const CardTitle = ({ children, style }: { children: ReactNode } & ViewProps) => (
  <Text style={[styles.title, style as any]}>{children}</Text>
);
export const CardContent = ({ children, style }: { children: ReactNode } & ViewProps) => (
  <View style={[styles.content, style]}>{children}</View>
);

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 12, borderWidth: 0.5, borderColor: "#E5E7EB" },
  header: { marginBottom: 8 },
  title: { fontSize: 16, fontWeight: "700", color: "#111827" },
  content: { gap: 8 }
});
