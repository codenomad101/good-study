import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import {
  Trophy,
  Medal,
  Award,
  Crown,
  TrendingUp,
  Target,
  Flame,
  BarChart3,
  CheckCircle,
  HelpCircle,
  Star,
  Calendar,
  User,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLeaderboard, useUserRank, useAvailableSubjects, useUserStatistics } from '../hooks/useStatistics';
import { useAuth } from '../contexts/AuthContext';
import { responsiveValues, scaleWidth, scaleFont, isSmallScreen, screenWidth } from '../utils/responsive';
import { Dimensions } from 'react-native';
import AppHeader from './AppHeader';

const LeaderboardContent: React.FC = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'alltime'>('alltime');
  const [selectedCategory, setSelectedCategory] = useState<'overall' | 'practice' | 'exam' | 'streak' | 'accuracy'>('overall');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  // Responsive sizing
  const isSmall = isSmallScreen();
  const screenW = screenWidth;
  const minTableWidth = 800; // Minimum width for all columns
  const needsHorizontalScroll = screenW < minTableWidth;
  
  // Responsive column widths
  const getColumnWidth = (baseWidth: number) => scaleWidth(baseWidth);
  const getFontSize = (baseSize: number) => scaleFont(baseSize);

  const { data: leaderboardData, isLoading: leaderboardLoading, refetch: refetchLeaderboard } = useLeaderboard(
    selectedPeriod,
    selectedCategory,
    selectedSubjectId,
    100
  );
  const { data: userRankData, isLoading: rankLoading } = useUserRank(selectedPeriod);
  const { data: userStatsData } = useUserStatistics();
  const { data: subjectsData } = useAvailableSubjects();

  const leaderboard = leaderboardData?.data || [];
  const userRank = userRankData?.data;
  const userStats = userStatsData?.data || userStatsData || {};
  const subjects = subjectsData?.data || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchLeaderboard(),
    ]);
    setRefreshing(false);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown size={24} color="#F59E0B" />;
    if (rank === 2) return <Medal size={24} color="#94A3B8" />;
    if (rank === 3) return <Award size={24} color="#CD7F32" />;
    return null;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#F59E0B'; // Gold
    if (rank === 2) return '#94A3B8'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    if (rank <= 10) return '#2563EB'; // Blue
    return '#6B7280'; // Gray
  };

  const getRankBgColor = (rank: number) => {
    if (rank === 1) return '#FEF3C7';
    if (rank === 2) return '#F3F4F6';
    if (rank === 3) return '#FED7AA';
    return '#FFFFFF';
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return '#10B981';
    if (accuracy >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 7) return '#EF4444';
    if (streak >= 3) return '#F59E0B';
    return '#2563EB';
  };

  const renderUserStatsCards = () => {
    const currentUserRank = userRank?.rank;
    const rankingPoints = userStats?.rankingPoints || 0;
    const questionsSolved = userStats?.totalQuestionsAttempted || 0;
    const currentStreak = userStats?.currentStreak || 0;

    return (
      <View style={styles.statsCardsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            {currentUserRank ? getRankIcon(currentUserRank) : <User size={20} color={getRankColor(currentUserRank || 999)} />}
            <Text style={styles.statCardTitle}>Your Rank</Text>
          </View>
          <Text style={[styles.statCardValue, { color: getRankColor(currentUserRank || 999) }]}>
            {currentUserRank || 'Unranked'}
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <Star size={20} color="#2563EB" />
            <Text style={styles.statCardTitle}>Your Points</Text>
          </View>
          <Text style={[styles.statCardValue, { color: '#2563EB' }]}>
            {rankingPoints.toLocaleString()}
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <HelpCircle size={20} color="#10B981" />
            <Text style={styles.statCardTitle}>Questions</Text>
          </View>
          <Text style={[styles.statCardValue, { color: '#10B981' }]}>
            {questionsSolved.toLocaleString()}
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <Flame size={20} color="#F59E0B" />
            <Text style={styles.statCardTitle}>Streak</Text>
          </View>
          <Text style={[styles.statCardValue, { color: '#F59E0B' }]}>
            {currentStreak} days
          </Text>
        </View>
      </View>
    );
  };

  const renderPeriodSelector = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filterLabel}>Time Period</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterScrollContent}
      >
        {([
          { value: 'daily', label: 'Daily', icon: Calendar },
          { value: 'weekly', label: 'Weekly', icon: Calendar },
          { value: 'monthly', label: 'Monthly', icon: Calendar },
          { value: 'alltime', label: 'All Time', icon: Star },
        ] as const).map(({ value, label, icon: Icon }) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.filterButton,
              selectedPeriod === value && styles.filterButtonActive
            ]}
            onPress={() => setSelectedPeriod(value)}
          >
            <Icon 
              size={16} 
              color={selectedPeriod === value ? '#FFFFFF' : '#6B7280'} 
            />
            <Text style={[
              styles.filterButtonText,
              selectedPeriod === value && styles.filterButtonTextActive
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderCategorySelector = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filterLabel}>Category</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterScrollContent}
      >
        {([
          { key: 'overall', label: 'Overall', icon: Trophy },
          { key: 'practice', label: 'Practice', icon: Target },
          { key: 'exam', label: 'Exam', icon: CheckCircle },
          { key: 'streak', label: 'Streak', icon: Flame },
          { key: 'accuracy', label: 'Accuracy', icon: BarChart3 },
        ] as const).map(({ key, label, icon: Icon }) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.filterButton,
              selectedCategory === key && styles.filterButtonActive
            ]}
            onPress={() => setSelectedCategory(key)}
          >
            <Icon 
              size={16} 
              color={selectedCategory === key ? '#FFFFFF' : '#6B7280'} 
            />
            <Text style={[
              styles.filterButtonText,
              selectedCategory === key && styles.filterButtonTextActive
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderLeaderboardEntry = (entry: any, index: number) => {
    const rank = entry.rank || index + 1;
    const isCurrentUser = entry.userId === user?.userId;
    const accuracy = parseFloat(entry.overallAccuracy || '0');
    const rankColor = getRankColor(rank);
    const rankBgColor = getRankBgColor(rank);
    
    // Get user initial for avatar
    const username = entry.username || entry.userName || entry.fullName || 'Anonymous';
    const initial = username.charAt(0).toUpperCase();
    
    // Responsive icon sizes
    const iconSize = isSmall ? 18 : 24;
    const smallIconSize = isSmall ? 10 : 12;

    return (
      <View
        key={entry.userId || index}
        style={[
          styles.leaderboardRow,
          { backgroundColor: isCurrentUser ? '#EFF6FF' : rankBgColor },
          isCurrentUser && styles.currentUserRow,
        ]}
      >
        {/* Rank Column */}
        <View style={styles.rankColumn}>
          {rank === 1 ? <Crown size={iconSize} color="#F59E0B" /> :
           rank === 2 ? <Medal size={iconSize} color="#94A3B8" /> :
           rank === 3 ? <Award size={iconSize} color="#CD7F32" /> : (
            <Text style={[styles.rankNumber, { color: rankColor }]}>#{rank}</Text>
          )}
        </View>

        {/* User Column */}
        <View style={styles.userColumn}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: rankColor }]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={[
                styles.username,
                isCurrentUser && styles.currentUsername
              ]}>
                {username}
                {isCurrentUser && ' (You)'}
              </Text>
              {entry.email && (
                <Text style={styles.userEmail}>{entry.email}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Points Column */}
        <View style={styles.pointsColumn}>
          <Text style={styles.pointsValue}>
            {entry.rankingPoints?.toLocaleString() || '0'}
          </Text>
        </View>

        {/* Questions Column */}
        <View style={styles.questionsColumn}>
          <Text style={styles.questionsValue}>
            {entry.totalQuestionsAttempted?.toLocaleString() || '0'}
          </Text>
        </View>

        {/* Accuracy Column */}
        <View style={styles.accuracyColumn}>
          <View style={[styles.accuracyCircle, { borderColor: getAccuracyColor(accuracy) }]}>
            <Text style={[styles.accuracyText, { color: getAccuracyColor(accuracy) }]}>
              {Math.round(accuracy)}%
            </Text>
          </View>
        </View>

        {/* Streak Column */}
        <View style={styles.streakColumn}>
          {entry.currentStreak > 0 && (
            <View style={[styles.streakTag, { backgroundColor: getStreakColor(entry.currentStreak) + '20' }]}>
              <Flame size={smallIconSize} color={getStreakColor(entry.currentStreak)} />
              <Text style={[styles.streakText, { color: getStreakColor(entry.currentStreak) }]}>
                {entry.currentStreak}
              </Text>
            </View>
          )}
        </View>

        {/* Sessions Column */}
        <View style={styles.sessionsColumn}>
          <Text style={styles.sessionsText}>
            P: {entry.totalPracticeSessions || 0}
          </Text>
          <Text style={styles.sessionsText}>
            E: {entry.totalExamSessions || 0}
          </Text>
        </View>
      </View>
    );
  };

  const renderLeaderboardHeader = () => (
    <View style={styles.tableHeader}>
      <View style={styles.rankColumn}>
        <Text style={styles.headerText}>Rank</Text>
      </View>
      <View style={styles.userColumn}>
        <Text style={styles.headerText}>User</Text>
      </View>
      <View style={styles.pointsColumn}>
        <Text style={styles.headerText}>Points</Text>
      </View>
      <View style={styles.questionsColumn}>
        <Text style={styles.headerText}>Qs</Text>
      </View>
      <View style={styles.accuracyColumn}>
        <Text style={styles.headerText}>Acc</Text>
      </View>
      <View style={styles.streakColumn}>
        <Text style={styles.headerText}>Streak</Text>
      </View>
      <View style={styles.sessionsColumn}>
        <Text style={styles.headerText}>Sessions</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Leaderboard" showLogo={true} extraTopSpacing={true} />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* User Stats Cards */}
        {renderUserStatsCards()}

        {/* Filters */}
        {renderPeriodSelector()}
        {renderCategorySelector()}

        {/* Leaderboard Table */}
        <View style={styles.tableContainer}>
          <View style={styles.tableTitle}>
            <Trophy size={20} color="#F59E0B" />
            <Text style={styles.tableTitleText}>
              {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Leaderboard
              {selectedPeriod !== 'alltime' && ` - ${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}`}
            </Text>
          </View>
          <Text style={styles.tableSubtitle}>
            Showing top {leaderboard.length} users
          </Text>

          {leaderboardLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loadingText}>Loading leaderboard...</Text>
            </View>
          ) : leaderboard.length === 0 ? (
            <View style={styles.emptyState}>
              <Trophy size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No Data Available</Text>
              <Text style={styles.emptyStateSubtext}>
                No users found for the selected period and category.
              </Text>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={needsHorizontalScroll ? { minWidth: minTableWidth } : undefined}
            >
              <View style={{ flex: 1, width: needsHorizontalScroll ? minTableWidth : '100%' }}>
                {renderLeaderboardHeader()}
                {leaderboard.map((entry: any, index: number) => renderLeaderboardEntry(entry, index))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* How Rankings Work */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>How Rankings Work</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Trophy size={24} color="#2563EB" />
              <Text style={styles.infoItemTitle}>Activity Points</Text>
              <Text style={styles.infoItemText}>Practice (10 pts) + Exam (20 pts)</Text>
            </View>
            <View style={styles.infoItem}>
              <BarChart3 size={24} color="#10B981" />
              <Text style={styles.infoItemTitle}>Accuracy Bonus</Text>
              <Text style={styles.infoItemText}>Overall accuracy × 2 points</Text>
            </View>
            <View style={styles.infoItem}>
              <Flame size={24} color="#F59E0B" />
              <Text style={styles.infoItemTitle}>Streak Bonus</Text>
              <Text style={styles.infoItemText}>Current streak × 5 points</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const getStyles = () => {
  const isSmall = isSmallScreen();
  const baseFontSize = scaleFont(16);
  const smallFontSize = scaleFont(14);
  const xsFontSize = scaleFont(12);
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F9FAFB',
    },
    content: {
      flex: 1,
    },
    statsCardsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: scaleWidth(16),
      paddingVertical: scaleWidth(16),
      gap: scaleWidth(12),
    },
    statCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: scaleWidth(12),
      padding: scaleWidth(isSmall ? 12 : 16),
      width: isSmall ? '48%' : '47%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    statCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: scaleWidth(8),
      gap: scaleWidth(6),
    },
    statCardTitle: {
      fontSize: xsFontSize,
      color: '#6B7280',
      fontWeight: '500',
    },
    statCardValue: {
      fontSize: scaleFont(isSmall ? 20 : 24),
      fontWeight: 'bold',
    },
    filtersContainer: {
      paddingHorizontal: scaleWidth(16),
      marginBottom: scaleWidth(16),
    },
    filterLabel: {
      fontSize: smallFontSize,
      fontWeight: '600',
      color: '#1F2937',
      marginBottom: scaleWidth(8),
    },
    filterScroll: {
      maxHeight: scaleWidth(50),
    },
    filterScrollContent: {
      gap: scaleWidth(8),
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: scaleWidth(isSmall ? 12 : 16),
      paddingVertical: scaleWidth(8),
      borderRadius: scaleWidth(20),
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      gap: scaleWidth(6),
      marginRight: scaleWidth(8),
    },
    filterButtonActive: {
      backgroundColor: '#2563EB',
      borderColor: '#2563EB',
    },
    filterButtonText: {
      fontSize: smallFontSize,
      fontWeight: '500',
      color: '#6B7280',
    },
    filterButtonTextActive: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    tableContainer: {
      backgroundColor: '#FFFFFF',
      marginHorizontal: scaleWidth(16),
      marginBottom: scaleWidth(16),
      borderRadius: scaleWidth(12),
      padding: scaleWidth(isSmall ? 12 : 16),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    tableTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: scaleWidth(4),
      gap: scaleWidth(8),
    },
    tableTitleText: {
      fontSize: scaleFont(isSmall ? 16 : 18),
      fontWeight: '600',
      color: '#1F2937',
    },
    tableSubtitle: {
      fontSize: xsFontSize,
      color: '#6B7280',
      marginBottom: scaleWidth(16),
    },
    tableHeader: {
      flexDirection: 'row',
      paddingVertical: scaleWidth(isSmall ? 8 : 12),
      paddingHorizontal: scaleWidth(isSmall ? 4 : 8),
      borderBottomWidth: 2,
      borderBottomColor: '#E5E7EB',
      marginBottom: scaleWidth(8),
    },
    headerText: {
      fontSize: xsFontSize,
      fontWeight: '600',
      color: '#6B7280',
      textTransform: 'uppercase',
    },
    leaderboardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: scaleWidth(isSmall ? 8 : 12),
      paddingHorizontal: scaleWidth(isSmall ? 4 : 8),
      borderRadius: scaleWidth(8),
      marginBottom: scaleWidth(4),
      borderLeftWidth: 0,
    },
    currentUserRow: {
      borderLeftWidth: scaleWidth(4),
      borderLeftColor: '#2563EB',
      backgroundColor: '#EFF6FF',
    },
    rankColumn: {
      width: scaleWidth(isSmall ? 40 : 50),
      alignItems: 'center',
      justifyContent: 'center',
    },
    rankNumber: {
      fontSize: scaleFont(isSmall ? 14 : 16),
      fontWeight: 'bold',
    },
    userColumn: {
      flex: 2,
      paddingRight: scaleWidth(isSmall ? 4 : 8),
      minWidth: scaleWidth(120),
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scaleWidth(isSmall ? 6 : 8),
    },
    avatar: {
      width: scaleWidth(isSmall ? 32 : 40),
      height: scaleWidth(isSmall ? 32 : 40),
      borderRadius: scaleWidth(isSmall ? 16 : 20),
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: scaleFont(isSmall ? 14 : 16),
    },
    userDetails: {
      flex: 1,
    },
    username: {
      fontSize: scaleFont(isSmall ? 13 : 15),
      fontWeight: '600',
      color: '#1F2937',
      marginBottom: scaleWidth(2),
    },
    currentUsername: {
      color: '#2563EB',
    },
    userEmail: {
      fontSize: scaleFont(10),
      color: '#6B7280',
    },
    pointsColumn: {
      width: scaleWidth(isSmall ? 50 : 60),
      alignItems: 'center',
    },
    pointsValue: {
      fontSize: scaleFont(isSmall ? 14 : 16),
      fontWeight: 'bold',
      color: '#2563EB',
    },
    questionsColumn: {
      width: scaleWidth(isSmall ? 40 : 50),
      alignItems: 'center',
    },
    questionsValue: {
      fontSize: smallFontSize,
      fontWeight: '600',
      color: '#1F2937',
    },
    accuracyColumn: {
      width: scaleWidth(isSmall ? 50 : 60),
      alignItems: 'center',
    },
    accuracyCircle: {
      width: scaleWidth(isSmall ? 40 : 50),
      height: scaleWidth(isSmall ? 40 : 50),
      borderRadius: scaleWidth(isSmall ? 20 : 25),
      borderWidth: isSmall ? 2 : 3,
      alignItems: 'center',
      justifyContent: 'center',
    },
    accuracyText: {
      fontSize: xsFontSize,
      fontWeight: 'bold',
    },
    streakColumn: {
      width: scaleWidth(isSmall ? 50 : 60),
      alignItems: 'center',
    },
    streakTag: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: scaleWidth(isSmall ? 4 : 6),
      paddingVertical: scaleWidth(4),
      borderRadius: scaleWidth(12),
      gap: scaleWidth(4),
    },
    streakText: {
      fontSize: xsFontSize,
      fontWeight: '600',
    },
    sessionsColumn: {
      width: scaleWidth(isSmall ? 55 : 70),
      alignItems: 'flex-start',
    },
    sessionsText: {
      fontSize: scaleFont(10),
      color: '#6B7280',
      marginBottom: scaleWidth(2),
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: scaleWidth(48),
    },
    loadingText: {
      marginTop: scaleWidth(16),
      fontSize: baseFontSize,
      color: '#6B7280',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: scaleWidth(48),
    },
    emptyStateText: {
      fontSize: scaleFont(isSmall ? 16 : 18),
      fontWeight: '600',
      color: '#6B7280',
      marginTop: scaleWidth(16),
      marginBottom: scaleWidth(8),
    },
    emptyStateSubtext: {
      fontSize: smallFontSize,
      color: '#9CA3AF',
      textAlign: 'center',
    },
    infoCard: {
      backgroundColor: '#FFFFFF',
      marginHorizontal: scaleWidth(16),
      marginBottom: scaleWidth(24),
      borderRadius: scaleWidth(12),
      padding: scaleWidth(isSmall ? 16 : 20),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    infoCardTitle: {
      fontSize: scaleFont(isSmall ? 16 : 18),
      fontWeight: '600',
      color: '#1F2937',
      marginBottom: scaleWidth(16),
      textAlign: 'center',
    },
    infoRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
      gap: scaleWidth(16),
    },
    infoItem: {
      alignItems: 'center',
      width: isSmall ? '100%' : '30%',
      minWidth: scaleWidth(100),
    },
    infoItemTitle: {
      fontSize: smallFontSize,
      fontWeight: '600',
      color: '#1F2937',
      marginTop: scaleWidth(8),
      marginBottom: scaleWidth(4),
    },
    infoItemText: {
      fontSize: scaleFont(10),
      color: '#6B7280',
      textAlign: 'center',
    },
  });
};

const styles = getStyles();

export default LeaderboardContent;
