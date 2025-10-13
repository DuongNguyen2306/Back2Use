import { Redirect, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthProvider";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  const router = useRouter();
  
  // Debug trạng thái xác thực
  console.log("🔐 AuthGate state:", {
    isHydrated: state.isHydrated,
    isAuthenticated: state.isAuthenticated,
    role: state.role,
    hasAccessToken: !!state.accessToken,
  });

  // Chờ trạng thái được tải (hydrated)
  if (!state.isHydrated) {
    console.log("🔐 AuthGate: Not hydrated yet, showing loading");
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  // Nếu đã xác thực, điều hướng dựa trên vai trò
  if (state.isAuthenticated) {
    console.log("🔐 AuthGate: ✅ User is authenticated, role:", state.role);
    // Điều hướng đến layout phù hợp dựa trên role
    useEffect(() => {
      if (state.role === "business") {
        router.replace("/(protected)/business");
      } else if (state.role === "customer") {
        router.replace("/(protected)/customer");
      }
    }, [state.role, router]); // Chạy lại khi role thay đổi

    return children; // Render nội dung protected sau khi điều hướng
  }
  
  // Nếu chưa xác thực, chuyển hướng đến trang đăng nhập
  console.log("🔐 AuthGate: ❌ User not authenticated, redirecting to login");
  return <Redirect href="/auth/login" />;
}


