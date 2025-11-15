import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Typography, 
  Table,
  Space,
  Tag,
  Avatar,
  Badge,
  Progress,
  Statistic,
  Timeline,
  List,
  Modal,
  Result,
  Divider,
  Spin
} from 'antd';
import {
  BookOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  UserOutlined,
  SettingOutlined,
  BellOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  EyeOutlined,
  DownloadOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  BarChartOutlined,
  PlayCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { AppLayout } from '../components/AppLayout';
import { useCategories } from '../hooks/useCategories';
import { useExamHistory, useResumeExam, useCreateDynamicExam } from '../hooks/useExams';
import { useRemainingSessions } from '../hooks/useSubscription';
import { message, Modal } from 'antd';

const { Title, Text, Paragraph } = Typography;

export default function Exams() {
  const navigate = useNavigate();
  
  // Use custom hooks
  const { data: categories = [] } = useCategories();
  const { data: examHistoryData = [], isLoading: historyLoading } = useExamHistory();
  const resumeExamMutation = useResumeExam();
  const createExamMutation = useCreateDynamicExam();
  const { data: remainingSessions, refetch: refetchRemainingSessions } = useRemainingSessions();
  
  const examHistory = examHistoryData || [];
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedExamResults, setSelectedExamResults] = useState<any>(null);

  const handleQuickExam = async (totalQuestions: number = 20, negativeMarking: boolean = false) => {
    if (!categories || categories.length === 0) {
      message.error('No categories available for quick exam');
      return;
    }

    // Check remaining exam sessions for free plan
    if (remainingSessions && remainingSessions.exam !== -1 && remainingSessions.exam <= 0) {
      Modal.warning({
        title: 'Daily Exam Limit Reached',
        content: 'You have reached your daily limit of 3 exam sessions. Upgrade to Pro for unlimited sessions or try again tomorrow.',
        okText: 'Upgrade to Pro',
        cancelText: 'Cancel',
        onOk: () => {
          window.location.href = '/pricing';
        },
      });
      return;
    }

    // Ensure all categories are included (including Marathi)
    const numCategories = categories.length;
    
    // Calculate minimum questions per category based on exam size
    // For 20 questions: try for at least 2 per category, but adjust if needed
    // For 40+ questions: at least 3 per category
    let minQuestionsPerCategory: number;
    if (totalQuestions <= 20) {
      // For 20 questions: if we have 11 categories, we can't do 2 each (would be 22)
      // So calculate: floor(20/11) = 1, but we want at least 1-2
      minQuestionsPerCategory = Math.max(1, Math.floor(totalQuestions / numCategories));
      // If possible, ensure at least 2 for most categories
      if (totalQuestions >= numCategories * 2) {
        minQuestionsPerCategory = 2;
      }
    } else {
      // For 40+ questions: at least 3 per category
      minQuestionsPerCategory = Math.max(3, Math.floor(totalQuestions / numCategories));
      if (totalQuestions >= numCategories * 3) {
        minQuestionsPerCategory = 3;
      }
    }
    
    // Calculate distribution: each category gets minimum, then distribute remaining
    const baseQuestions = minQuestionsPerCategory * numCategories;
    const remainingQuestions = Math.max(0, totalQuestions - baseQuestions);
    
    // Priority categories for extra questions: Polity, Economy, History, Science, GK, Current Affairs
    const priorityCategories = ['polity', 'economy', 'history', 'science', 'gk', 'current-affairs'];
    
    const distribution = categories.map((cat) => {
      const categorySlug = (cat.slug || cat.id || '').toLowerCase();
      const baseCount = minQuestionsPerCategory;
      
      // Calculate extra questions for this category
      let extraCount = 0;
      if (remainingQuestions > 0) {
        // Priority categories get more extra questions
        if (priorityCategories.includes(categorySlug)) {
          // Priority categories get proportionally more
          extraCount = Math.ceil(remainingQuestions / (priorityCategories.length + 2));
        } else {
          // Other categories get fewer extra questions
          extraCount = Math.floor(remainingQuestions / (numCategories * 3));
        }
      }
      
      return {
        category: cat.id,
        count: baseCount + extraCount,
        marksPerQuestion: 2
      };
    });
    
    // Adjust to ensure total matches exactly
    let currentTotal = distribution.reduce((sum, d) => sum + d.count, 0);
    let difference = totalQuestions - currentTotal;
    
    if (difference !== 0) {
      // Distribute the difference to priority categories first
      const priorityIndices = categories
        .map((cat, idx) => {
          const slug = (cat.slug || cat.id || '').toLowerCase();
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
      
      // If still remaining, distribute to all categories
      idx = 0;
      while (difference > 0) {
        distribution[idx % distribution.length].count += 1;
        difference -= 1;
        idx += 1;
      }
      
      // Handle negative difference (too many questions)
      idx = 0;
      while (difference < 0) {
        if (distribution[idx % distribution.length].count > minQuestionsPerCategory) {
          distribution[idx % distribution.length].count -= 1;
          difference += 1;
        }
        idx += 1;
        if (idx > distribution.length * 10) break; // Safety break
      }
    }

    const totalQ = distribution.reduce((sum, d) => sum + d.count, 0);
    const totalMarks = totalQ * 2;
    const duration = Math.ceil(totalQ * 0.75); // ~45 seconds per question

    const examData = {
      examName: `Quick Test - ${totalQ} Questions`,
      totalMarks,
      durationMinutes: duration,
      questionDistribution: distribution,
      negativeMarking,
      negativeMarksRatio: negativeMarking ? 0.25 : 0
    };

    try {
      const response = await createExamMutation.mutateAsync(examData);
      
      if (response.success) {
        // Refetch remaining sessions after creating exam
        await refetchRemainingSessions();
        navigate(`/exam/${response.data.sessionId}`);
      } else {
        console.error('Failed to create quick exam:', response.message);
        message.error('Failed to create exam. Please try again.');
      }
    } catch (error: any) {
      console.error('Error creating quick exam:', error);
      // Check if it's a session limit error
      if (error?.response?.status === 403 && error?.response?.data?.requiresUpgrade) {
        Modal.warning({
          title: 'Daily Exam Limit Reached',
          content: error.response.data.message || 'You have reached your daily limit of 3 exam sessions. Upgrade to Pro for unlimited sessions.',
          okText: 'Upgrade to Pro',
          cancelText: 'Cancel',
          onOk: () => {
            window.location.href = '/pricing';
          },
        });
      } else {
        message.error(error?.response?.data?.message || 'Failed to create quick exam');
      }
    }
  };

  const handleCreateExam = async () => {
    // Navigate to practice page with exam mode
    navigate('/practice?mode=exam');
  };

  const handleResumeExam = async (sessionId: string) => {
    try {
      const examData = await resumeExamMutation.mutateAsync(sessionId);
      // Navigate to exam page with the session ID
      navigate(`/exam/${sessionId}`);
    } catch (error) {
      console.error('Error resuming exam:', error);
    }
  };

  const handleViewExam = (sessionId: string, status: string) => {
    if (status === 'completed') {
      // Find the exam data and show results modal
      const exam = examHistory.find(e => e.sessionId === sessionId);
      if (exam) {
        setSelectedExamResults(exam);
        setShowResultsModal(true);
      }
    } else {
      // Resume the exam
      handleResumeExam(sessionId);
    }
  };

  const columns = [
    {
      title: 'Exam',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <div 
            style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #FF7846, #722ed1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px'
            }}
          >
            <FileTextOutlined />
          </div>
            <div>
            <Text strong>{text || record.examName || 'Untitled Exam'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.totalQuestions || 0} questions
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Score',
      dataIndex: 'marksObtained',
      key: 'score',
      render: (marksObtained, record) => {
        // Parse marksObtained if it's a string decimal
        const marks = typeof marksObtained === 'string' ? parseFloat(marksObtained) : (marksObtained ?? 0);
        const total = record.totalMarks ?? 0;
        // Parse percentage if it's a string decimal
        const percentage = typeof record.percentage === 'string' ? parseFloat(record.percentage) : (record.percentage ?? 0);
        
        const percentageDisplay = total > 0 && marks > 0 ? ((marks / total) * 100).toFixed(1) : percentage.toFixed(1);
        
        return (
          <div>
            <Text strong>{marks.toFixed(0)}/{total}</Text>
            <br />
            <Tag color={percentage >= 80 ? 'green' : percentage >= 60 ? 'orange' : 'red'}>
              {percentageDisplay}%
            </Tag>
          </div>
        );
      },
    },
    {
      title: 'Time Used',
      dataIndex: 'timeSpentSeconds',
      key: 'duration',
      render: (timeSpentSeconds, record) => {
        // Calculate actual time spent in minutes
        let timeUsed = 0;
        if (timeSpentSeconds && timeSpentSeconds > 0) {
          timeUsed = Math.floor(timeSpentSeconds / 60);
        } else if (record.completedAt && record.startedAt) {
          // Fallback: calculate from start/end timestamps
          const startTime = new Date(record.startedAt).getTime();
          const endTime = new Date(record.completedAt).getTime();
          if (!isNaN(startTime) && !isNaN(endTime)) {
            timeUsed = Math.floor((endTime - startTime) / 60000); // milliseconds to minutes
          }
        }
        
        // If no time found, show "Not started" or "N/A"
        const displayText = timeUsed > 0 ? `${timeUsed} min` : (record.status === 'not_started' ? 'Not started' : 'N/A');
        
        return (
          <Space>
            <ClockCircleOutlined />
            <Text>{displayText}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (createdAt) => {
        let dateStr = 'N/A';
        if (createdAt) {
          try {
            const date = new Date(createdAt);
            dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          } catch (e) {
            dateStr = 'N/A';
          }
        }
        return (
          <Space>
            <CalendarOutlined />
            <Text>{dateStr}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        const completionPercentage = record.completionPercentage || 0;
        const isCompleted = status === 'completed';
        const isInProgress = status === 'in_progress';
        
        return (
          <div>
            <Tag color={isCompleted ? 'green' : isInProgress ? 'blue' : 'orange'}>
              {isCompleted ? <CheckCircleOutlined /> : isInProgress ? <ClockCircleOutlined /> : <PlayCircleOutlined />}
              {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Not Started'}
            </Tag>
            {!isCompleted && (
              <div style={{ marginTop: '4px' }}>
                <Progress 
                  percent={completionPercentage} 
                  size="small" 
                  showInfo={false}
                  strokeColor="#1890ff"
                />
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {completionPercentage}% complete
                </Text>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => {
        const isCompleted = record.status === 'completed';
        const isResumable = record.status === 'in_progress' || record.status === 'not_started';
        
        return (
          <Space>
            {isResumable && (
              <Button 
                type="primary" 
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleResumeExam(record.sessionId)}
                loading={resumeExamMutation.isPending}
              >
                {record.status === 'in_progress' ? 'Resume' : 'Start'}
              </Button>
            )}
            {isCompleted && (
              <Button 
                type="link" 
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewExam(record.sessionId, record.status)}
              >
                View Results
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  // Calculate exam statistics
  const completedExams = examHistory.filter(e => e.status === 'completed');
  const totalExams = examHistory.length;
  const averageScore = completedExams.length > 0
    ? (completedExams.reduce((sum, e) => {
        const pct = typeof e.percentage === 'string' ? parseFloat(e.percentage) : (e.percentage ?? 0);
        return sum + pct;
      }, 0) / completedExams.length).toFixed(1)
    : '0';
  const bestScore = completedExams.length > 0
    ? Math.max(...completedExams.map(e => {
        const pct = typeof e.percentage === 'string' ? parseFloat(e.percentage) : (e.percentage ?? 0);
        return pct;
      })).toFixed(1)
    : '0';
  const totalTime = Math.floor(examHistory.reduce((sum, e) => sum + (e.timeSpentSeconds || 0), 0) / 60);

  return (
    <AppLayout>
      <div style={{ 
        padding: '24px', 
        width: '1400px', 
        margin: '0 auto',
        backgroundColor: '#F8FAFC',
        minHeight: '100vh'
      }}>
        {/* Page Header */}
        <div style={{ 
          marginBottom: '24px'
        }}>
          <Title level={1} style={{ 
            margin: '0 0 8px 0',
            fontSize: '28px',
            fontWeight: '800',
            color: '#1F2937'
          }}>
            Exams
          </Title>
          <Text style={{ 
            fontSize: '16px', 
            color: '#6B7280',
            fontWeight: '500'
          }}>
            Create custom exams or take quick tests to assess your preparation.
          </Text>
        </div>

        {/* Exam Statistics */}
        <div style={{ 
          marginBottom: '32px'
        }}>
          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <Spin />
            </div>
          ) : (
            <div style={{
              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Decorative circles */}
              <div style={{
                position: 'absolute',
                top: '-30px',
                right: '-30px',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.15)',
                opacity: 0.6
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-20px',
                left: '-20px',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                opacity: 0.5
              }} />
              
              <Row gutter={[16, 16]} style={{ position: 'relative', zIndex: 1 }}>
                <Col xs={12} sm={12} md={6} lg={6} xl={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '8px'
                    }}>
                      <FileTextOutlined style={{ 
                        fontSize: '24px', 
                        color: '#FFFFFF',
                        marginRight: '8px'
                      }} />
                    </div>
                    <Text style={{
                      display: 'block',
                      fontSize: '28px',
                      fontWeight: '800',
                      color: '#FFFFFF',
                      marginBottom: '4px',
                      lineHeight: '1.2'
                    }}>
                      {totalExams}
                    </Text>
                    <Text style={{
                      fontSize: '13px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '600'
                    }}>
                      Total Exams
                    </Text>
                  </div>
                </Col>
                <Col xs={12} sm={12} md={6} lg={6} xl={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '8px'
                    }}>
                      <TrophyOutlined style={{ 
                        fontSize: '24px', 
                        color: '#FFFFFF',
                        marginRight: '8px'
                      }} />
                    </div>
                    <Text style={{
                      display: 'block',
                      fontSize: '28px',
                      fontWeight: '800',
                      color: '#FFFFFF',
                      marginBottom: '4px',
                      lineHeight: '1.2'
                    }}>
                      {averageScore}%
                    </Text>
                    <Text style={{
                      fontSize: '13px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '600'
                    }}>
                      Average Score
                    </Text>
                  </div>
                </Col>
                <Col xs={12} sm={12} md={6} lg={6} xl={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '8px'
                    }}>
                      <TrophyOutlined style={{ 
                        fontSize: '24px', 
                        color: '#FFFFFF',
                        marginRight: '8px'
                      }} />
                    </div>
                    <Text style={{
                      display: 'block',
                      fontSize: '28px',
                      fontWeight: '800',
                      color: '#FFFFFF',
                      marginBottom: '4px',
                      lineHeight: '1.2'
                    }}>
                      {bestScore}%
                    </Text>
                    <Text style={{
                      fontSize: '13px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '600'
                    }}>
                      Best Score
                    </Text>
                  </div>
                </Col>
                <Col xs={12} sm={12} md={6} lg={6} xl={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '8px'
                    }}>
                      <ClockCircleOutlined style={{ 
                        fontSize: '24px', 
                        color: '#FFFFFF',
                        marginRight: '8px'
                      }} />
                    </div>
                    <Text style={{
                      display: 'block',
                      fontSize: '28px',
                      fontWeight: '800',
                      color: '#FFFFFF',
                      marginBottom: '4px',
                      lineHeight: '1.2'
                    }}>
                      {totalTime}
                    </Text>
                    <Text style={{
                      fontSize: '13px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '600'
                    }}>
                      Minutes Spent
                    </Text>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ 
          marginBottom: '32px'
        }}>
          <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card 
              hoverable
              style={{ 
                borderRadius: '20px', 
                textAlign: 'center',
                border: '1px solid #E5E7EB',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <div style={{ fontSize: '48px', color: '#FF7846', marginBottom: '16px' }}>
                <PlayCircleOutlined />
              </div>
              <Title level={4} style={{ margin: '0 0 8px 0', color: '#1F2937', fontWeight: '700' }}>
                Quick Test (20Q)
              </Title>
              <Text style={{ color: '#6B7280', margin: '0 0 16px 0', fontSize: '14px', display: 'block' }}>
                No negative marking
              </Text>
              <Button 
                type="primary" 
                size="large" 
                block
                onClick={() => handleQuickExam(20, false)}
                loading={createExamMutation.isPending}
                style={{
                  borderRadius: '12px',
                  height: '44px',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #FF7846 0%, #FF5722 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
                }}
              >
                Start Now
              </Button>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card 
              hoverable
              style={{ 
                borderRadius: '20px', 
                textAlign: 'center',
                border: '1px solid #E5E7EB',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <div style={{ fontSize: '48px', color: '#FF7846', marginBottom: '16px' }}>
                <PlayCircleOutlined />
              </div>
              <Title level={4} style={{ margin: '0 0 8px 0', color: '#1F2937', fontWeight: '700' }}>
                Quick Test (50Q)
              </Title>
              <Text style={{ color: '#6B7280', margin: '0 0 16px 0', fontSize: '14px', display: 'block' }}>
                No negative marking
              </Text>
              <Button 
                type="primary" 
                size="large" 
                block
                onClick={() => handleQuickExam(50, false)}
                loading={createExamMutation.isPending}
                style={{
                  borderRadius: '12px',
                  height: '44px',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #FF7846 0%, #FF5722 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
                }}
              >
                Start Now
              </Button>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card 
              hoverable
              style={{ 
                borderRadius: '20px', 
                textAlign: 'center',
                border: '1px solid #E5E7EB',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <div style={{ fontSize: '48px', color: '#EF4444', marginBottom: '16px' }}>
                <PlayCircleOutlined />
              </div>
              <Title level={4} style={{ margin: '0 0 8px 0', color: '#1F2937', fontWeight: '700' }}>
                Challenge Test (20Q)
              </Title>
              <Text style={{ color: '#6B7280', margin: '0 0 16px 0', fontSize: '14px', display: 'block' }}>
                With -25% negative marking
              </Text>
              <Button 
                danger
                type="primary" 
                size="large" 
                block
                onClick={() => handleQuickExam(20, true)}
                loading={createExamMutation.isPending}
                style={{
                  borderRadius: '12px',
                  height: '44px',
                  fontWeight: '600'
                }}
              >
                Start Challenge
              </Button>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card 
              hoverable
              style={{ 
                borderRadius: '20px', 
                textAlign: 'center',
                border: '1px solid #E5E7EB',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <div style={{ fontSize: '48px', color: '#7C3AED', marginBottom: '16px' }}>
                <PlusOutlined />
              </div>
              <Title level={4} style={{ margin: '0 0 8px 0', color: '#1F2937', fontWeight: '700' }}>
                Custom Exam
              </Title>
              <Text style={{ color: '#6B7280', margin: '0 0 16px 0', fontSize: '14px', display: 'block' }}>
                Configure your own
              </Text>
              <Button 
                size="large" 
                block
                onClick={handleCreateExam}
                style={{
                  borderRadius: '12px',
                  height: '44px',
                  fontWeight: '600',
                  border: '1px solid #E5E7EB'
                }}
              >
                Create
              </Button>
            </Card>
          </Col>
        </Row>
        </div>

        {/* Exam History */}
        <div style={{ 
          marginBottom: '32px'
        }}>
          <Title level={2} style={{ 
            margin: '0 0 16px 0',
            fontSize: '22px',
            fontWeight: '700',
            color: '#1F2937'
          }}>
            Recent Exams
          </Title>
          <Card style={{ 
            borderRadius: '20px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
          }}>
          <Table 
            columns={columns} 
            dataSource={examHistory} 
            pagination={false}
            rowKey="sessionId"
          />
          </Card>
        </div>

        {/* Performance Timeline */}
        <div>
          <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Recent Performance" style={{ borderRadius: '12px' }}>
              <Timeline>
                {examHistory.slice(0, 5).map((exam) => {
                  const percentage = typeof exam.percentage === 'string' ? parseFloat(exam.percentage) : (exam.percentage ?? 0);
                  const dateStr = exam.completedAt || exam.createdAt 
                    ? new Date(exam.completedAt || exam.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'N/A';
                  const color = percentage >= 80 ? 'green' : percentage >= 60 ? 'orange' : 'red';
                  
                  return (
                    <Timeline.Item key={exam.sessionId} color={color}>
                      <Text strong>{exam.examName || 'Untitled Exam'} - {percentage.toFixed(1)}%</Text>
                      <br />
                      <Text type="secondary">{dateStr}</Text>
                    </Timeline.Item>
                  );
                })}
                {examHistory.length === 0 && (
                  <Timeline.Item color="gray">
                    <Text type="secondary">No exams yet</Text>
                  </Timeline.Item>
                )}
              </Timeline>
            </Card>
          </Col>
          
          <Col xs={24} lg={12}>
            <Card title="Exam Statistics" style={{ borderRadius: '12px' }}>
              <List
                dataSource={[
                  { 
                    label: 'Total Exams', 
                    value: examHistory.length, 
                    color: '#FF7846',
                    icon: <FileTextOutlined />
                  },
                  { 
                    label: 'Completed Exams', 
                    value: examHistory.filter(e => e.status === 'completed').length,
                    color: '#52c41a',
                    icon: <CheckCircleOutlined />
                  },
                  { 
                    label: 'In Progress', 
                    value: examHistory.filter(e => e.status === 'in_progress').length,
                    color: '#fa8c16',
                    icon: <ClockCircleOutlined />
                  },
                  { 
                    label: 'Not Started', 
                    value: examHistory.filter(e => e.status === 'not_started').length,
                    color: '#1890ff',
                    icon: <PlayCircleOutlined />
                  },
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <div style={{ width: '100%' }}>
                      <Row justify="space-between" style={{ marginBottom: '8px' }}>
                        <Col>
                          <Space>
                            {item.icon}
                            <Text>{item.label}</Text>
                          </Space>
                        </Col>
                        <Col>
                          <Text strong style={{ color: item.color }}>{item.value}</Text>
                        </Col>
                      </Row>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          </Row>
        </div>
      </div>

      {/* Exam Results Modal */}
      <Modal
        title="Exam Results"
        open={showResultsModal}
        onCancel={() => setShowResultsModal(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setShowResultsModal(false)}>
            Close
          </Button>
        ]}
        width={800}
        centered
      >
        {selectedExamResults && (
          <div>
            <Result
              status={selectedExamResults.percentage >= 60 ? "success" : "warning"}
              title={`${selectedExamResults.examName || selectedExamResults.name} - Completed!`}
              subTitle={`You scored ${selectedExamResults.percentage}% (${selectedExamResults.marksObtained}/${selectedExamResults.totalMarks} marks)`}
            />
            
            <Divider />
            
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="Questions Attempted"
                    value={selectedExamResults.questionsAttempted || 0}
                    suffix={`/ ${(selectedExamResults.questionsAttempted || 0) + (selectedExamResults.skippedQuestions || 0)}`}
                    prefix={<QuestionCircleOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="Correct Answers"
                    value={selectedExamResults.correctAnswers || 0}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="Incorrect Answers"
                    value={selectedExamResults.incorrectAnswers || 0}
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
                    value={selectedExamResults.skippedQuestions || 0}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="Time Spent"
                    value={Math.floor((selectedExamResults.timeSpentSeconds || 0) / 60)}
                    suffix={`min ${(selectedExamResults.timeSpentSeconds || 0) % 60}s`}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="Total Duration"
                    value={selectedExamResults.durationMinutes || selectedExamResults.duration || 0}
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
                percent={selectedExamResults.percentage || 0}
                strokeColor={(selectedExamResults.percentage || 0) >= 80 ? '#52c41a' : (selectedExamResults.percentage || 0) >= 60 ? '#faad14' : '#ff4d4f'}
                size={120}
                format={(percent) => `${percent}%`}
              />
              <div style={{ marginTop: '16px' }}>
                <Text strong style={{ fontSize: '18px' }}>
                  {(selectedExamResults.percentage || 0) >= 80 ? 'Excellent!' : 
                   (selectedExamResults.percentage || 0) >= 60 ? 'Good Job!' : 
                   'Keep Practicing!'}
                </Text>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}