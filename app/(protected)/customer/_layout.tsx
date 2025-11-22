import { Ionicons } from "@expo/vector-icons";
import { router, Stack, usePathname } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useI18n } from "../../../hooks/useI18n";
import { useBusinessRoleCheck } from "../../../src/hooks/useBusinessRoleCheck";
import { useAuth } from "../../../context/AuthProvider";
import { getCurrentUserProfileWithAutoRefresh } from "../../../src/services/api/userService";

export default function CustomerLayout() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { state: authState, actions: authActions } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const hasCheckedRoleRef = useRef(false);
  const isRedirectingRef = useRef(false);
  
  // Auto-check business role status (this will auto-redirect if role changes to business)
  useBusinessRoleCheck();
  
  // Force check role from backend when component mounts or when on customer screen
  useEffect(() => {
    const checkRoleFromBackend = async () => {
      // Prevent multiple checks
      if (hasCheckedRoleRef.current || isRedirectingRef.current) {
        return;
      }
      
      // Only check if authenticated and hydrated
      if (!authState.isAuthenticated || !authState.isHydrated) {
        return;
      }
      
      // Only check if on customer screen
      if (!pathname?.includes('/customer')) {
        return;
      }
      
      try {
        hasCheckedRoleRef.current = true;
        console.log('🔍 CustomerLayout: Checking role from backend...');
        console.log('🔍 Current role in state:', authState.role);
        
        // Get role from backend
        const userProfile = await getCurrentUserProfileWithAutoRefresh();
        const backendRole = userProfile?.role;
        
        console.log('🔍 Role from backend:', backendRole);
        
        if (backendRole === 'business') {
          console.log('✅ CustomerLayout: Backend role is business, updating auth state...');
          
          // Update role in auth state immediately
          await authActions.updateRole('business');
          
          // Redirect immediately without waiting
          if (!isRedirectingRef.current) {
            isRedirectingRef.current = true;
            console.log('🚀 CustomerLayout: Redirecting to business dashboard...');
            // Use replace to prevent going back
            router.replace('/(protected)/business');
          }
        } else {
          // Reset check flag if role is not business so it can check again later
          hasCheckedRoleRef.current = false;
        }
      } catch (error: any) {
        // Don't log network errors as errors - they're expected when offline
        const isNetworkError = error?.message?.toLowerCase().includes('network') ||
                               error?.message?.toLowerCase().includes('timeout') ||
                               error?.message?.toLowerCase().includes('connection');
        
        if (isNetworkError) {
          console.warn('⚠️ CustomerLayout: Network error checking role from backend (will retry later):', error.message);
        } else {
          console.error('❌ CustomerLayout: Error checking role from backend:', error);
        }
        // Reset check flag on error so it can retry
        hasCheckedRoleRef.current = false;
      }
    };
    
    // Check role immediately and also after a short delay
    checkRoleFromBackend();
    
    // Also check after a delay to catch any updates
    const timeout = setTimeout(() => {
      if (!isRedirectingRef.current) {
        checkRoleFromBackend();
      }
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, [authState.isAuthenticated, authState.isHydrated, pathname, authActions]);
  
  // Immediately redirect if user is business but on customer screen
  // This is a safety check - AuthGate should handle this, but we double-check here
  useEffect(() => {
    // Only redirect if we're on a customer screen and user is business
    const isOnCustomerScreen = pathname?.includes('/customer');
    
    if (authState.isHydrated && authState.isAuthenticated && authState.role === 'business' && isOnCustomerScreen) {
      if (!isRedirectingRef.current) {
        isRedirectingRef.current = true;
        console.log('🚀 CustomerLayout: User is business but on customer screen, redirecting to business dashboard');
        // Redirect immediately
        router.replace('/(protected)/business');
      }
    } else if (!isOnCustomerScreen || authState.role !== 'business') {
      // Reset redirect flag if we're not on customer screen or role changed
      isRedirectingRef.current = false;
    }
  }, [authState.isHydrated, authState.isAuthenticated, authState.role, pathname]);
  
  const navigationItems = [
    { id: "dashboard", label: t('navigation').home, icon: "home-button", route: "/(protected)/customer" },
    { id: "wallet", label: t('navigation').wallet, icon: "wallet", route: "/(protected)/customer/customer-wallet" },
    { id: "stores", label: t('navigation').store, icon: "storefront", route: "/(protected)/customer/stores" },
    { id: "rewards", label: t('navigation').rewards, icon: "gift", route: "/(protected)/customer/rewards" },
    { id: "profile", label: t('navigation').profile, icon: "person", route: "/(protected)/customer/my-profile" },
  ];

  // Function to get active tab based on pathname
  const getActiveTab = (path: string) => {
    if (path.includes("customer-wallet")) return "wallet";
    if (path.includes("stores")) return "stores";
    if (path.includes("rewards")) return "rewards";
    if (path.includes("my-profile")) return "profile";
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
