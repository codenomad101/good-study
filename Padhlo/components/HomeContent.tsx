import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { BookOpen, Trophy, Target, Clock, TrendingUp, Award, CheckCircle, Bell, Calendar, Users, FileText, Play, Crown, Rocket, Star } from 'lucide-react-native';
import { useExams, useUserStats, useSubjectWiseProgress, useSubscriptionStatus, useReminders, useAvailableExams } from '../hooks/useApi';
import { useUserRank } from '../hooks/useStatistics';
import { useAuth } from '../contexts/AuthContext';
import { responsiveValues } from '../utils/responsive';
import AppHeader from './AppHeader';
import { useRouter } from 'expo-router';
import { useTranslation } from '../hooks/useTranslation';

const HomeContent: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
    
  // Fetch data using React Query hooks - must be called unconditionally
  const { data: examsData, isLoading: examsLoading, error: examsError } = useExams();
  const { data: statsResponse, isLoading: statsLoading, error: statsError } = useUserStats();
  const { data: subjectProgressResponse, isLoading: progressLoading, error: progressError } = useSubjectWiseProgress();
  const { data: subscriptionData } = useSubscriptionStatus();
  const { data: remindersResponse, isLoading: remindersLoading, error: remindersError } = useReminders({ upcoming: 'true' });
  const { data: availableExamsResponse, isLoading: availableExamsLoading, error: availableExamsError } = useAvailableExams({ upcoming: 'true' });
  const { data: userRankResponse, isLoading: rankLoading } = useUserRank('alltime');



  const statsData = statsResponse||{};
const subjectProgressData = subjectProgressResponse?.data || (Array.isArray(subjectProgressResponse) ? subjectProgressResponse : []);
const examsList = examsData?.data || (Array.isArray(examsData) ? examsData : []);

// Parse reminders - EXACTLY like schedule page does
// Schedule page: const reminders = remindersResponse?.data || [];
const reminders = remindersResponse?.data || [];

// Handle available exams response - React Query returns { data: ApiResponse, ... }
// ApiResponse is { success: true, data: [...] }
let availableExams: any[] = [];
if (availableExamsResponse) {
  // React Query wraps it: availableExamsResponse is the ApiResponse
  if (availableExamsResponse.data && Array.isArray(availableExamsResponse.data)) {
    availableExams = availableExamsResponse.data;
  } else if (Array.isArray(availableExamsResponse)) {
    availableExams = availableExamsResponse;
  } else if (availableExamsResponse.success && availableExamsResponse.data && Array.isArray(availableExamsResponse.data)) {
    availableExams = availableExamsResponse.data;
  }
}

// Debug logging BEFORE fallback
const remindersResponseStr = remindersResponse ? (JSON.stringify(remindersResponse, null, 2) || '').substring(0, 500) : 'null';
console.log('[HomeContent] Before Fallback:', {
  availableExamsLength: availableExams.length,
  remindersLength: reminders?.length || 0,
  reminders: reminders,
  remindersResponse: remindersResponseStr,
  remindersResponseType: typeof remindersResponse,
  remindersResponseIsArray: Array.isArray(remindersResponse),
  remindersResponseHasData: !!remindersResponse?.data,
  remindersResponseHasSuccess: !!remindersResponse?.success,
  remindersResponseDataIsArray: Array.isArray(remindersResponse?.data),
  remindersResponseDataDataIsArray: Array.isArray(remindersResponse?.data?.data),
  remindersLoading: remindersLoading,
  remindersError: remindersError,
});

// Fallback: If no available exams but we have reminders, use those (so user sees their exams)
if (availableExams.length === 0) {
  console.log('[HomeContent] No available exams, checking reminders for fallback...');
  if (reminders && Array.isArray(reminders) && reminders.length > 0) {
    console.log('[HomeContent] Using reminders as fallback, count:', reminders.length);
    availableExams = reminders.map((r: any) => ({
      examId: r.reminderId || r.examId,
      examName: r.examName,
      examDate: r.examDate,
      examTime: r.examTime,
      description: r.description,
    }));
  } else {
    console.log('[HomeContent] No reminders available for fallback');
  }
}

// Debug logging AFTER fallback
console.log('[HomeContent] Available Exams Debug:', {
  availableExamsResponse,
  availableExamsLength: availableExams.length,
  availableExams,
  availableExamsLoading,
  availableExamsError,
  responseType: typeof availableExamsResponse,
  isArray: Array.isArray(availableExamsResponse),
  hasData: !!availableExamsResponse?.data,
  hasSuccess: !!availableExamsResponse?.success,
  remindersLength: reminders?.length || 0,
  reminders: reminders,
  usingFallback: availableExams.length > 0 && reminders && reminders.length > 0,
});


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
              <Text style={styles.welcomeText}>{t('home.welcomeBack', { name: user?.fullName || 'Student' })} 👋</Text>
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
      <AppHeader showLogo={true} />
      
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeHeader}>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeText}>{t('home.welcomeBack', { name: user?.fullName || 'Student' })} 👋</Text>
            <View style={styles.userNameRow}>
              {(() => {
                // userRankResponse structure: { success: true, data: { rank: 1 }, message: "..." }
                // So userRankResponse.data is { rank: 1 }
                const userRank = userRankResponse?.data?.rank;
                console.log('[HomeContent] User Rank Debug:', {
                  userRankResponse,
                  userRankData: userRankResponse?.data,
                  userRank,
                });
                if (userRank && userRank > 0) {
                  return (
                    <TouchableOpacity 
                      style={styles.rankBadge}
                      onPress={() => router.push('/(tabs)/leaderboard')}
                    >
                      <Trophy size={14} color="#F59E0B" />
                      <Text style={styles.rankText}>Rank #{userRank}</Text>
                    </TouchableOpacity>
                  );
                }
                return null;
              })()}
            </View>
          </View>
          {/* Current Plan Badge */}
          {(() => {
            const subscription = subscriptionData?.data as any;
            const planType = subscription?.type || 'free';
            const isActive = subscription?.active || false;
            
            // Always show plan badge (including free plan)
            const planColors: Record<string, { bg: string; text: string; icon: any }> = {
              trial: { bg: '#ECFDF5', text: '#10B981', icon: Rocket },
              lite: { bg: '#EFF6FF', text: '#2563EB', icon: Star },
              pro: { bg: '#FFF7ED', text: '#F59E0B', icon: Crown },
              free: { bg: '#F3F4F6', text: '#6B7280', icon: Star },
            };
            
            const planInfo = planColors[planType] || planColors.free;
            const PlanIcon = planInfo.icon;
            const planName = planType.charAt(0).toUpperCase() + planType.slice(1);
            
            return (
              <View style={[styles.planBadge, { backgroundColor: planInfo.bg }]}>
                <PlanIcon size={16} color={planInfo.text} />
                <Text style={[styles.planBadgeText, { color: planInfo.text }]}>{planName}</Text>
              </View>
            );
          })()}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

      {/* Streak Card - Compact with Stats */}
      <View style={styles.streakCard}>
        <View style={styles.streakHeader}>
          <View style={styles.streakMain}>
            <View style={styles.streakTitleRow}>
              <Text style={styles.streakDays}>{stats.currentStreak || 0}</Text>
              <Text style={styles.streakLabel}>{t('home.dayStreak')} 🔥</Text>
            </View>
            <View style={styles.streakStatsRow}>
              <View style={styles.streakStatItem}>
                <Text style={styles.streakStatNumber}>{stats.totalQuestions || 0}</Text>
                <Text style={styles.streakStatLabel}>{t('home.questions')}</Text>
              </View>
              <View style={styles.streakStatDivider} />
              <View style={styles.streakStatItem}>
                <Text style={styles.streakStatNumber}>{stats.accuracy || 0}%</Text>
                <Text style={styles.streakStatLabel}>{t('home.accuracy')}</Text>
              </View>
              <View style={styles.streakStatDivider} />
              <View style={styles.streakStatItem}>
                <Text style={styles.streakStatNumber}>{stats.totalTimeSpent || 0}</Text>
                <Text style={styles.streakStatLabel}>{t('home.min')}</Text>
              </View>
            </View>
          </View>
          <Trophy size={36} color="#FCD34D" />
        </View>
      </View>

      {/* Check Out Cards */}
      <View style={styles.checkOutSection}>
        <Text style={styles.checkOutTitle}>Check out</Text>
        <View style={styles.checkOutCards}>
          <TouchableOpacity 
            style={styles.checkOutCard}
            onPress={() => router.push('/(tabs)/leaderboard')}
          >
            <Trophy size={24} color="#F59E0B" />
            <Text style={styles.checkOutCardTitle}>Leaderboard</Text>
            <Text style={styles.checkOutCardSubtitle}>See rankings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.checkOutCard}
            onPress={() => router.push('/(tabs)/schedule')}
          >
            <Calendar size={24} color="#2563EB" />
            <Text style={styles.checkOutCardTitle}>Schedule</Text>
            <Text style={styles.checkOutCardSubtitle}>Plan your study</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Available Exams */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.availableExams')}</Text>
          {availableExams.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/schedule')}>
              <Calendar size={20} color="#2563EB" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Available Exams (System-wide) */}
        {(availableExamsLoading || remindersLoading) ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.loadingText}>Loading upcoming exams...</Text>
          </View>
        ) : availableExamsError && remindersError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load exams</Text>
            <Text style={styles.errorSubtext}>{availableExamsError?.message || 'Please check your connection'}</Text>
          </View>
        ) : availableExams && availableExams.length > 0 ? (
          <View style={styles.remindersContainer}>
            <Text style={styles.remindersTitle}>Upcoming Exams</Text>
            {availableExams.slice(0, 3).map((exam: any) => {
              console.log('[HomeContent] Rendering exam:', exam);
              const examDate = new Date(exam.examDate);
              const today = new Date();
              const daysUntil = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const isToday = daysUntil === 0;
              const isTomorrow = daysUntil === 1;
              
              return (
                <View key={exam.examId} style={styles.reminderCard}>
                  <View style={styles.reminderContent}>
                    <View style={styles.reminderHeader}>
                      <Text style={styles.reminderExamName}>{exam.examName}</Text>
                      {exam.examTime && (
                        <Text style={styles.reminderTime}>{exam.examTime}</Text>
                      )}
                    </View>
                    <View style={styles.reminderDateRow}>
                      <Calendar size={14} color="#6B7280" />
                      <Text style={styles.reminderDate}>
                        {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : examDate.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: examDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
                        })}
                      </Text>
                      {daysUntil > 1 && (
                        <Text style={styles.reminderDaysAway}>
                          ({daysUntil} days away)
                        </Text>
                      )}
                    </View>
                    {exam.description && (
                      <Text style={styles.reminderDescription} numberOfLines={1}>
                        {exam.description}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
            {availableExams.length > 3 && (
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => router.push('/(tabs)/schedule')}
              >
                <Text style={styles.viewAllText}>View All ({availableExams.length})</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No upcoming exams scheduled</Text>
            <Text style={styles.noDataSubtext}>Check back later for new exam dates</Text>
          </View>
        )}
        
        {/* Practice Exams */}
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
        ) : examsList.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.examsContainer}>
              {examsList.map((exam: any) => (
                <TouchableOpacity key={exam.examId || exam.id} style={styles.examCard}>
                  <Text style={styles.examName}>{exam.examName || exam.name || 'Exam'}</Text>
                  <Text style={styles.examDescription}>{exam.description || 'Practice exam'}</Text>
                  <View style={styles.examStats}>
                    <Text style={styles.examStat}>{exam.totalMarks || 'N/A'} marks</Text>
                    <Text style={styles.examStat}>{exam.durationMinutes || 'N/A'} min</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : null}
      </View>

      {/* Today's Practice */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.todayPractice')}</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', { 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric' 
            })}
          </Text>
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
            <Text style={styles.title}>{t('home.welcomeBack', { name: user?.fullName || 'Student' })} 👋</Text>
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
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  welcomeTextContainer: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginTop: 4,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
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
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  streakCard: {
    backgroundColor: '#F97316',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: responsiveValues.padding.medium,
    marginBottom: responsiveValues.padding.medium,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakMain: {
    flex: 1,
  },
  streakTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
    gap: 8,
  },
  streakDays: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  streakLabel: {
    fontSize: 16,
    color: '#FED7AA',
    fontWeight: '600',
  },
  streakStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  streakStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  streakStatLabel: {
    fontSize: 11,
    color: '#FED7AA',
    fontWeight: '500',
  },
  streakStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#FED7AA',
    opacity: 0.5,
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
  checkOutSection: {
    paddingHorizontal: responsiveValues.padding.medium,
    marginBottom: responsiveValues.margin.medium,
  },
  checkOutTitle: {
    fontSize: responsiveValues.fontSize.small,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: responsiveValues.margin.small,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checkOutCards: {
    flexDirection: 'row',
    gap: 12,
  },
  checkOutCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  checkOutCardTitle: {
    fontSize: responsiveValues.fontSize.medium,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  checkOutCardSubtitle: {
    fontSize: responsiveValues.fontSize.xs,
    color: '#6B7280',
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
  remindersContainer: {
    marginBottom: 16,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: responsiveValues.padding.medium,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  remindersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
  },
  reminderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  reminderContent: {
    flex: 1,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reminderExamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  reminderTime: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  reminderDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  reminderDate: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  reminderDaysAway: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  reminderDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  viewAllButton: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
});

export default HomeContent;
