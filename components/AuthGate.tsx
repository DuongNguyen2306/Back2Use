import { Redirect, useRouter, usePathname } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View, Alert } from "react-native";
import { useAuth } from "../context/AuthProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasNavigatedRef = useRef(false);
  
  // Debug trạng thái xác thực
  console.log("🔐 AuthGate state:", {
    isHydrated: state.isHydrated,
    isAuthenticated: state.isAuthenticated,
    role: state.role,
    hasAccessToken: !!state.accessToken,
    pathname,
  });

  // Block admin access on mobile - logout and redirect to login
  useEffect(() => {
    if (state.isAuthenticated && state.isHydrated && state.role === "admin") {
      console.log("❌ AuthGate: Admin user detected on mobile - blocking access and logging out");
      
      // Logout admin user and redirect to login
      const logoutAdmin = async () => {
        try {
          // Clear auth storage
          await AsyncStorage.multiRemove([
            'AUTH',
            'ROLE',
            'ACCESS_TOKEN',
            'REFRESH_TOKEN',
            'TOKEN_EXPIRY'
          ]);
          
          // Show alert message
          Alert.alert(
            "Admin Access Restricted",
            "Admin accounts cannot be accessed on mobile devices. Please log in on the web platform.",
            [
              {
                text: "OK",
                onPress: () => {
                  // Redirect to login
                  router.replace("/auth/login");
                }
              }
            ],
            { cancelable: false }
          );
        } catch (error) {
          console.error("Error logging out admin:", error);
          router.replace("/auth/login");
        }
      };
      
      logoutAdmin();
    }
  }, [state.isAuthenticated, state.isHydrated, state.role, router]);

  // Điều hướng đến layout phù hợp dựa trên role
  // IMPORTANT: useEffect must be called at top level, not inside conditional
  useEffect(() => {
    // Only redirect if authenticated, hydrated, and have a role (and not admin)
    if (!state.isAuthenticated || !state.isHydrated || !state.role || hasNavigatedRef.current || state.role === "admin") {
      return;
    }
    
    // Check if user is on wrong role screen
    const isOnCustomerScreen = pathname?.includes('/customer');
    const isOnBusinessScreen = pathname?.includes('/business');
    const isOnAdminScreen = pathname?.includes('/admin');
    
    // Only redirect if user is on wrong screen for their role
    if (state.role === "business") {
      // If user is business but on customer or admin screen, redirect to business
      if (isOnCustomerScreen || isOnAdminScreen) {
        console.log("🔄 AuthGate: User is business but on wrong screen, redirecting to business dashboard");
        hasNavigatedRef.current = true;
        router.replace("/(protected)/business");
      }
      // If already on business screen, do nothing
    } else if (state.role === "customer") {
      // If user is customer but on business or admin screen, redirect to customer
      if (isOnBusinessScreen || isOnAdminScreen) {
        console.log("🔄 AuthGate: User is customer but on wrong screen, redirecting to customer dashboard");
        hasNavigatedRef.current = true;
        router.replace("/(protected)/customer");
      }
      // If already on customer screen, do nothing
    }
    
    // Reset navigation flag after navigation completes
    const timeout = setTimeout(() => {
      hasNavigatedRef.current = false;
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [state.role, pathname, router, state.isHydrated, state.isAuthenticated]);

  // Chờ trạng thái được tải (hydrated)
  if (!state.isHydrated) {
    console.log("🔐 AuthGate: Not hydrated yet, showing loading");
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  // Nếu đã xác thực, kiểm tra role admin (block admin on mobile)
  if (state.isAuthenticated) {
    console.log("🔐 AuthGate: ✅ User is authenticated, role:", state.role);
    
    // Block admin access on mobile - show loading while logging out
    if (state.role === "admin") {
      console.log("❌ AuthGate: Admin user detected on mobile - blocking access");
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20 }}>
          <ActivityIndicator />
        </View>
      );
    }
    
    return <>{children}</>;
  }
  
  // Nếu chưa xác thực, chuyển hướng đến trang đăng nhập
  console.log("🔐 AuthGate: ❌ User not authenticated, redirecting to login");
  return <Redirect href="/auth/login" />;
}


