import { User } from '@/types/auth.types';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
    Image,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import NotificationBadge from './NotificationBadge';

interface CustomerHeaderProps {
  title: string;
  subtitle?: string;
  user?: User | null;
  showProfile?: boolean;
  rightAction?: React.ReactNode;
  backgroundColor?: string;
  onProfilePress?: () => void;
  showNotifications?: boolean;
}

export default function CustomerHeader({
  title,
  subtitle,
  user,
  showProfile = true,
  rightAction,
  backgroundColor = '#00704A',
  onProfilePress,
  showNotifications = true,
}: CustomerHeaderProps) {
  const { height: screenHeight } = useWindowDimensions();
  
  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      router.push('/(protected)/customer/my-profile');
    }
  };

  // Memoize user initial to prevent unnecessary re-renders
  const userInitial = useMemo(() => {
    if (!user) return 'U';
    const name = (user as any)?.fullName || user?.name || '';
    return name.charAt(0).toUpperCase() || 'U';
  }, [user?.name, (user as any)?.fullName]);

  // Memoize header style to prevent recalculation
  const headerStyle = useMemo(() => [
    styles.header,
    {
      backgroundColor,
      minHeight: screenHeight * 0.25,
      maxHeight: screenHeight * 0.30,
    }
  ], [backgroundColor, screenHeight]);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />
      <SafeAreaView style={headerStyle}>
        {/* Background Decoration */}
        <View style={styles.backgroundDecoration}>
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
          <View style={styles.decorativeCircle3} />
        </View>
        
        <View style={styles.greetingRow}>
          {/* Left: Logo/Greeting */}
          <View style={styles.greetingLeft}>
            <Text style={styles.greetingSub} numberOfLines={1}>{title || ''}</Text>
            {subtitle && (
              <Text style={styles.greetingNice} numberOfLines={1}>{subtitle}</Text>
            )}
          </View>
          
          {/* Right: Notifications + Avatar */}
          <View style={styles.greetingRight}>
            {rightAction}
            
            {/* Notifications Button */}
            {showNotifications && (
              <NotificationBadge iconColor="#FFFFFF" />
            )}
            
            {/* Avatar Button - Navigate to Menu/Profile */}
            {showProfile && (
              <TouchableOpacity 
                style={styles.avatarLg}
                onPress={handleProfilePress}
                activeOpacity={0.7}
              >
                {user?.avatar ? (
                  <Image 
                    source={{ uri: user.avatar }} 
                    style={styles.avatarLgImage}
                    onError={() => {
                      // Fallback to initial if image fails to load
                      console.log('Avatar image failed to load');
                    }}
                  />
                ) : (
                  <Text style={styles.avatarLgText}>
                    {userInitial}
                  </Text>
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
    backgroundColor: '#00704A',
    paddingHorizontal: 24,
    paddingTop: 5,
    paddingBottom: 40, // Increased to accommodate floating card
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    top: -40,
    right: -20,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    bottom: -20,
    left: -10,
  },
  decorativeCircle3: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    top: '50%',
    right: 30,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    zIndex: 1,
  },
  brandTitle: {
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 2,
    fontSize: 14,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    zIndex: 1,
  },
  greetingLeft: {
    flex: 1,
    paddingRight: 16,
  },
  greetingSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 4,
  },
  greetingNice: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 24,
  },
  greetingRight: {
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
  avatarLg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarLgText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#00704A',
  },
  avatarLgImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
});