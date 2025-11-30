import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface SimpleHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  backgroundColor?: string;
}

export default function SimpleHeader({
  title,
  onBack,
  rightAction,
  backgroundColor = '#FFFFFF',
}: SimpleHeaderProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
      <SafeAreaView style={[styles.header, { backgroundColor }]}>
        <View style={styles.headerContent}>
          {/* Left: Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          
          {/* Center: Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
          </View>
          
          {/* Right: Action (optional) */}
          <View style={styles.rightContainer}>
            {rightAction || <View style={styles.placeholder} />}
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  rightContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
});

