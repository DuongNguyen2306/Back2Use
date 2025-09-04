import { StyleSheet, View, ViewStyle } from "react-native";

export function Progress({ value = 0, style }: { value?: number; style?: ViewStyle }) {
  return (
    <View style={[styles.track, style]}>
      <View style={[styles.bar, { width: `${Math.min(100, Math.max(0, value))}%` }]} />
    </View>
  );
}
const styles = StyleSheet.create({
  track: { height: 8, backgroundColor: "#E5E7EB", borderRadius: 999 },
  bar: { height: 8, backgroundColor: "#2563EB", borderRadius: 999 }
});
