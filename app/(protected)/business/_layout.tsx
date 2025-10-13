"use client"

import { Ionicons } from "@expo/vector-icons";
import { router, Stack, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const bottomNavItems = [
  { id: "overview", label: "Tổng quan", icon: "home", route: "/(protected)/business" },
  { id: "wallet", label: "Ví", icon: "wallet", route: "/(protected)/business/wallet" },
  { id: "inventory", label: "Kho", icon: "cube", route: "/(protected)/business/inventory" },
  { id: "more", label: "Thêm", icon: "settings", route: "/(protected)/business/more" },
];

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("overview");

  // Function to get active tab based on pathname
  const getActiveTab = (path: string) => {
    if (path.includes("wallet")) return "wallet";
    if (path.includes("inventory")) return "inventory";
    if (path.includes("more")) return "more";
    if (path.includes("business") || path === "/(protected)/business") return "overview";
    return "overview"; // default
  };

  // Update active tab based on current path
  useEffect(() => {
    const newActiveTab = getActiveTab(pathname);
    setActiveTab(newActiveTab);
  }, [pathname]);

  const handleNavigation = (route: string, itemId: string) => {
    router.push(route);
  };

  // Check if current page is overview (tương tự dashboard trong CustomerLayout)
  const isOverview = activeTab === "overview";

  return (
    <View style={styles.container}>
      {/* Status Bar - Different for overview vs other pages */}
      <StatusBar 
        barStyle={isOverview ? "light-content" : "dark-content"} 
        backgroundColor={isOverview ? "transparent" : "#ffffff"} 
        translucent={false}
      />
    
      {/* Main Content */}
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>

      {/* Bottom Navigation */}
      <View style={styles.navigation}>
        {bottomNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.navItem, isActive && styles.activeNavItem]}
              onPress={() => handleNavigation(item.route, item.id)}
            >
              <View style={styles.navItemContent}>
                <Ionicons
                  name={item.icon as any}
                  size={18}
                  color={isActive ? "#FFFFFF" : "#6B7280"}
                />
                <Text style={[styles.navText, isActive && styles.activeNavText]}>
                  {item.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    flex: 1,
  },
  navigation: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 12,
    justifyContent: "space-around",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  activeNavItem: {
    backgroundColor: "#6366f1",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  navItemContent: {
    alignItems: "center",
  },
  navText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
  activeNavText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});