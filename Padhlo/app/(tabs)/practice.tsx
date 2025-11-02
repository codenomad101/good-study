import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import EnhancedPracticeContent from '../../components/EnhancedPracticeContent';
import { View, StyleSheet } from 'react-native';

export default function PracticeScreen() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <View style={styles.loadingContainer} />;
  }

  return (
    <View style={styles.container}>
      <EnhancedPracticeContent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
