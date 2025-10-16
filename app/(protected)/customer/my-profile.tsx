import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../../context/AuthProvider';

const { width } = Dimensions.get('window');

interface MenuItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function MyProfile() {
  const auth = useAuth();
  const user = { 
    name: "User Name", 
    email: "email@example.com", 
    avatar: null,
    isVerified: true
  }; // Mock user for now

  const achievements = [
    { id: 'loyalty', icon: 'star', color: '#FFD700', title: 'VIP Member' },
    { id: 'points', icon: 'diamond', color: '#FF6B6B', title: '1000 Points' },
    { id: 'streak', icon: 'flame', color: '#FF8C00', title: '7 Day Streak' },
    { id: 'eco', icon: 'leaf', color: '#32CD32', title: 'Eco Warrior' },
  ];

  const menuSections: MenuSection[] = [
    {
      title: 'General Settings',
      items: [
        {
          id: 'account',
          title: 'Account Settings',
          subtitle: 'Update information and edit profile',
          icon: 'person-circle',
          onPress: () => console.log('Navigate to Account Settings'),
        },
        {
          id: 'security',
          title: 'Security',
          subtitle: 'Password, 2FA authentication and privacy',
          icon: 'shield-checkmark',
          onPress: () => console.log('Navigate to Security'),
        },
        {
          id: 'notifications',
          title: 'Notifications',
          subtitle: 'Manage notifications and sound settings',
          icon: 'notifications',
          onPress: () => console.log('Navigate to Notifications'),
        },
      ]
    },
    {
      title: 'Activity',
      items: [
        {
          id: 'rank',
          title: 'View Rankings',
          subtitle: 'Leaderboard and your ranking position',
          icon: 'trophy',
          onPress: () => router.push('/(protected)/customer/leaderboard'),
        },
        {
          id: 'history',
          title: 'Activity History',
          subtitle: 'View transaction and activity history',
          icon: 'time',
          onPress: () => console.log('Navigate to History'),
        },
        {
          id: 'rewards',
          title: 'Rewards',
          subtitle: 'Points, vouchers and special offers',
          icon: 'gift',
          onPress: () => router.push('/(protected)/customer/rewards'),
        },
        {
          id: 'ai-chat',
          title: 'AI Chat',
          subtitle: 'Chat with smart AI Assistant',
          icon: 'chatbubble-ellipses',
                        onPress: () => router.push('/(protected)/customer/ai-chat'),
        },
      ]
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help',
          subtitle: 'FAQ, guides and contact support',
          icon: 'help-circle',
          onPress: () => console.log('Navigate to Help'),
        },
        {
          id: 'about',
          title: 'About App',
          subtitle: 'Version, terms and policies',
          icon: 'information-circle',
          onPress: () => console.log('Navigate to About'),
        },
      ]
    }
  ];

  const handleLogout = () => {
    console.log('Logout pressed');
    // Implement logout logic here
  };

  const handleEditProfile = () => {
    console.log('Edit profile pressed');
    // Navigate to edit profile screen
  };

  return (
    <View style={styles.container}>
      {/* Unified Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Account</Text>
        <TouchableOpacity style={styles.editIconButton} onPress={handleEditProfile}>
          <Ionicons name="pencil" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Large User Information Card */}
        <View style={styles.userInfoCard}>
          {/* Background decorative shapes */}
          <View style={styles.backgroundShapes}>
            <View style={[styles.shape, styles.shape1]} />
            <View style={[styles.shape, styles.shape2]} />
            <View style={[styles.shape, styles.shape3]} />
          </View>
          
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{(user?.name || "U").charAt(0)}</Text>
              </View>
            )}
          </View>
          
          {/* User Details */}
          <View style={styles.userDetails}>
            <View style={styles.nameContainer}>
              <Text style={styles.userName}>{user.name}</Text>
              {user.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={styles.verifiedIcon} />
              )}
            </View>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
          
          {/* Achievement Badges */}
          <View style={styles.achievementsContainer}>
            {achievements.map((achievement, index) => (
              <View key={achievement.id} style={styles.achievementBadge}>
                <View style={[styles.achievementIcon, { backgroundColor: achievement.color }]}>
                  <Ionicons name={achievement.icon as any} size={16} color="#FFFFFF" />
                </View>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuContainer}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    itemIndex === section.items.length - 1 && styles.lastMenuItem
                  ]}
                  onPress={item.onPress}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons name={item.icon} size={20} color="#0F4D3A" />
                    </View>
                    <View style={styles.menuTextContainer}>
                      <Text style={styles.menuTitle}>{item.title}</Text>
                      {item.subtitle && (
                        <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Separated Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#0F4D3A',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  editIconButton: {
    padding: 8,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userInfoCard: {
    backgroundColor: '#0F4D3A',
    borderRadius: 20,
    marginTop: 20,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  backgroundShapes: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shape: {
    position: 'absolute',
    borderRadius: 50,
    opacity: 0.1,
  },
  shape1: {
    width: 80,
    height: 80,
    backgroundColor: '#A8E063',
    top: -20,
    right: -20,
  },
  shape2: {
    width: 60,
    height: 60,
    backgroundColor: '#10B981',
    bottom: -10,
    left: -10,
  },
  shape3: {
    width: 40,
    height: 40,
    backgroundColor: '#34D399',
    top: 60,
    right: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#0F4D3A',
  },
  userDetails: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 8,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#E5E7EB',
  },
  achievementsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  achievementBadge: {
    alignItems: 'center',
    marginBottom: 12,
    minWidth: 70,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  sectionContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginLeft: 4,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  logoutSection: {
    marginTop: 40,
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
