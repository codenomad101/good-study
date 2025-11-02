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
  Divider
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
import { message } from 'antd';

const { Title, Text, Paragraph } = Typography;

export default function Exams() {
  const navigate = useNavigate();
  
  // Use custom hooks
  const { data: categories = [] } = useCategories();
  const { data: examHistoryData = [], isLoading: historyLoading } = useExamHistory();
  const resumeExamMutation = useResumeExam();
  const createExamMutation = useCreateDynamicExam();
  
  const examHistory = examHistoryData || [];
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedExamResults, setSelectedExamResults] = useState<any>(null);

  const handleQuickExam = async (totalQuestions: number = 20, negativeMarking: boolean = false) => {
    if (!categories || categories.length === 0) {
      message.error('No categories available for quick exam');
      return;
    }

    // Create equal distribution across available categories
    const questionsPerCategory = Math.ceil(totalQuestions / categories.length);
    const distribution = categories.map((cat) => ({
      category: cat.id,
      count: questionsPerCategory,
      marksPerQuestion: 2
    }));

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
        navigate(`/exam/${response.data.sessionId}`);
      } else {
        console.error('Failed to create quick exam:', response.message);
        message.error('Failed to create exam. Please try again.');
      }
    } catch (error: any) {
      console.error('Error creating quick exam:', error);
      message.error(error?.response?.data?.message || 'Failed to create quick exam');
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

  return (
    <AppLayout>
      <div style={{ padding: '32px 24px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
        {/* Quick Actions */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={6}>
            <Card 
              hoverable
              style={{ borderRadius: '12px', textAlign: 'center' }}
              bodyStyle={{ padding: '20px' }}
            >
              <div style={{ fontSize: '40px', color: '#FF7846', marginBottom: '12px' }}>
                <PlayCircleOutlined />
              </div>
              <Title level={5} style={{ margin: '0 0 8px 0' }}>
                Quick Test (20Q)
              </Title>
              <Paragraph style={{ color: '#666', margin: '0 0 12px 0', fontSize: '12px' }}>
                No negative marking
              </Paragraph>
              <Button 
                type="primary" 
                size="middle" 
                block
                onClick={() => handleQuickExam(20, false)}
                loading={createExamMutation.isPending}
              >
                Start Now
              </Button>
            </Card>
          </Col>

          <Col xs={24} sm={6}>
            <Card 
              hoverable
              style={{ borderRadius: '12px', textAlign: 'center' }}
              bodyStyle={{ padding: '20px' }}
            >
              <div style={{ fontSize: '40px', color: '#FF7846', marginBottom: '12px' }}>
                <PlayCircleOutlined />
              </div>
              <Title level={5} style={{ margin: '0 0 8px 0' }}>
                Quick Test (50Q)
              </Title>
              <Paragraph style={{ color: '#666', margin: '0 0 12px 0', fontSize: '12px' }}>
                No negative marking
              </Paragraph>
              <Button 
                type="primary" 
                size="middle" 
                block
                onClick={() => handleQuickExam(50, false)}
                loading={createExamMutation.isPending}
              >
                Start Now
              </Button>
            </Card>
          </Col>

          <Col xs={24} sm={6}>
            <Card 
              hoverable
              style={{ borderRadius: '12px', textAlign: 'center' }}
              bodyStyle={{ padding: '20px' }}
            >
              <div style={{ fontSize: '40px', color: '#ff4d4f', marginBottom: '12px' }}>
                <PlayCircleOutlined />
              </div>
              <Title level={5} style={{ margin: '0 0 8px 0' }}>
                Challenge Test (20Q)
              </Title>
              <Paragraph style={{ color: '#666', margin: '0 0 12px 0', fontSize: '12px' }}>
                With -25% negative marking
              </Paragraph>
              <Button 
                danger
                type="primary" 
                size="middle" 
                block
                onClick={() => handleQuickExam(20, true)}
                loading={createExamMutation.isPending}
              >
                Start Challenge
              </Button>
            </Card>
          </Col>

          <Col xs={24} sm={6}>
            <Card 
              hoverable
              style={{ borderRadius: '12px', textAlign: 'center' }}
              bodyStyle={{ padding: '20px' }}
            >
              <div style={{ fontSize: '40px', color: '#722ed1', marginBottom: '12px' }}>
                <PlusOutlined />
              </div>
              <Title level={5} style={{ margin: '0 0 8px 0' }}>
                Custom Exam
              </Title>
              <Paragraph style={{ color: '#666', margin: '0 0 12px 0', fontSize: '12px' }}>
                Configure your own
              </Paragraph>
              <Button 
                size="middle" 
                block
                onClick={handleCreateExam}
              >
                Create
              </Button>
            </Card>
          </Col>
        </Row>

        {/* Divider */}
        <div style={{ margin: '32px 0', borderTop: '1px solid #e5e7eb' }} />

        {/* Performance Summary */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Total Exams"
                value={examHistory.length}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#FF7846' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Average Score"
                value={(() => {
                  const completed = examHistory.filter(e => e.status === 'completed');
                  if (completed.length === 0) return 0;
                  const sum = completed.reduce((acc, e) => {
                    const pct = typeof e.percentage === 'string' ? parseFloat(e.percentage) : (e.percentage ?? 0);
                    return acc + pct;
                  }, 0);
                  return (sum / completed.length).toFixed(1);
                })()}
                suffix="%"
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Total Time"
                value={(() => {
                  const totalSeconds = examHistory.reduce((sum, e) => sum + (e.timeSpentSeconds || 0), 0);
                  return Math.floor(totalSeconds / 60);
                })()}
                suffix="min"
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Best Score"
                value={(() => {
                  const completed = examHistory.filter(e => e.status === 'completed');
                  if (completed.length === 0) return 0;
                  const max = Math.max(...completed.map(e => {
                    const pct = typeof e.percentage === 'string' ? parseFloat(e.percentage) : (e.percentage ?? 0);
                    return pct;
                  }));
                  return max.toFixed(1);
                })()}
                suffix="%"
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Exam History */}
        <Card title="Recent Exams" style={{ borderRadius: '12px' }}>
          <Table 
            columns={columns} 
            dataSource={examHistory} 
            pagination={false}
            rowKey="sessionId"
          />
        </Card>

        {/* Performance Timeline */}
        <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
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