import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthProvider';
import { useToast } from '../../../hooks/use-toast';
import { authApi, SubscriptionPackage } from '../../../lib/api';
import { businessesApi, subscriptionsApi } from '../../../src/services/api/businessService';
import { staffApi, StaffProfile } from '../../../src/services/api/staffService';
import { BusinessProfile } from '../../../src/types/business.types';

const { width } = Dimensions.get('window');

export default function BusinessMenu() {
  const { bottom } = useSafeAreaInsets();
  const auth = useAuth();
  const { toast } = useToast();
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedHelp, setExpandedHelp] = useState(false);
  const [expandedSettings, setExpandedSettings] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptions, setSubscriptions] = useState<SubscriptionPackage[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [buyingSubscription, setBuyingSubscription] = useState(false);
  const [buyingSubscriptionId, setBuyingSubscriptionId] = useState<string | null>(null);
  const [activeSubscription, setActiveSubscription] = useState<any[]>([]);
  const [autoRenewStates, setAutoRenewStates] = useState<Record<string, boolean>>({});
  const [activatingTrial, setActivatingTrial] = useState(false);
  const [togglingAutoRenew, setTogglingAutoRenew] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadProfileData = async () => {
      if (!auth.state.isHydrated) {
        return;
      }
      
      if (!auth.state.accessToken || !auth.state.isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        if (auth.state.role === 'business') {
          const profileResponse = await businessesApi.getProfileWithAutoRefresh();
          if (profileResponse.data) {
            if (profileResponse.data.business) {
              setBusinessProfile(profileResponse.data.business);
            }
            // Load active subscription
            if (profileResponse.data.activeSubscription) {
              const subscriptions = Array.isArray(profileResponse.data.activeSubscription) 
                ? profileResponse.data.activeSubscription 
                : [profileResponse.data.activeSubscription];
              setActiveSubscription(subscriptions);
              
              // Load auto-renew states from active subscriptions
              const autoRenewMap: Record<string, boolean> = {};
              subscriptions.forEach((sub: any) => {
                const subId = sub._id;
                if (subId) {
                  autoRenewMap[subId] = sub.autoRenew || false;
                }
              });
              setAutoRenewStates(prev => ({ ...prev, ...autoRenewMap }));
            } else {
              setActiveSubscription([]);
            }
          }
        } else if (auth.state.role === 'staff') {
          const profileResponse = await staffApi.getProfile();
          if (profileResponse.data) {
            setStaffProfile(profileResponse.data);
          }
        }
      } catch (error: any) {
        // Silently handle 403 errors
        if (error?.response?.status === 403) {
          console.log('⚠️ Access denied (403) - silently handled');
        } else if (error?.response?.status && error.response.status >= 500) {
          console.error('Error loading profile:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [auth.state.isHydrated, auth.state.accessToken, auth.state.isAuthenticated, auth.state.role]);

  const handleSwitchRole = async () => {
    try {
      console.log(`🔄 Switching role to: customer`);
      
                const response = await authApi.switchRole({ role: 'customer' });
      
      if (response.data?.accessToken && response.data?.refreshToken) {
        const newRole = response.data.user?.role as 'customer' | 'business' | 'admin';
        const tokenExpiry = Date.now() + (60 * 60 * 1000);
        
        // Use switchRoleWithTokens to update both tokens and role in auth state
        await auth.actions.switchRoleWithTokens(
          newRole || 'customer',
          response.data.accessToken,
          response.data.refreshToken,
          tokenExpiry,
          response.data.user || null
        );
        
        console.log(`✅ Role switched, waiting for token propagation...`);
        
        // Wait a bit longer to ensure token is fully propagated
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Verify token was saved correctly before redirecting
        const savedToken = await AsyncStorage.getItem('ACCESS_TOKEN');
        if (savedToken !== response.data.accessToken) {
          console.error('❌ Token mismatch after switch!');
          throw new Error('Token không được lưu đúng cách');
        }
        
        console.log(`✅ Token verified, redirecting...`);
        
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

  const loadSubscriptions = async () => {
    try {
      setLoadingSubscriptions(true);
      console.log('🔍 Loading subscriptions...');
      const response = await subscriptionsApi.getAll();
      console.log('✅ Subscriptions loaded:', response);
      
      // API returns: { statusCode: 200, message: "OK", data: [...] }
      // data is an array directly, not data.subscriptions
      let subscriptionsList: any[] = [];
      
      if (Array.isArray(response.data)) {
        // New format: data is array directly
        subscriptionsList = response.data;
      } else if (response.data?.subscriptions && Array.isArray(response.data.subscriptions)) {
        // Old format: data.subscriptions is array
        subscriptionsList = response.data.subscriptions;
      } else if (response.data && typeof response.data === 'object') {
        // Fallback: try to extract array from response.data
        subscriptionsList = [];
      }
      
      // Filter only active subscriptions
      subscriptionsList = subscriptionsList.filter((sub: any) => sub.isActive !== false);
      
      setSubscriptions(subscriptionsList);
      console.log('✅ Set subscriptions:', subscriptionsList.length);
    } catch (error: any) {
      console.error('❌ Error loading subscriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load subscriptions",
      });
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const handleSubscriptionPress = () => {
    setShowSubscriptionModal(true);
    if (subscriptions.length === 0) {
      loadSubscriptions();
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `${price.toLocaleString('vi-VN')} VNĐ`;
  };

  const formatDuration = (days: number) => {
    if (days < 30) return `${days} days`;
    if (days < 90) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''}`;
    return `${Math.floor(days / 30)} months`;
  };

  const hasActiveSubscription = () => {
    return activeSubscription && activeSubscription.length > 0 && 
           activeSubscription.some((sub: any) => {
             const status = sub.status || (sub.isActive ? 'active' : 'inactive');
             return status === 'active';
           });
  };

  const isSubscriptionActive = (packageId: string) => {
    return activeSubscription.some((sub: any) => {
      const subId = sub.subscriptionId?._id || sub.subscriptionId || sub.subscription?._id || sub.subscription;
      return subId === packageId;
    });
  };

  const handleBuySubscription = async (packageItem: SubscriptionPackage) => {
    // Check if already has active subscription
    if (hasActiveSubscription()) {
      toast({
        title: "Warning",
        description: "You already have an active subscription. Please wait for it to expire before purchasing a new one.",
      });
      return;
    }

    try {
      setBuyingSubscription(true);
      setBuyingSubscriptionId(packageItem._id);
      console.log('🛒 Buying subscription:', packageItem);
      
      const autoRenew = autoRenewStates[packageItem._id] || false;
      
      const response = await subscriptionsApi.buy({
        subscriptionId: packageItem._id,
        autoRenew: autoRenew,
      });
      
      console.log('✅ Buy subscription response:', response);
      
      toast({
        title: "Success",
        description: response.message || "Subscription purchased successfully",
      });
      
      // Reload business profile to get updated activeSubscription
      const profileResponse = await businessesApi.getProfileWithAutoRefresh();
      if (profileResponse.data?.activeSubscription) {
        const subscriptions = Array.isArray(profileResponse.data.activeSubscription) 
          ? profileResponse.data.activeSubscription 
          : [profileResponse.data.activeSubscription];
        setActiveSubscription(subscriptions);
      }
      
      setShowSubscriptionModal(false);
    } catch (error: any) {
      console.error('❌ Error buying subscription:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to purchase subscription. Please try again.",
      });
    } finally {
      setBuyingSubscription(false);
      setBuyingSubscriptionId(null);
    }
  };

  const handleActivateTrial = async () => {
    try {
      setActivatingTrial(true);
      console.log('🎁 Activating trial subscription...');
      
      const response = await subscriptionsApi.activateTrial();
      
      console.log('✅ Activate trial response:', response);
      
      toast({
        title: "Success",
        description: response.message || "Trial subscription activated successfully",
      });
      
      // Reload business profile to get updated activeSubscription
      const profileResponse = await businessesApi.getProfileWithAutoRefresh();
      if (profileResponse.data?.activeSubscription) {
        const subscriptions = Array.isArray(profileResponse.data.activeSubscription) 
          ? profileResponse.data.activeSubscription 
          : [profileResponse.data.activeSubscription];
        setActiveSubscription(subscriptions);
        
        // Update auto-renew states
        const autoRenewMap: Record<string, boolean> = {};
        subscriptions.forEach((sub: any) => {
          const subId = sub._id;
          if (subId) {
            autoRenewMap[subId] = sub.autoRenew || false;
          }
        });
        setAutoRenewStates(prev => ({ ...prev, ...autoRenewMap }));
      }
      
      setShowSubscriptionModal(false);
    } catch (error: any) {
      console.error('❌ Error activating trial:', error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to activate trial subscription. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setActivatingTrial(false);
    }
  };

  const handleToggleAutoRenew = async (subscriptionId: string, currentValue: boolean) => {
    try {
      setTogglingAutoRenew(prev => ({ ...prev, [subscriptionId]: true }));
      console.log('🔄 Toggling auto-renew for subscription:', subscriptionId);
      
      const newValue = !currentValue;
      const response = await subscriptionsApi.toggleAutoRenew(subscriptionId, {
        autoRenew: newValue,
      });
      
      console.log('✅ Toggle auto-renew response:', response);
      
      // Update local state
      setAutoRenewStates(prev => ({
        ...prev,
        [subscriptionId]: newValue,
      }));
      
      // Update active subscription data
      setActiveSubscription(prev => prev.map(sub => {
        if (sub._id === subscriptionId) {
          return { ...sub, autoRenew: newValue };
        }
        return sub;
      }));
      
      toast({
        title: "Success",
        description: newValue 
          ? "Auto-renewal has been enabled" 
          : "Auto-renewal has been disabled",
      });
    } catch (error: any) {
      console.error('❌ Error toggling auto-renew:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || error?.message || "Unable to change auto-renewal settings. Please try again.",
      });
    } finally {
      setTogglingAutoRenew(prev => ({ ...prev, [subscriptionId]: false }));
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

  // All shortcuts for business owner
  const allShortcuts = [
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
      id: 'vouchers',
      icon: 'ticket-outline',
      label: 'Vouchers',
      color: '#EC4899',
      onPress: () => router.push('/(protected)/business/vouchers'),
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
      onPress: handleSubscriptionPress,
    },
    {
      id: 'staff',
      icon: 'people-outline',
      label: 'Staff Management',
      color: '#00704A',
      onPress: () => router.push('/(protected)/business/staff-management'),
    },
    {
      id: 'notifications',
      icon: 'notifications-outline',
      label: 'Notifications',
      color: '#06B6D4',
      onPress: () => router.push('/(protected)/business/notifications'),
    },
  ];

  // Filter shortcuts based on role
  // Staff: no shortcuts (only profile section)
  // Business: all shortcuts
  const shortcuts = auth.state.role === 'staff' as any ? [] : allShortcuts;

  const userName = auth.state.role === 'staff'
    ? (staffProfile?.fullName || auth.state.user?.username || 'Staff')
    : (businessProfile?.businessName || 
       businessProfile?.userId?.username || 
       auth.state.user?.username || 
       'User Name');
  const userAvatar = auth.state.role === 'staff'
    ? (staffProfile?.avatar || null)
    : (businessProfile?.businessLogoUrl || null);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00704A" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu</Text>
        {auth.state.role !== 'staff' as any && (
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
        )}
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
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
            {auth.state.role !== 'staff' as any && (
            <TouchableOpacity 
              style={styles.switchRoleButton}
              onPress={(e) => {
                e.stopPropagation();
                handleSwitchRole();
              }}
            >
              <Ionicons name="swap-horizontal" size={20} color="#00704A" />
            </TouchableOpacity>
            )}
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

          {auth.state.role !== 'staff' as any && (
            <>
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
            </>
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Subscription Modal */}
      <Modal
        visible={showSubscriptionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSubscriptionModal(false)}
      >
        <View style={styles.subscriptionModalOverlay}>
          <View style={styles.subscriptionModalContent}>
            <View style={styles.subscriptionModalHeader}>
              <Text style={styles.subscriptionModalTitle}>Subscription Plans</Text>
              <TouchableOpacity onPress={() => setShowSubscriptionModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.subscriptionModalBody} showsVerticalScrollIndicator={false}>
              {loadingSubscriptions ? (
                <View style={styles.subscriptionLoadingContainer}>
                  <Text style={styles.subscriptionLoadingText}>Loading subscriptions...</Text>
                </View>
              ) : (
                <>
                  {/* Current Active Subscription with Auto-Renew Toggle */}
                  {activeSubscription.length > 0 && hasActiveSubscription() && activeSubscription.map((sub: any) => {
                    const subscriptionId = sub._id;
                    const subscriptionName = sub.subscriptionId?.name || sub.subscription?.name || sub.name || 'Unknown Plan';
                    const subscriptionPrice = sub.subscriptionId?.price || sub.subscription?.price || sub.price || 0;
                    const startDate = sub.startDate || sub.startAt || sub.createdAt;
                    const endDate = sub.endDate || sub.endAt || sub.expiresAt;
                    const status = sub.status || (sub.isActive ? 'active' : 'inactive');
                    const currentAutoRenew = autoRenewStates[subscriptionId] ?? sub.autoRenew ?? false;
                    const isToggling = togglingAutoRenew[subscriptionId] || false;
                    
                    if (status !== 'active') return null;
                    
                    return (
                      <View key={subscriptionId} style={styles.activeSubscriptionCard}>
                        <View style={styles.activeSubscriptionHeader}>
                          <View style={styles.activeSubscriptionIcon}>
                            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                          </View>
                          <View style={styles.activeSubscriptionInfo}>
                            <Text style={styles.activeSubscriptionTitle}>Current Subscription</Text>
                            <Text style={styles.activeSubscriptionName}>{subscriptionName}</Text>
                            {startDate && endDate && (
                              <Text style={styles.activeSubscriptionDate}>
                                {new Date(startDate).toLocaleDateString('en-US')} - {new Date(endDate).toLocaleDateString('en-US')}
                              </Text>
                            )}
                          </View>
                        </View>
                        
                        {/* Auto Renew Toggle */}
                        <View style={styles.activeAutoRenewContainer}>
                          <View style={styles.activeAutoRenewInfo}>
                            <Ionicons name="refresh" size={20} color="#00704A" />
                            <Text style={styles.activeAutoRenewLabel}>Auto Renew</Text>
                          </View>
                          <TouchableOpacity
                            style={[
                              styles.toggleSwitch,
                              currentAutoRenew && styles.toggleSwitchActive,
                              isToggling && styles.toggleSwitchDisabled
                            ]}
                            onPress={() => handleToggleAutoRenew(subscriptionId, currentAutoRenew)}
                            disabled={isToggling}
                          >
                            <View style={[
                              styles.toggleThumb,
                              currentAutoRenew && styles.toggleThumbActive
                            ]} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                  
                  {/* Activate Trial Button - Only show if no active subscription */}
                  {activeSubscription.length === 0 && !hasActiveSubscription() && (
                    <View style={styles.subscriptionPackageCard}>
                      <View style={styles.subscriptionPackageHeader}>
                        <View style={styles.subscriptionPackageIcon}>
                          <Ionicons name="gift" size={24} color="#00704A" />
                        </View>
                        <View style={styles.subscriptionPackageInfo}>
                          <Text style={styles.subscriptionPackageName}>Free Trial</Text>
                          <Text style={styles.subscriptionPackageDuration}>Try our service for free</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.subscriptionBuyButton,
                          activatingTrial && styles.subscriptionBuyButtonDisabled
                        ]}
                        onPress={handleActivateTrial}
                        disabled={activatingTrial}
                      >
                        <Text style={styles.subscriptionBuyButtonText}>
                          {activatingTrial ? 'Activating...' : 'Activate Trial'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {/* Subscription Packages */}
                  {subscriptions.length > 0 && subscriptions.map((packageItem) => (
                  <View
                    key={packageItem._id}
                    style={styles.subscriptionPackageCard}
                  >
                    <View style={styles.subscriptionPackageHeader}>
                      <View style={styles.subscriptionPackageIcon}>
                        <Ionicons 
                          name={packageItem.isTrial ? "gift" : "card"} 
                          size={24} 
                          color="#00704A" 
                        />
                      </View>
                      <View style={styles.subscriptionPackageInfo}>
                        <View style={styles.subscriptionRow}>
                          <Text style={styles.subscriptionPackageName}>{packageItem.name}</Text>
                          {packageItem.isTrial && (
                            <View style={styles.subscriptionTrialBadge}>
                              <Text style={styles.subscriptionTrialText}>TRIAL</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.subscriptionPackageDuration}>
                          {formatDuration(packageItem.durationInDays)}
                        </Text>
                      </View>
                      <View style={styles.subscriptionPackagePrice}>
                        <Text style={styles.subscriptionPriceText}>
                          {formatPrice(packageItem.price)}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.subscriptionPackageFeatures}>
                      <View style={styles.subscriptionFeatureItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.subscriptionFeatureText}>Full feature access</Text>
                      </View>
                      <View style={styles.subscriptionFeatureItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.subscriptionFeatureText}>Priority customer support</Text>
                      </View>
                      <View style={styles.subscriptionFeatureItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.subscriptionFeatureText}>Advanced analytics</Text>
                      </View>
                    </View>
                    
                    {/* Auto Renew Toggle - Only show if not active and not trial */}
                    {!isSubscriptionActive(packageItem._id) && !hasActiveSubscription() && !packageItem.isTrial && (
                      <View style={styles.autoRenewContainer}>
                        <Text style={styles.autoRenewLabel}>Auto Renew</Text>
                        <TouchableOpacity
                          style={[
                            styles.toggleSwitch,
                            autoRenewStates[packageItem._id] && styles.toggleSwitchActive
                          ]}
                          onPress={() => {
                            setAutoRenewStates(prev => ({
                              ...prev,
                              [packageItem._id]: !prev[packageItem._id]
                            }));
                          }}
                        >
                          <View style={[
                            styles.toggleThumb,
                            autoRenewStates[packageItem._id] && styles.toggleThumbActive
                          ]} />
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    {isSubscriptionActive(packageItem._id) ? (
                      <View style={[styles.subscriptionBuyButton, styles.subscriptionBuyButtonActive]}>
                        <Text style={styles.subscriptionBuyButtonText}>Currently Active</Text>
                      </View>
                    ) : hasActiveSubscription() ? (
                      <View style={[styles.subscriptionBuyButton, styles.subscriptionBuyButtonDisabled]}>
                        <Text style={styles.subscriptionBuyButtonText}>Already Have Active Plan</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.subscriptionBuyButton,
                          (buyingSubscription && buyingSubscriptionId === packageItem._id) && styles.subscriptionBuyButtonDisabled
                        ]}
                        onPress={() => handleBuySubscription(packageItem)}
                        disabled={buyingSubscription}
                      >
                        {buyingSubscription && buyingSubscriptionId === packageItem._id ? (
                          <Text style={styles.subscriptionBuyButtonText}>Processing...</Text>
                        ) : (
                          <Text style={styles.subscriptionBuyButtonText}>
                            {packageItem.price === 0 ? 'Get Free Plan' : 'Buy Now'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                  ))}
                  
                  {subscriptions.length === 0 && (
                    <View style={styles.subscriptionLoadingContainer}>
                      <Text style={styles.subscriptionLoadingText}>No subscriptions available</Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  // Subscription Modal styles
  subscriptionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  subscriptionModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  subscriptionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  subscriptionModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  subscriptionModalBody: {
    padding: 20,
  },
  subscriptionLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  subscriptionLoadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  subscriptionPackageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subscriptionPackageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscriptionPackageIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subscriptionPackageInfo: {
    flex: 1,
  },
  subscriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  subscriptionPackageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  subscriptionTrialBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  subscriptionTrialText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
  },
  subscriptionPackageDuration: {
    fontSize: 14,
    color: '#6B7280',
  },
  subscriptionPackagePrice: {
    alignItems: 'flex-end',
  },
  subscriptionPriceText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00704A',
  },
  subscriptionPackageFeatures: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  subscriptionFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionFeatureText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  subscriptionBuyButton: {
    marginTop: 16,
    backgroundColor: '#00704A',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionBuyButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  subscriptionBuyButtonActive: {
    backgroundColor: '#10B981',
  },
  subscriptionBuyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  autoRenewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  autoRenewLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#00704A',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  toggleSwitchDisabled: {
    opacity: 0.5,
  },
  // Active Subscription Card styles
  activeSubscriptionCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  activeSubscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  activeSubscriptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activeSubscriptionInfo: {
    flex: 1,
  },
  activeSubscriptionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  activeSubscriptionName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  activeSubscriptionDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  activeAutoRenewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#D1FAE5',
  },
  activeAutoRenewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeAutoRenewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
});

