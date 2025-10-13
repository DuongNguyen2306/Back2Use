"use client"

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../../../context/AuthProvider";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function BusinessDashboard() {
  console.log("BusinessDashboard rendered");
  const { state } = useAuth();
  
  const [userData] = useState({
    name: "Business Owner",
    email: "business@example.com",
    avatar: "https://via.placeholder.com/100"
  });

  // Function to get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "Chào buổi sáng";
    } else if (hour < 18) {
      return "Chào buổi trưa";
    } else {
      return "Chào buổi tối";
    }
  };

  // Mock data for business stats
  const businessStats = {
    totalRevenue: 12500000,
    totalOrders: 156,
    totalCustomers: 89,
    totalProducts: 234
  };

  const quickActions = [
    {
      id: "wallet",
      title: "Ví Business",
      subtitle: "Quản lý tài chính",
      icon: "wallet",
      color: "#10B981",
      route: "/(protected)/business/wallet"
    },
    {
      id: "inventory",
      title: "Quản lý kho",
      subtitle: "Sản phẩm & hàng hóa",
      icon: "cube",
      color: "#3B82F6",
      route: "/(protected)/business/inventory"
    },
    {
      id: "orders",
      title: "Đơn hàng",
      subtitle: "Theo dõi giao dịch",
      icon: "receipt",
      color: "#F59E0B",
      route: "/(protected)/business/transactions"
    },
    {
      id: "settings",
      title: "Cài đặt",
      subtitle: "Tùy chỉnh hệ thống",
      icon: "settings",
      color: "#8B5CF6",
      route: "/(protected)/business/more"
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: "order",
      title: "Đơn hàng mới #12345",
      time: "2 phút trước",
      amount: 250000
    },
    {
      id: 2,
      type: "payment",
      title: "Thanh toán thành công",
      time: "15 phút trước",
      amount: 500000
    },
    {
      id: 3,
      type: "inventory",
      title: "Cập nhật kho hàng",
      time: "1 giờ trước",
      amount: 0
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header with Background */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80' }}
        style={styles.header}
        imageStyle={styles.headerImage}
      >
        <View style={styles.headerOverlay}>
          <View style={styles.headerContent}>
            <View style={styles.greetingSection}>
              <Text style={styles.greeting}>{getTimeBasedGreeting()}</Text>
              <Text style={styles.userName}>{userData.name}</Text>
              <Text style={styles.userEmail}>{userData.email}</Text>
            </View>
            
            <TouchableOpacity style={styles.profileButton}>
              <Ionicons name="person-circle" size={40} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#10B981' }]}>
              <Ionicons name="trending-up" size={24} color="#FFFFFF" />
              <Text style={styles.statValue}>{formatCurrency(businessStats.totalRevenue)}</Text>
              <Text style={styles.statLabel}>Doanh thu</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: '#3B82F6' }]}>
              <Ionicons name="receipt" size={24} color="#FFFFFF" />
              <Text style={styles.statValue}>{businessStats.totalOrders}</Text>
              <Text style={styles.statLabel}>Đơn hàng</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#F59E0B' }]}>
              <Ionicons name="people" size={24} color="#FFFFFF" />
              <Text style={styles.statValue}>{businessStats.totalCustomers}</Text>
              <Text style={styles.statLabel}>Khách hàng</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: '#8B5CF6' }]}>
              <Ionicons name="cube" size={24} color="#FFFFFF" />
              <Text style={styles.statValue}>{businessStats.totalProducts}</Text>
              <Text style={styles.statLabel}>Sản phẩm</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={() => router.push(action.route as any)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                  <Ionicons name={action.icon as any} size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
          <View style={styles.activitiesList}>
            {recentActivities.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons 
                    name={
                      activity.type === 'order' ? 'receipt' :
                      activity.type === 'payment' ? 'card' : 'cube'
                    } 
                    size={20} 
                    color="#6B7280" 
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
                {activity.amount > 0 && (
                  <Text style={styles.activityAmount}>
                    {formatCurrency(activity.amount)}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    height: 200,
  },
  headerImage: {
    opacity: 0.8,
  },
  headerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 2,
  },
  profileButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (screenWidth - 60) / 2,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  activitiesList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
});