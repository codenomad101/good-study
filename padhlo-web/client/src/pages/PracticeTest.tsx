import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Typography, 
  Radio, 
  Space, 
  Progress, 
  Row, 
  Col,
  Statistic,
  Divider,
  Alert
} from 'antd';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ArrowLeftOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { AppLayout } from '../components/AppLayout';
import { dataService, Question } from '../services/dataService';
import { practiceAPI } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';

const { Title, Text, Paragraph } = Typography;

interface TestResult {
  question: Question;
  selectedAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

interface PracticeSession {
  sessionId: string;
  questions: Question[];
  category: string;
  totalQuestions: number;
  timeLimitMinutes: number;
  status: string;
}

const PracticeTestPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testCompleted, setTestCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [language, setLanguage] = useState<'en' | 'mr'>('en');

  const currentQuestion = session?.questions[currentQuestionIndex];
  const totalQuestions = session?.totalQuestions || 20;
  
  // Debug: Log session changes
  useEffect(() => {
    console.log('Session state changed:', session);
    if (session) {
      console.log('Session ID:', session.sessionId);
      console.log('Session has questions:', !!session.questions);
      console.log('Questions count:', session.questions?.length);
    }
  }, [session]);
  
  const timePerQuestion = 45; // 45 seconds per question (15 minutes / 20 questions)

  const handleTestComplete = useCallback(async () => {
    if (testCompleted) return; // Prevent multiple calls
    
    if (currentQuestion && selectedAnswer && session) {
      // Parse selected answer to get option ID
      const selectedOptionId = parseInt(selectedAnswer);
      
      // Get the selected option text
      const selectedOption = currentQuestion.options?.find(opt => opt.id === selectedOptionId);
      const selectedOptionText = selectedOption?.text || '';
      
      // Compare using option ID first, then fallback to text comparison
      let isCorrect = false;
      if (!isNaN(selectedOptionId) && currentQuestion.correctOption !== null) {
        // Primary validation: compare option IDs
        if (selectedOptionId === currentQuestion.correctOption) {
          isCorrect = true;
        } else {
          // Fallback: compare option texts (for cases where option IDs don't match but answers are correct)
          const correctOptionObj = currentQuestion.options?.find(opt => opt.id === currentQuestion.correctOption);
          const correctOptionText = correctOptionObj?.text || '';
          if (correctOptionText && selectedOptionText) {
            isCorrect = correctOptionText.toLowerCase().trim() === selectedOptionText.toLowerCase().trim();
          }
          // Also check if user's answer matches the stored correct answer text
          if (!isCorrect && currentQuestion.correctAnswer && selectedOptionText) {
            isCorrect = currentQuestion.correctAnswer.toLowerCase().trim() === selectedOptionText.toLowerCase().trim();
          }
        }
      }
      
      const timeSpent = timePerQuestion - (timeLeft % timePerQuestion);
      
      const result: TestResult = {
        question: currentQuestion,
        selectedAnswer,
        isCorrect,
        timeSpent
      };
      setTestResults(prev => [...prev, result]);

      try {
        // Update the final answer in the backend
        await dataService.updatePracticeAnswer(
          session.sessionId,
          currentQuestion.questionId,
          selectedAnswer,
          timeSpent
        );

        // Complete the practice session
        await dataService.completePracticeSession(session.sessionId);
        
        // Invalidate statistics cache to update the dashboard
        queryClient.invalidateQueries({ queryKey: ['userStatistics'] });
        queryClient.invalidateQueries({ queryKey: ['practiceHistory'] });
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
        queryClient.invalidateQueries({ queryKey: ['userRank'] });
        queryClient.invalidateQueries({ queryKey: ['availableSubjects'] });
      } catch (error) {
        console.error('Error completing practice session:', error);
      }
    }
    setTestCompleted(true);
  }, [currentQuestion, selectedAnswer, session, timeLeft, timePerQuestion, testCompleted]);

  useEffect(() => {
    const initializeSession = async () => {
      if (!categoryId) {
        setError('Category not found');
        setLoading(false);
        return;
      }

      try {
        // Create a new practice session via backend
        const sessionData = await practiceAPI.createSession(categoryId, 15, language);
        console.log('Session data received:', sessionData);
        console.log('Session data structure:', JSON.stringify(sessionData, null, 2));
        console.log('Setting session with data:', sessionData.data);
        
        // Debug: Check if questions exist
        if (sessionData.data && sessionData.data.questions) {
          console.log('Questions found:', sessionData.data.questions.length);
          console.log('First question:', sessionData.data.questions[0]);
        } else {
          console.error('No questions found in session data!');
          console.log('Available keys:', Object.keys(sessionData.data || {}));
        }
        
        setSession(sessionData.data);
      } catch (err) {
        setError('Failed to create practice session');
        console.error('Error creating practice session:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, [categoryId, language]);

  useEffect(() => {
    if (timeLeft <= 0 && !testCompleted) {
      handleTestComplete();
    }
  }, [timeLeft, testCompleted, handleTestComplete]);

  useEffect(() => {
    if (testCompleted) return; // Don't run timer if test is completed
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTestComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testCompleted, handleTestComplete]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = async () => {
    console.log('handleNextQuestion called with:', {
      currentQuestion: !!currentQuestion,
      selectedAnswer: !!selectedAnswer,
      session: !!session,
      sessionId: session?.sessionId,
      questionsLength: session?.questions?.length,
      currentQuestionIndex,
      totalQuestions
    });
    
    if (!currentQuestion || !selectedAnswer || !session) {
      console.log('Missing required data:', {
        currentQuestion: !!currentQuestion,
        selectedAnswer: !!selectedAnswer,
        session: !!session,
        sessionId: session?.sessionId
      });
      return;
    }

    // Parse selected answer to get option ID and compare with correctOption
    const selectedOptionId = parseInt(selectedAnswer);
    const isCorrect = !isNaN(selectedOptionId) && currentQuestion.correctOption !== null && selectedOptionId === currentQuestion.correctOption;
    
    // Debug logging for practice answer comparison
    console.log('Practice answer validation debug:', {
      questionId: currentQuestion.questionId,
      userAnswer: `"${selectedAnswer}"`,
      selectedOptionId,
      correctAnswer: `"${currentQuestion.correctAnswer}"`,
      correctOption: currentQuestion.correctOption,
      userAnswerType: typeof selectedAnswer,
      correctAnswerType: typeof currentQuestion.correctAnswer,
      areEqual: isCorrect,
      validationMethod: 'optionId',
      questionOptions: currentQuestion.options
    });
    
    const timeSpent = timePerQuestion - (timeLeft % timePerQuestion);
    
    const result: TestResult = {
      question: currentQuestion,
      selectedAnswer,
      isCorrect,
      timeSpent
    };

    setTestResults(prev => [...prev, result]);

    try {
      // Update the answer in the backend
      console.log('Updating practice answer with sessionId:', session.sessionId);
      console.log('Session object:', session);
      await dataService.updatePracticeAnswer(
        session.sessionId,
        currentQuestion.questionId,
        selectedAnswer,
        timeSpent
      );
      
      // Invalidate statistics cache to update real-time stats
      queryClient.invalidateQueries({ queryKey: ['userStatistics'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['userRank'] });
    } catch (error) {
      console.error('Error updating practice answer:', error);
    }

    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer('');
    } else {
      handleTestComplete();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getScore = () => {
    const correct = testResults.filter(result => result.isCorrect).length;
    return Math.round((correct / testResults.length) * 100);
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <Title level={2}>Creating Practice Session...</Title>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <Alert message={error} type="error" />
          <Button 
            type="primary" 
            onClick={() => navigate('/practice')}
            style={{ marginTop: '16px' }}
          >
            Back to Practice
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (testCompleted) {
    const score = getScore();
    const correctAnswers = testResults.filter(result => result.isCorrect).length;
    const totalAnswered = testResults.length;

    return (
      <AppLayout>
        <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/practice')}
              style={{ marginBottom: '24px' }}
            >
              Back to Practice
            </Button>
            <Title level={1} style={{ textAlign: 'center', marginBottom: '8px' }}>
              <TrophyOutlined style={{ color: '#f59e0b', marginRight: '12px' }} />
              Test Completed!
            </Title>
            <Text style={{ textAlign: 'center', display: 'block', fontSize: '16px', color: '#6b7280' }}>
              Here are your results and explanations
            </Text>
          </div>

          {/* Score Summary */}
          <Card style={{ marginBottom: '32px', textAlign: 'center' }}>
            <Row gutter={24}>
              <Col span={8}>
                <Statistic 
                  title="Score" 
                  value={score} 
                  suffix="%" 
                  valueStyle={{ color: score >= 70 ? '#52c41a' : score >= 50 ? '#faad14' : '#ff4d4f' }}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="Correct Answers" 
                  value={correctAnswers} 
                  suffix={`/ ${totalAnswered}`}
                  valueStyle={{ color: '#FF7846' }}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="Time Used" 
                  value={formatTime(15 * 60 - timeLeft)}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>
          </Card>

          {/* Question Results */}
          <div>
            <Title level={2} style={{ marginBottom: '24px' }}>Question Review</Title>
            {(() => { console.log('Test results for rendering:', testResults); return null; })()}
            {testResults.map((result, index) => {
              console.log(`Rendering result ${index}:`, result);
              // Safety check for question object
              const question = result.question || {};
              const questionText = typeof question.questionText === 'string' ? question.questionText : String(question.questionText || '');
              const explanation = typeof question.explanation === 'string' ? question.explanation : String(question.explanation || '');
              
              return (
              <Card key={index} style={{ marginBottom: '16px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong style={{ fontSize: '16px' }}>
                    Question {index + 1}: {questionText}
                  </Text>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>Your Answer: </Text>
                  <Text style={{ 
                    color: result.isCorrect ? '#52c41a' : '#ff4d4f',
                    fontWeight: 'bold'
                  }}>
                    {(() => {
                      // Debug logging for answer display
                      console.log('Answer display debug:', {
                        selectedAnswer: result.selectedAnswer,
                        selectedAnswerType: typeof result.selectedAnswer,
                        questionOptions: question.options,
                        questionId: question.questionId
                      });
                      
                      // Convert selected answer ID back to option text for display
                      const selectedId = parseInt(result.selectedAnswer);
                      if (!isNaN(selectedId) && question.options && Array.isArray(question.options)) {
                        const selectedOption = question.options.find(opt => {
                          if (typeof opt === 'object' && opt.id) {
                            return opt.id === selectedId;
                          }
                          return false;
                        });
                        if (selectedOption && typeof selectedOption === 'object') {
                          return String(selectedOption.text || '');
                        }
                      }
                      // Fallback: if we can't find the option, show the raw answer
                      return String(result.selectedAnswer || 'No answer selected');
                    })()}
                  </Text>
                  {result.isCorrect ? (
                    <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: '8px' }} />
                  ) : (
                    <CloseCircleOutlined style={{ color: '#ff4d4f', marginLeft: '8px' }} />
                  )}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <Text strong>Correct Answer: </Text>
                  <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
                    {(() => {
                      // Convert correctOption ID to option text for display
                      if (question.correctOption && question.options && Array.isArray(question.options)) {
                        const correctOption = question.options.find(opt => {
                          if (typeof opt === 'object' && opt.id) {
                            return opt.id === question.correctOption;
                          }
                          return false;
                        });
                        if (correctOption && typeof correctOption === 'object') {
                          return String(correctOption.text || '');
                        }
                      }
                      // Fallback to original correctAnswer text
                      return String(question.correctAnswer || 'Correct answer not available');
                    })()}
                  </Text>
                </div>

                <Divider />
                
                <div>
                  <Text strong>Explanation:</Text>
                  <Paragraph style={{ marginTop: '8px', marginBottom: 0 }}>
                    {explanation}
                  </Paragraph>
                </div>
              </Card>
              );
            })}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/practice')}
            style={{ marginBottom: '16px' }}
          >
            Back to Practice
          </Button>
          
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2} style={{ margin: 0 }}>
                Practice Test - {categoryId ? categoryId.charAt(0).toUpperCase() + categoryId.slice(1) : 'Unknown'}
              </Title>
              <Text type="secondary">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </Text>
            </Col>
            <Col>
              <div style={{ textAlign: 'right' }}>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: timeLeft < 300 ? '#ff4d4f' : '#FF7846',
                  marginBottom: '4px'
                }}>
                  <ClockCircleOutlined style={{ marginRight: '8px' }} />
                  {formatTime(timeLeft)}
                </div>
                <Text type="secondary">Time Remaining</Text>
              </div>
            </Col>
          </Row>
          <Row justify="end" style={{ marginTop: 12 }}>
            <Col>
              <Space>
                <Text type="secondary">Language:</Text>
                <Radio.Group value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <Radio.Button value="en">English</Radio.Button>
                  <Radio.Button value="mr">Marathi</Radio.Button>
                </Radio.Group>
              </Space>
            </Col>
          </Row>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '32px' }}>
          <Progress 
            percent={Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)} 
            strokeColor="#FF7846"
            showInfo={false}
            size="default"
          />
        </div>

        {/* Question Card */}
        <Card style={{ marginBottom: '24px' }}>
          <Title level={3} style={{ marginBottom: '24px' }}>
            {String(currentQuestion?.questionText || 'Question not available')}
          </Title>
          
          <Radio.Group 
            value={selectedAnswer} 
            onChange={(e) => handleAnswerSelect(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {currentQuestion?.options && Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0 ? currentQuestion.options.map((option, index) => {
                // Handle both string and object formats - ensure we always render strings
                let optionText: string;
                let optionValue: string;
                
                // Debug: Log the option structure
                console.log(`Option ${index}:`, option);
                
                try {
                  if (typeof option === 'string') {
                    optionText = option;
                    optionValue = String(index + 1); // Use option ID (1, 2, 3, 4)
                } else if (option && typeof option === 'object') {
                  // Extract text from object, with multiple fallbacks
                  // Handle case where option.text is also an object
                  let textValue = (option as any).text;
                  if (textValue && typeof textValue === 'object') {
                    textValue = textValue.text || textValue.label || textValue.value || JSON.stringify(textValue);
                  }
                  
                  optionText = textValue || (option as any).id || (option as any).label || (option as any).value || JSON.stringify(option);
                  optionValue = String((option as any).id || (index + 1)); // Use option.id if available, otherwise use index + 1
                } else {
                    optionText = String(option || '');
                    optionValue = String(index + 1); // Use option ID (1, 2, 3, 4)
                  }
                  
                  // Final safety check - ensure we have valid strings
                  if (typeof optionText !== 'string' || typeof optionValue !== 'string') {
                    console.warn('Invalid option data:', option);
                    optionText = 'Invalid option';
                    optionValue = String(index + 1);
                  }
                } catch (error) {
                  console.error('Error processing option:', option, error);
                  optionText = 'Error loading option';
                  optionValue = String(index + 1);
                }
                
                return (
                  <Radio key={index} value={optionValue} style={{ 
                    display: 'block',
                    padding: '12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    fontSize: '16px'
                  }}>
                    {optionText}
                  </Radio>
                );
              }) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  No options available for this question
                </div>
              )}
            </Space>
          </Radio.Group>
        </Card>

        {/* Action Buttons */}
        <div style={{ textAlign: 'center' }}>
          <Button 
            type="primary" 
            size="large"
            onClick={handleNextQuestion}
            disabled={!selectedAnswer}
            style={{ 
              padding: '0 32px',
              height: '48px',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            {currentQuestionIndex < totalQuestions - 1 ? 'Next Question' : 'Finish Test'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default PracticeTestPage;