import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import CommunityContent from '../../components/CommunityContent';
import { PremiumFeatureGate } from '../../components/PremiumFeatureGate';
import { View, StyleSheet, Alert } from 'react-native';

export default function CommunityScreen() {
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
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
          onPress: logout,
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return <View style={styles.loadingContainer} />;
  }

  return (
    <PremiumFeatureGate featureName="community">
      <CommunityContent />
    </PremiumFeatureGate>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
