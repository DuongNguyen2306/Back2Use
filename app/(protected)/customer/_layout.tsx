import { Ionicons } from "@expo/vector-icons";
import { router, Stack, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CustomerLayout() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const navigationItems = [
    { id: "dashboard", label: "Trang chủ", icon: "home", route: "/(protected)/customer" },
    { id: "wallet", label: "Ví", icon: "wallet", route: "/(protected)/customer/customer-wallet" },
    { id: "stores", label: "Cửa hàng", icon: "storefront", route: "/(protected)/customer/stores" },
    { id: "rewards", label: "Thưởng", icon: "gift", route: "/(protected)/customer/rewards" },
    { id: "profile", label: "Hồ sơ", icon: "person", route: "/(protected)/customer/customer-profile" },
  ];

  // Function to get active tab based on pathname
  const getActiveTab = (path: string) => {
    if (path.includes("customer-wallet")) return "wallet";
    if (path.includes("stores")) return "stores";
    if (path.includes("rewards")) return "rewards";
    if (path.includes("customer-profile")) return "profile";
    if (path.includes("customer") || path === "/(protected)/customer") return "dashboard";
    
    return "dashboard"; // default
  };

  // Update active tab based on current path
  useEffect(() => {
    const newActiveTab = getActiveTab(pathname);
    setActiveTab(newActiveTab);
  }, [pathname]);

  const handleNavigation = (route: string, itemId: string) => {
    if (activeTab === itemId) {
      // If clicking on active tab, reload the page
      router.replace(route);
    } else {
      // Navigate to new tab
      router.push(route);
    }
  };

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
      

      {/* Bottom Navigation */}
      <View style={styles.navigation}>
        {navigationItems.map((item) => {
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
                  size={20}
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
    paddingVertical: 12,
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
    paddingVertical: 10,
  },
  activeNavItem: {
    backgroundColor: "#10B981",
    borderRadius: 16,
    marginHorizontal: 6,
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
  },
});
