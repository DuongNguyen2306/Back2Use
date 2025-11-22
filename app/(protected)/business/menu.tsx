import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../../context/AuthProvider';
import { useToast } from '../../../hooks/use-toast';
import { authApi } from '../../../lib/api';
import { businessesApi } from '../../../src/services/api/businessService';
import { BusinessProfile } from '../../../src/types/business.types';

const { width } = Dimensions.get('window');

export default function BusinessMenu() {
  const auth = useAuth();
  const { toast } = useToast();
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedHelp, setExpandedHelp] = useState(false);
  const [expandedSettings, setExpandedSettings] = useState(false);

  useEffect(() => {
    const loadBusinessData = async () => {
      if (!auth.state.isHydrated) {
        return;
      }
      
      if (auth.state.accessToken && auth.state.isAuthenticated && auth.state.role === 'business') {
        try {
          const profileResponse = await businessesApi.getProfileWithAutoRefresh();
          if (profileResponse.data && profileResponse.data.business) {
            setBusinessProfile(profileResponse.data.business);
          }
        } catch (error) {
          console.error('Error loading business profile:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadBusinessData();
  }, [auth.state.isHydrated, auth.state.accessToken, auth.state.isAuthenticated, auth.state.role]);

  const handleSwitchRole = async () => {
    try {
      console.log(`🔄 Switching role to: customer`);
      
      const response = await authApi.switchRole({ role: 'customer' });
      
      if (response.data?.accessToken && response.data?.refreshToken) {
        // Save new tokens
        await AsyncStorage.setItem('ACCESS_TOKEN', response.data.accessToken);
        await AsyncStorage.setItem('REFRESH_TOKEN', response.data.refreshToken);
        
        // Update role in auth state
        const newRole = response.data.user?.role as 'customer' | 'business' | 'admin';
        if (newRole) {
          await auth.actions.updateRole(newRole);
        }
        
        // Calculate token expiry (1 hour from now)
        const tokenExpiry = Date.now() + (60 * 60 * 1000);
        await AsyncStorage.setItem('TOKEN_EXPIRY', tokenExpiry.toString());
        
        toast({
          title: "Success",
          description: "Switched to customer account",
        });
        
        // Redirect to customer dashboard
        router.replace('/(protected)/customer');
      } else {
        throw new Error('No token received from server');
      }
    } catch (error: any) {
      console.error('❌ Switch role error:', error);
      toast({
        title: "Error",
        description: error.message || "Unable to switch account. Please try again.",
      });
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await auth.actions.logout();
              router.replace('/welcome');
            } catch (error) {
              console.error('Error during logout:', error);
              router.replace('/welcome');
            }
          },
        },
      ]
    );
  };

  const shortcuts = [
    {
      id: 'inventory',
      icon: 'cube-outline',
      label: 'Inventory Management',
      color: '#3B82F6',
      onPress: () => router.push('/(protected)/business/inventory'),
    },
    {
      id: 'wallet',
      icon: 'wallet-outline',
      label: 'Business Wallet',
      color: '#10B981',
      onPress: () => router.push('/(protected)/business/wallet'),
    },
    {
      id: 'analytics',
      icon: 'analytics-outline',
      label: 'Reports & Analytics',
      color: '#F59E0B',
      onPress: () => router.push('/(protected)/business/analytics'),
    },
    {
      id: 'subscription',
      icon: 'card-outline',
      label: 'Subscription',
      color: '#8B5CF6',
      onPress: () => {
        // Navigate to subscription or show modal
        router.push('/(protected)/business/settings');
      },
    },
    {
      id: 'qr',
      icon: 'qr-code-outline',
      label: 'Generate QR Code',
      color: '#EF4444',
      onPress: () => {
        // Navigate to QR code generator
        Alert.alert('Generate QR Code', 'Feature under development');
      },
    },
    {
      id: 'notifications',
      icon: 'notifications-outline',
      label: 'Notifications',
      color: '#06B6D4',
      onPress: () => router.push('/(protected)/business/notifications'),
    },
  ];

  const userName = businessProfile?.businessName || 
                   businessProfile?.userId?.username || 
                   'User Name';
  const userAvatar = businessProfile?.businessLogoUrl || 
                     businessProfile?.userId?.avatar || 
                     null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00704A" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerIconButton}
            onPress={() => router.push('/(protected)/business/settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIconButton}
            onPress={() => {
              Alert.alert('Search', 'Feature under development');
            }}
          >
            <Ionicons name="search-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <TouchableOpacity 
          style={styles.profileCard}
          onPress={() => router.push('/(protected)/business/my-profile')}
        >
          <View style={styles.profileCardContent}>
            <View style={styles.profileLeft}>
              <Image
                source={{ 
                  uri: userAvatar || 'https://via.placeholder.com/80' 
                }}
                style={styles.avatar}
              />
              <Text style={styles.userName}>{userName}</Text>
            </View>
            <TouchableOpacity 
              style={styles.switchRoleButton}
              onPress={(e) => {
                e.stopPropagation();
                handleSwitchRole();
              }}
            >
              <Ionicons name="swap-horizontal" size={20} color="#00704A" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Shortcuts Grid */}
        <View style={styles.shortcutsGrid}>
          {shortcuts.map((shortcut) => (
            <TouchableOpacity
              key={shortcut.id}
              style={styles.shortcutCard}
              onPress={shortcut.onPress}
            >
              <View style={[styles.shortcutIconContainer, { backgroundColor: `${shortcut.color}15` }]}>
                <Ionicons name={shortcut.icon as any} size={32} color={shortcut.color} />
              </View>
              <Text style={styles.shortcutLabel}>{shortcut.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Collapsible Settings List */}
        <View style={styles.settingsList}>
          <TouchableOpacity
            style={styles.settingsListItem}
            onPress={() => setExpandedHelp(!expandedHelp)}
          >
            <View style={styles.settingsListItemLeft}>
              <Ionicons name="help-circle-outline" size={24} color="#00704A" />
              <Text style={styles.settingsListItemText}>Help & Support</Text>
            </View>
            <Ionicons 
              name={expandedHelp ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#6B7280" 
            />
          </TouchableOpacity>
          {expandedHelp && (
            <View style={styles.expandedContent}>
              <TouchableOpacity 
                style={styles.expandedItem}
                onPress={() => router.push('/(protected)/business/help')}
              >
                <Text style={styles.expandedItemText}>FAQ</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.expandedItem}
                onPress={() => router.push('/(protected)/business/contact')}
              >
                <Text style={styles.expandedItemText}>Contact Support</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.settingsListItem}
            onPress={() => setExpandedSettings(!expandedSettings)}
          >
            <View style={styles.settingsListItemLeft}>
              <Ionicons name="settings-outline" size={24} color="#00704A" />
              <Text style={styles.settingsListItemText}>Settings & Privacy</Text>
            </View>
            <Ionicons 
              name={expandedSettings ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#6B7280" 
            />
          </TouchableOpacity>
          {expandedSettings && (
            <View style={styles.expandedContent}>
              <TouchableOpacity 
                style={styles.expandedItem}
                onPress={() => router.push('/(protected)/business/settings')}
              >
                <Text style={styles.expandedItemText}>Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.expandedItem}
                onPress={() => router.push('/(protected)/business/privacy')}
              >
                <Text style={styles.expandedItemText}>Privacy</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#00704A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  switchRoleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5F7F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00704A',
  },
  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  shortcutCard: {
    width: (width - 48) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  shortcutIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shortcutLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
  },
  settingsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingsListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingsListItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsListItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 12,
  },
  expandedContent: {
    backgroundColor: '#F9FAFB',
    paddingLeft: 52,
  },
  expandedItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  expandedItemText: {
    fontSize: 14,
    color: '#6B7280',
  },
  logoutButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  bottomSpacing: {
    height: 100,
  },
});

