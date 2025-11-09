import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LeaderboardContent from '../../components/LeaderboardContent';
import { PremiumFeatureGate } from '../../components/PremiumFeatureGate';
import { View, StyleSheet } from 'react-native';

export default function LeaderboardScreen() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <View style={styles.loadingContainer} />;
  }

  return (
    <PremiumFeatureGate featureName="leaderboard">
      <LeaderboardContent />
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

