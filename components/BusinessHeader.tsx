import React from 'react';
import {
    Image,
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
}

export default function BusinessHeader({
  title,
  subtitle,
  user,
  showProfile = true,
  rightAction,
  backgroundColor = '#0F4D3A',
  onProfilePress,
}: BusinessHeaderProps) {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />
      <View style={[styles.header, { backgroundColor }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>{title}</Text>
            {subtitle && (
              <Text style={styles.headerSubtitle}>{subtitle}</Text>
            )}
          </View>
          
          <View style={styles.headerRight}>
            {rightAction}
            
            {showProfile && (
              <TouchableOpacity 
                style={styles.profileButton}
                onPress={onProfilePress}
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
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
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
  },
  profileButton: {
    padding: 4,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePlaceholderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
