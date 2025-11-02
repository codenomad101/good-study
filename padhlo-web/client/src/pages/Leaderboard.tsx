import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Segmented, 
  Table, 
  Avatar, 
  Tag, 
  Space, 
  Statistic,
  Progress,
  Tooltip,
  Spin,
  Alert,
  Select
} from 'antd';
import {
  TrophyOutlined,
  CrownOutlined,
  MailOutlined,
  StarOutlined,
  FireOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  QuestionCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { AppLayout } from '../components/AppLayout';
import { useLeaderboard, useUserRank, useUserStatistics, useAvailableSubjects } from '../hooks/useStatistics';

const { Title, Text } = Typography;

interface LeaderboardEntry {
  userId: string;
  username: string;
  email: string;
  rankingPoints: number;
  totalPracticeSessions: number;
  totalExamSessions: number;
  totalQuestionsAttempted: number;
  totalCorrectAnswers: number;
  overallAccuracy: string;
  currentStreak: number;
  longestStreak: number;
  rank: number;
}

const LeaderboardPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'alltime'>('alltime');
  const [selectedCategory, setSelectedCategory] = useState<'overall' | 'practice' | 'exam' | 'streak' | 'accuracy'>('overall');
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  // Fetch data
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useLeaderboard(selectedPeriod, selectedCategory, selectedSubject || undefined, 100);
  const { data: userRank } = useUserRank(selectedPeriod);
  const { data: userStats } = useUserStatistics();
  const { data: availableSubjects = [] } = useAvailableSubjects();

  // Get current user's position in leaderboard
  const currentUserRank = userRank?.rank;
  const currentUserEntry = leaderboard.find((entry: LeaderboardEntry) => entry.userId === userStats?.userId);

  // Define ranking categories
  const categories = [
    { value: 'overall', label: 'Overall', icon: <TrophyOutlined /> },
    { value: 'practice', label: 'Practice', icon: <QuestionCircleOutlined /> },
    { value: 'exam', label: 'Exams', icon: <CheckCircleOutlined /> },
    { value: 'streak', label: 'Streak', icon: <FireOutlined /> },
    { value: 'accuracy', label: 'Accuracy', icon: <BarChartOutlined /> },
  ];

  // Define time periods
  const periods = [
    { value: 'daily', label: 'Daily', icon: <CalendarOutlined /> },
    { value: 'weekly', label: 'Weekly', icon: <CalendarOutlined /> },
    { value: 'monthly', label: 'Monthly', icon: <CalendarOutlined /> },
    { value: 'alltime', label: 'All Time', icon: <StarOutlined /> },
  ];

  // Get rank icon based on position
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <CrownOutlined style={{ color: '#ffd700' }} />;
    if (rank === 2) return <MailOutlined style={{ color: '#c0c0c0' }} />;
    if (rank === 3) return <MailOutlined style={{ color: '#cd7f32' }} />;
    return <span style={{ fontWeight: 'bold', color: '#666' }}>#{rank}</span>;
  };

  // Get rank color
  const getRankColor = (rank: number) => {
    if (rank === 1) return '#ffd700';
    if (rank === 2) return '#c0c0c0';
    if (rank === 3) return '#cd7f32';
    if (rank <= 10) return '#1890ff';
    return '#666';
  };

  // Table columns
  const columns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank: number) => (
        <div style={{ textAlign: 'center' }}>
          {getRankIcon(rank)}
        </div>
      ),
    },
    {
      title: 'User',
      key: 'user',
      render: (record: LeaderboardEntry) => (
        <Space>
          <Avatar 
            size={40} 
            style={{ 
              backgroundColor: getRankColor(record.rank),
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            {record.username?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          <div>
            <Text strong style={{ fontSize: '16px' }}>
              {record.username || 'Anonymous'}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Points',
      dataIndex: 'rankingPoints',
      key: 'points',
      width: 100,
      render: (points: number) => (
        <div style={{ textAlign: 'center' }}>
          <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
            {points.toLocaleString()}
          </Text>
        </div>
      ),
    },
    {
      title: 'Questions',
      dataIndex: 'totalQuestionsAttempted',
      key: 'questions',
      width: 100,
      render: (questions: number) => (
        <div style={{ textAlign: 'center' }}>
          <Text strong>{questions.toLocaleString()}</Text>
        </div>
      ),
    },
    {
      title: 'Accuracy',
      dataIndex: 'overallAccuracy',
      key: 'accuracy',
      width: 120,
      render: (accuracy: string) => {
        const acc = parseFloat(accuracy || '0');
        return (
          <div style={{ textAlign: 'center' }}>
            <Progress
              type="circle"
              percent={acc}
              size={50}
              strokeColor={acc >= 80 ? '#52c41a' : acc >= 60 ? '#faad14' : '#ff4d4f'}
              format={() => `${Math.round(acc)}%`}
            />
          </div>
        );
      },
    },
    {
      title: 'Streak',
      dataIndex: 'currentStreak',
      key: 'streak',
      width: 100,
      render: (streak: number) => (
        <div style={{ textAlign: 'center' }}>
          <Tag 
            color={streak >= 7 ? 'red' : streak >= 3 ? 'orange' : 'blue'}
            icon={<FireOutlined />}
          >
            {streak} days
          </Tag>
        </div>
      ),
    },
    {
      title: 'Sessions',
      key: 'sessions',
      width: 120,
      render: (record: LeaderboardEntry) => (
        <div style={{ textAlign: 'center' }}>
          <div>
            <Text type="secondary">Practice: </Text>
            <Text strong>{record.totalPracticeSessions}</Text>
          </div>
          <div>
            <Text type="secondary">Exams: </Text>
            <Text strong>{record.totalExamSessions}</Text>
          </div>
        </div>
      ),
    },
  ];

  // Sort leaderboard based on selected category
  const getSortedLeaderboard = () => {
    // Backend already sorts the data, so we just return it as is
    return leaderboard;
  };

  const sortedLeaderboard = getSortedLeaderboard();

  return (
    <AppLayout>
      <div style={{ padding: '32px 24px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={1} style={{ margin: '0 0 8px 0', fontSize: '36px' }}>
            <TrophyOutlined style={{ marginRight: '12px', color: '#ffd700' }} />
            Leaderboard
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Compete with other learners and track your progress
          </Text>
        </div>

        {/* Current User Stats */}
        {userStats && (
          <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="Your Rank"
                  value={currentUserRank || 'Unranked'}
                  prefix={currentUserRank ? getRankIcon(currentUserRank) : <UserOutlined />}
                  valueStyle={{ color: currentUserRank ? getRankColor(currentUserRank) : '#666' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="Your Points"
                  value={userStats.rankingPoints || 0}
                  prefix={<StarOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="Questions Solved"
                  value={userStats.totalQuestionsAttempted || 0}
                  prefix={<QuestionCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="Current Streak"
                  value={userStats.currentStreak || 0}
                  suffix="days"
                  prefix={<FireOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Filters */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={8}>
            <Card title="Time Period" size="small">
              <Segmented
                options={periods}
                value={selectedPeriod}
                onChange={(value) => setSelectedPeriod(value as any)}
                size="large"
                block
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card title="Category" size="small">
              <Segmented
                options={categories}
                value={selectedCategory}
                onChange={(value) => setSelectedCategory(value as any)}
                size="large"
                block
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card title="Subject" size="small">
              <Select
                placeholder="Select Subject"
                value={selectedSubject || undefined}
                onChange={(value) => setSelectedSubject(value || '')}
                style={{ width: '100%' }}
                size="large"
                allowClear
              >
                <Select.Option value="">All Subjects</Select.Option>
                {availableSubjects.map((subject: any) => (
                  <Select.Option key={subject.categoryId} value={subject.categoryId}>
                    {subject.name} ({subject.language})
                  </Select.Option>
                ))}
              </Select>
            </Card>
          </Col>
        </Row>

        {/* Leaderboard Table */}
        <Card 
          title={
            <Space>
              <TrophyOutlined />
              <span>
                {selectedSubject ? 
                  `${availableSubjects.find((s: any) => s.categoryId === selectedSubject)?.name || 'Subject'} Leaderboard` :
                  `${categories.find(c => c.value === selectedCategory)?.label} Leaderboard`
                }
                {selectedPeriod !== 'alltime' && ` - ${periods.find(p => p.value === selectedPeriod)?.label}`}
              </span>
            </Space>
          }
          extra={
            <Text type="secondary">
              Showing top {sortedLeaderboard.length} users
            </Text>
          }
        >
          {leaderboardLoading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px' }}>
                <Text type="secondary">Loading leaderboard...</Text>
              </div>
            </div>
          ) : sortedLeaderboard.length === 0 ? (
            <Alert
              message="No Data Available"
              description="No users found for the selected period and category."
              type="info"
              showIcon
            />
          ) : (
            <Table
              columns={columns}
              dataSource={sortedLeaderboard}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} users`,
              }}
              rowKey="userId"
              rowClassName={(record: LeaderboardEntry) => 
                record?.userId === userStats?.userId ? 'current-user-row' : ''
              }
              scroll={{ x: 800 }}
            />
          )}
        </Card>

        {/* How Rankings Work */}
        <Card 
          title="How Rankings Work" 
          style={{ marginTop: '24px' }}
          size="small"
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center' }}>
                <TrophyOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
                <div><Text strong>Activity Points</Text></div>
                <Text type="secondary">Practice sessions (10 pts) + Exam sessions (20 pts)</Text>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center' }}>
                <BarChartOutlined style={{ fontSize: '24px', color: '#52c41a', marginBottom: '8px' }} />
                <div><Text strong>Accuracy Bonus</Text></div>
                <Text type="secondary">Overall accuracy × 2 points</Text>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center' }}>
                <FireOutlined style={{ fontSize: '24px', color: '#faad14', marginBottom: '8px' }} />
                <div><Text strong>Streak Bonus</Text></div>
                <Text type="secondary">Current streak × 5 points</Text>
              </div>
            </Col>
          </Row>
        </Card>
      </div>

      <style>{`
        .current-user-row {
          background-color: #f0f9ff !important;
          border-left: 4px solid #1890ff !important;
        }
        .current-user-row:hover {
          background-color: #e6f7ff !important;
        }
      `}</style>
    </AppLayout>
  );
};

export default LeaderboardPage;
