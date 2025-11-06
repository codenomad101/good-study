import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Modal,
  Dimensions
} from 'react-native';
import { 
  Play, 
  Clock, 
  CheckCircle, 
  XCircle,
  BookOpen,
  TrendingUp,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Timer,
  Eye,
  Trophy,
  Target,
  BarChart3
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { usePracticeCategories, useCreatePracticeSession, useUpdatePracticeAnswer, useCompletePracticeSession } from '../hooks/usePractice';
import { useCategories } from '../hooks/useCategories';
import { useUserStats } from '../hooks/useApi';
import { apiService } from '../services/api';
import AppHeader from './AppHeader';
import { useTranslation } from '../hooks/useTranslation';

const { width } = Dimensions.get('window');

interface PracticeCategory {
  id: string;
  name: string;
  description: string;
  fileName: string;
  categoryId?: string; // UUID from database
  slug?: string; // Slug identifier
}

interface PracticeQuestion {
  questionId: string;
  questionText: string;
  options: Array<{ id: number; text: string }>;
  correctAnswer: string;
  explanation: string;
  category: string;
  marks: number;
  questionType: string;
}

interface PracticeSession {
  sessionId: string;
  category: string;
  status: string;
  totalQuestions: number;
  timeLimitMinutes: number;
  startedAt: Date;
  completedAt?: Date;
  timeSpentSeconds: number;
  questionsAttempted: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  score: number;
  percentage: number;
  questionsData: Array<{
    questionId: string;
    questionText: string;
    options: Array<{ id: number; text: string }>;
    correctAnswer: string;
    userAnswer: string;
    isCorrect: boolean;
    timeSpentSeconds: number;
    explanation: string;
    category: string;
  }>;
}

interface UserPracticeStats {
  totalPracticeSessions: number;
  totalQuestionsAttempted: number;
  totalCorrectAnswers: number;
  totalIncorrectAnswers: number;
  currentStreak: number;
  longestStreak: number;
  totalTimeSpentMinutes: number;
  overallAccuracy: number;
  // Fields that are not directly available from /statistics/user but are part of the original interface
  totalPracticeScore: number;
  weeklyPracticeScore: number;
  monthlyPracticeScore: number;
  weeklyPracticeCount: number;
  monthlyPracticeCount: number;
  categoryPerformance: Record<string, any>;
}

const EnhancedPracticeContent: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  // Try to load categories from API, fallback to hardcoded
  const { data: categoriesResponse, isLoading: categoriesLoading } = useCategories();
  const { data: statsResponse, refetch: refetchUserStats, error: statsError } = useUserStats();
  const apiCategories = categoriesResponse?.data || (Array.isArray(categoriesResponse) ? categoriesResponse : []);
  
  const fallbackCategories: PracticeCategory[] = [
    { id: 'economy', name: 'Economy', description: 'Economic concepts and theories', fileName: 'economyEnglish.json' },
    { id: 'gk', name: 'General Knowledge', description: 'General knowledge questions', fileName: 'GKEnglish.json' },
    { id: 'history', name: 'History', description: 'Historical events and facts', fileName: 'historyEnglish.json' },
    { id: 'geography', name: 'Geography', description: 'Geographical knowledge', fileName: 'geographyEnglish.json' },
    { id: 'english', name: 'English Grammar', description: 'English language and grammar', fileName: 'englishGrammer.json' },
    { id: 'aptitude', name: 'Aptitude', description: 'Logical reasoning and aptitude', fileName: 'AptitudeEnglish.json' },
    { id: 'agriculture', name: 'Agriculture', description: 'Agricultural science and practices', fileName: 'agricultureEnglish.json' },
    { id: 'marathi', name: 'Marathi Grammar', description: 'Marathi language and grammar', fileName: 'grammerMarathi.json' },
  ];
  
  // Use API categories if available, otherwise use fallback
  // Note: Server accepts either categoryId (UUID) or slug for session creation
  const categories: PracticeCategory[] = apiCategories.length > 0 
    ? apiCategories.map((cat: any) => ({
        id: cat.slug || cat.categoryId || cat.id, // Prefer slug, fallback to categoryId (UUID), then id
        categoryId: cat.categoryId || cat.id, // Keep UUID reference
        slug: cat.slug || cat.id, // Keep slug reference
        name: cat.name,
        description: cat.description || '',
        fileName: cat.fileName || `${cat.slug || cat.id}.json`
      }))
    : fallbackCategories;

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [timeRemaining, setTimeRemaining] = useState(15 * 60); // 15 minutes in seconds
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionResults, setSessionResults] = useState<PracticeSession | null>(null);
  const [showExplanations, setShowExplanations] = useState(false);
  const [userStats, setUserStats] = useState<UserPracticeStats | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // API hooks
  const createSessionMutation = useCreatePracticeSession();
  const updateAnswerMutation = useUpdatePracticeAnswer();
  const completeSessionMutation = useCompletePracticeSession();

  useEffect(() => {
    if (statsError) {
      console.error('[EnhancedPractice] Error fetching stats:', statsError);
      setUserStats(null);
    } else if (statsResponse) {
      // Handle different response structures
      const statsData = (statsResponse as any)?.data || statsResponse || {};
      
      // Calculate average accuracy from practice data if available
      let practiceAccuracy = 0;
      if (statsData.practiceAccuracy !== undefined && statsData.practiceAccuracy !== null) {
        practiceAccuracy = typeof statsData.practiceAccuracy === 'string' 
          ? parseFloat(statsData.practiceAccuracy) 
          : Number(statsData.practiceAccuracy);
      } else if (statsData.overallAccuracy !== undefined && statsData.overallAccuracy !== null) {
        practiceAccuracy = typeof statsData.overallAccuracy === 'string' 
          ? parseFloat(statsData.overallAccuracy) 
          : Number(statsData.overallAccuracy);
      }
      
      // Calculate average accuracy if we have questions attempted and correct answers
      let calculatedAccuracy = practiceAccuracy;
      if (statsData.totalQuestionsAttempted > 0 && statsData.totalCorrectAnswers !== undefined) {
        const calculated = (statsData.totalCorrectAnswers / statsData.totalQuestionsAttempted) * 100;
        // Use calculated value if practiceAccuracy is 0 or invalid
        if (isNaN(practiceAccuracy) || practiceAccuracy === 0) {
          calculatedAccuracy = calculated;
        } else {
          // Prefer stored accuracy, but use calculated if it's more reasonable
          calculatedAccuracy = practiceAccuracy;
        }
      }
      
      // Ensure calculatedAccuracy is a valid number
      if (isNaN(calculatedAccuracy)) {
        calculatedAccuracy = 0;
      }
      
      const mappedStats: UserPracticeStats = {
        totalPracticeSessions: statsData.totalPracticeSessions || 0,
        totalQuestionsAttempted: statsData.totalQuestionsAttempted || 0,
        totalCorrectAnswers: statsData.totalCorrectAnswers || 0,
        totalIncorrectAnswers: statsData.totalIncorrectAnswers || 0,
        currentStreak: statsData.currentStreak || 0,
        longestStreak: statsData.longestStreak || 0,
        totalTimeSpentMinutes: statsData.totalTimeSpentMinutes || 0,
        overallAccuracy: calculatedAccuracy,
        // Fields not directly available from /statistics/user but are part of the original interface
        totalPracticeScore: statsData.totalCorrectAnswers || 0, // Using totalCorrectAnswers as practice score
        weeklyPracticeScore: 0,
        monthlyPracticeScore: 0,
        weeklyPracticeCount: 0,
        monthlyPracticeCount: 0,
        categoryPerformance: {},
      };
      
      console.log('[EnhancedPractice] Mapped stats:', mappedStats);
      setUserStats(mappedStats);
    } else {
      console.log('[EnhancedPractice] No stats response available');
      setUserStats(null);
    }
  }, [statsResponse, statsError]);

  const startSession = () => {
    setSessionStarted(true);
    setSessionCompleted(false);
    setSessionResults(null);
    
    // Start timer
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          completeSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const loadQuestions = async (category: string) => {
    setIsLoading(true);
    
    try {
      // Import the JSON data directly
      let questionsData: any[] = [];
      
      switch (category) {
        case 'economy':
          questionsData = require('../data/English/economyEnglish.json');
          break;
        case 'current-affairs':
        case 'gk':
          questionsData = require('../data/English/GKEnglish.json');
          break;
        case 'history':
          questionsData = require('../data/English/historyEnglish.json');
          break;
        case 'geography':
          questionsData = require('../data/English/geographyEnglish.json');
          break;
        case 'english':
          questionsData = require('../data/English/englishGrammer.json');
          break;
        case 'aptitude':
          questionsData = require('../data/English/AptitudeEnglish.json');
          break;
        case 'agriculture':
          questionsData = require('../data/English/agricultureEnglish.json');
          break;
        case 'marathi':
          questionsData = require('../data/Marathi/grammerMarathi.json');
          break;
        default:
          throw new Error('Invalid category');
      }

      if (!Array.isArray(questionsData)) {
        throw new Error('Invalid questions format');
      }

      // Shuffle and select 20 random questions
      const shuffled = questionsData.sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, 20);

      // Transform to our format
      const formattedQuestions: PracticeQuestion[] = selectedQuestions.map((q: any, index: number) => ({
        questionId: `q_${index + 1}`,
        questionText: q.Question || q.question || '',
        options: q.Options ? q.Options.map((opt: any, optIndex: number) => ({
          id: optIndex + 1,
          text: typeof opt === 'string' ? opt : opt.text || opt.id || ''
        })) : [],
        correctAnswer: q.CorrectAnswer || q.correctAnswer || '',
        explanation: q.Explanation || q.explanation || 'No explanation available',
        category: q.Category || q.category || category,
        marks: q.Marks || q.marks || 1,
        questionType: q.QuestionType || q.questionType || 'multiple_choice'
      }));

      setQuestions(formattedQuestions);
      setSelectedCategory(category);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setTimeRemaining(15 * 60);
      setQuestionStartTime(Date.now());
      
      
      // Create a practice session via API if user is authenticated
      if (user?.userId) {
        try {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(user.userId)) {
            // Ensure category is a valid string (use selectedCategory as fallback)
            const categoryToUse = category || selectedCategory || '';
            if (!categoryToUse || categoryToUse.trim() === '') {
              return;
            }
            
            // Find the category object to get both slug and categoryId
            const categoryObj = categories.find(cat => cat.id === categoryToUse || cat.slug === categoryToUse);
            // Prefer slug over UUID, as that's what the web frontend uses
            const categoryForServer = categoryObj?.slug || categoryObj?.categoryId || categoryToUse.trim();
            
         
            
            const sessionResult = await createSessionMutation.mutateAsync({
              category: categoryForServer, // Send slug or UUID to server
              timeLimitMinutes: 15,
              language: 'en'
            });
            
            
            // The response structure is { success: true, data: { sessionId, questions, ... } }
            const sessionData = (sessionResult as any)?.data;
            if (sessionData?.sessionId) {
              setSessionId(sessionData.sessionId);
              
              // If server returned questions with proper questionIds, update our local questions array
              if (sessionData.questions && Array.isArray(sessionData.questions) && sessionData.questions.length > 0) {
                // Map server questions to our format, preserving server questionIds
                const serverQuestions: PracticeQuestion[] = sessionData.questions.map((q: any, index: number) => ({
                  questionId: q.questionId || `q_${index + 1}`, // Use server questionId if available
                  questionText: q.questionText || q.question || '',
                  options: q.options || q.Options || [],
                  correctAnswer: q.correctAnswer || q.CorrectAnswer || '',
                  explanation: q.explanation || q.Explanation || 'No explanation available',
                  category: q.category || q.Category || category,
                  marks: q.marks || q.Marks || 1,
                  questionType: q.questionType || q.QuestionType || 'multiple_choice'
                }));
                setQuestions(serverQuestions);
              }
            } else {
            }
          } else {
          }
        } catch (error: any) {
        
          // Continue with local session - don't block the user
        }
      } else {
        console.log('No user ID available, skipping session creation');
      }
      
      // Automatically start the session after loading questions
      startSession();
      
    } catch (error) {
      Alert.alert('Error', 'Failed to load questions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const completeSession = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const totalTimeSpent = (15 * 60) - timeRemaining;
    const questionsData = questions.map((q, index) => {
      const userAnswer = userAnswers[q.questionId] || '';
      const isCorrect = userAnswer === q.correctAnswer;
      
      return {
        questionId: q.questionId,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        userAnswer,
        isCorrect,
        timeSpentSeconds: 45, // Average time per question
        explanation: q.explanation,
        category: q.category
      };
    });

    const correctAnswers = questionsData.filter(q => q.isCorrect).length;
    const incorrectAnswers = questionsData.filter(q => !q.isCorrect && q.userAnswer).length;
    const skippedQuestions = questionsData.filter(q => !q.userAnswer).length;
    const percentage = (correctAnswers / questions.length) * 100;

    const sessionData = {
      category: selectedCategory,
      totalQuestions: questions.length,
      timeLimitMinutes: 15,
      timeSpentSeconds: totalTimeSpent,
      questionsData,
      correctAnswers,
      incorrectAnswers,
      questionsAttempted: correctAnswers + incorrectAnswers,
      skippedQuestions,
      percentage: percentage.toFixed(2)
    };

    try {
      // Check if userId is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!user?.userId || !uuidRegex.test(user.userId)) {
        
        // Still show results locally
        setSessionResults({
          sessionId: `local_${Date.now()}`,
          category: selectedCategory || '',
          status: 'completed',
          totalQuestions: questions.length,
          timeLimitMinutes: 15,
          startedAt: new Date(),
          completedAt: new Date(),
          timeSpentSeconds: totalTimeSpent,
          questionsAttempted: correctAnswers + incorrectAnswers,
          correctAnswers,
          incorrectAnswers,
          skippedQuestions,
          score: correctAnswers,
          percentage,
          questionsData
        });
        
        setSessionCompleted(true);
        
        Alert.alert(
          'Session Completed!',
          `You scored ${correctAnswers}/${questions.length} (${percentage.toFixed(1)}%)`,
          [
            { text: 'View Results', onPress: () => setShowExplanations(true) },
            { text: 'OK' }
          ]
        );
        return;
      }


      // If we have a sessionId, complete it using the API
      if (sessionId) {
        try {
          await completeSessionMutation.mutateAsync(sessionId);
          
          setSessionResults({
            sessionId: sessionId,
            category: selectedCategory || '',
            status: 'completed',
            totalQuestions: questions.length,
            timeLimitMinutes: 15,
            startedAt: new Date(),
            completedAt: new Date(),
            timeSpentSeconds: totalTimeSpent,
            questionsAttempted: correctAnswers + incorrectAnswers,
            correctAnswers,
            incorrectAnswers,
            skippedQuestions,
            score: correctAnswers,
            percentage,
            questionsData
          });
          
          setSessionCompleted(true);
          await refetchUserStats();
          
          Alert.alert(
            'Session Completed!',
            `You scored ${correctAnswers}/${questions.length} (${percentage.toFixed(1)}%)`,
            [
              { text: 'View Results', onPress: () => setShowExplanations(true) },
              { text: 'OK' }
            ]
          );
          return;
        } catch (error: any) {
          Alert.alert('Error', error.message || 'Failed to save session results');
          return;
        }
      }

      // Fallback: For local sessions, save as local results only
      
      setSessionResults({
        sessionId: `local_${Date.now()}`,
        category: selectedCategory || '',
        status: 'completed',
        totalQuestions: questions.length,
        timeLimitMinutes: 15,
        startedAt: new Date(),
        completedAt: new Date(),
        timeSpentSeconds: totalTimeSpent,
        questionsAttempted: correctAnswers + incorrectAnswers,
        correctAnswers,
        incorrectAnswers,
        skippedQuestions,
        score: correctAnswers,
        percentage,
        questionsData
      });
      
      setSessionCompleted(true);
      
      Alert.alert(
        'Session Completed!',
        `You scored ${correctAnswers}/${questions.length} (${percentage.toFixed(1)}%)`,
        [
          { text: 'View Results', onPress: () => setShowExplanations(true) },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save session results');
    }
  };

  const selectAnswer = async (questionId: string, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    // Save answer to backend if we have a sessionId
    if (sessionId && user?.userId) {
      try {
        const timeSpent = Date.now() - questionStartTime;
        const currentQuestion = questions.find(q => q.questionId === questionId);
        
        // Try to find the option ID from the answer text
        let userAnswerValue = answer;
        if (currentQuestion && currentQuestion.options) {
          const selectedOption = currentQuestion.options.find(opt => opt.text === answer);
          if (selectedOption) {
            // Send option ID as string if available, otherwise send the text
            userAnswerValue = selectedOption.id?.toString() || answer;
          }
        }
        
     
        
        await updateAnswerMutation.mutateAsync({
          sessionId,
          questionId,
          userAnswer: userAnswerValue,
          timeSpentSeconds: Math.floor(timeSpent / 1000)
        });
      } catch (error: any) {
        console.error('[EnhancedPracticeContent] Failed to save answer to backend:', {
          error: error?.message,
          
        });
        // Don't block the UI if saving fails - user can still continue
      }
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionStartTime(Date.now());
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setQuestionStartTime(Date.now());
    }
  };

  const resetSession = () => {
    setSessionStarted(false);
    setSessionCompleted(false);
    setSessionResults(null);
    setShowExplanations(false);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setTimeRemaining(15 * 60);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return '#10B981'; // Green
    if (percentage >= 60) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const renderCategorySelection = () => (
    <View style={styles.container}>
      <AppHeader title="Practice" showLogo={true} extraTopSpacing={true} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Your Progress - Styled like streak card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressMain}>
              <View style={styles.progressTitleRow}>
                <Text style={styles.progressTitle}>Your Progress</Text>
              </View>
              {userStats ? (
                <View style={styles.progressStatsRow}>
                  <View style={styles.progressStatItem}>
                    <Text style={styles.progressStatNumber}>{userStats.totalPracticeSessions || 0}</Text>
                    <Text style={styles.progressStatLabel}>Sessions</Text>
                  </View>
                  <View style={styles.progressStatDivider} />
                  <View style={styles.progressStatItem}>
                    <Text style={styles.progressStatNumber}>
                      {(() => {
                        let accuracy = 0;
                        if (userStats.overallAccuracy !== undefined && userStats.overallAccuracy !== null) {
                          accuracy = typeof userStats.overallAccuracy === 'string' 
                            ? parseFloat(userStats.overallAccuracy) 
                            : Number(userStats.overallAccuracy);
                        } else if (userStats.totalQuestionsAttempted > 0 && userStats.totalCorrectAnswers !== undefined) {
                          accuracy = (userStats.totalCorrectAnswers / userStats.totalQuestionsAttempted) * 100;
                        }
                        return isNaN(accuracy) ? '0' : accuracy.toFixed(1);
                      })()}%
                    </Text>
                    <Text style={styles.progressStatLabel}>Accuracy</Text>
                  </View>
                  <View style={styles.progressStatDivider} />
                  <View style={styles.progressStatItem}>
                    <Text style={styles.progressStatNumber}>{userStats.totalTimeSpentMinutes || 0}</Text>
                    <Text style={styles.progressStatLabel}>Minutes</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.progressStatsRow}>
                  <View style={styles.progressStatItem}>
                    <Text style={styles.progressStatNumber}>0</Text>
                    <Text style={styles.progressStatLabel}>Sessions</Text>
                  </View>
                  <View style={styles.progressStatDivider} />
                  <View style={styles.progressStatItem}>
                    <Text style={styles.progressStatNumber}>0%</Text>
                    <Text style={styles.progressStatLabel}>Accuracy</Text>
                  </View>
                  <View style={styles.progressStatDivider} />
                  <View style={styles.progressStatItem}>
                    <Text style={styles.progressStatNumber}>0</Text>
                    <Text style={styles.progressStatLabel}>Minutes</Text>
                  </View>
                </View>
              )}
            </View>
            <Trophy size={36} color="#FCD34D" />
          </View>
        </View>

        {/* Subtitle and Stats Button */}
        <View style={styles.subtitleSection}>
          <Text style={styles.subtitle}>{t('practice.chooseCategory')}</Text>
          {userStats && (
            <TouchableOpacity 
              style={styles.statsButton}
              onPress={() => setShowStats(true)}
            >
              <BarChart3 size={20} color="#3B82F6" />
              <Text style={styles.statsButtonText}>{t('practice.statistics')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Practice Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('practice.availableCategories')}</Text>
          <View style={styles.practiceContainer}>
            {categories.map((category) => (
              <View key={category.id} style={styles.practiceItem}>
                <View style={styles.practiceHeader}>
                  <View style={styles.practiceInfo}>
                    <View style={styles.categoryIconContainer}>
                      <BookOpen size={24} color="#3B82F6" />
                    </View>
                    <View style={styles.categoryDetails}>
                      <Text style={styles.practiceSubject}>{category.name}</Text>
                      <Text style={styles.categoryDescription}>{category.description}</Text>
                      <View style={styles.practiceMeta}>
                        <View style={styles.practiceMetaItem}>
                          <Clock size={12} color="#6B7280" />
                          <Text style={styles.practiceMetaText}>15 min</Text>
                        </View>
                        <Text style={styles.practiceMetaText}>20 {t('practice.questions')}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.startButton}
                    onPress={() => loadQuestions(category.id)}
                    disabled={isLoading}
                  >
                    <Text style={styles.startButtonText}>{t('practice.start')}</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Progress Bar Placeholder */}
                <View style={styles.progressBar}>
                  <View style={styles.progressFill} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>{t('practice.loadingQuestions')}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderQuestion = () => {
    const question = questions[currentQuestionIndex];
    const userAnswer = userAnswers[question.questionId];

    return (
      <View style={styles.questionContainer}>
        <View style={styles.questionHeader}>
          <View style={styles.questionCounter}>
            <Text style={styles.questionCounterText}>
              {t('practice.question')} {currentQuestionIndex + 1} {t('practice.of')} {questions.length}
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <View style={styles.timerContainer}>
              <Timer size={20} color={timeRemaining < 300 ? '#EF4444' : '#3B82F6'} />
              <Text style={[
                styles.timerText,
                { color: timeRemaining < 300 ? '#EF4444' : '#3B82F6' }
              ]}>
                {formatTime(timeRemaining)}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.quitButton}
              onPress={() => {
                Alert.alert(
                  t('practice.quit'),
                  t('practice.quitConfirm'),
                  [
                    { text: t('common.cancel'), style: 'cancel' },
                    { 
                      text: t('practice.quit'), 
                      style: 'destructive',
                      onPress: () => {
                        if (timerRef.current) {
                          clearInterval(timerRef.current);
                        }
                        resetSession();
                      }
                    }
                  ]
                );
              }}
            >
              <XCircle size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.questionContent}>
          <Text style={styles.questionText}>{question.questionText}</Text>
          
          <View style={styles.optionsContainer}>
            {question.options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  userAnswer === option.text && styles.selectedOption
                ]}
                onPress={() => selectAnswer(question.questionId, option.text)}
              >
                <Text style={[
                  styles.optionText,
                  userAnswer === option.text && styles.selectedOptionText
                ]}>
                  {option.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, currentQuestionIndex === 0 && styles.disabledButton]}
            onPress={previousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft size={20} color={currentQuestionIndex === 0 ? '#9CA3AF' : '#3B82F6'} />
            <Text style={[
              styles.navButtonText,
              currentQuestionIndex === 0 && styles.disabledButtonText
            ]}>
              {t('practice.previousQuestion')}
            </Text>
          </TouchableOpacity>

          {currentQuestionIndex === questions.length - 1 ? (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={completeSession}
            >
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={styles.completeButtonText}>{t('practice.complete')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.navButton}
              onPress={nextQuestion}
            >
              <Text style={styles.navButtonText}>{t('practice.nextQuestion')}</Text>
              <ArrowRight size={20} color="#3B82F6" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderResults = () => {
    if (!sessionResults) return null;

    const { correctAnswers, totalQuestions, percentage, timeSpentSeconds } = sessionResults;
    const scoreColor = getScoreColor(percentage);

    return (
      <ScrollView style={styles.container}>
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Trophy size={48} color={scoreColor} />
            <Text style={styles.resultsTitle}>{t('practice.sessionCompleted')}</Text>
            <Text style={styles.resultsSubtitle}>
              {selectedCategory?.charAt(0).toUpperCase() + selectedCategory?.slice(1)} {t('practice.title')}
            </Text>
          </View>

          <View style={styles.scoreContainer}>
            <View style={styles.scoreItem}>
              <Target size={24} color={scoreColor} />
              <Text style={styles.scoreLabel}>{t('practice.score')}</Text>
              <Text style={[styles.scoreValue, { color: scoreColor }]}>
                {correctAnswers}/{totalQuestions}
              </Text>
            </View>
            
            <View style={styles.scoreItem}>
              <TrendingUp size={24} color={scoreColor} />
              <Text style={styles.scoreLabel}>{t('practice.percentage')}</Text>
              <Text style={[styles.scoreValue, { color: scoreColor }]}>
                {percentage.toFixed(1)}%
              </Text>
            </View>
            
            <View style={styles.scoreItem}>
              <Clock size={24} color="#3B82F6" />
              <Text style={styles.scoreLabel}>{t('practice.timeSpent')}</Text>
              <Text style={styles.scoreValue}>
                {Math.floor(timeSpentSeconds / 60)}:{(timeSpentSeconds % 60).toString().padStart(2, '0')}
              </Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.explanationButton}
              onPress={() => setShowExplanations(true)}
            >
              <Eye size={20} color="#3B82F6" />
              <Text style={styles.explanationButtonText}>View Explanations</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.restartButton}
              onPress={resetSession}
            >
              <RefreshCw size={20} color="#FFFFFF" />
              <Text style={styles.restartButtonText}>{t('practice.practiceAgain')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderExplanations = () => {
    if (!sessionResults) return null;

    return (
      <Modal
        visible={showExplanations}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.explanationsContainer}>
          <View style={styles.explanationsHeader}>
            <Text style={styles.explanationsTitle}>Question Explanations</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowExplanations(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.explanationsContent}>
            {sessionResults.questionsData.map((question, index) => (
              <View key={question.questionId} style={styles.explanationItem}>
                <View style={styles.explanationHeader}>
                  <Text style={styles.explanationQuestionNumber}>
                    Question {index + 1}
                  </Text>
                  <View style={[
                    styles.explanationStatus,
                    { backgroundColor: question.isCorrect ? '#10B981' : '#EF4444' }
                  ]}>
                    {question.isCorrect ? (
                      <CheckCircle size={16} color="#FFFFFF" />
                    ) : (
                      <XCircle size={16} color="#FFFFFF" />
                    )}
                  </View>
                </View>

                <Text style={styles.explanationQuestionText}>
                  {question.questionText}
                </Text>

                <View style={styles.explanationAnswers}>
                  <View style={styles.explanationAnswer}>
                    <Text style={styles.explanationAnswerLabel}>Your Answer:</Text>
                    <Text style={[
                      styles.explanationAnswerText,
                      { color: question.isCorrect ? '#10B981' : '#EF4444' }
                    ]}>
                      {question.userAnswer || 'Not answered'}
                    </Text>
                  </View>
                  
                  <View style={styles.explanationAnswer}>
                    <Text style={styles.explanationAnswerLabel}>Correct Answer:</Text>
                    <Text style={styles.explanationAnswerText}>
                      {question.correctAnswer}
                    </Text>
                  </View>
                </View>

                <View style={styles.explanationBox}>
                  <Text style={styles.explanationLabel}>Explanation:</Text>
                  <Text style={styles.explanationText}>
                    {question.explanation}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const renderStats = () => {
    if (!userStats) return null;

    return (
      <Modal
        visible={showStats}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.statsContainer}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsTitle}>{t('practice.yourPracticeStatistics')}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowStats(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.statsContent}>
            <View style={styles.statsSection}>
              <Text style={styles.statsSectionTitle}>Overall Performance</Text>
              
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userStats.totalPracticeSessions}</Text>
                  <Text style={styles.statLabel}>Total Sessions</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userStats.totalPracticeScore}</Text>
                  <Text style={styles.statLabel}>Total Score</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {(() => {
                      let accuracy = 0;
                      if (userStats.overallAccuracy !== undefined && userStats.overallAccuracy !== null) {
                        accuracy = typeof userStats.overallAccuracy === 'string' 
                          ? parseFloat(userStats.overallAccuracy) 
                          : Number(userStats.overallAccuracy);
                      } else if (userStats.totalQuestionsAttempted > 0 && userStats.totalCorrectAnswers !== undefined) {
                        accuracy = (userStats.totalCorrectAnswers / userStats.totalQuestionsAttempted) * 100;
                      }
                      return isNaN(accuracy) ? '0' : accuracy.toFixed(1);
                    })()}%
                  </Text>
                  <Text style={styles.statLabel}>Average Accuracy</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userStats.currentStreak}</Text>
                  <Text style={styles.statLabel}>Current Streak</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsSection}>
              <Text style={styles.statsSectionTitle}>Weekly Performance</Text>
              
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userStats.weeklyPracticeCount}</Text>
                  <Text style={styles.statLabel}>Sessions This Week</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userStats.weeklyPracticeScore}</Text>
                  <Text style={styles.statLabel}>Weekly Score</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsSection}>
              <Text style={styles.statsSectionTitle}>Monthly Performance</Text>
              
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userStats.monthlyPracticeCount}</Text>
                  <Text style={styles.statLabel}>Sessions This Month</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userStats.monthlyPracticeScore}</Text>
                  <Text style={styles.statLabel}>Monthly Score</Text>
                </View>
              </View>
            </View>

            {Object.keys(userStats.categoryPerformance).length > 0 && (
              <View style={styles.statsSection}>
                <Text style={styles.statsSectionTitle}>Category Performance</Text>
                
                {Object.entries(userStats.categoryPerformance).map(([category, stats]: [string, any]) => (
                  <View key={category} style={styles.categoryStatItem}>
                    <Text style={styles.categoryStatName}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                    <Text style={styles.categoryStatDetails}>
                      {stats.correct}/{stats.total} correct ({stats.sessions} sessions)
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    );
  };

  // Error boundary - if categories are loading, show loading state
  if (categoriesLoading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Practice" showLogo={true} extraTopSpacing={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading Categories...</Text>
        </View>
      </View>
    );
  }

  if (sessionCompleted) {
    return (
      <>
        {renderResults()}
        {renderExplanations()}
        {renderStats()}
      </>
    );
  }

  if (sessionStarted) {
    return (
      <>
        {renderQuestion()}
        {renderExplanations()}
        {renderStats()}
      </>
    );
  }

  return (
    <>
      {renderCategorySelection()}
      {renderStats()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  progressCard: {
    backgroundColor: '#F97316',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressMain: {
    flex: 1,
  },
  progressTitleRow: {
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  progressStatLabel: {
    fontSize: 11,
    color: '#FED7AA',
    fontWeight: '500',
  },
  progressStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#FED7AA',
    opacity: 0.5,
  },
  subtitleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statsButtonText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  practiceContainer: {
    paddingHorizontal: 20,
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
    flexDirection: 'row',
    flex: 1,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  practiceSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
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
    fontSize: 12,
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
    fontSize: 14,
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
    width: '0%',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  questionContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  questionCounter: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  questionCounterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timerText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  questionContent: {
    flex: 1,
    padding: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 26,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
  },
  selectedOptionText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginHorizontal: 8,
  },
  disabledButton: {
    backgroundColor: '#F9FAFB',
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  resultsHeader: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  resultsSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 30,
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  actionButtons: {
    padding: 20,
    gap: 12,
  },
  explanationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 8,
  },
  explanationButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 8,
  },
  restartButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  explanationsContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  explanationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  explanationsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  explanationsContent: {
    flex: 1,
    padding: 20,
  },
  explanationItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  explanationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  explanationQuestionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  explanationStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  explanationQuestionText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 16,
  },
  explanationAnswers: {
    marginBottom: 16,
  },
  explanationAnswer: {
    marginBottom: 8,
  },
  explanationAnswerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  explanationAnswerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  explanationBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  explanationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  statsContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statsContent: {
    flex: 1,
    padding: 20,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: (width - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  categoryStatItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryStatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  categoryStatDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default EnhancedPracticeContent;
