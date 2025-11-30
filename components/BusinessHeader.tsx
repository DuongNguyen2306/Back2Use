import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    Image,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { User } from '@/types/auth.types';

interface BusinessHeaderProps {
  title: string;
  subtitle?: string;
  user?: User | null;
  showProfile?: boolean;
  rightAction?: React.ReactNode;
  backgroundColor?: string;
  onProfilePress?: () => void;
  showNotifications?: boolean;
}

export default function BusinessHeader({
  title,
  subtitle,
  user,
  showProfile = true,
  rightAction,
  backgroundColor = '#00704A',
  onProfilePress,
  showNotifications = true,
}: BusinessHeaderProps) {
  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      router.push('/(protected)/business/menu');
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />
      <SafeAreaView style={[styles.header, { backgroundColor }]}>
        <View style={styles.headerContent}>
          {/* Left: Title/Subtitle */}
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>{title}</Text>
            {subtitle && (
              <Text style={styles.headerSubtitle}>{subtitle}</Text>
            )}
          </View>
          
          {/* Right: Notifications + Avatar */}
          <View style={styles.headerRight}>
            {rightAction}
            
            {/* Notifications Button */}
            {showNotifications && (
              <TouchableOpacity 
                style={styles.notificationButton}
                onPress={() => router.push('/(protected)/business/notifications')}
              >
                <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            
            {/* Avatar Button - Navigate to Menu/Profile */}
            {showProfile && (
              <TouchableOpacity 
                style={styles.profileButton}
                onPress={handleProfilePress}
              >
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <Text style={styles.profilePlaceholderText}>
                      {(user?.name || user?.fullName || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
    paddingRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 16,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    padding: 2,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profilePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profilePlaceholderText: {
    color: '#00704A',
    fontSize: 18,
    fontWeight: '600',
  },
});
