import { User } from '@/types/auth.types';
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

interface CustomerHeaderProps {
  title: string;
  subtitle?: string;
  user?: User | null;
  showProfile?: boolean;
  rightAction?: React.ReactNode;
  backgroundColor?: string;
  onProfilePress?: () => void;
}

export default function CustomerHeader({
  title,
  subtitle,
  user,
  showProfile = true,
  rightAction,
  backgroundColor = '#00704A',
  onProfilePress,
}: CustomerHeaderProps) {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />
      <SafeAreaView style={[styles.header, { backgroundColor }]}>
        <View style={styles.topBar}>
          <Text style={styles.brandTitle}>BACK2USE</Text>
        </View>
        
        <View style={styles.greetingRow}>
          <View style={styles.greetingLeft}>
            <Text style={styles.greetingSub}>{title}</Text>
            {subtitle && (
              <Text style={styles.greetingNice}>{subtitle}</Text>
            )}
          </View>
          
          <View style={styles.greetingRight}>
            {rightAction}
            
            {showProfile && (
              <TouchableOpacity 
                style={styles.avatarLg}
                onPress={onProfilePress}
              >
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatarLgImage} />
                ) : (
                  <Text style={styles.avatarLgText}>
                    {(user?.name || user?.fullName || 'U').charAt(0).toUpperCase()}
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
    paddingHorizontal: 16,
    paddingTop: 5,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
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
  },
  greetingLeft: {
    flex: 1,
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
  },
  avatarLg: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
