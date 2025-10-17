import { Ionicons } from "@expo/vector-icons";
import { router, Stack, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function BusinessLayout() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const navigationItems = [
    { id: "dashboard", label: "Home", icon: "home-button", route: "/(protected)/business" },
    { id: "wallet", label: "Wallet", icon: "wallet", route: "/(protected)/business/wallet" },
    { id: "transaction", label: "Transaction", icon: "receipt", route: "/(protected)/business/transaction" },
    { id: "redeem", label: "Redeem", icon: "gift", route: "/(protected)/business/redeem" },
    { id: "settings", label: "Settings", icon: "settings", route: "/(protected)/business/settings" },
  ];

  // Function to get active tab based on pathname
  const getActiveTab = (path: string) => {
    if (path.includes("wallet")) return "wallet";
    if (path.includes("transaction")) return "transaction";
    if (path.includes("redeem")) return "redeem";
    if (path.includes("settings")) return "settings";
    if (path.includes("business") || path === "/(protected)/business") return "dashboard";
    
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
              {item.icon === "home-button" ? (
                <Image
                  source={require("../../../assets/images/home-button.png")}
                  style={{ 
                    width: 18, 
                    height: 18,
                    tintColor: isActive ? "#00704A" : "#FFFFFF"
                  }}
                />
              ) : (
                <Ionicons
                  name={item.icon as any}
                  size={18}
                  color={isActive ? "#00704A" : "#FFFFFF"}
                />
              )}
              {isActive && (
                <Text style={[styles.navText, styles.activeNavText]}>
                  {item.label}
                </Text>
              )}
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
    backgroundColor: "#00704A",
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 24,
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
    paddingVertical: 6,
    paddingHorizontal: 4,
    position: "relative",
  },
  activeNavItem: {
    backgroundColor: "#A8E063",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  navItemContent: {
    alignItems: "center",
  },
  navText: {
    fontSize: 9,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
    textAlign: "center",
  },
  activeNavText: {
    color: "#00704A",
    fontWeight: "700",
    marginTop: 2,
    fontSize: 9,
  },
});
