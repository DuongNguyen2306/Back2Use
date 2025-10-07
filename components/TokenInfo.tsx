import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthProvider';

export const TokenInfo = () => {
  const { state, actions } = useAuth();

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getTimeUntilExpiry = () => {
    if (!state.tokenExpiry) return 'N/A';
    const timeLeft = state.tokenExpiry - Date.now();
    if (timeLeft <= 0) return 'Expired';
    return `${Math.round(timeLeft / 1000)}s`;
  };

  const handleRefreshToken = async () => {
    const success = await actions.refreshToken();
    console.log('Manual token refresh:', success ? 'Success' : 'Failed');
  };

  if (!state.isAuthenticated) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Token Info (Debug)</Text>
      <Text style={styles.text}>Access Token: {state.accessToken ? '***' + state.accessToken.slice(-8) : 'None'}</Text>
      <Text style={styles.text}>Refresh Token: {state.refreshToken ? '***' + state.refreshToken.slice(-8) : 'None'}</Text>
      <Text style={styles.text}>Expires At: {formatTime(state.tokenExpiry)}</Text>
      <Text style={styles.text}>Time Left: {getTimeUntilExpiry()}</Text>
      <Text style={styles.text}>Is Expired: {actions.isTokenExpired() ? 'Yes' : 'No'}</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleRefreshToken}>
        <Text style={styles.buttonText}>Refresh Token</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 8,
    maxWidth: 200,
    zIndex: 1000,
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  text: {
    color: 'white',
    fontSize: 12,
    marginBottom: 2,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 12,
  },
});
