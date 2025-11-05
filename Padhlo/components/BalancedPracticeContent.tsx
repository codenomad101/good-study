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
  Timer
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '@/config/api';

const { width } = Dimensions.get('window');

interface PracticeCategory {
  id: string;
  name: string;
  description: string;
  fileName: string;
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
  startedAt: string;
  questionsData: Array<{
    questionId: string;
    userAnswer: string;
    isCorrect: boolean;
    timeSpentSeconds: number;
  }>;
}

const PracticeContent: React.FC = () => {
  const { user } = useAuth();
  const [categories] = useState<PracticeCategory[]>([
    { id: 'economy', name: 'Economy', description: 'Economic concepts and current affairs', fileName: 'economyEnglish.json' },
    { id: 'gk', name: 'General Knowledge', description: 'General knowledge and current affairs', fileName: 'GKEnglish.json' },
    { id: 'history', name: 'History', description: 'Historical events and facts', fileName: 'historyEnglish.json' },
    { id: 'geography', name: 'Geography', description: 'Geographical concepts and facts', fileName: 'geographyEnglish.json' },
    { id: 'english', name: 'English', description: 'English grammar and vocabulary', fileName: 'englishGrammer.json' },
    { id: 'aptitude', name: 'Aptitude', description: 'Quantitative and logical reasoning', fileName: 'AptitudeEnglish.json' },
    { id: 'agriculture', name: 'Agriculture', description: 'Agricultural concepts and practices', fileName: 'agricultureEnglish.json' },
    { id: 'marathi', name: 'Marathi', description: 'Marathi grammar and language', fileName: 'grammerMarathi.json' },
  ]);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    skipped: 0,
    total: 0
  });
  const [sessionStarted, setSessionStarted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());
  const sessionStartTimeRef = useRef<number>(Date.now());

  // Load questions from local JSON data
  const loadQuestions = async (category: string, count: number = 20) => {
    try {
      setIsLoading(true);
      
      // Import the JSON data directly
      let questionsData: any[] = [];
      
      switch (category) {
        case 'economy':
          questionsData = require('../data/English/economyEnglish.json');
          break;
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

      // Shuffle and select random questions
      const shuffled = questionsData.sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, Math.min(count, questionsData.length));

      // Transform questions to match our format
      const transformedQuestions = selectedQuestions.map((q: any, index: number) => ({
        questionId: `q_${category}_${index}_${Date.now()}`,
        questionText: q.Question || q.questionText || '',
        options: q.Options || q.options || [],
        correctAnswer: q.CorrectAnswer || q.correctAnswer || '',
        explanation: q.Explanation || q.explanation || '',
        category: q.category || category,
        marks: 1,
        questionType: 'mcq'
      }));

      return transformedQuestions;
    } catch (error) {
      console.error('Error loading questions:', error);
      throw new Error('Failed to load questions');
    }
  };

  const startPracticeSession = async () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    try {
      const loadedQuestions = await loadQuestions(selectedCategory, 20);
      setQuestions(loadedQuestions);
      setTimeRemaining(15 * 60); // 15 minutes
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setShowResults(false);
      setSessionStarted(true);
      sessionStartTimeRef.current = Date.now();
      questionStartTimeRef.current = Date.now();
      startTimer();
    } catch (error) {
      console.error('Error starting practice session:', error);
      Alert.alert('Error', 'Failed to start practice session');
    } finally {
      setIsLoading(false);
    }
  };

  const startTimer = () => {
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

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const submitAnswer = (answer: string) => {
    if (!questions[currentQuestionIndex]) return;

    const questionId = questions[currentQuestionIndex].questionId;
    const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);

    setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
    
    // Move to next question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      questionStartTimeRef.current = Date.now();
    } else {
      completeSession();
    }
  };

  const completeSession = async () => {
    stopTimer();

    // Calculate stats
    const correct = Object.keys(userAnswers).filter(
      qId => {
        const question = questions.find(q => q.questionId === qId);
        return question && userAnswers[qId] === question.correctAnswer;
      }
    ).length;
    
    const attempted = Object.keys(userAnswers).length;
    const skipped = questions.length - attempted;
    const totalTimeSpent = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);

    setSessionStats({
      correct,
      incorrect: attempted - correct,
      skipped,
      total: questions.length
    });
    setShowResults(true);

    // Save session to backend (optional - for progress tracking)
    if (user?.token) {
      try {
        await fetch(`${API_BASE_URL}/practice/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            category: selectedCategory,
            timeLimitMinutes: 15,
            questionsData: questions.map(q => ({
              questionId: q.questionId,
              userAnswer: userAnswers[q.questionId] || '',
              isCorrect: userAnswers[q.questionId] === q.correctAnswer,
              timeSpentSeconds: 0 // We could track this per question if needed
            })),
            timeSpentSeconds: totalTimeSpent,
            correctAnswers: correct,
            incorrectAnswers: attempted - correct,
            questionsAttempted: attempted,
            skippedQuestions: skipped,
            percentage: (correct / questions.length) * 100,
            status: 'completed'
          }),
        });
      } catch (error) {
        console.log('Failed to save session to backend (continuing offline)');
      }
    }
  };

  const resetSession = () => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setTimeRemaining(0);
    setShowResults(false);
    setSessionStarted(false);
    stopTimer();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCategorySelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Choose Practice Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryCard,
              selectedCategory === category.id && styles.selectedCategoryCard
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <BookOpen size={24} color={selectedCategory === category.id ? '#FFFFFF' : '#6366F1'} />
            <Text style={[
              styles.categoryName,
              selectedCategory === category.id && styles.selectedCategoryName
            ]}>
              {category.name}
            </Text>
            <Text style={[
              styles.categoryDescription,
              selectedCategory === category.id && styles.selectedCategoryDescription
            ]}>
              {category.description}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderQuestion = () => {
    if (!questions[currentQuestionIndex]) return null;

    const question = questions[currentQuestionIndex];
    const userAnswer = userAnswers[question.questionId];

    return (
      <View style={styles.questionContainer}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumber}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
          <View style={styles.timerContainer}>
            <Timer size={20} color="#EF4444" />
            <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
          </View>
        </View>

        <Text style={styles.questionText}>{question.questionText}</Text>

        <View style={styles.optionsContainer}>
          {question.options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                userAnswer === option.text && styles.selectedOptionButton
              ]}
              onPress={() => submitAnswer(option.text)}
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

        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, currentQuestionIndex === 0 && styles.disabledButton]}
            onPress={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft size={20} color={currentQuestionIndex === 0 ? '#9CA3AF' : '#FFFFFF'} />
            <Text style={[styles.navButtonText, currentQuestionIndex === 0 && styles.disabledButtonText]}>
              Previous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, currentQuestionIndex === questions.length - 1 && styles.disabledButton]}
            onPress={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
            disabled={currentQuestionIndex === questions.length - 1}
          >
            <Text style={[styles.navButtonText, currentQuestionIndex === questions.length - 1 && styles.disabledButtonText]}>
              Next
            </Text>
            <ArrowRight size={20} color={currentQuestionIndex === questions.length - 1 ? '#9CA3AF' : '#FFFFFF'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderResults = () => (
    <Modal visible={showResults} animationType="slide">
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Practice Session Complete!</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <CheckCircle size={32} color="#10B981" />
            <Text style={styles.statNumber}>{sessionStats.correct}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          
          <View style={styles.statCard}>
            <XCircle size={32} color="#EF4444" />
            <Text style={styles.statNumber}>{sessionStats.incorrect}</Text>
            <Text style={styles.statLabel}>Incorrect</Text>
          </View>
          
          <View style={styles.statCard}>
            <Clock size={32} color="#F59E0B" />
            <Text style={styles.statNumber}>{sessionStats.skipped}</Text>
            <Text style={styles.statLabel}>Skipped</Text>
          </View>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>
            Score: {sessionStats.correct}/{sessionStats.total}
          </Text>
          <Text style={styles.percentageText}>
            {Math.round((sessionStats.correct / sessionStats.total) * 100)}%
          </Text>
        </View>

        <View style={styles.resultsActions}>
          <TouchableOpacity style={styles.actionButton} onPress={resetSession}>
            <RefreshCw size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Practice Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={resetSession}>
            <TrendingUp size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>View Progress</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading questions...</Text>
      </View>
    );
  }

  if (sessionStarted && questions.length > 0) {
    return (
      <View style={styles.container}>
        {renderQuestion()}
        {renderResults()}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Practice</Text>
        <Text style={styles.subtitle}>Choose a category and start practicing</Text>
      </View>

      {renderCategorySelector()}

      {selectedCategory && (
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={startPracticeSession}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Play size={20} color="#FFFFFF" />
                <Text style={styles.startButtonText}>
                  Start Practice (20 questions, 15 minutes)
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoryCard: {
    width: width * 0.7,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  selectedCategoryCard: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 8,
  },
  selectedCategoryName: {
    color: '#FFFFFF',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  selectedCategoryDescription: {
    color: '#E2E8F0',
  },
  startButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  questionContainer: {
    flex: 1,
    padding: 20,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  questionNumber: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  questionText: {
    fontSize: 18,
    color: '#1E293B',
    lineHeight: 26,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  selectedOptionButton: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  optionText: {
    fontSize: 16,
    color: '#1E293B',
    lineHeight: 22,
  },
  selectedOptionText: {
    color: '#6366F1',
    fontWeight: '500',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  navButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#E2E8F0',
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 32,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    minWidth: 100,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  scoreContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  scoreText: {
    fontSize: 18,
    color: '#1E293B',
    marginBottom: 8,
  },
  percentageText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  resultsActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PracticeContent;
