import React, { useState, useRef, useEffect } from 'react';
import { apiService } from '../services/api';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { 
  Clock, 
  BookOpen, 
  Target, 
  CheckCircle, 
  XCircle, 
  Trophy,
  BarChart3,
  Play,
  Settings,
  Award
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../utils/toast';
import { useCategories } from '../hooks/useCategories';
import { useRemainingSessions } from '../hooks/useApi';
import { useRouter } from 'expo-router';

interface Question {
  questionId: string;
  questionText: string;
  options: Array<{ id: number; text: string }>;
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  marksObtained: number;
  category: string;
  marksPerQuestion: number;
}

interface ExamSession {
  sessionId: string;
  examName: string;
  totalMarks: number;
  durationMinutes: number;
  totalQuestions: number;
  negativeMarking: boolean;
  negativeMarksRatio: number;
  questions: Question[];
}

interface DynamicExamContentProps {
  sessionId?: string | null;
  onViewChange?: (view: 'config' | 'exam' | 'results') => void;
}

const DynamicExamContent: React.FC<DynamicExamContentProps> = ({ sessionId: initialSessionId, onViewChange }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [currentView, setCurrentView] = useState<'config' | 'exam' | 'results'>('config');
  const [isLoading, setIsLoading] = useState(false);
  const [examSession, setExamSession] = useState<ExamSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [examStats, setExamStats] = useState<any>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTime = useRef<number>(Date.now());

  // Fetch categories
  const { data: categoriesResponse, isLoading: categoriesLoading } = useCategories();
  const { data: remainingSessions, refetch: refetchRemainingSessions } = useRemainingSessions();
  
  // Extract categories from response
  let apiCategories: any[] = [];
  if (categoriesResponse) {
    if (Array.isArray(categoriesResponse)) {
      apiCategories = categoriesResponse;
    } else if (categoriesResponse.data) {
      if (Array.isArray(categoriesResponse.data)) {
        apiCategories = categoriesResponse.data;
      } else if (categoriesResponse.data.data && Array.isArray(categoriesResponse.data.data)) {
        apiCategories = categoriesResponse.data.data;
      }
    } else if (categoriesResponse.success && Array.isArray(categoriesResponse.data)) {
      apiCategories = categoriesResponse.data;
    }
  }
  
  // Fallback categories
  const fallbackCategories = [
    { id: 'economy', slug: 'economy', categoryId: 'economy', name: 'Economy' },
    { id: 'gk', slug: 'gk', categoryId: 'gk', name: 'General Knowledge' },
    { id: 'history', slug: 'history', categoryId: 'history', name: 'History' },
    { id: 'geography', slug: 'geography', categoryId: 'geography', name: 'Geography' },
    { id: 'english', slug: 'english', categoryId: 'english', name: 'English' },
    { id: 'aptitude', slug: 'aptitude', categoryId: 'aptitude', name: 'Aptitude' },
    { id: 'agriculture', slug: 'agriculture', categoryId: 'agriculture', name: 'Agriculture' },
    { id: 'polity', slug: 'polity', categoryId: 'polity', name: 'Polity' },
    { id: 'science', slug: 'science', categoryId: 'science', name: 'Science' },
    { id: 'current-affairs', slug: 'current-affairs', categoryId: 'current-affairs', name: 'Current Affairs' },
    { id: 'marathi', slug: 'marathi', categoryId: 'marathi', name: 'Marathi' },
  ];
  
  const categories = apiCategories.length > 0 ? apiCategories : fallbackCategories;

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Notify parent when view changes
  useEffect(() => {
    if (onViewChange) {
      onViewChange(currentView);
    }
  }, [currentView, onViewChange]);

  // Auto-load questions if sessionId is provided
  useEffect(() => {
    if (initialSessionId && !examSession && !isLoading) {
      console.log('[DynamicExamContent] Auto-loading questions for sessionId:', initialSessionId);
      generateQuestions(initialSessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSessionId]);

  // Function to generate question distribution
  const generateQuestionDistribution = (totalQuestions: number) => {
    const validCategories = Array.isArray(categories) ? categories : [];
    const numCategories = validCategories.length;
    
    // Calculate minimum questions per category based on exam size
    let minQuestionsPerCategory: number;
    if (totalQuestions <= 20) {
      minQuestionsPerCategory = Math.max(1, Math.floor(totalQuestions / numCategories));
      if (totalQuestions >= numCategories * 2) {
        minQuestionsPerCategory = 2;
      }
    } else {
      minQuestionsPerCategory = Math.max(3, Math.floor(totalQuestions / numCategories));
      if (totalQuestions >= numCategories * 3) {
        minQuestionsPerCategory = 3;
      }
    }
    
    // Calculate distribution: each category gets minimum, then distribute remaining
    const baseQuestions = minQuestionsPerCategory * numCategories;
    const remainingQuestions = Math.max(0, totalQuestions - baseQuestions);
    
    // Priority categories for extra questions
    const priorityCategories = ['polity', 'economy', 'history', 'science', 'gk', 'current-affairs'];
    
    const distribution = validCategories.map((cat: any) => {
      const categorySlug = (cat.slug || cat.id || cat.categoryId || '').toLowerCase();
      const baseCount = minQuestionsPerCategory;
      
      // Calculate extra questions for this category
      let extraCount = 0;
      if (remainingQuestions > 0) {
        if (priorityCategories.includes(categorySlug)) {
          extraCount = Math.ceil(remainingQuestions / (priorityCategories.length + 2));
        } else {
          extraCount = Math.floor(remainingQuestions / (numCategories * 3));
        }
      }
      
      return {
        category: cat.id || cat.slug || cat.categoryId,
        count: baseCount + extraCount,
        marksPerQuestion: 2,
      };
    });
    
    // Adjust to ensure total matches exactly
    let currentTotal = distribution.reduce((sum: number, d: any) => sum + d.count, 0);
    let difference = totalQuestions - currentTotal;
    
    if (difference !== 0) {
      const priorityIndices = validCategories
        .map((cat: any, idx: number) => {
          const slug = (cat.slug || cat.id || cat.categoryId || '').toLowerCase();
          return priorityCategories.includes(slug) ? idx : -1;
        })
        .filter(idx => idx !== -1);
      
      let idx = 0;
      while (difference > 0 && priorityIndices.length > 0) {
        const targetIdx = priorityIndices[idx % priorityIndices.length];
        distribution[targetIdx].count += 1;
        difference -= 1;
        idx += 1;
      }
      
      idx = 0;
      while (difference > 0) {
        distribution[idx % distribution.length].count += 1;
        difference -= 1;
        idx += 1;
      }
      
      idx = 0;
      while (difference < 0) {
        if (distribution[idx % distribution.length].count > minQuestionsPerCategory) {
          distribution[idx % distribution.length].count -= 1;
          difference += 1;
        }
        idx += 1;
        if (idx > distribution.length * 10) break;
      }
    }
    
    return distribution;
  };

  // Exam configuration - initialize with default 20 questions
  const [examConfig, setExamConfig] = useState(() => {
    const defaultDistribution = [
      { category: 'economy', count: 2, marksPerQuestion: 2 },
      { category: 'gk', count: 2, marksPerQuestion: 2 },
      { category: 'history', count: 2, marksPerQuestion: 2 },
      { category: 'geography', count: 2, marksPerQuestion: 2 },
      { category: 'english', count: 2, marksPerQuestion: 2 },
      { category: 'aptitude', count: 2, marksPerQuestion: 2 },
      { category: 'agriculture', count: 2, marksPerQuestion: 2 },
      { category: 'marathi', count: 2, marksPerQuestion: 2 }
    ];
    const totalQ = defaultDistribution.reduce((sum, d) => sum + d.count, 0);
    return {
      examName: 'Quick Test',
      totalMarks: totalQ * 2,
      durationMinutes: Math.ceil(totalQ * 0.75),
      negativeMarking: true,
      negativeMarksRatio: 0.25,
      questionDistribution: defaultDistribution
    };
  });

  // Update exam config when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !initialSessionId) {
      const distribution = generateQuestionDistribution(20);
      const totalQ = distribution.reduce((sum: number, d: any) => sum + d.count, 0);
      setExamConfig({
        examName: 'Quick Test',
        totalMarks: totalQ * 2,
        durationMinutes: Math.ceil(totalQ * 0.75),
        negativeMarking: true,
        negativeMarksRatio: 0.25,
        questionDistribution: distribution
      });
    }
  }, [categories.length, initialSessionId]);

  // Helper function to get category name
  const getCategoryName = (categoryId: string) => {
    const cat = categories.find((c: any) => 
      (c.id || c.slug || c.categoryId) === categoryId
    );
    return cat?.name || categoryId;
  };

  // Timer functions
  const startTimer = (durationMinutes: number) => {
    // Clear any existing timer first
    stopTimer();
    setTimeRemaining(durationMinutes * 60);
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTimeUp = () => {
    stopTimer();
    showToast.info('Your exam time has ended. Submitting your answers...', 'Time Up!');
    // Auto-complete exam after a short delay
    setTimeout(() => {
      completeExam();
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Create exam session (only used if no initialSessionId provided)
  const createExamSession = async () => {
    if (!user?.userId) {
      showToast.error('User not authenticated');
      return;
    }

    if (initialSessionId) {
      // Session already created, just load questions
      await generateQuestions(initialSessionId);
      return;
    }

    // Check remaining exam sessions for free plan
    if (remainingSessions && remainingSessions.exam !== -1 && remainingSessions.exam <= 0) {
      Modal.alert(
        'Daily Exam Limit Reached',
        'You have reached your daily limit of 3 exam sessions. Upgrade to Pro for unlimited sessions or try again tomorrow.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Upgrade to Pro', 
            onPress: () => router.push('/(tabs)/pricing'),
            style: 'default'
          }
        ]
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.createDynamicExam(examConfig);
      
      if (response.success && response.data) {
        // Refetch remaining sessions after creating exam
        await refetchRemainingSessions();
        const sessionId = response.data.sessionId || (Array.isArray(response.data) ? response.data[0]?.sessionId : null);
        if (sessionId) {
          await generateQuestions(sessionId);
        } else {
          showToast.error('No session ID returned');
        }
      } else {
        // Check if it's a session limit error
        if (response.message?.includes('limit') || response.message?.includes('Daily')) {
          Modal.alert(
            'Daily Exam Limit Reached',
            response.message || 'You have reached your daily limit of 3 exam sessions. Upgrade to Pro for unlimited sessions.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Upgrade to Pro', 
                onPress: () => router.push('/(tabs)/pricing'),
                style: 'default'
              }
            ]
          );
        } else {
          showToast.error(response.message || 'Failed to create exam session');
        }
      }
    } catch (error: any) {
      console.error('Error creating exam session:', error);
      // Check if it's a session limit error
      if (error?.response?.status === 403 && error?.response?.data?.requiresUpgrade) {
        Modal.alert(
          'Daily Exam Limit Reached',
          error.response.data.message || 'You have reached your daily limit of 3 exam sessions. Upgrade to Pro for unlimited sessions.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Upgrade to Pro', 
              onPress: () => router.push('/(tabs)/pricing'),
              style: 'default'
            }
          ]
        );
      } else {
        showToast.error(error?.message || 'Failed to create exam session');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Generate questions
  const generateQuestions = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.getDynamicExamQuestions(sessionId);
      
      if (response.success && response.data) {
        setExamSession(response.data);
        setCurrentView('exam');
        startTimer(response.data.durationMinutes);
        questionStartTime.current = Date.now();
      } else {
        showToast.error(response.message || 'Failed to generate questions');
      }
    } catch (error: any) {
      console.error('Error generating questions:', error);
      showToast.error(error?.message || 'Failed to generate questions');
    } finally {
      setIsLoading(false);
    }
  };

  // Start exam
  const startExam = async () => {
    if (!examSession) return;

    try {
      const result = await apiService.startDynamicExam(examSession.sessionId);
      if (!result.success) {
        showToast.error(result.message || 'Failed to start exam');
      }
    } catch (error: any) {
      console.error('Error starting exam:', error);
      showToast.error(error?.message || 'Failed to start exam');
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId: string, answer: string) => {
    const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);
    
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));

    // Update question time spent
    if (examSession) {
      const updatedQuestions = examSession.questions.map(q => 
        q.questionId === questionId 
          ? { ...q, userAnswer: answer, timeSpentSeconds: timeSpent }
          : q
      );
      setExamSession({ ...examSession, questions: updatedQuestions });
    }

    questionStartTime.current = Date.now();
  };

  // Navigate questions
  const goToNextQuestion = () => {
    if (examSession && currentQuestionIndex < examSession.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      questionStartTime.current = Date.now();
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      questionStartTime.current = Date.now();
    }
  };

  // Complete exam
  const completeExam = async () => {
    if (!examSession) return;

    stopTimer();
    
    // Calculate results
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let skippedQuestions = 0;
    let totalMarksObtained = 0;

    const updatedQuestions = examSession.questions.map(question => {
      const userAnswer = userAnswers[question.questionId];
      const isCorrect = userAnswer === question.correctAnswer;
      const isSkipped = !userAnswer;

      if (isCorrect) {
        correctAnswers++;
        totalMarksObtained += question.marksPerQuestion;
      } else if (!isSkipped) {
        incorrectAnswers++;
        if (examSession.negativeMarking) {
          totalMarksObtained -= question.marksPerQuestion * examSession.negativeMarksRatio;
        }
      } else {
        skippedQuestions++;
      }

      return {
        ...question,
        userAnswer: userAnswer || '',
        isCorrect,
        marksObtained: isCorrect ? question.marksPerQuestion : 
          (!isSkipped && examSession.negativeMarking ? 
            -question.marksPerQuestion * examSession.negativeMarksRatio : 0)
      };
    });

    const percentage = (totalMarksObtained / examSession.totalMarks) * 100;
    const timeSpentSeconds = (examSession.durationMinutes * 60) - timeRemaining;

    // Update exam session with results
    setExamSession({
      ...examSession,
      questions: updatedQuestions
    });

    // Submit to backend
    try {
      // Complete exam session
      const completeResult = await apiService.completeDynamicExam(examSession.sessionId, {
        timeSpentSeconds,
        questionsAttempted: correctAnswers + incorrectAnswers,
        correctAnswers,
        incorrectAnswers,
        skippedQuestions,
        marksObtained: totalMarksObtained,
        percentage
      });

      if (completeResult.success) {
        setExamStats({
          totalMarks: examSession.totalMarks,
          marksObtained: totalMarksObtained,
          percentage,
          correctAnswers,
          incorrectAnswers,
          skippedQuestions,
          timeSpentSeconds,
          questions: updatedQuestions
        });
        setCurrentView('results');
        showToast.success(`Exam completed successfully! You scored ${totalMarksObtained}/${examSession.totalMarks} marks (${percentage.toFixed(1)}%)`, 'Exam Completed');
      } else {
        throw new Error(completeResult.message || 'Failed to complete exam');
      }
    } catch (error: any) {
      console.error('Error completing exam:', error);
      // Still show results even if backend fails
      showToast.error('Results saved locally but failed to sync with server. ' + (error?.message || ''), 'Warning');
      setExamStats({
        totalMarks: examSession.totalMarks,
        marksObtained: totalMarksObtained,
        percentage,
        correctAnswers,
        incorrectAnswers,
        skippedQuestions,
        timeSpentSeconds,
        questions: updatedQuestions
      });
      setCurrentView('results');
    }
  };


  // Reset exam
  const resetExam = () => {
    setCurrentView('config');
    setExamSession(null);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setTimeRemaining(0);
    setExamStats(null);
    stopTimer();
  };

  // Render exam configuration
  const renderExamConfig = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dynamic Exam</Text>
        <Text style={styles.subtitle}>Configure your exam settings</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Exam Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exam Settings</Text>
          
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Exam Name</Text>
            <Text style={styles.configValue}>{examConfig.examName}</Text>
          </View>
          
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Total Marks</Text>
            <Text style={styles.configValue}>{examConfig.totalMarks}</Text>
          </View>
          
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Duration</Text>
            <Text style={styles.configValue}>{examConfig.durationMinutes} minutes</Text>
          </View>
          
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Negative Marking</Text>
            <Text style={styles.configValue}>
              {examConfig.negativeMarking ? `Yes (-${examConfig.negativeMarksRatio * 100}%)` : 'No'}
            </Text>
          </View>
        </View>

        {/* Quick Exam Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Exam</Text>
          <View style={styles.quickExamRow}>
            <TouchableOpacity
              style={styles.quickExamButton}
              onPress={() => {
                const distribution = generateQuestionDistribution(20);
                const totalQ = distribution.reduce((sum: number, d: any) => sum + d.count, 0);
                setExamConfig({
                  examName: `Quick Test - ${totalQ} Questions`,
                  totalMarks: totalQ * 2,
                  durationMinutes: Math.ceil(totalQ * 0.75),
                  negativeMarking: false,
                  negativeMarksRatio: 0,
                  questionDistribution: distribution
                });
              }}
              disabled={categoriesLoading || isLoading}
            >
              <Text style={styles.quickExamButtonText}>20 Questions</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickExamButton}
              onPress={() => {
                const distribution = generateQuestionDistribution(40);
                const totalQ = distribution.reduce((sum: number, d: any) => sum + d.count, 0);
                setExamConfig({
                  examName: `Quick Test - ${totalQ} Questions`,
                  totalMarks: totalQ * 2,
                  durationMinutes: Math.ceil(totalQ * 0.75),
                  negativeMarking: false,
                  negativeMarksRatio: 0,
                  questionDistribution: distribution
                });
              }}
              disabled={categoriesLoading || isLoading}
            >
              <Text style={styles.quickExamButtonText}>40 Questions</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickExamButton}
              onPress={() => {
                const distribution = generateQuestionDistribution(20);
                const totalQ = distribution.reduce((sum: number, d: any) => sum + d.count, 0);
                setExamConfig({
                  examName: `Quick Test - ${totalQ} Questions`,
                  totalMarks: totalQ * 2,
                  durationMinutes: Math.ceil(totalQ * 0.75),
                  negativeMarking: true,
                  negativeMarksRatio: 0.25,
                  questionDistribution: distribution
                });
              }}
              disabled={categoriesLoading || isLoading}
            >
              <Text style={styles.quickExamButtonText}>20Q (Neg)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Question Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Question Distribution</Text>
          {categoriesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading categories...</Text>
            </View>
          ) : (
            <>
              {examConfig.questionDistribution.map((dist, index) => (
                <View key={index} style={styles.distributionItem}>
                  <View style={styles.distributionInfo}>
                    <Text style={styles.distributionCategory}>
                      {getCategoryName(dist.category)}
                    </Text>
                    <Text style={styles.distributionDetails}>
                      {dist.count} questions × {dist.marksPerQuestion} marks
                    </Text>
                  </View>
                  <Text style={styles.distributionTotal}>
                    {dist.count * dist.marksPerQuestion}
                  </Text>
                </View>
              ))}
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Questions</Text>
                <Text style={styles.totalValue}>
                  {examConfig.questionDistribution.reduce((sum, dist) => sum + dist.count, 0)}
                </Text>
              </View>
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Marks</Text>
                <Text style={styles.totalValue}>
                  {examConfig.questionDistribution.reduce((sum, dist) => sum + (dist.count * dist.marksPerQuestion), 0)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Start Button */}
        <TouchableOpacity 
          style={[styles.startButton, (categoriesLoading || isLoading) && styles.disabledButton]}
          onPress={createExamSession}
          disabled={categoriesLoading || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Play size={20} color="#FFFFFF" />
              <Text style={styles.startButtonText}>Start Exam</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // Render exam questions
  const renderExam = () => {
    if (!examSession) return null;

    const question = examSession.questions[currentQuestionIndex];
    const userAnswer = userAnswers[question.questionId];

    return (
      <View style={styles.examContainer}>
        {/* Header */}
        <View style={styles.examHeader}>
          <View style={styles.questionCounter}>
            <Text style={styles.questionCounterText}>
              Question {currentQuestionIndex + 1} of {examSession.questions.length}
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <View style={styles.timerContainer}>
              <Clock size={20} color={timeRemaining < 300 ? '#EF4444' : '#3B82F6'} />
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
                showToast.error('Exam quit. Your progress has been lost.', 'Quit Exam');
                resetExam();
              }}
            >
              <XCircle size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Question */}
        <ScrollView style={styles.questionContent}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {getCategoryName(question.category)}
            </Text>
          </View>
          
          <Text style={styles.questionText}>{question.questionText}</Text>
          
          <View style={styles.optionsContainer}>
            {question.options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  userAnswer === option.text && styles.selectedOption
                ]}
                onPress={() => handleAnswerSelect(question.questionId, option.text)}
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

        {/* Navigation */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity 
            style={[styles.navButton, currentQuestionIndex === 0 && styles.disabledButton]}
            onPress={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>
          
          {currentQuestionIndex === examSession.questions.length - 1 ? (
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={() => {
                showToast.info('Submitting your exam...', 'Submit Exam');
                completeExam();
              }}
            >
              <Text style={styles.submitButtonText}>Submit Exam</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.navButton}
              onPress={goToNextQuestion}
            >
              <Text style={styles.navButtonText}>Next</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Render results
  const renderResults = () => {
    if (!examStats) return null;

    return (
      <View style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <Trophy size={48} color="#F59E0B" />
          <Text style={styles.resultsTitle}>Exam Completed!</Text>
          <Text style={styles.resultsSubtitle}>Here are your results</Text>
        </View>

        <ScrollView style={styles.resultsContent}>
          {/* Score Summary */}
          <View style={styles.scoreCard}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Marks Obtained</Text>
              <Text style={styles.scoreValue}>
                {examStats.marksObtained.toFixed(2)} / {examStats.totalMarks}
              </Text>
            </View>
            
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Percentage</Text>
              <Text style={styles.scoreValue}>{examStats.percentage.toFixed(2)}%</Text>
            </View>
            
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Time Taken</Text>
              <Text style={styles.scoreValue}>
                {Math.floor(examStats.timeSpentSeconds / 60)}:{(examStats.timeSpentSeconds % 60).toString().padStart(2, '0')}
              </Text>
            </View>
          </View>

          {/* Answer Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Answer Summary</Text>
            
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <CheckCircle size={20} color="#10B981" />
                <Text style={styles.summaryText}>Correct: {examStats.correctAnswers}</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <XCircle size={20} color="#EF4444" />
                <Text style={styles.summaryText}>Incorrect: {examStats.incorrectAnswers}</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Target size={20} color="#6B7280" />
                <Text style={styles.summaryText}>Skipped: {examStats.skippedQuestions}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={resetExam}
            >
              <Text style={styles.actionButtonText}>Take Another Exam</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <>
      {currentView === 'config' && renderExamConfig()}
      {currentView === 'exam' && renderExam()}
      {currentView === 'results' && renderResults()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  configLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  configValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  distributionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  distributionInfo: {
    flex: 1,
  },
  distributionCategory: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  distributionDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  distributionTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  startButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  examContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  questionCounter: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  questionCounterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
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
  questionContent: {
    flex: 1,
    padding: 20,
  },
  categoryBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D4ED8',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1F2937',
    lineHeight: 26,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  optionText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 22,
  },
  selectedOptionText: {
    color: '#1D4ED8',
    fontWeight: '500',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  submitButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  resultsHeader: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
  },
  resultsSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  resultsContent: {
    flex: 1,
    padding: 16,
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryRow: {
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryText: {
    fontSize: 16,
    color: '#1F2937',
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  quickExamRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  quickExamButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickExamButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default DynamicExamContent;



