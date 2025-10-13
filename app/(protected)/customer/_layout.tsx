import { Ionicons } from "@expo/vector-icons";
import { router, Stack, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, StatusBar } from "react-native";

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
    // Always navigate to the new tab, no reload needed
    router.push(route);
  };

  // Check if current page is dashboard
  const isDashboard = activeTab === "dashboard";

  return (
    <View style={styles.container}>
      {/* Status Bar - Different for dashboard vs other pages */}
      <StatusBar 
        barStyle={isDashboard ? "light-content" : "dark-content"} 
        backgroundColor={isDashboard ? "transparent" : "#ffffff"} 
        translucent={false}
      />
    
    {/* Main Content */}
    <View style={styles.content}>
      <Stack screenOptions={{ headerShown: false }} />
    </View>
    

    {/* Bottom Navigation */}
    <View style={styles.navWrapper}>
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
                size={18}
                color={"#0F4D3A"}
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
  navWrapper: {
    paddingBottom: 8,
  },
  navigation: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  activeNavItem: {
    backgroundColor: "#F3F4F6",
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
