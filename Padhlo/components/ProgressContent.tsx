import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from './AppHeader';
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  Award, 
  Clock, 
  CheckCircle, 
  BarChart3,
  Trophy,
  Flame,
  BookOpen,
  Zap,
  Star
} from 'lucide-react-native';
import { 
  useUserStats,
  useUserProgress,
  useSubjectWiseProgress,
  useUserAnalytics,
  useUserAchievements,
  useDailyChallenges
} from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { responsiveValues } from '../utils/responsive';

const { width } = Dimensions.get('window');

interface ProgressData {
  totalQuestionsAttempted: number;
  correctAnswers: number;
  totalTimeSpent: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  level: number;
  accuracy: number;
}

interface SubjectProgress {
  subjectId: string;
  subjectName: string;
  masteryLevel: string;
  masteryPercentage: number;
  totalQuestionsAttempted: number;
  correctAnswers: number;
  averageAccuracy: number;
  averageTimePerQuestion: number;
  lastPracticedAt: string;
}

const ProgressContent: React.FC = () => {
  const { user } = useAuth();
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'all'>('week');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'achievements'>('overview');

  // React Query hooks
  const { data: userStats, isLoading: statsLoading, refetch: refetchStats } = useUserStats();
  const { data: progressData, isLoading: progressLoading, refetch: refetchProgress } = useUserProgress();
  const { data: subjectProgress, isLoading: subjectLoading, refetch: refetchSubjects } = useSubjectWiseProgress();
  const { data: analyticsData, isLoading: analyticsLoading, refetch: refetchAnalytics } = useUserAnalytics(selectedTimeRange);
  const { data: achievements, isLoading: achievementsLoading, refetch: refetchAchievements } = useUserAchievements();
  const { data: dailyChallenges, isLoading: challengesLoading, refetch: refetchChallenges } = useDailyChallenges();

  const stats: ProgressData = userStats?.data || {
    totalQuestionsAttempted: 0,
    correctAnswers: 0,
    totalTimeSpent: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalPoints: 0,
    level: 1,
    accuracy: 0
  };

  const subjects: SubjectProgress[] = subjectProgress?.data || [];
  // Handle analytics data - ensure it's an array
  // getUserStats returns an object, not an array, so we need to handle it differently
  const analytics: any[] = Array.isArray(analyticsData?.data) 
    ? analyticsData.data 
    : analyticsData?.data?.dailyStats 
    ? analyticsData.data.dailyStats 
    : [];
  const userAchievements = achievements?.data || [];
  const challenges = dailyChallenges?.data || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchStats(),
      refetchProgress(),
      refetchSubjects(),
      refetchAnalytics(),
      refetchAchievements(),
      refetchChallenges()
    ]);
    setRefreshing(false);
  };

  const renderOverviewTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Streak Card */}
      <View style={styles.streakCard}>
        <View style={styles.streakHeader}>
          <View>
            <Text style={styles.streakNumber}>{stats.currentStreak}</Text>
            <Text style={styles.streakLabel}>Day Streak 🔥</Text>
          </View>
          <Flame size={40} color="#FF6B35" />
        </View>
        <Text style={styles.streakSubtext}>
          Longest streak: {stats.longestStreak} days
        </Text>
        <View style={styles.streakProgress}>
          <View style={[styles.streakProgressBar, { width: `${Math.min((stats.currentStreak / 30) * 100, 100)}%` }]} />
        </View>
      </View>

      {/* Quick Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Target size={24} color="#2563EB" />
          <Text style={styles.statNumber}>{stats.totalQuestionsAttempted}</Text>
          <Text style={styles.statLabel}>Questions</Text>
        </View>
        <View style={styles.statCard}>
          <TrendingUp size={24} color="#10B981" />
          <Text style={styles.statNumber}>{Math.round(stats.accuracy)}%</Text>
          <Text style={styles.statLabel}>Accuracy</Text>
        </View>
        <View style={styles.statCard}>
          <Clock size={24} color="#F59E0B" />
          <Text style={styles.statNumber}>{Math.round(stats.totalTimeSpent / 60)}</Text>
          <Text style={styles.statLabel}>Hours</Text>
        </View>
        <View style={styles.statCard}>
          <Award size={24} color="#8B5CF6" />
          <Text style={styles.statNumber}>{stats.totalPoints}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
      </View>

      {/* Level Progress */}
      <View style={styles.levelCard}>
        <View style={styles.levelHeader}>
          <Star size={24} color="#F59E0B" />
          <Text style={styles.levelTitle}>Level {stats.level}</Text>
        </View>
        <View style={styles.levelProgress}>
          <View style={styles.levelProgressBar}>
            <View style={[styles.levelProgressFill, { width: `${(stats.totalPoints % 1000) / 10}%` }]} />
          </View>
          <Text style={styles.levelProgressText}>
            {stats.totalPoints % 1000}/1000 XP to next level
          </Text>
        </View>
      </View>

      {/* Weekly Performance Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Weekly Performance</Text>
        <View style={styles.chartContainer}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
            const dayData = analytics.find((a: any) => a.dayOfWeek === index + 1);
            const height = dayData ? (dayData.questionsAttempted / 50) * 100 : 20;
            return (
              <View key={day} style={styles.chartBar}>
                <View style={[styles.bar, { height: `${Math.max(height, 10)}%` }]} />
                <Text style={styles.barLabel}>{day}</Text>
                <Text style={styles.barValue}>{dayData?.questionsAttempted || 0}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Daily Challenges */}
      {challenges.length > 0 && (
        <View style={styles.challengesCard}>
          <Text style={styles.challengesTitle}>Today's Challenges</Text>
          {challenges.map((challenge: any) => (
            <View key={challenge.challengeId} style={styles.challengeItem}>
              <View style={styles.challengeIcon}>
                <Zap size={20} color="#F59E0B" />
              </View>
              <View style={styles.challengeContent}>
                <Text style={styles.challengeText}>{challenge.description}</Text>
                <Text style={styles.challengeReward}>
                  {challenge.pointsReward} points • {challenge.coinsReward} coins
                </Text>
              </View>
              <View style={styles.challengeProgress}>
                <View style={styles.challengeProgressBar}>
                  <View style={[styles.challengeProgressFill, { width: `${(challenge.progress / challenge.targetValue) * 100}%` }]} />
                </View>
                <Text style={styles.challengeProgressText}>
                  {challenge.progress}/{challenge.targetValue}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderSubjectsTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.sectionTitle}>Subject-wise Performance</Text>
      
      {subjects.map((subject) => (
        <View key={subject.subjectId} style={styles.subjectCard}>
          <View style={styles.subjectHeader}>
            <View style={styles.subjectInfo}>
              <BookOpen size={20} color="#2563EB" />
              <Text style={styles.subjectName}>{subject.subjectName}</Text>
            </View>
            <View style={[
              styles.masteryBadge,
              subject.masteryLevel === 'beginner' ? styles.beginnerBadge :
              subject.masteryLevel === 'intermediate' ? styles.intermediateBadge :
              subject.masteryLevel === 'advanced' ? styles.advancedBadge :
              styles.expertBadge
            ]}>
              <Text style={styles.masteryText}>
                {subject.masteryLevel.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.subjectStats}>
            <View style={styles.subjectStat}>
              <Text style={styles.subjectStatNumber}>{subject.totalQuestionsAttempted}</Text>
              <Text style={styles.subjectStatLabel}>Questions</Text>
            </View>
            <View style={styles.subjectStat}>
              <Text style={styles.subjectStatNumber}>{Math.round(subject.averageAccuracy)}%</Text>
              <Text style={styles.subjectStatLabel}>Accuracy</Text>
            </View>
            <View style={styles.subjectStat}>
              <Text style={styles.subjectStatNumber}>{Math.round(subject.averageTimePerQuestion)}s</Text>
              <Text style={styles.subjectStatLabel}>Avg Time</Text>
            </View>
          </View>

          <View style={styles.subjectProgress}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Mastery Progress</Text>
              <Text style={styles.progressPercentage}>{Math.round(subject.masteryPercentage)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${subject.masteryPercentage}%` }]} />
            </View>
          </View>

          <Text style={styles.lastPracticed}>
            Last practiced: {new Date(subject.lastPracticedAt).toLocaleDateString()}
          </Text>
        </View>
      ))}

      {subjects.length === 0 && (
        <View style={styles.emptyState}>
          <BookOpen size={48} color="#9CA3AF" />
          <Text style={styles.emptyStateText}>No practice data available</Text>
          <Text style={styles.emptyStateSubtext}>Start practicing to see your progress here</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderAchievementsTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.sectionTitle}>Achievements</Text>
      
      <View style={styles.achievementsGrid}>
        {userAchievements.map((achievement: any) => (
          <View key={achievement.achievementId} style={styles.achievementCard}>
            <View style={styles.achievementIcon}>
              <Trophy size={24} color="#F59E0B" />
            </View>
            <Text style={styles.achievementName}>{achievement.achievementName}</Text>
            <Text style={styles.achievementDescription}>{achievement.description}</Text>
            <View style={styles.achievementReward}>
              <Text style={styles.rewardText}>
                {achievement.pointsReward} points • {achievement.coinsReward} coins
              </Text>
            </View>
            <Text style={styles.achievementDate}>
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </Text>
          </View>
        ))}
      </View>

      {userAchievements.length === 0 && (
        <View style={styles.emptyState}>
          <Trophy size={48} color="#9CA3AF" />
          <Text style={styles.emptyStateText}>No achievements yet</Text>
          <Text style={styles.emptyStateSubtext}>Keep practicing to unlock achievements</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'subjects':
        return renderSubjectsTab();
      case 'achievements':
        return renderAchievementsTab();
      default:
        return renderOverviewTab();
    }
  };

  if (statsLoading || progressLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Progress" showLogo={true} extraTopSpacing={true} />
      
      {/* Subtitle */}
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>Track your learning journey</Text>
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        {(['week', 'month', 'all'] as const).map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeRangeButton,
              selectedTimeRange === range && styles.timeRangeButtonActive
            ]}
            onPress={() => setSelectedTimeRange(range)}
          >
            <Text style={[
              styles.timeRangeText,
              selectedTimeRange === range && styles.timeRangeTextActive
            ]}>
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'overview' && styles.tabButtonActive]}
          onPress={() => setActiveTab('overview')}
        >
          <BarChart3 size={20} color={activeTab === 'overview' ? '#2563EB' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'subjects' && styles.tabButtonActive]}
          onPress={() => setActiveTab('subjects')}
        >
          <BookOpen size={20} color={activeTab === 'subjects' ? '#2563EB' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'subjects' && styles.tabTextActive]}>
            Subjects
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'achievements' && styles.tabButtonActive]}
          onPress={() => setActiveTab('achievements')}
        >
          <Trophy size={20} color={activeTab === 'achievements' ? '#2563EB' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'achievements' && styles.tabTextActive]}>
            Achievements
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {renderTabContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  subtitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    paddingHorizontal: responsiveValues.padding.medium,
    paddingVertical: responsiveValues.padding.small,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  timeRangeButtonActive: {
    backgroundColor: '#2563EB',
  },
  timeRangeText: {
    fontSize: responsiveValues.fontSize.small,
    color: '#6B7280',
    fontWeight: '500',
  },
  timeRangeTextActive: {
    color: '#FFFFFF',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontSize: responsiveValues.fontSize.small,
    color: '#6B7280',
    marginLeft: 8,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: responsiveValues.padding.medium,
  },
  sectionTitle: {
    fontSize: responsiveValues.fontSize.large,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: responsiveValues.padding.medium,
  },
  streakCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  streakLabel: {
    fontSize: responsiveValues.fontSize.medium,
    color: '#6B7280',
  },
  streakSubtext: {
    fontSize: responsiveValues.fontSize.small,
    color: '#6B7280',
    marginBottom: 12,
  },
  streakProgress: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  streakProgressBar: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    marginTop: 4,
  },
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelTitle: {
    fontSize: responsiveValues.fontSize.large,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  levelProgress: {
    marginTop: 8,
  },
  levelProgressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  levelProgressText: {
    fontSize: responsiveValues.fontSize.small,
    color: '#6B7280',
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: responsiveValues.fontSize.large,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    backgroundColor: '#2563EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: responsiveValues.fontSize.small,
    color: '#6B7280',
    marginBottom: 4,
  },
  barValue: {
    fontSize: responsiveValues.fontSize.small,
    fontWeight: '600',
    color: '#1F2937',
  },
  challengesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  challengesTitle: {
    fontSize: responsiveValues.fontSize.large,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  challengeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  challengeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  challengeContent: {
    flex: 1,
  },
  challengeText: {
    fontSize: responsiveValues.fontSize.medium,
    color: '#1F2937',
    marginBottom: 4,
  },
  challengeReward: {
    fontSize: responsiveValues.fontSize.small,
    color: '#6B7280',
  },
  challengeProgress: {
    alignItems: 'flex-end',
  },
  challengeProgressBar: {
    width: 60,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 4,
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  challengeProgressText: {
    fontSize: responsiveValues.fontSize.small,
    color: '#6B7280',
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subjectName: {
    fontSize: responsiveValues.fontSize.medium,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  masteryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  beginnerBadge: {
    backgroundColor: '#FEE2E2',
  },
  intermediateBadge: {
    backgroundColor: '#FEF3C7',
  },
  advancedBadge: {
    backgroundColor: '#D1FAE5',
  },
  expertBadge: {
    backgroundColor: '#DBEAFE',
  },
  masteryText: {
    fontSize: responsiveValues.fontSize.small,
    fontWeight: '600',
    color: '#374151',
  },
  subjectStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subjectStat: {
    alignItems: 'center',
  },
  subjectStatNumber: {
    fontSize: responsiveValues.fontSize.large,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subjectStatLabel: {
    fontSize: responsiveValues.fontSize.small,
    color: '#6B7280',
    marginTop: 2,
  },
  subjectProgress: {
    marginBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: responsiveValues.fontSize.small,
    color: '#6B7280',
  },
  progressPercentage: {
    fontSize: responsiveValues.fontSize.small,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },
  lastPracticed: {
    fontSize: responsiveValues.fontSize.small,
    color: '#6B7280',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  achievementName: {
    fontSize: responsiveValues.fontSize.medium,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: responsiveValues.fontSize.small,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementReward: {
    marginBottom: 8,
  },
  rewardText: {
    fontSize: responsiveValues.fontSize.small,
    color: '#F59E0B',
    fontWeight: '600',
  },
  achievementDate: {
    fontSize: responsiveValues.fontSize.small,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: responsiveValues.fontSize.large,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: responsiveValues.fontSize.medium,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default ProgressContent;
