import { Ionicons } from "@expo/vector-icons";
import { router, Stack, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../../context/AuthProvider";

export default function BusinessLayout() {
  const pathname = usePathname();
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // All navigation items - Standard 5 tabs for business (includes Transaction)
  const allNavigationItems = [
    { id: "dashboard", label: "Home", icon: "home-button", route: "/(protected)/business" },
    { id: "wallet", label: "Wallet", icon: "wallet", route: "/(protected)/business/wallet" },
    { id: "transaction", label: "Transaction", icon: "swap-horizontal", route: "/(protected)/business/transaction-processing" },
    { id: "materials", label: "Inventory", icon: "cube", route: "/(protected)/business/materials" },
    { id: "menu", label: "Menu", icon: "reorder-three", route: "/(protected)/business/menu" },
  ];

  // Normalize role: handle both array and string formats
  const normalizedRole = Array.isArray(auth.state.role) ? auth.state.role[0] : auth.state.role;
  const isStaff = normalizedRole === 'staff';

  // Filter navigation items based on role
  // Staff: only dashboard, menu (profile) - QR button will be floating in center
  // Business: all items (Home, Wallet, Inventory, Menu)
  const navigationItems = isStaff
    ? allNavigationItems.filter(item => 
        item.id === 'dashboard' || 
        item.id === 'menu'
      )
    : allNavigationItems;

  // Function to get active tab based on pathname
  const getActiveTab = (path: string) => {
    if (path.includes("menu") || path.includes("my-profile")) return "menu";
    if (path.includes("wallet")) return "wallet";
    if (path.includes("materials") || path.includes("inventory")) return "materials";
    if (path.includes("transaction") || path.includes("transaction-processing")) return "transaction";
    if (path.includes("business") || path === "/(protected)/business" || path.includes("overview") || path.includes("business-dashboard")) return "dashboard";
    
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

  const handleQRPress = () => {
    // Navigate to QR scanner with mode switcher
    router.push('/(protected)/business/qr-scanner');
  };

  // Check if current page is dashboard
  const isDashboard = activeTab === "dashboard";
  
  // Hide bottom navigation only for qr-scanner screen (full-screen camera)
  const shouldHideBottomNav = pathname.includes("qr-scanner");

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
    

    {/* Bottom Navigation - Hidden for sub-screens */}
    {!shouldHideBottomNav && (
    <View style={styles.navWrapper}>
      <View style={[styles.navigation, isStaff && styles.navigationWithQR]}>
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
      
      {/* Floating QR Button for Staff - Center of navigation */}
      {isStaff && (
        <TouchableOpacity
          style={styles.floatingQRButton}
          onPress={handleQRPress}
          activeOpacity={0.8}
        >
          <View style={styles.qrButtonInner}>
            <Ionicons name="qr-code" size={28} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      )}
      </View>
    </View>
    )}
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
    position: "relative",
  },
  navigationWithQR: {
    justifyContent: "space-around",
    paddingHorizontal: 8,
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
  floatingQRButton: {
    position: "absolute",
    bottom: 20,
    left: "50%",
    marginLeft: -32,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#00FF88",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#00FF88",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 15,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    zIndex: 1000,
  },
  qrButtonInner: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#00FF88",
  },
});
