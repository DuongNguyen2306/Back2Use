import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

export function Button({
  children, onPress, disabled, variant = "primary", style
}: {
  children: ReactNode; onPress?: () => void; disabled?: boolean;
  variant?: "primary" | "secondary" | "eco"; style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        variant === "secondary" && { backgroundColor: "#E5E7EB" },
        variant === "eco" && { backgroundColor: "#22C55E" },
        disabled && { opacity: 0.6 },
        style
      ]}
    >
      <Text style={[styles.text, variant === "secondary" && { color: "#111827" }]}>{children}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  btn: { backgroundColor: "#111827", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, alignItems: "center" },
  text: { color: "#fff", fontWeight: "700" }
});
