import { Ionicons } from "@expo/vector-icons";
import { router, Stack, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CustomerLayout() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const navigationItems = [
    { id: "dashboard", label: "Home", icon: "qr-code", route: "/(protected)/customer" },
    { id: "wallet", label: "Wallet", icon: "wallet", route: "/(protected)/customer/customer-wallet" },
    { id: "stores", label: "Stores", icon: "location", route: "/(protected)/customer/stores" },
    { id: "rewards", label: "Rewards", icon: "gift", route: "/(protected)/customer/rewards" },
    { id: "profile", label: "Profile", icon: "person", route: "/(protected)/customer/customer-profile" },
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
                  color={isActive ? "#FFFFFF" : "#0F4D3A"}
                />
                <Text style={[styles.navText, isActive && styles.activeNavText]}>
                  {item.label}
                </Text>
                {/* Active indicator */}
                {isActive && <View style={styles.activeIndicator} />}
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
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
  },
  navigation: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: "space-around",
    alignItems: "center",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginHorizontal: 2,
    position: "relative",
  },
  activeNavItem: {
    backgroundColor: "#0F4D3A",
  },
  navItemContent: {
    alignItems: "center",
    position: "relative",
  },
  navText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#0F4D3A",
    marginTop: 4,
    textAlign: "center",
  },
  activeNavText: {
    color: "#FFFFFF",
  },
  activeIndicator: {
    position: "absolute",
    top: -2,
    left: "50%",
    marginLeft: -4,
    width: 8,
    height: 3,
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
  },
});
