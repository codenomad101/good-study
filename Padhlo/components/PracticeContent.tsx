import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Modal,
  TextInput,
  FlatList
} from 'react-native';
import { 
  Target, 
  Play, 
  Clock, 
  CheckCircle, 
  BookOpen, 
  TrendingUp,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react-native';
import { 
  useExams, 
  useSubjectsByExam, 
  useTopicsBySubject, 
  useQuestionsByTopic,
  useCreatePracticeSession,
  useAddQuestionHistory,
  useUpdateProgress
} from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { responsiveValues } from '../utils/responsive';

interface PracticeQuestion {
  questionId: string;
  questionText: string;
  questionType: 'mcq' | 'numerical' | 'true_false' | 'fill_blank';
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer: string;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  marks: number;
}

const PracticeContent: React.FC = () => {
  const { user } = useAuth();
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    total: 0,
    timeSpent: 0
  });

  // React Query hooks
  const { data: examsData, isLoading: examsLoading } = useExams();
  const { data: subjectsData, isLoading: subjectsLoading } = useSubjectsByExam(selectedExam);
  const { data: topicsData, isLoading: topicsLoading } = useTopicsBySubject(selectedSubject);
  const { data: questionsData, isLoading: questionsLoading } = useQuestionsByTopic(selectedTopic, 20);
  
  // Mutations
  const createSessionMutation = useCreatePracticeSession();
  const addHistoryMutation = useAddQuestionHistory();
  const updateProgressMutation = useUpdateProgress();

  const exams = examsData?.data || [];
  const subjects = subjectsData?.data || [];
  const topics = topicsData?.data || [];
  const questions = questionsData?.data || [];

  const startPracticeSession = async () => {
    if (!selectedTopic || !selectedSubject) {
      Alert.alert('Error', 'Please select a topic to practice');
      return;
    }

    try {
      const sessionData = {
        topicId: selectedTopic,
        subjectId: selectedSubject,
        sessionDate: new Date().toISOString().split('T')[0],
        sessionType: 'custom' as const,
        totalQuestions: questions.length,
        isCompleted: false,
      };

      await createSessionMutation.mutateAsync(sessionData);
      setSessionStarted(true);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setSessionStats({ correct: 0, incorrect: 0, total: 0, timeSpent: 0 });
      setShowQuestionModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to start practice session');
    }
  };

  const submitAnswer = async (questionId: string, answer: string) => {
    const question = questions[currentQuestionIndex];
    const isCorrect = answer === question.correctAnswer;
    
    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
      total: prev.total + 1,
    }));

    // Store user answer
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }));

    // Add to question history
    try {
      await addHistoryMutation.mutateAsync({
        questionId,
        userAnswer: answer,
        isCorrect,
        timeTakenSeconds: 30, // Mock time
        sourceType: 'custom_practice',
      });
    } catch (error) {
      console.error('Failed to save question history:', error);
    }

    // Move to next question or finish
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishSession();
    }
  };

  const finishSession = async () => {
    try {
      // Update progress
      await updateProgressMutation.mutateAsync({
        topicId: selectedTopic,
        subjectId: selectedSubject,
        totalQuestionsAttempted: sessionStats.total,
        correctAnswers: sessionStats.correct,
        masteryLevel: sessionStats.correct / sessionStats.total > 0.8 ? 'advanced' : 
                     sessionStats.correct / sessionStats.total > 0.6 ? 'intermediate' : 'beginner',
        masteryPercentage: (sessionStats.correct / sessionStats.total) * 100,
        averageAccuracy: (sessionStats.correct / sessionStats.total) * 100,
      });

      setShowQuestionModal(false);
      setSessionStarted(false);
      
      Alert.alert(
        'Session Complete!',
        `You answered ${sessionStats.correct}/${sessionStats.total} questions correctly (${Math.round((sessionStats.correct / sessionStats.total) * 100)}%)`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save progress');
    }
  };

  const renderExamSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Exam</Text>
      {examsLoading ? (
        <ActivityIndicator size="small" color="#2563EB" />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.optionsContainer}>
            {exams.map((exam: any) => (
              <TouchableOpacity
                key={exam.examId}
                style={[
                  styles.optionCard,
                  selectedExam === exam.examId && styles.selectedOptionCard
                ]}
                onPress={() => {
                  setSelectedExam(exam.examId);
                  setSelectedSubject('');
                  setSelectedTopic('');
                }}
              >
                <Text style={[
                  styles.optionText,
                  selectedExam === exam.examId && styles.selectedOptionText
                ]}>
                  {exam.examName}
                </Text>
                <Text style={styles.optionSubtext}>{exam.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );

  const renderSubjectSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Subject</Text>
      {subjectsLoading ? (
        <ActivityIndicator size="small" color="#2563EB" />
      ) : (
        <View style={styles.gridContainer}>
          {subjects.map((subject: any) => (
            <TouchableOpacity
              key={subject.subjectId}
              style={[
                styles.subjectCard,
                selectedSubject === subject.subjectId && styles.selectedSubjectCard
              ]}
              onPress={() => {
                setSelectedSubject(subject.subjectId);
                setSelectedTopic('');
              }}
            >
              <BookOpen size={24} color={selectedSubject === subject.subjectId ? "#FFFFFF" : "#2563EB"} />
              <Text style={[
                styles.subjectText,
                selectedSubject === subject.subjectId && styles.selectedSubjectText
              ]}>
                {subject.subjectName}
              </Text>
              <Text style={styles.subjectSubtext}>
                {subject.totalQuestions || 0} questions
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderTopicSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Topic</Text>
      {topicsLoading ? (
        <ActivityIndicator size="small" color="#2563EB" />
      ) : (
        <View style={styles.topicsContainer}>
          {topics.map((topic: any) => (
            <TouchableOpacity
              key={topic.topicId}
              style={[
                styles.topicCard,
                selectedTopic === topic.topicId && styles.selectedTopicCard
              ]}
              onPress={() => setSelectedTopic(topic.topicId)}
            >
              <View style={styles.topicHeader}>
                <Text style={[
                  styles.topicText,
                  selectedTopic === topic.topicId && styles.selectedTopicText
                ]}>
                  {topic.topicName}
                </Text>
                <View style={[
                  styles.difficultyBadge,
                  topic.difficultyLevel === 'easy' ? styles.easyBadge :
                  topic.difficultyLevel === 'medium' ? styles.mediumBadge :
                  styles.hardBadge
                ]}>
                  <Text style={styles.difficultyText}>
                    {topic.difficultyLevel?.toUpperCase() || 'MEDIUM'}
                  </Text>
                </View>
              </View>
              <Text style={styles.topicSubtext}>
                {topic.estimatedTimeMinutes || 30} min estimated
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderQuestionModal = () => {
    if (!questions.length || currentQuestionIndex >= questions.length) return null;

    const question = questions[currentQuestionIndex];
    const options = [question.optionA, question.optionB, question.optionC, question.optionD].filter(Boolean);

    return (
      <Modal
        visible={showQuestionModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Question {currentQuestionIndex + 1} of {questions.length}
            </Text>
            <TouchableOpacity onPress={() => setShowQuestionModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.questionContainer}>
            <View style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <View style={[
                  styles.difficultyBadge,
                  question.difficultyLevel === 'easy' ? styles.easyBadge :
                  question.difficultyLevel === 'medium' ? styles.mediumBadge :
                  styles.hardBadge
                ]}>
                  <Text style={styles.difficultyText}>
                    {question.difficultyLevel?.toUpperCase() || 'MEDIUM'}
                  </Text>
                </View>
                <Text style={styles.questionMarks}>{question.marks} marks</Text>
              </View>

              <Text style={styles.questionText}>{question.questionText}</Text>

              <View style={styles.optionsContainer}>
                {options.map((option, index) => {
                  const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.optionButton}
                      onPress={() => submitAnswer(question.questionId, optionLetter)}
                    >
                      <Text style={styles.optionLetter}>{optionLetter}</Text>
                      <Text style={styles.optionText}>{option}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={styles.sessionStats}>
            <View style={styles.statItem}>
              <CheckCircle size={16} color="#10B981" />
              <Text style={styles.statText}>Correct: {sessionStats.correct}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statText}>Total: {sessionStats.total}</Text>
            </View>
            <View style={styles.statItem}>
              <Clock size={16} color="#6B7280" />
              <Text style={styles.statText}>Time: {sessionStats.timeSpent}s</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderQuickPractice = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Practice</Text>
      <View style={styles.quickPracticeContainer}>
        <TouchableOpacity style={styles.quickPracticeCard}>
          <Play size={32} color="#2563EB" />
          <Text style={styles.quickPracticeTitle}>Random Questions</Text>
          <Text style={styles.quickPracticeSubtext}>Practice with random questions from all topics</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickPracticeCard}>
          <Target size={32} color="#10B981" />
          <Text style={styles.quickPracticeTitle}>Weak Areas</Text>
          <Text style={styles.quickPracticeSubtext}>Focus on topics that need improvement</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Practice</Text>
        <Text style={styles.subtitle}>Choose a topic and start practicing</Text>
      </View>

      {renderExamSelector()}
      {selectedExam && renderSubjectSelector()}
      {selectedSubject && renderTopicSelector()}

      {selectedTopic && (
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={startPracticeSession}
            disabled={questionsLoading}
          >
            {questionsLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Play size={20} color="#FFFFFF" />
                <Text style={styles.startButtonText}>
                  Start Practice ({questions.length} questions)
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {renderQuickPractice()}
      {renderQuestionModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: responsiveValues.padding.medium,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: responsiveValues.fontSize.xlarge,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: responsiveValues.fontSize.medium,
    color: '#6B7280',
  },
  section: {
    marginBottom: responsiveValues.padding.medium,
  },
  sectionTitle: {
    fontSize: responsiveValues.fontSize.large,
    fontWeight: 'bold',
    color: '#1F2937',
    paddingHorizontal: responsiveValues.padding.medium,
    marginBottom: responsiveValues.padding.small,
  },
  optionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: responsiveValues.padding.medium,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 200,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedOptionCard: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  optionText: {
    fontSize: responsiveValues.fontSize.medium,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  selectedOptionText: {
    color: '#2563EB',
  },
  optionSubtext: {
    fontSize: responsiveValues.fontSize.small,
    color: '#6B7280',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: responsiveValues.padding.medium,
    justifyContent: 'space-between',
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedSubjectCard: {
    borderColor: '#2563EB',
    backgroundColor: '#2563EB',
  },
  subjectText: {
    fontSize: responsiveValues.fontSize.medium,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    textAlign: 'center',
  },
  selectedSubjectText: {
    color: '#FFFFFF',
  },
  subjectSubtext: {
    fontSize: responsiveValues.fontSize.small,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  topicsContainer: {
    paddingHorizontal: responsiveValues.padding.medium,
  },
  topicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedTopicCard: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topicText: {
    fontSize: responsiveValues.fontSize.medium,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  selectedTopicText: {
    color: '#2563EB',
  },
  topicSubtext: {
    fontSize: responsiveValues.fontSize.small,
    color: '#6B7280',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  easyBadge: {
    backgroundColor: '#D1FAE5',
  },
  mediumBadge: {
    backgroundColor: '#FEF3C7',
  },
  hardBadge: {
    backgroundColor: '#FEE2E2',
  },
  difficultyText: {
    fontSize: responsiveValues.fontSize.small,
    fontWeight: '600',
    color: '#374151',
  },
  startButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: responsiveValues.padding.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: responsiveValues.fontSize.medium,
    fontWeight: '600',
    marginLeft: 8,
  },
  quickPracticeContainer: {
    flexDirection: 'row',
    paddingHorizontal: responsiveValues.padding.medium,
    justifyContent: 'space-between',
  },
  quickPracticeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickPracticeTitle: {
    fontSize: responsiveValues.fontSize.medium,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    textAlign: 'center',
  },
  quickPracticeSubtext: {
    fontSize: responsiveValues.fontSize.small,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: responsiveValues.padding.medium,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: responsiveValues.fontSize.large,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    fontSize: responsiveValues.fontSize.large,
    color: '#6B7280',
  },
  questionContainer: {
    flex: 1,
    padding: responsiveValues.padding.medium,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionMarks: {
    fontSize: responsiveValues.fontSize.small,
    color: '#2563EB',
    fontWeight: '600',
  },
  questionText: {
    fontSize: responsiveValues.fontSize.medium,
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionLetter: {
    fontSize: responsiveValues.fontSize.medium,
    fontWeight: '600',
    color: '#2563EB',
    width: 24,
    textAlign: 'center',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: responsiveValues.padding.medium,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: responsiveValues.fontSize.small,
    color: '#6B7280',
    marginLeft: 4,
  },
});

export default PracticeContent;
