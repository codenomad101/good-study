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
  Dimensions,
  RefreshControl
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
import { usePracticeCategories, useCreatePracticeSession, useUpdatePracticeAnswer, useCompletePracticeSession, usePracticeHistory } from '../hooks/usePractice';
import { useCategories } from '../hooks/useCategories';
import { useUserStats, useRemainingSessions } from '../hooks/useApi';
import { apiService } from '../services/api';
import AppHeader from './AppHeader';
import { useTranslation } from '../hooks/useTranslation';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();
  
  // Try to load categories from API, fallback to hardcoded
  const { data: categoriesResponse, isLoading: categoriesLoading, refetch: refetchCategories } = useCategories();
  const { data: statsResponse, refetch: refetchUserStats, error: statsError } = useUserStats();
  const { data: practiceHistoryResponse, isLoading: historyLoading, refetch: refetchHistory } = usePracticeHistory();
  const [refreshing, setRefreshing] = useState(false);
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
  
  // New state variables for accurate time tracking
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // API hooks
  const createSessionMutation = useCreatePracticeSession();
  const updateAnswerMutation = useUpdatePracticeAnswer();
  const completeSessionMutation = useCompletePracticeSession();
  const { data: remainingSessions, refetch: refetchRemainingSessions } = useRemainingSessions();
  const router = useRouter();

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

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
      console.log('[EnhancedPractice] Raw stats data:', statsData);
      setUserStats(mappedStats);
    } else {
      console.log('[EnhancedPractice] No stats response available');
      console.log('[EnhancedPractice] statsResponse:', statsResponse);
      console.log('[EnhancedPractice] statsError:', statsError);
      setUserStats(null);
    }
  }, [statsResponse, statsError]);

  const startSession = (initialTime?: number) => {
    const startTimestamp = Date.now();
    setSessionStartTime(startTimestamp);
    setSessionStarted(true);
    setSessionCompleted(false);
    setSessionResults(null);
    
    // Clear any existing timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Use provided initial time or current state, default to 15 minutes if both are 0
    const startTime = initialTime !== undefined ? initialTime : (timeRemaining > 0 ? timeRemaining : 15 * 60);
    
    // Set the time immediately and ensure it's set before starting timer
    setTimeRemaining(startTime);
    
    // Start timer after a brief delay to ensure state is updated
    setTimeout(() => {
      // Double-check time is set
      setTimeRemaining(startTime);
      console.log('[EnhancedPractice] Timer starting with time:', startTime);
      
      // Start timer - use functional update to always get the latest state
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = Math.max(0, prev - 1);
          if (newTime <= 0) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            completeSession();
            return 0;
          }
          // Log every 10 seconds for debugging
          if (newTime % 10 === 0) {
            console.log('[EnhancedPractice] Timer tick:', newTime);
          }
          return newTime;
        });
      }, 1000);
    }, 50);
  };

  const loadQuestions = async (category: string) => {
    setIsLoading(true);
    
    try {
      // Define multiple file paths per category
      // Add all your JSON files here - they will be loaded and combined
      const categoryFiles: Record<string, string[]> = {
        'economy': [
          '../data/data/English/economy/economyEnglish1.json',
          '../data/data/English/economy/economyEnglish2.json',
          '../data/data/English/economy/economyExtra.json',
          '../data/data/English/economy/economyEnglish.json',
          '../data/data/English/economy/Economy-2025-11-08.json',
          '../data/English/economyEnglish.json',
          // Add more economy files here as needed
          // '../data/English/economy/economy4.json',
          // '../data/English/economy/economy5.json',
        ],
        'geography': [
          '../data/English/geography/geographyEnglish.json',
          '../data/English/geography/geographyExtra.json',
          '../data/English/geography/geographyEnglish_2025-11-10.json',
          '../data/English/geographyEnglish.json',
          // Add more geography files here as needed
          // '../data/English/geography/geography4.json',
          // '../data/English/geography/geography5.json',
        ],
        'current-affairs': [
          '../data/data/English/currentAffairs/currentAffairsEnglish.json',
          '../data/data/English/currentAffairs/currentAffairsEnglish_2025-08-08.json',
        
          // Add more current affairs files here
          // '../data/English/current-affairs/file1.json',
          // '../data/English/current-affairs/file2.json',
        ],
        'gk': [
          '../data/English/GKEnglish.json',
          '../data/data/English/gk/gkEnglish.json',
          '../data/data/English/gk/GKEnglish_2025-11-10.json',

          // Add more GK files here
          // '../data/English/gk/file1.json',
          // '../data/English/gk/file2.json',
        ],
        'history': [
          '../data/data/English/history/historyEnglish1.json',
          '../data/data/English/history/historyEnglish2.json',
          '../data/data/English/history/historyEnglish3.json',
          '../data/data/English/history/historyExtra.json',
          '../data/data/English/history/historyEnglish.json',
          '../data/data/English/history/HistoryEnglish_2025-11-10.json',

          // Add more history files here
          // '../data/English/history/history4.json',
          // '../data/English/history/history5.json',
        ],
        'english': [
          '../data/data/English/english/englishGrammer.json',
          // Add more English files here
          // '../data/English/english/english4.json',
          // '../data/English/english/english5.json',
        ],
        'aptitude': [
          '../data/data/English/aptitude/AptitudeEnglish.json',
          '../data/data/English/aptitude/aptitude-2025-11-08.json',
          '../data//English/AptitudeEnglish.json',
          // Add more aptitude files here
          // '../data/English/aptitude/AptitudeEnglish_2025-11-10.json',
          // '../data/English/aptitude/AptitudeEnglish_2025-11-10.json',
        ],
        'polity': [
          // Polity questions should come from database via API
          // Fallback: use GK questions if local file not available
          '../data/data/English/polity/polityEnglish.json',
          '../data/data/English/polity/Polity-2025-11-10.json',
          '../data/data/English/polity/polityEnglish1.json',
          '../data/data/English/polity/polityEnglish2.json',
          '../data/data/English/polity/polityExtra.json',
          // Add more polity files here when available
          // '../data/English/polity/polity1.json',
          // '../data/English/polity/polity2.json',
        ],
        'science': [
          // Science questions should come from database via API
          // Fallback: use GK questions if local file not available
          '../data/data/science/scienceEnglish.json',
          '../data/data/science/Science-2025-11-08.json',
          // Add more science files here when available
          // '../data/English/science/science1.json',
          // '../data/English/science/science2.json',
        ],
        'marathi': [
              '../data/Marathi/grammerMarathi.json',
              '../data/data/Marathi/marathi/Marathi-2025-11-08.json',

          // Add more Marathi files here
          // '../data/Marathi/marathi/file1.json',
          // '../data/Marathi/marathi/file2.json',
        ],
      };

      // Helper function to load file data by path (using static require)
      const loadFileByPath = (filePath: string): any => {
        try {
          // Map file paths to static require calls
          // This is required because React Native doesn't support dynamic require()
          switch (filePath) {
            // Economy files
            case '../data/data/English/economy/economyEnglish1.json':
              return require('../data/data/English/economy/economyEnglish1.json');
            case '../data/data/English/economy/economyEnglish2.json':
              return require('../data/data/English/economy/economyEnglish2.json');
            case '../data/data/English/economy/economyExtra.json':
              return require('../data/data/English/economy/economyExtra.json');
            case '../data/data/English/economy/economyEnglish.json':
              return require('../data/data/English/economy/economyEnglish.json');
            case '../data/data/English/economy/Economy-2025-11-08.json':
              return require('../data/data/English/economy/Economy-2025-11-08.json');
            case '../data/English/economyEnglish.json':
              return require('../data/English/economyEnglish.json');
            
            // Geography files
            case '../data/English/geography/geographyEnglish.json':
              return require('../data/English/geography/geographyEnglish.json');
            case '../data/English/geography/geographyExtra.json':
              return require('../data/English/geography/geographyExtra.json');
            case '../data/English/geography/geographyEnglish_2025-11-10.json':
              return require('../data/English/geography/geographyEnglish_2025-11-10.json');
            case '../data/English/geographyEnglish.json':
              return require('../data/English/geographyEnglish.json');
            
            // Current Affairs files
            case '../data/data/English/currentAffairs/currentAffairsEnglish.json':
              return require('../data/data/English/currentAffairs/currentAffairsEnglish.json');
            case '../data/data/English/currentAffairs/currentAffairsEnglish_2025-08-08.json':
              return require('../data/data/English/currentAffairs/currentAffairsEnglish_2025-08-08.json');
            
            // GK files
            case '../data/English/GKEnglish.json':
              return require('../data/English/GKEnglish.json');
            case '../data/data/English/gk/gkEnglish.json':
              return require('../data/data/English/gk/gkEnglish.json');
            case '../data/data/English/gk/GKEnglish_2025-11-10.json':
              return require('../data/data/English/gk/GKEnglish_2025-11-10.json');
            
            // History files
            case '../data/data/English/history/historyEnglish1.json':
              return require('../data/data/English/history/historyEnglish1.json');
            case '../data/data/English/history/historyEnglish2.json':
              return require('../data/data/English/history/historyEnglish2.json');
            case '../data/data/English/history/historyEnglish3.json':
              return require('../data/data/English/history/historyEnglish3.json');
            case '../data/data/English/history/historyExtra.json':
              return require('../data/data/English/history/historyExtra.json');
            case '../data/data/English/history/historyEnglish.json':
              return require('../data/data/English/history/historyEnglish.json');
            case '../data/data/English/history/HistoryEnglish_2025-11-10.json':
              return require('../data/data/English/history/HistoryEnglish_2025-11-10.json');
            
            // English files
            case '../data/data/English/english/englishGrammer.json':
              return require('../data/data/English/english/englishGrammer.json');
            
            // Aptitude files
            case '../data/data/English/aptitude/AptitudeEnglish.json':
              return require('../data/data/English/aptitude/AptitudeEnglish.json');
            case '../data/data/English/aptitude/aptitude-2025-11-08.json':
              return require('../data/data/English/aptitude/aptitude-2025-11-08.json');
            case '../data//English/AptitudeEnglish.json':
              return require('../data/English/AptitudeEnglish.json');
            
            // Polity files
            case '../data/data/English/polity/polityEnglish.json':
              return require('../data/data/English/polity/polityEnglish.json');
            case '../data/data/English/polity/Polity-2025-11-10.json':
              return require('../data/data/English/polity/Polity-2025-11-10.json');
            case '../data/data/English/polity/polityEnglish1.json':
              return require('../data/data/English/polity/polityEnglish1.json');
            case '../data/data/English/polity/polityEnglish2.json':
              return require('../data/data/English/polity/polityEnglish2.json');
            case '../data/data/English/polity/polityExtra.json':
              return require('../data/data/English/polity/polityExtra.json');
            
            // Science files
            case '../data/data/science/scienceEnglish.json':
              return require('../data/data/science/scienceEnglish.json');
            case '../data/data/science/Science-2025-11-08.json':
              return require('../data/data/science/Science-2025-11-08.json');
            
            // Marathi files
            case '../data/Marathi/grammerMarathi.json':
              return require('../data/Marathi/grammerMarathi.json');
            case '../data/data/Marathi/marathi/Marathi-2025-11-08.json':
              return require('../data/data/Marathi/marathi/Marathi-2025-11-08.json');
            
            default:
              throw new Error(`File path not mapped: ${filePath}`);
          }
        } catch (error) {
          throw error;
        }
      };

      // Load questions from multiple files for the category
      let questionsData: any[] = [];
      const filesToLoad = categoryFiles[category] || [];
      
      if (filesToLoad.length === 0) {
        console.warn(`[EnhancedPractice] Category '${category}' not found in local files. Will use API only.`);
      } else {
        // Load and combine questions from all files for this category
        for (const filePath of filesToLoad) {
          try {
            const fileData = loadFileByPath(filePath);
            if (Array.isArray(fileData)) {
              questionsData = [...questionsData, ...fileData];
              console.log(`[EnhancedPractice] Loaded ${fileData.length} questions from ${filePath}`);
            } else if (fileData && Array.isArray(fileData.questions)) {
              questionsData = [...questionsData, ...fileData.questions];
              console.log(`[EnhancedPractice] Loaded ${fileData.questions.length} questions from ${filePath}`);
            } else {
              console.warn(`[EnhancedPractice] Invalid format in ${filePath}, skipping`);
            }
          } catch (error) {
            console.warn(`[EnhancedPractice] Failed to load ${filePath}:`, error);
            // Continue loading other files even if one fails
          }
        }
        
        console.log(`[EnhancedPractice] Total questions loaded for ${category}: ${questionsData.length}`);
      }

      if (!Array.isArray(questionsData)) {
        throw new Error('Invalid questions format');
      }

      // Only use local JSON if we have data and it's not polity/science (which should come from DB)
      // For polity and science, we'll rely entirely on the API
      if (questionsData.length === 0 && (category === 'polity' || category === 'science')) {
        // Don't set questions from local JSON for polity/science - wait for API
        console.log(`[EnhancedPractice] Category '${category}' will use database questions only`);
      } else if (questionsData.length > 0) {
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
      }
      setSelectedCategory(category);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setQuestionTimes({});
      const initialTime = 15 * 60; // 15 minutes in seconds
      setTimeRemaining(initialTime);
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
            
            // Map invalid categories to valid enum values
            // "science" is not in the enum, so map it to "gk" (which is used as fallback)
            let categoryForServer = categoryObj?.slug || categoryObj?.categoryId || categoryToUse.trim();
            
            // Map invalid categories to valid ones
            const categoryMapping: Record<string, string> = {
              'science': 'gk', // Science maps to General Knowledge
            };
            
            if (categoryMapping[categoryForServer]) {
              console.log(`[EnhancedPractice] Mapping category "${categoryForServer}" to "${categoryMapping[categoryForServer]}" for server compatibility`);
              categoryForServer = categoryMapping[categoryForServer];
            }
            
            // Check remaining practice sessions for free plan
            if (remainingSessions && remainingSessions.practice !== -1 && remainingSessions.practice <= 0) {
              Alert.alert(
                'Daily Practice Limit Reached',
                'You have reached your daily limit of 3 practice sessions. Upgrade to Pro for unlimited sessions or try again tomorrow.',
                [
                  { text: 'Cancel', style: 'cancel', onPress: () => setIsLoading(false) },
                  { 
                    text: 'Upgrade to Pro', 
                    onPress: () => {
                      setIsLoading(false);
                      router.push('/(tabs)/pricing');
                    },
                    style: 'default'
                  }
                ]
              );
              return;
            }
            
            const sessionResult = await createSessionMutation.mutateAsync({
              category: categoryForServer, // Send slug or UUID to server
              timeLimitMinutes: 15,
              language: 'en'
            });
            
            // Refetch remaining sessions after creating practice session
            await refetchRemainingSessions();
            
            
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
          console.error('[EnhancedPractice] Error creating session:', error);
          
          // Check if it's a category validation error (400 Bad Request)
          if (error?.status === 400 || error?.response?.status === 400) {
            const errorMessage = error?.message || error?.response?.data?.message || '';
            if (errorMessage.includes('practice_category') || errorMessage.includes('enum')) {
              console.warn('[EnhancedPractice] Category validation error - continuing with local session:', errorMessage);
              // Continue with local session - don't block the user
            } else {
              // Other 400 errors - continue with local session
              console.warn('[EnhancedPractice] Bad request error - continuing with local session:', errorMessage);
            }
          }
          // Check if it's a session limit error
          else if (error?.response?.status === 403 && error?.response?.data?.requiresUpgrade) {
            Alert.alert(
              'Daily Practice Limit Reached',
              error.response.data.message || 'You have reached your daily limit of 3 practice sessions. Upgrade to Pro for unlimited sessions.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Upgrade to Pro', 
                  onPress: () => router.push('/(tabs)/pricing'),
                  style: 'default'
                }
              ]
            );
            setIsLoading(false);
            return;
          }
          // Continue with local session - don't block the user
        }
      } else {
        console.log('No user ID available, skipping session creation');
      }
      
      // Automatically start the session after loading questions
      // Ensure timeRemaining is set before starting session
      setTimeRemaining(initialTime);
      // Pass initial time to ensure timer starts with correct value
      // Use a small delay to ensure state is updated
      setTimeout(() => {
        startSession(initialTime);
      }, 100);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to load questions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const completeSession = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Calculate actual time spent in seconds
    const sessionEndTime = Date.now();
    const actualTimeSpentSeconds = sessionStartTime > 0 ? Math.floor((sessionEndTime - sessionStartTime) / 1000) : 0;
    
    // Also calculate time spent based on timer for fallback
    // If timer was initialized with 15 minutes (900 seconds), calculate time spent
    const initialTime = 15 * 60; // 15 minutes in seconds
    const timerBasedTimeSpent = Math.max(0, initialTime - timeRemaining);
    
    // Use actual time spent if available and valid, otherwise use timer calculation
    // If actual time is 0 or invalid, use timer-based calculation
    const totalTimeSpent = (sessionStartTime > 0 && actualTimeSpentSeconds > 0) 
      ? actualTimeSpentSeconds 
      : timerBasedTimeSpent;
    
    console.log('[EnhancedPractice] Time calculation:', {
      sessionStartTime,
      sessionEndTime,
      actualTimeSpentSeconds,
      timeRemaining,
      timerBasedTimeSpent,
      totalTimeSpent,
      totalTimeSpentMinutes: Math.floor(totalTimeSpent / 60)
    });

    const questionsData = questions.map((q, index) => {
      const userAnswer = userAnswers[q.questionId] || '';
      const isCorrect = userAnswer === q.correctAnswer;
      const questionTime = questionTimes[q.questionId] || Math.floor(totalTimeSpent / questions.length);
      
      return {
        questionId: q.questionId,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        userAnswer,
        isCorrect,
        timeSpentSeconds: Math.floor(questionTime / 1000), // Convert from ms to seconds
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
          startedAt: new Date(sessionStartTime),
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
          `You scored ${correctAnswers}/${questions.length} (${percentage.toFixed(1)}%)\nTime spent: ${Math.floor(totalTimeSpent / 60)}:${(totalTimeSpent % 60).toString().padStart(2, '0')}`,
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
          await completeSessionMutation.mutateAsync({
            sessionId,
            timeSpentSeconds: totalTimeSpent // Send the calculated total time
          });
          
          setSessionResults({
            sessionId: sessionId,
            category: selectedCategory || '',
            status: 'completed',
            totalQuestions: questions.length,
            timeLimitMinutes: 15,
            startedAt: new Date(sessionStartTime),
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
          // Invalidate and refetch user stats to show updated minutes
          queryClient.invalidateQueries({ queryKey: ['progress', 'stats'] });
          queryClient.invalidateQueries({ queryKey: ['practiceHistory'] });
          await refetchUserStats();
          await refetchRemainingSessions();
          await refetchHistory();
          
          Alert.alert(
            'Session Completed!',
            `You scored ${correctAnswers}/${questions.length} (${percentage.toFixed(1)}%)\nTime spent: ${Math.floor(totalTimeSpent / 60)}:${(totalTimeSpent % 60).toString().padStart(2, '0')}`,
            [
              { text: 'View Results', onPress: () => setShowExplanations(true) },
              { text: 'OK' }
            ]
          );
          return;
        } catch (error: any) {
          console.error('[EnhancedPractice] Error completing session:', error);
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
        startedAt: new Date(sessionStartTime),
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
        `You scored ${correctAnswers}/${questions.length} (${percentage.toFixed(1)}%)\nTime spent: ${Math.floor(totalTimeSpent / 60)}:${(totalTimeSpent % 60).toString().padStart(2, '0')}`,
        [
          { text: 'View Results', onPress: () => setShowExplanations(true) },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      console.error('[EnhancedPractice] Error in completeSession:', error);
      Alert.alert('Error', 'Failed to save session results');
    }
  };

  const selectAnswer = async (questionId: string, answer: string) => {
    const timeSpent = Date.now() - questionStartTime;
    
    // Store individual question time
    setQuestionTimes(prev => ({
      ...prev,
      [questionId]: timeSpent
    }));
    
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    // Save answer to backend if we have a sessionId
    if (sessionId && user?.userId) {
      try {
        const currentQuestion = questions.find(q => q.questionId === questionId);
        
        if (!currentQuestion) {
          console.warn('[EnhancedPracticeContent] Question not found:', questionId);
          return;
        }
        
        // Try to find the option ID from the answer text
        let userAnswerValue = answer;
        if (currentQuestion.options) {
          const selectedOption = currentQuestion.options.find(opt => opt.text === answer);
          if (selectedOption && selectedOption.id !== undefined) {
            // Send option ID as number (1, 2, 3, 4) which is what server expects
            userAnswerValue = selectedOption.id.toString();
          }
        }
        
        // Only save to server if we have a valid questionId (not local q_ format)
        // Local questionIds (q_1, q_2) won't match server session questionIds
        if (questionId.startsWith('q_')) {
          console.warn('[EnhancedPracticeContent] Skipping server save for local questionId:', questionId);
          return; // Don't try to save local questionIds to server
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
          questionId,
          sessionId,
          hasQuestion: !!questions.find(q => q.questionId === questionId)
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
    setQuestionTimes({});
    setTimeRemaining(15 * 60);
    setSessionStartTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
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

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchUserStats(),
      refetchHistory(),
      refetchCategories()
    ]);
    setRefreshing(false);
  };

  const renderCategorySelection = () => (
    <View style={styles.container}>
      <AppHeader showLogo={true} extraTopSpacing={true} />
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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

        {/* Practice History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Practice Sessions</Text>
          {historyLoading ? (
            <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
          ) : (() => {
            // Parse practice history - similar to exam history parsing
            let practiceHistory: any[] = [];
            if (practiceHistoryResponse) {
              // The API service getPracticeHistory() returns: { success: true, data: [...] }
              if (Array.isArray(practiceHistoryResponse.data)) {
                practiceHistory = practiceHistoryResponse.data;
              } else if (Array.isArray(practiceHistoryResponse)) {
                // Fallback: if response itself is an array
                practiceHistory = practiceHistoryResponse;
              } else if (practiceHistoryResponse.data && Array.isArray(practiceHistoryResponse.data)) {
                practiceHistory = practiceHistoryResponse.data;
              }
            }
            
            // Debug logging
            console.log('[EnhancedPractice] Practice History Debug:', {
              practiceHistoryResponse,
              practiceHistoryResponseData: practiceHistoryResponse?.data,
              practiceHistoryResponseDataType: typeof practiceHistoryResponse?.data,
              isDataArray: Array.isArray(practiceHistoryResponse?.data),
              practiceHistoryLength: practiceHistory.length,
              practiceHistory,
              historyLoading,
            });

            return practiceHistory.length === 0 ? (
              <View style={styles.emptyState}>
                <BookOpen size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No practice sessions yet</Text>
                <Text style={styles.emptySubtext}>Start practicing to see your history!</Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {practiceHistory
                  .filter((session: any) => session && session.sessionId)
                  .slice(0, 10) // Show only last 10 sessions
                  .map((session: any) => {
                    // Calculate percentage
                    let percentage = 0;
                    if (session.percentage !== undefined && session.percentage !== null) {
                      percentage = typeof session.percentage === 'string' 
                        ? parseFloat(session.percentage) 
                        : (session.percentage || 0);
                    } else if (session.correctAnswers !== undefined && session.totalQuestions !== undefined && session.totalQuestions > 0) {
                      percentage = ((session.correctAnswers || 0) / (session.totalQuestions || 1)) * 100;
                    }
                    
                    // Format category name
                    const categoryName = session.category 
                      ? session.category.charAt(0).toUpperCase() + session.category.slice(1).replace('-', ' ')
                      : 'Practice';
                    
                    // Format date
                    const formatDate = (date: string | Date) => {
                      if (!date) return 'N/A';
                      const d = new Date(date);
                      const now = new Date();
                      const diffMs = now.getTime() - d.getTime();
                      const diffMins = Math.floor(diffMs / 60000);
                      const diffHours = Math.floor(diffMs / 3600000);
                      const diffDays = Math.floor(diffMs / 86400000);
                      
                      if (diffMins < 1) return 'Just now';
                      if (diffMins < 60) return `${diffMins}m ago`;
                      if (diffHours < 24) return `${diffHours}h ago`;
                      if (diffDays < 7) return `${diffDays}d ago`;
                      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    };
                    
                    return (
                      <TouchableOpacity
                        key={session.sessionId}
                        style={styles.historyItem}
                        onPress={() => {
                          // Optionally show session details
                          Alert.alert(
                            'Practice Session',
                            `Category: ${categoryName}\nScore: ${session.correctAnswers || 0}/${session.totalQuestions || 0}\nAccuracy: ${percentage.toFixed(1)}%\nTime: ${Math.floor((session.timeSpentSeconds || 0) / 60)}:${((session.timeSpentSeconds || 0) % 60).toString().padStart(2, '0')}`,
                            [{ text: 'OK' }]
                          );
                        }}
                      >
                        <View style={styles.historyItemLeft}>
                          <View style={[styles.statusBadge, { backgroundColor: session.status === 'completed' ? '#10B98120' : '#F59E0B20' }]}>
                            {session.status === 'completed' ? (
                              <CheckCircle size={20} color="#10B981" />
                            ) : (
                              <Clock size={20} color="#F59E0B" />
                            )}
                          </View>
                          <View style={styles.historyItemInfo}>
                            <Text style={styles.historyItemTitle}>{categoryName}</Text>
                            <View style={styles.historyItemMeta}>
                              <Text style={styles.historyItemMetaText}>
                                {session.totalQuestions || 0} questions
                              </Text>
                              <Text style={styles.historyItemMetaText}> • </Text>
                              <Text style={styles.historyItemMetaText}>
                                {Math.floor((session.timeSpentSeconds || 0) / 60)}:${((session.timeSpentSeconds || 0) % 60).toString().padStart(2, '0')}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.historyItemRight}>
                          {session.status === 'completed' && (
                            <View style={styles.historyScoreContainer}>
                              <Text style={styles.historyScoreText}>
                                {session.correctAnswers || 0}/{session.totalQuestions || 0}
                              </Text>
                              <Text style={[styles.historyPercentageText, { color: percentage >= 80 ? '#10B981' : percentage >= 60 ? '#F59E0B' : '#EF4444' }]}>
                                {percentage.toFixed(1)}%
                              </Text>
                            </View>
                          )}
                          <Text style={styles.historyDateText}>
                            {formatDate(session.completedAt || session.createdAt)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            );
          })()}
        </View>
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
                {formatTime(Math.max(0, timeRemaining))}
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
              {selectedCategory ? selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1) : ''} {t('practice.title')}
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
              
              <View style={styles.statsGridDetailed}>
                <View style={styles.statItemDetailed}>
                  <Text style={styles.statValueDetailed}>{userStats.totalPracticeSessions}</Text>
                  <Text style={styles.statLabelDetailed}>Total Sessions</Text>
                </View>
                
                <View style={styles.statItemDetailed}>
                  <Text style={styles.statValueDetailed}>{userStats.totalPracticeScore}</Text>
                  <Text style={styles.statLabelDetailed}>Total Score</Text>
                </View>
                
                <View style={styles.statItemDetailed}>
                  <Text style={styles.statValueDetailed}>
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
                  <Text style={styles.statLabelDetailed}>Average Accuracy</Text>
                </View>
                
                <View style={styles.statItemDetailed}>
                  <Text style={styles.statValueDetailed}>{userStats.currentStreak}</Text>
                  <Text style={styles.statLabelDetailed}>Current Streak</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsSection}>
              <Text style={styles.statsSectionTitle}>Weekly Performance</Text>
              
              <View style={styles.statsGridDetailed}>
                <View style={styles.statItemDetailed}>
                  <Text style={styles.statValueDetailed}>{userStats.weeklyPracticeCount}</Text>
                  <Text style={styles.statLabelDetailed}>Sessions This Week</Text>
                </View>
                
                <View style={styles.statItemDetailed}>
                  <Text style={styles.statValueDetailed}>{userStats.weeklyPracticeScore}</Text>
                  <Text style={styles.statLabelDetailed}>Weekly Score</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsSection}>
              <Text style={styles.statsSectionTitle}>Monthly Performance</Text>
              
              <View style={styles.statsGridDetailed}>
                <View style={styles.statItemDetailed}>
                  <Text style={styles.statValueDetailed}>{userStats.monthlyPracticeCount}</Text>
                  <Text style={styles.statLabelDetailed}>Sessions This Month</Text>
                </View>
                
                <View style={styles.statItemDetailed}>
                  <Text style={styles.statValueDetailed}>{userStats.monthlyPracticeScore}</Text>
                  <Text style={styles.statLabelDetailed}>Monthly Score</Text>
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
        <AppHeader showLogo={true} extraTopSpacing={true} />
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
  statsGridDetailed: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItemDetailed: {
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
  statValueDetailed: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabelDetailed: {
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
  historySection: {
    marginTop: 24,
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
  historyScoreContainer: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  historyScoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  historyPercentageText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  historyDateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default EnhancedPracticeContent;
