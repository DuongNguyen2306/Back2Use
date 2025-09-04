import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs initialRouteName="(app)/customer-dashboard" screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="(app)/customer-dashboard" options={{ title: "Customer" }} />
    </Tabs>
  );
}
