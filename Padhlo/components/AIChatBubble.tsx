import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AIChatModal } from './AIChatModal';
import { useAuth } from '../contexts/AuthContext';
import { useUserStatistics } from '../hooks/useStatistics';
import { useExamHistory } from '../hooks/useExams';
import { usePracticeHistory } from '../hooks/usePractice';

export const AIChatBubble: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { isAuthenticated } = useAuth();
  
  // Fetch performance data
  const { data: userStats } = useUserStatistics();
  const { data: examHistory } = useExamHistory();
  const { data: practiceHistory } = usePracticeHistory();
  
  // Don't show if not authenticated
  if (!isAuthenticated) {
    return null;
  }
  
  // Extract data from API responses
  const statsData = userStats?.data || userStats;
  const examData = examHistory?.data || examHistory || [];
  const practiceData = practiceHistory?.data || practiceHistory || [];
  
  // Calculate weak areas (simplified version)
  const weakAreas: Array<{ category: string; score: number; testCount: number }> = [];
  // You can add weak area calculation logic here if needed
  
  const performanceData = {
    overallAccuracy: statsData?.overallAccuracy ? Math.round(parseFloat(String(statsData.overallAccuracy))) : 0,
    totalQuestionsAttempted: statsData?.totalQuestionsAttempted || 0,
    currentStreak: statsData?.currentStreak || 0,
    examHistory: Array.isArray(examData) ? examData : [],
    practiceHistory: Array.isArray(practiceData) ? practiceData : [],
    weakAreas: weakAreas
  };
  
  return (
    <>
      <TouchableOpacity
        style={styles.bubble}
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <AIChatModal
          performanceData={performanceData}
          onClose={() => setIsModalVisible(false)}
        />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 1000,
  },
});

