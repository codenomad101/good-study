import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  FileText,
  Play,
  Plus,
  Clock,
  Trophy,
  CheckCircle,
  XCircle,
  Calendar,
  BarChart3,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import {
  useExamHistory,
  useCreateDynamicExam,
  useResumeExam,
} from '../hooks/useExams';
import { useCategories } from '../hooks/useCategories';
import DynamicExamContent from './DynamicExamContent';
import AppHeader from './AppHeader';
import { showToast } from '../utils/toast';

const { width } = Dimensions.get('window');

export default function ExamContent() {
  const { user, isAuthenticated } = useAuth();
  const [showExamCreator, setShowExamCreator] = useState(false);
  const [selectedExamSessionId, setSelectedExamSessionId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data: examHistoryResponse, isLoading: historyLoading, refetch } = useExamHistory();
  const { data: categoriesResponse, isLoading: categoriesLoading, error: categoriesError, refetch: refetchCategories } = useCategories();
  const createExamMutation = useCreateDynamicExam();
  const resumeExamMutation = useResumeExam();

  const examHistory = examHistoryResponse?.data || [];
  
  // Fallback categories in case API fails
  const fallbackCategories = [
    { id: 'economy', slug: 'economy', categoryId: 'economy', name: 'Economy', description: 'Economic concepts and theories' },
    { id: 'gk', slug: 'gk', categoryId: 'gk', name: 'General Knowledge', description: 'General knowledge questions' },
    { id: 'history', slug: 'history', categoryId: 'history', name: 'History', description: 'Historical events and facts' },
    { id: 'geography', slug: 'geography', categoryId: 'geography', name: 'Geography', description: 'Geographical knowledge' },
    { id: 'english', slug: 'english', categoryId: 'english', name: 'English Grammar', description: 'English language and grammar' },
    { id: 'aptitude', slug: 'aptitude', categoryId: 'aptitude', name: 'Aptitude', description: 'Logical reasoning and aptitude' },
    { id: 'agriculture', slug: 'agriculture', categoryId: 'agriculture', name: 'Agriculture', description: 'Agricultural science and practices' },
    { id: 'marathi', slug: 'marathi', categoryId: 'marathi', name: 'Marathi Grammar', description: 'Marathi language and grammar' },
  ];
  
  // Extract categories from response - handle different response formats
  // API returns: { success: true, data: [...] } or { data: { data: [...] } }
  let apiCategories: any[] = [];
  
  if (categoriesResponse) {
    // Check if it's already an array
    if (Array.isArray(categoriesResponse)) {
      apiCategories = categoriesResponse;
    }
    // Check if data.data exists (nested)
    else if (categoriesResponse.data) {
      if (Array.isArray(categoriesResponse.data)) {
        apiCategories = categoriesResponse.data;
      } else if (categoriesResponse.data.data && Array.isArray(categoriesResponse.data.data)) {
        apiCategories = categoriesResponse.data.data;
      }
    }
    // Check if it's { success: true, data: [...] }
    else if (categoriesResponse.success && Array.isArray(categoriesResponse.data)) {
      apiCategories = categoriesResponse.data;
    }
  }
  
  // Use API categories if available, otherwise use fallback
  const categories = apiCategories.length > 0 ? apiCategories : fallbackCategories;
  const usingFallbackCategories = apiCategories.length === 0 && !categoriesLoading;
  
  // Log error if categories failed to load (but don't crash)
  if (categoriesError || (categoriesResponse && !categoriesResponse.success && apiCategories.length === 0 && !categoriesLoading)) {
    console.warn('[WebExamContent] Categories loading issue - using fallback:', {
      error: categoriesError,
      response: categoriesResponse,
      message: categoriesResponse?.message || categoriesError?.message || 'Failed to load categories',
      usingFallback: usingFallbackCategories,
      fallbackCount: fallbackCategories.length
    });
  }
  
  // Debug logging
  console.log('[WebExamContent] Categories Debug:', {
    categoriesResponse,
    apiCategories: apiCategories.length,
    usingFallback: usingFallbackCategories,
    totalCategories: categories.length,
    categoriesError,
    categoriesLoading
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchCategories()]);
    setRefreshing(false);
  };

  const handleQuickExam = async (totalQuestions: number = 20, negativeMarking: boolean = false) => {
    // Ensure categories is an array
    const validCategories = Array.isArray(categories) ? categories : [];
    
    console.log('handleQuickExam - validCategories:', validCategories);
    
    if (!validCategories || validCategories.length === 0) {
      if (categoriesLoading) {
        showToast.info('Please wait while categories are loading...', 'Loading');
        return;
      }
      showToast.error('No categories available for quick exam. Please check your connection or try again later.', 'No Categories');
      return;
    }

    // Create equal distribution across available categories
    const questionsPerCategory = Math.ceil(totalQuestions / validCategories.length);
    const distribution = validCategories.map((cat: any) => ({
      category: cat.id || cat.slug || cat.categoryId,
      count: questionsPerCategory,
      marksPerQuestion: 2,
    }));

    const totalQ = distribution.reduce((sum: number, d: any) => sum + d.count, 0);
    const totalMarks = totalQ * 2;
    const duration = Math.ceil(totalQ * 0.75); // ~45 seconds per question

    const examData = {
      examName: `Quick Test - ${totalQ} Questions`,
      totalMarks,
      durationMinutes: duration,
      questionDistribution: distribution,
      negativeMarking,
      negativeMarksRatio: negativeMarking ? 0.25 : 0,
    };

    try {
      console.log('[WebExamContent] Starting exam creation...');
      const response = await createExamMutation.mutateAsync(examData);
      console.log('[WebExamContent] Exam creation response received:', {
        success: response?.success,
        hasData: !!response?.data,
        dataType: typeof response?.data,
        isDataArray: Array.isArray(response?.data),
        fullResponse: response
      });
      
      // Handle response - server returns { success: true, data: [sessionObject] }
      // The data is an array because Drizzle's .returning() returns an array
      let sessionData: any = null;
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          console.log('[WebExamContent] Data is array, taking first item. Array length:', response.data.length);
          sessionData = response.data.length > 0 ? response.data[0] : null;
        } else if (typeof response.data === 'object' && response.data.sessionId) {
          // Already an object with sessionId
          sessionData = response.data;
        }
      }
      
      console.log('[WebExamContent] Processed session data:', {
        sessionId: sessionData?.sessionId,
        examName: sessionData?.examName,
        hasSessionId: !!sessionData?.sessionId
      });
      
      if (response.success && sessionData?.sessionId) {
        console.log('[WebExamContent] ✅ Exam session created successfully:', sessionData.sessionId);
        // Store sessionId immediately to prevent loss if error occurs later
        const savedSessionId = sessionData.sessionId;
        
        // Use requestAnimationFrame to ensure state updates happen smoothly
        requestAnimationFrame(() => {
          setSelectedExamSessionId(savedSessionId);
          setShowExamCreator(true);
        });
      } else {
        console.warn('[WebExamContent] ⚠️ Exam creation response invalid:', {
          success: response.success,
          hasData: !!response.data,
          dataType: typeof response.data,
          isDataArray: Array.isArray(response.data),
          sessionData: sessionData,
          message: response.message
        });
        showToast.error(response.message || 'Failed to create exam. No session ID returned.');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      const endpoint = error?.endpoint || '/exam/dynamic/create';
      
      console.error('[WebExamContent] Error creating quick exam:', {
        error: error,
        errorName: error?.name,
        message: errorMessage,
        endpoint: endpoint,
        stack: error?.stack,
        originalError: error?.originalError
      });
      
      // Provide user-friendly error messages based on error type
      let userMessage = 'Failed to create exam session';
      let userTitle = 'Network Error';
      
      if (errorMessage.includes('Network request failed') || 
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('Network error')) {
        userTitle = 'Connection Error';
        // Get the base URL from the API service if available
        const baseURL = 'http://10.46.150.205:3000'; // Current IP from api.ts
        const fullURL = `${baseURL}/api${endpoint}`;
        userMessage = 'Cannot connect to server. Please check:\n\n' +
          '1. Server is running on port 3000\n' +
          '2. Your device and computer are on the same network\n' +
          '3. Correct IP address is configured\n\n' +
          `Trying to connect to:\n${fullURL}`;
      } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        userTitle = 'Request Timeout';
        userMessage = 'Request timed out. The server may be slow or unreachable. Please try again.';
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        userTitle = 'Authentication Error';
        userMessage = 'Please login again to create an exam.';
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        userTitle = 'Access Denied';
        userMessage = 'You do not have permission to perform this action.';
      } else {
        userMessage = `Failed to create exam: ${errorMessage}`;
      }
      
      showToast.error(userMessage, userTitle);
      // Auto-retry after showing error
      setTimeout(() => {
        handleQuickExam(totalQuestions, negativeMarking);
      }, 2000);
    }
  };

  const handleResumeExam = async (sessionId: string) => {
    try {
      const examData = await resumeExamMutation.mutateAsync(sessionId);
      // Show exam creator with the resumed session
      setSelectedExamSessionId(sessionId);
      setShowExamCreator(true);
    } catch (error: any) {
      console.error('[WebExamContent] Error resuming exam:', error);
      showToast.error(error?.message || 'Failed to resume exam');
    }
  };

  const handleViewExam = (exam: any) => {
    if (exam.status === 'completed') {
      // Show results
      const score = exam.marksObtained || 0;
      const total = exam.totalMarks || 0;
      const percentage = total > 0 ? ((score / total) * 100).toFixed(1) : '0';
      const timeSpent = Math.floor((exam.timeSpentSeconds || 0) / 60);
      showToast.success(
        `Score: ${score}/${total} (${percentage}%) - Time: ${timeSpent} min`,
        'Exam Results'
      );
    } else {
      // Resume exam
      handleResumeExam(exam.sessionId);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return mins > 0 ? `${mins} min` : 'N/A';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'in_progress':
        return '#F59E0B';
      case 'not_started':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} color="#10B981" />;
      case 'in_progress':
        return <Clock size={16} color="#F59E0B" />;
      default:
        return <XCircle size={16} color="#6B7280" />;
    }
  };

  // Calculate statistics
  const completedExams = examHistory.filter((e: any) => e.status === 'completed');
  const avgScore = completedExams.length > 0
    ? (
        completedExams.reduce((sum: number, e: any) => {
          const pct = typeof e.percentage === 'string' ? parseFloat(e.percentage) : (e.percentage || 0);
          return sum + pct;
        }, 0) / completedExams.length
      ).toFixed(1)
    : '0.0';
  
  const bestScore = completedExams.length > 0
    ? Math.max(
        ...completedExams.map((e: any) => {
          const pct = typeof e.percentage === 'string' ? parseFloat(e.percentage) : (e.percentage || 0);
          return pct;
        })
      ).toFixed(1)
    : '0.0';
  
  const totalTime = Math.floor(
    examHistory.reduce((sum: number, e: any) => sum + (e.timeSpentSeconds || 0), 0) / 60
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please login to view exams</Text>
      </View>
    );
  }

  if (showExamCreator) {
    return (
      <View style={styles.container}>
        <AppHeader title="Exam" showLogo={true} extraTopSpacing={true} />
        <View style={styles.examHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setShowExamCreator(false);
              setSelectedExamSessionId(null);
            }}
          >
            <Text style={styles.backButtonText}>← Back to Exams</Text>
          </TouchableOpacity>
        </View>
        <DynamicExamContent sessionId={selectedExamSessionId} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Exams" showLogo={true} extraTopSpacing={true} />
      
      {/* Subtitle */}
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>Test your knowledge</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Tests</Text>
          {categoriesLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FF7846" />
              <Text style={styles.loadingText}>Loading categories...</Text>
            </View>
          )}
          {categoriesError && !usingFallbackCategories && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Error loading categories.</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => refetchCategories()}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          {usingFallbackCategories && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>Using default categories. Check your connection and refresh.</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => refetchCategories()}
              >
                <Text style={styles.retryButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[
                styles.quickActionCard, 
                styles.primaryCard,
                (categoriesLoading || createExamMutation.isPending) && styles.disabledCard
              ]}
              onPress={() => handleQuickExam(20, false)}
              disabled={createExamMutation.isPending || categoriesLoading}
            >
              {createExamMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Play size={32} color="#FFFFFF" />
                  <Text style={styles.quickActionTitle}>Quick Test</Text>
                  <Text style={styles.quickActionSubtitle}>20 Questions</Text>
                  <Text style={styles.quickActionDetail}>No negative marking</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionCard, 
                styles.primaryCard,
                (categoriesLoading || createExamMutation.isPending) && styles.disabledCard
              ]}
              onPress={() => handleQuickExam(50, false)}
              disabled={createExamMutation.isPending || categoriesLoading}
            >
              {createExamMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Play size={32} color="#FFFFFF" />
                  <Text style={styles.quickActionTitle}>Quick Test</Text>
                  <Text style={styles.quickActionSubtitle}>50 Questions</Text>
                  <Text style={styles.quickActionDetail}>No negative marking</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionCard, 
                styles.dangerCard,
                (categoriesLoading || createExamMutation.isPending) && styles.disabledCard
              ]}
              onPress={() => handleQuickExam(20, true)}
              disabled={createExamMutation.isPending || categoriesLoading}
            >
              {createExamMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Play size={32} color="#FFFFFF" />
                  <Text style={styles.quickActionTitle}>Challenge</Text>
                  <Text style={styles.quickActionSubtitle}>20 Questions</Text>
                  <Text style={styles.quickActionDetail}>-25% negative marking</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, styles.customCard]}
              onPress={() => setShowExamCreator(true)}
            >
              <Plus size={32} color="#722ED1" />
              <Text style={[styles.quickActionTitle, { color: '#722ED1' }]}>Custom</Text>
              <Text style={[styles.quickActionSubtitle, { color: '#6B7280' }]}>Configure</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <FileText size={24} color="#FF7846" />
              <Text style={styles.statValue}>{examHistory.length}</Text>
              <Text style={styles.statLabel}>Total Exams</Text>
            </View>
            <View style={styles.statCard}>
              <Trophy size={24} color="#10B981" />
              <Text style={styles.statValue}>{avgScore}%</Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </View>
            <View style={styles.statCard}>
              <Clock size={24} color="#F59E0B" />
              <Text style={styles.statValue}>{totalTime}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
            <View style={styles.statCard}>
              <Trophy size={24} color="#722ED1" />
              <Text style={styles.statValue}>{bestScore}%</Text>
              <Text style={styles.statLabel}>Best Score</Text>
            </View>
          </View>
        </View>

        {/* Exam History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Exams</Text>
          {historyLoading ? (
            <ActivityIndicator size="large" color="#FF7846" style={styles.loader} />
          ) : examHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No exams yet</Text>
              <Text style={styles.emptySubtext}>Start a quick test to begin!</Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {examHistory.map((exam: any) => {
                const percentage = typeof exam.percentage === 'string' 
                  ? parseFloat(exam.percentage) 
                  : (exam.percentage || 0);
                
                return (
                  <TouchableOpacity
                    key={exam.sessionId}
                    style={styles.historyItem}
                    onPress={() => handleViewExam(exam)}
                  >
                    <View style={styles.historyItemLeft}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(exam.status) + '20' }]}>
                        {getStatusIcon(exam.status)}
                      </View>
                      <View style={styles.historyItemInfo}>
                        <Text style={styles.historyItemTitle}>
                          {exam.examName || 'Untitled Exam'}
                        </Text>
                        <View style={styles.historyItemMeta}>
                          <Text style={styles.historyItemMetaText}>
                            {exam.totalQuestions || 0} questions
                          </Text>
                          <Text style={styles.historyItemMetaText}> • </Text>
                          <Text style={styles.historyItemMetaText}>
                            {formatTime(exam.timeSpentSeconds || 0)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.historyItemRight}>
                      {exam.status === 'completed' && (
                        <View style={styles.scoreContainer}>
                          <Text style={styles.scoreText}>
                            {exam.marksObtained || 0}/{exam.totalMarks || 0}
                          </Text>
                          <Text style={[styles.percentageText, { color: percentage >= 80 ? '#10B981' : percentage >= 60 ? '#F59E0B' : '#EF4444' }]}>
                            {percentage.toFixed(1)}%
                          </Text>
                        </View>
                      )}
                      <Text style={styles.dateText}>{formatDate(exam.completedAt || exam.createdAt)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  subtitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  quickActions: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  quickActionCard: {
    width: (width - 44) / 2,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    marginHorizontal: 6,
    marginBottom: 12,
  },
  primaryCard: {
    backgroundColor: '#FF7846',
  },
  dangerCard: {
    backgroundColor: '#EF4444',
  },
  customCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  quickActionDetail: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  statsSection: {
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  statCard: {
    width: (width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginHorizontal: 6,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  historySection: {
    marginBottom: 32,
  },
  loader: {
    marginVertical: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  historyList: {
    marginTop: 12,
  },
  historyItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyItemInfo: {
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  historyItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItemMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  historyItemRight: {
    alignItems: 'flex-end',
  },
  scoreContainer: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 40,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
    marginVertical: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  warningContainer: {
    alignItems: 'center',
    padding: 16,
    marginVertical: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#FF7846',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  examHeader: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FF7846',
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginBottom: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  disabledCard: {
    opacity: 0.5,
  },
});
