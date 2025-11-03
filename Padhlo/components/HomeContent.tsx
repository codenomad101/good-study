import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { BookOpen, Trophy, Target, Clock, TrendingUp, Award, CheckCircle, Bell, Calendar, Users, FileText, Play } from 'lucide-react-native';
import { useExams, useUserStats, useSubjectWiseProgress } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { responsiveValues } from '../utils/responsive';
import AppHeader from './AppHeader';
import { useRouter } from 'expo-router';

const HomeContent: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
    
  // Fetch data using React Query hooks - must be called unconditionally
  const { data: examsData, isLoading: examsLoading, error: examsError } = useExams();
  const { data: statsResponse, isLoading: statsLoading, error: statsError } = useUserStats();
  const { data: subjectProgressResponse, isLoading: progressLoading, error: progressError } = useSubjectWiseProgress();



  const statsData = statsResponse||{};
const subjectProgressData = subjectProgressResponse?.data || (Array.isArray(subjectProgressResponse) ? subjectProgressResponse : []);
const examsList = examsData?.data || (Array.isArray(examsData) ? examsData : []);


// Stats formatting with fallbacks
const stats = {
  totalQuestions: statsData?.totalQuestionsAttempted || statsData.questionsAttempted || 0,
  accuracy: Math.round(parseFloat(statsData.overallAccuracy || statsData.accuracy || '0')),
  currentStreak: statsData.currentStreak || statsData.streak || 0,
  totalTimeSpent: Math.round(statsData.totalTimeSpentMinutes || statsData.timeSpent || 0),
};

  const mockDailyTopics = [
    { subject: 'Quantitative Aptitude', progress: 65, time: '12 min', questions: 15 },
    { subject: 'General Awareness', progress: 80, time: '10 min', questions: 20 },
    { subject: 'English', progress: 45, time: '15 min', questions: 12 },
    { subject: 'Reasoning', progress: 90, time: '8 min', questions: 10 }
  ];

  // Show loading state while data is being fetched
  if (examsLoading || statsLoading || progressLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.fullName || 'Student'}! 👋</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </View>
    );
  }

  const renderHome = () => (
    <View style={styles.container}>
      <AppHeader title="Home" showLogo={true} />
      
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.fullName || 'Student'}! 👋</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

      {/* Streak Card */}
      <View style={styles.streakCard}>
        <View style={styles.streakHeader}>
          <View>
            <Text style={styles.streakDays}>{stats.currentStreak || 0} Days</Text>
            <Text style={styles.streakLabel}>Learning Streak 🔥</Text>
          </View>
          <Trophy size={48} color="#FCD34D" />
        </View>
        <Text style={styles.streakDescription}>Keep it up! You're in top 5% learners</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Target size={24} color="#2563EB" />
          <Text style={styles.statNumber}>{stats.totalQuestions || 0}</Text>
          <Text style={styles.statLabel}>Questions Solved</Text>
        </View>
        <View style={styles.statCard}>
          <TrendingUp size={24} color="#10B981" />
          <Text style={styles.statNumber}>{stats.accuracy || 0}%</Text>
          <Text style={styles.statLabel}>Accuracy</Text>
        </View>
        <View style={styles.statCard}>
          <Clock size={24} color="#F59E0B" />
          <Text style={styles.statNumber}>{stats.totalTimeSpent || 0}</Text>
          <Text style={styles.statLabel}>Time Spent (min)</Text>
        </View>
        
      </View>

      {/* Available Exams */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Exams</Text>
        {examsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.loadingText}>Loading exams...</Text>
          </View>
        ) : examsError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load exams</Text>
            <TouchableOpacity style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.examsContainer}>
              {examsList.length > 0 ? examsList.map((exam: any) => (
                <TouchableOpacity key={exam.examId || exam.id} style={styles.examCard}>
                  <Text style={styles.examName}>{exam.examName || exam.name || 'Exam'}</Text>
                  <Text style={styles.examDescription}>{exam.description || 'Practice exam'}</Text>
                  <View style={styles.examStats}>
                    <Text style={styles.examStat}>{exam.totalMarks || 'N/A'} marks</Text>
                    <Text style={styles.examStat}>{exam.durationMinutes || 'N/A'} min</Text>
                  </View>
                </TouchableOpacity>
              )) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No exams available</Text>
                  <Text style={styles.noDataSubtext}>Check back later for new content</Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Today's Practice */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Practice</Text>
          <Text style={styles.dateText}>15 Oct 2025</Text>
        </View>
        <View style={styles.practiceContainer}>
          {mockDailyTopics.map((topic, idx) => (
            <View key={idx} style={styles.practiceItem}>
              <View style={styles.practiceHeader}>
                <View style={styles.practiceInfo}>
                  <Text style={styles.practiceSubject}>{topic.subject}</Text>
                  <View style={styles.practiceMeta}>
                    <View style={styles.practiceMetaItem}>
                      <Clock size={12} color="#6B7280" />
                      <Text style={styles.practiceMetaText}>{topic.time}</Text>
                    </View>
                    <Text style={styles.practiceMetaText}>{topic.questions} questions</Text>
                  </View>
                </View>
                {topic.progress === 100 ? (
                  <CheckCircle size={20} color="#10B981" />
                ) : (
                  <TouchableOpacity 
                    style={styles.startButton}
                    onPress={() => router.push('/(tabs)/practice')}
                  >
                    <Text style={styles.startButtonText}>Start</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${topic.progress}%` }]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Subject Progress */}
      {subjectProgressData && subjectProgressData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subject Progress</Text>
          <View style={styles.subjectProgressContainer}>
            {subjectProgressData.map((subject: any, idx: number) => (
              <View key={idx} style={styles.subjectProgressItem}>
                <Text style={styles.subjectName}>{subject.subjectName || subject.name || 'Subject'}</Text>
                <View style={styles.subjectProgressBar}>
                  <View 
                    style={[styles.subjectProgressFill, { width: `${subject.accuracy || subject.masteryPercentage || 0}%` }]}
                  />
                </View>
                <Text style={styles.subjectAccuracy}>{subject.accuracy || subject.masteryPercentage || 0}%</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Previous Year Papers */}
      <View style={styles.papersCard}>
        <View style={styles.papersHeader}>
          <View>
            <Text style={styles.papersTitle}>Previous Year Papers</Text>
            <Text style={styles.papersSubtitle}>50+ papers available</Text>
          </View>
          <FileText size={40} color="#A78BFA" />
        </View>
        <TouchableOpacity style={styles.papersButton}>
          <Text style={styles.papersButtonText}>Browse Papers</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
  );

  try {
    return renderHome();
  } catch (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome back, {user?.fullName || 'Student'}! 👋</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Something went wrong</Text>
          <Text style={styles.errorSubtext}>Please try again later</Text>
        </View>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  welcomeSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  content: {
    flex: 1,
    paddingTop: responsiveValues.padding.small,
  },
  welcomeText: {
    fontSize: responsiveValues.fontSize.large,
    color: '#6B7280',
  },
  userName: {
    fontSize: responsiveValues.fontSize.xlarge,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  streakCard: {
    backgroundColor: '#F97316',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: responsiveValues.padding.medium,
    marginBottom: responsiveValues.padding.medium,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  streakDays: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  streakLabel: {
    fontSize: responsiveValues.fontSize.medium,
    color: '#FED7AA',
  },
  streakDescription: {
    fontSize: responsiveValues.fontSize.small,
    color: '#FED7AA',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveValues.padding.medium,
    marginBottom: responsiveValues.padding.medium,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: responsiveValues.fontSize.small,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    marginBottom: responsiveValues.padding.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveValues.padding.medium,
    marginBottom: responsiveValues.padding.small,
  },
  sectionTitle: {
    fontSize: responsiveValues.fontSize.large,
    fontWeight: 'bold',
    color: '#1F2937',
    paddingHorizontal: responsiveValues.padding.medium,
    marginBottom: responsiveValues.padding.small,
  },
  dateText: {
    fontSize: responsiveValues.fontSize.small,
    color: '#10B981',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: responsiveValues.padding.medium,
  },
  loadingText: {
    marginLeft: 8,
    color: '#6B7280',
  },
  errorContainer: {
    alignItems: 'center',
    padding: responsiveValues.padding.medium,
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 8,
    fontSize: responsiveValues.fontSize.medium,
    fontWeight: '600',
  },
  errorSubtext: {
    color: '#6B7280',
    fontSize: responsiveValues.fontSize.small,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  examsContainer: {
    flexDirection: 'row',
    paddingHorizontal: responsiveValues.padding.medium,
  },
  examCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  examName: {
    fontSize: responsiveValues.fontSize.medium,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  examDescription: {
    fontSize: responsiveValues.fontSize.small,
    color: '#6B7280',
    marginBottom: 8,
  },
  examStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  examStat: {
    fontSize: responsiveValues.fontSize.small,
    color: '#2563EB',
    fontWeight: '500',
  },
  noDataContainer: {
    alignItems: 'center',
    padding: responsiveValues.padding.medium,
  },
  noDataText: {
    fontSize: responsiveValues.fontSize.medium,
    color: '#6B7280',
    marginBottom: 4,
  },
  noDataSubtext: {
    fontSize: responsiveValues.fontSize.small,
    color: '#9CA3AF',
  },
  practiceContainer: {
    paddingHorizontal: responsiveValues.padding.medium,
  },
  practiceItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  practiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  practiceInfo: {
    flex: 1,
  },
  practiceSubject: {
    fontSize: responsiveValues.fontSize.medium,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  practiceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  practiceMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  practiceMetaText: {
    fontSize: responsiveValues.fontSize.small,
    color: '#6B7280',
    marginLeft: 4,
  },
  startButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: responsiveValues.fontSize.small,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  subjectProgressContainer: {
    paddingHorizontal: responsiveValues.padding.medium,
  },
  subjectProgressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectName: {
    fontSize: responsiveValues.fontSize.medium,
    color: '#1F2937',
    width: 120,
  },
  subjectProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  subjectProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  subjectAccuracy: {
    fontSize: responsiveValues.fontSize.small,
    color: '#10B981',
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  papersCard: {
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: responsiveValues.padding.medium,
    marginBottom: responsiveValues.padding.medium,
  },
  papersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  papersTitle: {
    fontSize: responsiveValues.fontSize.large,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  papersSubtitle: {
    fontSize: responsiveValues.fontSize.small,
    color: '#C4B5FD',
  },
  papersButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  papersButtonText: {
    color: '#7C3AED',
    fontSize: responsiveValues.fontSize.medium,
    fontWeight: '600',
  },
});

export default HomeContent;
