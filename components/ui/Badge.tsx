import { ReactNode } from "react";
import { StyleSheet, Text, View, ViewProps } from "react-native";

export function Badge({
  children, variant = "secondary", style,
}: { children: ReactNode; variant?: "secondary" | "success"; style?: ViewProps["style"] }) {
  return (
    <View
      style={[
        styles.badge,
        variant === "success" ? { backgroundColor: "#DCFCE7" } : { backgroundColor: "#F1F5F9" },
        style,
      ]}
    >
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  text: { fontSize: 12, color: "#111827", fontWeight: "600" },
});
