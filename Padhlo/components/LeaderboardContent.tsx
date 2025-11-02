import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
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
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLeaderboard, useUserRank, useAvailableSubjects } from '../hooks/useStatistics';
import { useAuth } from '../contexts/AuthContext';
import { responsiveValues } from '../utils/responsive';
import AppHeader from './AppHeader';

const LeaderboardContent: React.FC = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'alltime'>('alltime');
  const [selectedCategory, setSelectedCategory] = useState<'overall' | 'practice' | 'exam' | 'streak' | 'accuracy'>('overall');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  const { data: leaderboardData, isLoading: leaderboardLoading, refetch: refetchLeaderboard } = useLeaderboard(
    selectedPeriod,
    selectedCategory,
    selectedSubjectId,
    50
  );
  const { data: userRankData, isLoading: rankLoading } = useUserRank(selectedPeriod);
  const { data: subjectsData } = useAvailableSubjects();

  const leaderboard = leaderboardData?.data || [];
  const userRank = userRankData?.data;
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
    if (rank === 1) return '#FEF3C7';
    if (rank === 2) return '#F3F4F6';
    if (rank === 3) return '#FED7AA';
    return '#FFFFFF';
  };

  const renderPeriodSelector = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.periodSelector}
      contentContainerStyle={styles.periodSelectorContent}
    >
      {(['daily', 'weekly', 'monthly', 'alltime'] as const).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[
            styles.periodText,
            selectedPeriod === period && styles.periodTextActive
          ]}>
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderCategorySelector = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.categorySelector}
      contentContainerStyle={styles.categorySelectorContent}
    >
      {([
        { key: 'overall', label: 'Overall', icon: Trophy },
        { key: 'practice', label: 'Practice', icon: Target },
        { key: 'exam', label: 'Exam', icon: BarChart3 },
        { key: 'streak', label: 'Streak', icon: Flame },
        { key: 'accuracy', label: 'Accuracy', icon: TrendingUp },
      ] as const).map(({ key, label, icon: Icon }) => (
        <TouchableOpacity
          key={key}
          style={[
            styles.categoryButton,
            selectedCategory === key && styles.categoryButtonActive
          ]}
          onPress={() => setSelectedCategory(key)}
        >
          <Icon 
            size={18} 
            color={selectedCategory === key ? '#FFFFFF' : '#6B7280'} 
          />
          <Text style={[
            styles.categoryText,
            selectedCategory === key && styles.categoryTextActive
          ]}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderUserRankCard = () => {
    if (!userRank || rankLoading) return null;

    return (
      <View style={styles.userRankCard}>
        <View style={styles.userRankHeader}>
          <Trophy size={24} color="#F59E0B" />
          <Text style={styles.userRankTitle}>Your Rank</Text>
        </View>
        <View style={styles.userRankContent}>
          <Text style={styles.userRankNumber}>#{userRank.rank || 'N/A'}</Text>
          <Text style={styles.userRankSubtext}>
            {userRank.totalParticipants 
              ? `out of ${userRank.totalParticipants} participants`
              : 'Keep practicing!'}
          </Text>
          {userRank.percentile && (
            <Text style={styles.userRankPercentile}>
              Top {userRank.percentile}%
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Leaderboard" showLogo={true} extraTopSpacing={true} />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Period Selector */}
        {renderPeriodSelector()}

        {/* Category Selector */}
        {renderCategorySelector()}

        {/* User Rank Card */}
        {renderUserRankCard()}

        {/* Leaderboard List */}
        <View style={styles.leaderboardSection}>
          <Text style={styles.sectionTitle}>Top Performers</Text>
          
          {leaderboardLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loadingText}>Loading leaderboard...</Text>
            </View>
          ) : leaderboard.length === 0 ? (
            <View style={styles.emptyState}>
              <Trophy size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No data available</Text>
              <Text style={styles.emptyStateSubtext}>
                Be the first to appear on the leaderboard!
              </Text>
            </View>
          ) : (
            <View style={styles.leaderboardList}>
              {leaderboard.map((entry: any, index: number) => {
                const rank = index + 1;
                const isCurrentUser = entry.userId === user?.userId;
                
                return (
                  <View
                    key={entry.userId || index}
                    style={[
                      styles.leaderboardItem,
                      { backgroundColor: getRankColor(rank) },
                      isCurrentUser && styles.currentUserItem
                    ]}
                  >
                    <View style={styles.rankSection}>
                      {getRankIcon(rank) || (
                        <Text style={styles.rankNumber}>#{rank}</Text>
                      )}
                    </View>
                    
                    <View style={styles.userSection}>
                      <Text style={[
                        styles.userName,
                        isCurrentUser && styles.currentUserName
                      ]}>
                        {entry.userName || entry.fullName || 'Anonymous'}
                        {isCurrentUser && ' (You)'}
                      </Text>
                      {entry.points !== undefined && (
                        <Text style={styles.userPoints}>
                          {entry.points.toLocaleString()} points
                        </Text>
                      )}
                      {entry.score !== undefined && (
                        <Text style={styles.userScore}>
                          Score: {entry.score.toLocaleString()}
                        </Text>
                      )}
                    </View>
                    
                    <View style={styles.statsSection}>
                      {entry.accuracy !== undefined && (
                        <Text style={styles.statValue}>
                          {entry.accuracy.toFixed(1)}%
                        </Text>
                      )}
                      {entry.streak !== undefined && (
                        <View style={styles.streakBadge}>
                          <Flame size={14} color="#FF6B35" />
                          <Text style={styles.streakText}>{entry.streak}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  periodSelector: {
    maxHeight: 50,
    marginVertical: 8,
  },
  periodSelectorContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  periodButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  periodTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  categorySelector: {
    maxHeight: 50,
    marginBottom: 16,
  },
  categorySelectorContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  categoryButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  userRankCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userRankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userRankTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  userRankContent: {
    alignItems: 'center',
  },
  userRankNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 4,
  },
  userRankSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  userRankPercentile: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  leaderboardSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  leaderboardList: {
    gap: 8,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  currentUserItem: {
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  rankSection: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  userSection: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  currentUserName: {
    color: '#2563EB',
  },
  userPoints: {
    fontSize: 14,
    color: '#6B7280',
  },
  userScore: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsSection: {
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
  },
});

export default LeaderboardContent;

