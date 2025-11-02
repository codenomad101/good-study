import React, { useState, useEffect } from 'react';
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
  Alert,
  Spin,
  Modal,
  Result
} from 'antd';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ArrowLeftOutlined,
  TrophyOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { AppLayout } from '../components/AppLayout';
import { useExamQuestions, useCompleteExam, useResumeExam } from '../hooks/useExams';
import { useUserStatistics } from '../hooks/useStatistics';
import { useQueryClient } from '@tanstack/react-query';

const { Title, Text, Paragraph } = Typography;

interface ExamQuestion {
  questionId: string;
  questionText: string;
  options: Array<{ id: number; text: string }>;
  correctAnswer: string;
  correctOption: number | null;
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
  questions: ExamQuestion[];
  status: string;
  startTime: string;
  endTime?: string;
}

const ExamPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(-1); // -1 means not initialized yet
  const [examCompleted, setExamCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localSession, setLocalSession] = useState<ExamSession | null>(null);
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const [examResults, setExamResults] = useState<any>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);

  // Use custom hooks
  const { data: sessionData, isLoading: loading, error: queryError } = useExamQuestions(sessionId || '');
  const resumeExamMutation = useResumeExam();
  const completeExamMutation = useCompleteExam();
  const { data: userStats } = useUserStatistics();
  
  const session = localSession || (sessionData as ExamSession | null);

  const currentQuestion = session?.questions?.[currentQuestionIndex];
  const totalQuestions = session?.questions?.length || 0;

  // Initialize local session when data loads
  useEffect(() => {
    console.log('Session data changed:', { sessionData, localSession });
    if (sessionData && !localSession) {
      console.log('Setting local session:', sessionData);
      // Handle the nested data structure from the backend
      const examData = (sessionData as any).data || sessionData;
      setLocalSession(examData as ExamSession);
    }
  }, [sessionData]);

  useEffect(() => {
    if (session && !sessionInitialized) {
      console.log('Initializing session:', session);
      const safeDurationMinutes = session?.durationMinutes && session.durationMinutes > 0 
        ? session.durationMinutes 
        : 15; // fallback to 15 minutes if missing/zero
      const totalTime = safeDurationMinutes * 60;

      if (session?.status === 'in_progress' && session?.questions) {
        const attemptedQuestions = 0;
        const timeSpent = 0;
        setCurrentQuestionIndex(attemptedQuestions);
        setTimeLeft(Math.max(0, totalTime - timeSpent));
      } else {
        setCurrentQuestionIndex(0);
        setTimeLeft(totalTime);
      }

      // Mark initialized only after timeLeft has been set
      setSessionInitialized(true);
    }
  }, [session, sessionInitialized]);

  // Debug: Track currentQuestionIndex changes
  useEffect(() => {
    console.log('currentQuestionIndex changed to:', currentQuestionIndex);
  }, [currentQuestionIndex]);

  // Removed separate effect that completed on timeLeft === 0 to avoid race conditions

  useEffect(() => {
    // Start ticking only when initialized and timeLeft valid
    if (!sessionInitialized || !session || examCompleted || timeLeft < 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) return 0;
        const next = prev - 1;
        if (next === 0) {
          console.log('Timer expired, calling handleExamComplete from tick');
          handleExamComplete();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionInitialized, session, examCompleted, timeLeft]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    console.log('handleNextQuestion called', {
      currentQuestion: !!currentQuestion,
      selectedAnswer,
      session: !!session,
      currentQuestionIndex,
      totalQuestions,
      examCompleted,
      sessionInitialized
    });

    if (!currentQuestion || !selectedAnswer || !session || examCompleted || !sessionInitialized) return;

    // Update the question with the selected answer
    const updatedQuestions = session.questions?.map((q, index) => 
      index === currentQuestionIndex 
        ? { ...q, userAnswer: selectedAnswer }
        : q
    );

    console.log('Updated questions:', updatedQuestions);

    setLocalSession(prev => prev ? { ...prev, questions: updatedQuestions } : null);

    if (currentQuestionIndex < totalQuestions - 1) {
      console.log('Moving to next question', { currentQuestionIndex, totalQuestions });
      setCurrentQuestionIndex(prev => {
        console.log('Setting question index from', prev, 'to', prev + 1);
        return prev + 1;
      });
      setSelectedAnswer('');
    } else {
      console.log('Completing exam');
      handleExamComplete();
    }
  };

  const handleExamComplete = async () => {
    if (!session || !sessionId || !sessionInitialized) {
      console.log('Exam completion prevented - session:', !!session, 'sessionId:', !!sessionId, 'sessionInitialized:', sessionInitialized);
      return;
    }

    console.log('Starting exam completion process');
    setSubmitting(true);
    try {
      // Calculate results
      const updatedQuestions = session.questions?.map(q => {
        // Parse user answer to get option ID
        const selectedOptionId = parseInt(q.userAnswer);
        const hasUserAnswer = q.userAnswer && q.userAnswer.trim() !== '';
        
        // Get the selected option text
        const selectedOption = q.options?.find(opt => opt.id === selectedOptionId);
        const selectedOptionText = selectedOption?.text || '';
        
        // Compare using option ID first, then fallback to text comparison
        let isCorrect = false;
        if (hasUserAnswer && !isNaN(selectedOptionId) && q.correctOption !== null) {
          // Primary validation: compare option IDs
          if (selectedOptionId === q.correctOption) {
            isCorrect = true;
          } else {
            // Fallback: compare option texts (for cases where option IDs don't match but answers are correct)
            const correctOptionObj = q.options?.find(opt => opt.id === q.correctOption);
            const correctOptionText = correctOptionObj?.text || '';
            if (correctOptionText && selectedOptionText) {
              isCorrect = correctOptionText.toLowerCase().trim() === selectedOptionText.toLowerCase().trim();
            }
            // Also check if user's answer matches the stored correct answer text
            if (!isCorrect && q.correctAnswer && selectedOptionText) {
              isCorrect = q.correctAnswer.toLowerCase().trim() === selectedOptionText.toLowerCase().trim();
            }
          }
        }
        
        // Calculate marks: positive for correct, negative for incorrect (if negative marking enabled)
        let marksObtained = 0;
        if (hasUserAnswer) {
          if (isCorrect) {
            marksObtained = q.marksPerQuestion;
          } else if (session.negativeMarking) {
            // Apply negative marking ratio (default 0.25)
            const negativeRatio = session.negativeMarksRatio || 0.25;
            marksObtained = -(q.marksPerQuestion * negativeRatio);
          }
        }
        
        // Debug logging for exam answer comparison
        console.log('Exam answer validation debug:', {
          questionId: q.questionId,
          userAnswer: `"${q.userAnswer}"`,
          selectedOptionId,
          selectedOptionText,
          correctAnswer: `"${q.correctAnswer}"`,
          correctOption: q.correctOption,
          correctOptionText: q.options?.find(opt => opt.id === q.correctOption)?.text,
          userAnswerType: typeof q.userAnswer,
          correctAnswerType: typeof q.correctAnswer,
          areEqual: isCorrect,
          validationMethod: 'optionIdWithTextFallback',
          marksObtained,
          negativeMarking: session.negativeMarking
        });
        
        return {
          ...q,
          isCorrect,
          marksObtained
        };
      });

      const totalMarksObtained = updatedQuestions.reduce((sum, q) => sum + (q.marksObtained || 0), 0);
      const percentage = Math.round((totalMarksObtained / session.totalMarks) * 100);
      
      // Calculate statistics
      const questionsAttempted = updatedQuestions.filter(q => q.userAnswer).length;
      const correctAnswers = updatedQuestions.filter(q => q.isCorrect).length;
      const incorrectAnswers = questionsAttempted - correctAnswers;
      const skippedQuestions = updatedQuestions.length - questionsAttempted;
      const timeSpentSeconds = session.durationMinutes * 60 - timeLeft;

      const examData = {
        timeSpentSeconds,
        questionsAttempted,
        correctAnswers,
        incorrectAnswers,
        skippedQuestions,
        marksObtained: totalMarksObtained,
        percentage
      };

    console.log('Sending exam completion data:', examData);
    const result = await completeExamMutation.mutateAsync({ sessionId, examData });
    
    // Invalidate statistics cache to update the dashboard
    queryClient.invalidateQueries({ queryKey: ['userStatistics'] });
    queryClient.invalidateQueries({ queryKey: ['examHistory'] });
    queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    queryClient.invalidateQueries({ queryKey: ['userRank'] });
    queryClient.invalidateQueries({ queryKey: ['availableSubjects'] });
    
    // Store the results and show modal
    setExamResults({
      ...examData,
      examName: session.examName,
      totalMarks: session.totalMarks,
      durationMinutes: session.durationMinutes
    });
    setShowResultsModal(true);
    setExamCompleted(true);
    } catch (error) {
      console.error('Error completing exam:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getScore = () => {
    if (!session) return 0;
    const correct = session.questions?.filter(q => q.isCorrect).length || 0;
    return Math.round((correct / (session.questions?.length || 1)) * 100);
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <Spin size="large" />
          <Title level={2} style={{ marginTop: '16px' }}>Loading Exam...</Title>
        </div>
      </AppLayout>
    );
  }

  if (queryError) {
    return (
      <AppLayout>
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <Alert message="Failed to load exam" type="error" />
          <Button 
            type="primary" 
            onClick={() => navigate('/exams')}
            style={{ marginTop: '16px' }}
          >
            Back to Exams
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (examCompleted) {
    // Recalculate isCorrect for each question to ensure proper scoring
    const recalculatedQuestions = session?.questions.map(q => {
      const selectedOptionId = parseInt(q.userAnswer);
      const hasUserAnswer = q.userAnswer && q.userAnswer.trim() !== '';
      
      // Get the selected option text
      const selectedOption = q.options?.find(opt => opt.id === selectedOptionId);
      const selectedOptionText = selectedOption?.text || '';
      
      // Compare using option ID first, then fallback to text comparison
      let isCorrect = false;
      if (hasUserAnswer && !isNaN(selectedOptionId) && q.correctOption !== null) {
        // Primary validation: compare option IDs
        if (selectedOptionId === q.correctOption) {
          isCorrect = true;
        } else {
          // Fallback: compare option texts (for cases where option IDs don't match but answers are correct)
          const correctOptionObj = q.options?.find(opt => opt.id === q.correctOption);
          const correctOptionText = correctOptionObj?.text || '';
          if (correctOptionText && selectedOptionText) {
            isCorrect = correctOptionText.toLowerCase().trim() === selectedOptionText.toLowerCase().trim();
          }
          // Also check if user's answer matches the stored correct answer text
          if (!isCorrect && q.correctAnswer && selectedOptionText) {
            isCorrect = q.correctAnswer.toLowerCase().trim() === selectedOptionText.toLowerCase().trim();
          }
        }
      }
      
      // Recalculate marks
      let marksObtained = 0;
      if (hasUserAnswer) {
        if (isCorrect) {
          marksObtained = q.marksPerQuestion;
        } else if (session?.negativeMarking) {
          const negativeRatio = session?.negativeMarksRatio || 0.25;
          marksObtained = -(q.marksPerQuestion * negativeRatio);
        }
      }
      
      return {
        ...q,
        isCorrect,
        marksObtained
      };
    }) || [];
    
    const score = recalculatedQuestions.length > 0 
      ? Math.round((recalculatedQuestions.filter(q => q.isCorrect).length / recalculatedQuestions.length) * 100)
      : 0;
    const correctAnswers = recalculatedQuestions.filter(q => q.isCorrect).length;
    const totalAnswered = recalculatedQuestions.length;

    return (
      <AppLayout>
        <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/exams')}
              style={{ marginBottom: '24px' }}
            >
              Back to Exams
            </Button>
            <Title level={1} style={{ textAlign: 'center', marginBottom: '8px' }}>
              <TrophyOutlined style={{ color: '#f59e0b', marginRight: '12px' }} />
              Exam Completed!
            </Title>
            <Text style={{ textAlign: 'center', display: 'block', fontSize: '16px', color: '#6b7280' }}>
              {session?.examName} - Here are your results
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
                  value={formatTime(session?.durationMinutes ? session.durationMinutes * 60 - timeLeft : 0)}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>
          </Card>

          {/* Question Results */}
          <div>
            <Title level={2} style={{ marginBottom: '24px' }}>Question Review</Title>
            {recalculatedQuestions.map((question, index) => (
              <Card key={index} style={{ marginBottom: '16px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong style={{ fontSize: '16px' }}>
                    Question {index + 1}: {question.questionText}
                  </Text>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>Your Answer: </Text>
                  <Text style={{ 
                    color: question.isCorrect ? '#52c41a' : '#ff4d4f',
                    fontWeight: 'bold'
                  }}>
                    {(() => {
                      // Convert selected answer ID back to option text for display
                      if (question.userAnswer) {
                        const selectedId = parseInt(question.userAnswer);
                        if (!isNaN(selectedId) && question.options) {
                          const selectedOption = question.options.find(opt => opt.id === selectedId);
                          if (selectedOption) {
                            return typeof selectedOption === 'object' ? selectedOption.text : String(selectedOption);
                          }
                        }
                        return question.userAnswer;
                      }
                      return 'Not answered';
                    })()}
                  </Text>
                  {question.userAnswer && (
                    question.isCorrect ? (
                      <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: '8px' }} />
                    ) : (
                      <CloseCircleOutlined style={{ color: '#ff4d4f', marginLeft: '8px' }} />
                    )
                  )}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <Text strong>Correct Answer: </Text>
                  <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
                    {(() => {
                      // Convert correctOption ID to option text for display
                      if (question.correctOption && question.options) {
                        const correctOption = question.options.find(opt => opt.id === question.correctOption);
                        if (correctOption) {
                          return typeof correctOption === 'object' ? correctOption.text : String(correctOption);
                        }
                      }
                      return question.correctAnswer;
                    })()}
                  </Text>
                </div>

                <Divider />
                
                <div>
                  <Text strong>Marks: </Text>
                  <Text style={{ color: question.isCorrect ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
                    {question.marksObtained}/{question.marksPerQuestion}
                  </Text>
                </div>
              </Card>
            ))}
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
            onClick={() => navigate('/exams')}
            style={{ marginBottom: '16px' }}
          >
            Back to Exams
          </Button>
          
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2} style={{ margin: 0 }}>
                {session?.examName}
              </Title>
              <Text type="secondary">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </Text>
              {userStats && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '16px', fontSize: '12px' }}>
                  <Text type="secondary">Total Solved: {userStats.totalQuestionsAttempted || 0}</Text>
                  <Text type="secondary">Accuracy: {Math.round(parseFloat(userStats.overallAccuracy || '0'))}%</Text>
                  <Text type="secondary">Streak: {userStats.currentStreak || 0}</Text>
                </div>
              )}
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
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '32px' }}>
          <Progress 
            percent={Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)} 
            strokeColor="#FF7846"
            showInfo={false}
          />
        </div>

        {/* Question Card */}
        <Card style={{ marginBottom: '24px' }}>
          <Title level={3} style={{ marginBottom: '24px' }}>
            {currentQuestion?.questionText}
          </Title>
          
          <Radio.Group 
            value={selectedAnswer} 
            onChange={(e) => handleAnswerSelect(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {currentQuestion?.options.map((option, index) => {
                const optionText = typeof option === 'string' ? option : (option?.text || option);
                const optionValue = String(option?.id || (index + 1)); // Use option ID (1, 2, 3, 4)
                return (
                  <Radio key={index} value={optionValue} style={{ 
                    display: 'block',
                    padding: '12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    fontSize: '16px'
                  }}>
                    {String(optionText)}
                  </Radio>
                );
              })}
            </Space>
          </Radio.Group>
        </Card>

        {/* Action Buttons */}
        <div style={{ textAlign: 'center' }}>
          <Button 
            type="primary" 
            size="large"
            onClick={handleNextQuestion}
            disabled={!selectedAnswer || submitting}
            loading={submitting}
            htmlType="button"
            style={{ 
              padding: '0 32px',
              height: '48px',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            {currentQuestionIndex < totalQuestions - 1 ? 'Next Question' : 'Finish Exam'}
          </Button>
        </div>
      </div>

      {/* Exam Results Modal */}
      <Modal
        title="Exam Results"
        open={showResultsModal}
        onCancel={() => setShowResultsModal(false)}
        footer={[
          <Button key="back" onClick={() => navigate('/exams')}>
            Back to Exams
          </Button>,
          <Button key="close" type="primary" onClick={() => setShowResultsModal(false)}>
            Close
          </Button>
        ]}
        width={800}
        centered
      >
        {examResults && (
          <div>
            <Result
              status={examResults.percentage >= 60 ? "success" : "warning"}
              title={`${examResults.examName} - Completed!`}
              subTitle={`You scored ${examResults.percentage}% (${examResults.marksObtained}/${examResults.totalMarks} marks)`}
            />
            
            <Divider />
            
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="Questions Attempted"
                    value={examResults.questionsAttempted}
                    suffix={`/ ${examResults.questionsAttempted + examResults.skippedQuestions}`}
                    prefix={<QuestionCircleOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="Correct Answers"
                    value={examResults.correctAnswers}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="Incorrect Answers"
                    value={examResults.incorrectAnswers}
                    prefix={<CloseCircleOutlined />}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="Skipped Questions"
                    value={examResults.skippedQuestions}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="Time Spent"
                    value={Math.floor(examResults.timeSpentSeconds / 60)}
                    suffix={`min ${examResults.timeSpentSeconds % 60}s`}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="Total Duration"
                    value={examResults.durationMinutes}
                    suffix="min"
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#13c2c2' }}
                  />
                </Card>
              </Col>
            </Row>

            <Divider />
            
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Progress
                type="circle"
                percent={examResults.percentage}
                strokeColor={examResults.percentage >= 80 ? '#52c41a' : examResults.percentage >= 60 ? '#faad14' : '#ff4d4f'}
                size={120}
                format={(percent) => `${percent}%`}
              />
              <div style={{ marginTop: '16px' }}>
                <Text strong style={{ fontSize: '18px' }}>
                  {examResults.percentage >= 80 ? 'Excellent!' : 
                   examResults.percentage >= 60 ? 'Good Job!' : 
                   'Keep Practicing!'}
                </Text>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
};

export default ExamPage;
