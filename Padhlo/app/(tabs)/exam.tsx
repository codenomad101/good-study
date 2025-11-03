import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ExamContent from '../../components/WebExamContent';
import { View, StyleSheet } from 'react-native';

export default function ExamScreen() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <View style={styles.loadingContainer} />;
  }

  return <ExamContent />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});



