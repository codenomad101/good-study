import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Row, 
  Col, 
  Button, 
  Typography, 
  Space,
  Tag,
  Spin,
  Card,
  List,
  Avatar,
  Statistic
} from 'antd';
import {
  ArrowRightOutlined,
  BookOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  BulbOutlined,
  DollarOutlined,
  HistoryOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  ExperimentOutlined,
  CalendarOutlined,
  PlayCircleOutlined,
  SafetyOutlined,
  BankOutlined,
  TeamOutlined,
  AuditOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { useCategories, useTopics } from '../hooks/useCategories';
import { useUserStatistics, useUserRank } from '../hooks/useStatistics';
import { useDataServicePracticeHistory, useSampleQuestions } from '../hooks/useQuestions';
import { useExamHistory } from '../hooks/useExams';
import { PerformanceInsightsCard } from '../components/PerformanceInsightsCard';
import { SessionCard } from '../components/SessionCard';

const { Title, Text } = Typography;

// Category Card Component with Topics
const CategoryCard: React.FC<{ category: any }> = ({ category }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const { data: topicsData, isLoading: topicsLoading } = useTopics(category.slug);
  const IconComponent = getCategoryIcon(category.slug);
  const colors = { bg: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', icon: '#2563EB', hover: '#1E40AF' };
  
  // Extract topics from API response (could be { success: true, data: [...] } or just array)
  const topics = (topicsData as any)?.data || (Array.isArray(topicsData) ? topicsData : []);
  
  // Get first 3-4 topics
  const displayTopics = Array.isArray(topics) ? topics.slice(0, 3) : [];
  
  return (
    <Col xs={12} sm={12} md={6} lg={6} xl={6}>
      <Link to={`/category/${category.slug}`} style={{ textDecoration: 'none' }}>
        <div 
          style={{
            borderRadius: '20px',
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: '420px',
            boxShadow: isHovered ? '0 12px 24px rgba(0, 0, 0, 0.12)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
            transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
            position: 'relative'
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Header Section */}
          <div style={{
            background: colors.bg,
            padding: '20px 20px 16px 20px',
            borderBottom: '1px solid #E5E7EB',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative background element */}
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.4)',
              opacity: 0.6
            }} />
            <Text 
              style={{ 
                fontSize: '18px',
                fontWeight: '700',
                color: '#1F2937',
                lineHeight: '1.2',
                position: 'relative',
                zIndex: 1
              }}
            >
              {category.name}
            </Text>
          </div>
          
          {/* Center Section - Topics with Images */}
          <div style={{ 
            flex: 1,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {topicsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                <Spin size="small" />
              </div>
            ) : displayTopics.length > 0 ? (
              displayTopics.map((topic: any, index: number) => (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '12px',
                    background: '#F9FAFB',
                    transition: 'all 0.2s ease',
                    transform: isHovered ? 'translateX(4px)' : 'translateX(0)'
                  }}
                >
                  {/* Topic Image/Icon */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    background: colors.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: `2px solid ${colors.icon}20`
                  }}>
                    <IconComponent style={{ 
                      fontSize: '24px', 
                      color: colors.icon
                    }} />
                  </div>
                  {/* Topic Name */}
                  <Text 
                    style={{ 
                      fontSize: '13px',
                      color: '#1F2937',
                      fontWeight: '600',
                      lineHeight: '1.4',
                      flex: 1
                    }}
                  >
                    {topic.name || topic}
                  </Text>
                </div>
              ))
            ) : (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                flex: 1,
                flexDirection: 'column',
                gap: '8px'
              }}>
                <IconComponent style={{ fontSize: '48px', color: '#D1D5DB' }} />
                <Text style={{ 
                  fontSize: '13px',
                  color: '#9CA3AF',
                  fontStyle: 'italic'
                }}>
                  Topics coming soon...
                </Text>
              </div>
            )}
          </div>
          
          {/* Click to Know More Button */}
          <div style={{
            padding: '16px 20px 20px 20px',
            borderTop: '1px solid #E5E7EB',
            background: '#FAFBFC'
          }}>
            <div
              style={{
                width: '100%',
                padding: '10px 18px',
                borderRadius: '10px',
                background: isHovered ? colors.hover : colors.icon,
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: '700',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isHovered 
                  ? '0 4px 12px rgba(37, 99, 235, 0.4)' 
                  : '0 2px 4px rgba(37, 99, 235, 0.2)'
              }}
            >
                <span style={{ fontSize: '13px' }}>Click to know more</span>
                <ArrowRightOutlined style={{
                  fontSize: '13px',
                  transition: 'transform 0.3s ease',
                  transform: isHovered ? 'translateX(4px)' : 'translateX(0)'
                }} />
            </div>
          </div>
        </div>
      </Link>
    </Col>
  );
};

// Icon mapping for categories
const getCategoryIcon = (slug: string) => {
  const iconMap: Record<string, any> = {
    'economy': DollarOutlined,
    'history': HistoryOutlined,
    'geography': EnvironmentOutlined,
    'english': FileTextOutlined,
    'aptitude': CalculatorOutlined,
    'science': ExperimentOutlined,
    'agriculture': GlobalOutlined,
    'polity': BookOutlined,
    'current-affairs': FileTextOutlined,
    'gk': GlobalOutlined,
  };
  return iconMap[slug] || BookOutlined;
};

export default function Home() {
  const { user } = useAuth();
  
  // Use custom hooks for data fetching
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: practiceHistory = [], isLoading: historyLoading } = useDataServicePracticeHistory();
  const { data: userStats, isLoading: statsLoading } = useUserStatistics();
  const { data: userRank } = useUserRank();
  const { data: examHistory = [] } = useExamHistory();
  
  // Get sample questions from first category
  const firstCategory = (categories as any[])[0];
  const { data: sampleSession, isLoading: sampleLoading } = useSampleQuestions(firstCategory?.id || '');
  
  const recentQuestions = (sampleSession as any)?.questions?.slice(0, 5) || [];
  
  const loading = categoriesLoading || historyLoading || statsLoading;

  // Removed old generateSuggestions - now using PerformanceInsights component

  const stats = userStats ? [
    { label: 'Questions Solved', value: userStats.totalQuestionsAttempted || '0', color: '#3b82f6' },
    { label: 'Accuracy', value: `${Math.round(parseFloat(userStats.overallAccuracy || '0'))}%`, color: '#10b981' },
    { label: 'Time Spent', value: `${userStats.totalTimeSpentMinutes || '0'}min`, color: '#f59e0b' },
    { label: 'Current Streak', value: `${userStats.currentStreak || '0'} days`, color: '#8b5cf6' },
  ] : [
    { label: 'Questions Solved', value: '0', color: '#3b82f6' },
    { label: 'Accuracy', value: '0%', color: '#10b981' },
    { label: 'Time Spent', value: '0min', color: '#f59e0b' },
    { label: 'Current Streak', value: '0 days', color: '#8b5cf6' },
  ];

  // Combine practice and exam sessions, sort by date
  const allSessions = [
    ...((practiceHistory as any[]) || []).map((session: any) => ({
      ...session,
      type: 'practice',
      completedAt: session.completedAt || session.createdAt,
      category: session.category || 'Unknown',
      accuracy: session.accuracy || session.percentage || 0,
      durationMinutes: session.durationMinutes || Math.round((session.timeSpentSeconds || 0) / 60),
      questionsAttempted: session.questionsAttempted || session.totalQuestions || 0,
      correctAnswers: session.correctAnswers || 0,
      totalQuestions: session.totalQuestions || 0
    })),
    ...((examHistory as any[]) || []).map((session: any) => ({
      ...session,
      type: 'exam',
      completedAt: session.completedAt || session.createdAt,
      category: session.category || session.examName || 'Unknown',
      accuracy: session.accuracy || session.percentage || 0,
      durationMinutes: session.durationMinutes || Math.round((session.timeSpentSeconds || 0) / 60),
      questionsAttempted: session.questionsAttempted || session.totalQuestions || 0,
      correctAnswers: session.correctAnswers || 0,
      totalQuestions: session.totalQuestions || 0
    }))
  ]
    .filter((session: any) => session.completedAt) // Only completed sessions
    .sort((a: any, b: any) => {
      const dateA = new Date(a.completedAt).getTime();
      const dateB = new Date(b.completedAt).getTime();
      return dateB - dateA;
    })
    .slice(0, 5) // Get 5 most recent
    .map((session: any, index: number) => ({
      ...session,
      rank: index + 1,
      score: Math.round(parseFloat(session.accuracy || '0')),
      date: new Date(session.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: `${session.durationMinutes || 0} min`
    }));

  // Get category colors for sessions
  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, { bg: string; icon: string }> = {
      'economy': { bg: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', icon: '#2563EB' },
      'history': { bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', icon: '#F59E0B' },
      'geography': { bg: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)', icon: '#10B981' },
      'english': { bg: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)', icon: '#7C3AED' },
      'aptitude': { bg: 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)', icon: '#EC4899' },
      'science': { bg: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)', icon: '#6366F1' },
      'agriculture': { bg: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', icon: '#059669' },
      'polity': { bg: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)', icon: '#EF4444' },
      'current-affairs': { bg: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)', icon: '#F97316' },
      'gk': { bg: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)', icon: '#0EA5E9' },
    };
    const normalizedCategory = category.toLowerCase().replace(/\s+/g, '-');
    return colorMap[normalizedCategory] || { bg: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)', icon: '#6B7280' };
  };


  return (
    <AppLayout>
      <div style={{ 
        padding: '24px 16px', 
        maxWidth: '1400px', 
        margin: '0 auto',
        backgroundColor: '#F8FAFC',
        minHeight: '100vh'
      }}>
        {/* Combined Welcome & Stats Card */}
        <div style={{
          backgroundColor: '#EA580C',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '16px',
          marginLeft: '16px',
          marginRight: '16px',
          boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)'
        }}>
          {/* Top Row: Welcome + Leaderboard & Schedule */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {/* Welcome Message */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              <Text style={{ 
                fontSize: '26px', 
                fontWeight: '700', 
                color: '#FFFFFF',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }}>
              Welcome back, {user?.fullName?.split(' ')[0]}! 👋
              </Text>
              {userRank && typeof userRank === 'object' && userRank.rank ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <TrophyOutlined style={{ fontSize: '14px', color: '#FCD34D' }} />
                  Rank #{userRank.rank}
                </div>
              ) : userRank && typeof userRank === 'number' ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <TrophyOutlined style={{ fontSize: '14px', color: '#FCD34D' }} />
                  Rank #{userRank}
                </div>
              ) : null}
            </div>
            
            {/* Leaderboard, Community, Notes & Schedule Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              <Link to="/leaderboard" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  padding: '12px 18px',
                  minHeight: '44px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}>
                  <TrophyOutlined style={{ fontSize: '16px', color: '#FCD34D' }} />
                  <Text style={{ 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    color: '#FFFFFF' 
                  }}>
                    Leaderboard
                  </Text>
                </div>
              </Link>
              <Link to="/community" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  padding: '12px 18px',
                  minHeight: '44px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}>
                  <TeamOutlined style={{ fontSize: '16px', color: '#FFFFFF' }} />
                  <Text style={{ 
                    fontSize: '13px', 
                    fontWeight: '600',
                    color: '#FFFFFF' 
                  }}>
                    Community
                  </Text>
                </div>
              </Link>
              <Link to="/notes" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  padding: '12px 18px',
                  minHeight: '44px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}>
                  <FileTextOutlined style={{ fontSize: '16px', color: '#FFFFFF' }} />
                  <Text style={{ 
                    fontSize: '13px', 
                    fontWeight: '600',
                    color: '#FFFFFF' 
                  }}>
                    Notes
                  </Text>
                </div>
              </Link>
              <Link to="/schedule" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  padding: '12px 18px',
                  minHeight: '44px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}>
                  <CalendarOutlined style={{ fontSize: '16px', color: '#FFFFFF' }} />
                  <Text style={{ 
                    fontSize: '13px', 
                    fontWeight: '600',
                    color: '#FFFFFF' 
                  }}>
                    Schedule
                  </Text>
                </div>
              </Link>
            </div>
            </div>

          {/* Stats Row - All in One Line */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            borderTop: '1px solid rgba(254, 215, 170, 0.3)',
            paddingTop: '16px',
            flexWrap: 'wrap'
          }}>
            {/* Questions */}
            <div style={{ flex: 1, minWidth: '100px', textAlign: 'center' }}>
              <Text style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: '#FFFFFF',
                display: 'block',
                marginBottom: '4px'
              }}>
                {userStats?.totalQuestionsAttempted || 0}
              </Text>
              <Text style={{ 
                fontSize: '12px', 
                color: '#FED7AA', 
                fontWeight: '500' 
              }}>
                Questions
              </Text>
            </div>
                  <div style={{
              width: '1px', 
              height: '40px', 
              backgroundColor: '#FED7AA',
              opacity: 0.5
            }} />
            
            {/* Accuracy */}
            <div style={{ flex: 1, minWidth: '100px', textAlign: 'center' }}>
              <Text style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: '#FFFFFF',
                display: 'block',
                marginBottom: '4px'
              }}>
                {Math.round(parseFloat(userStats?.overallAccuracy || '0'))}%
              </Text>
              <Text style={{ 
                fontSize: '12px', 
                color: '#FED7AA', 
                fontWeight: '500' 
              }}>
                Accuracy
              </Text>
            </div>
            <div style={{ 
              width: '1px', 
              height: '40px', 
              backgroundColor: '#FED7AA',
              opacity: 0.5
            }} />
            
            {/* Streak */}
            <div style={{ flex: 1, minWidth: '100px', textAlign: 'center' }}>
                    <Text style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: '#FFFFFF',
                      display: 'block',
                      marginBottom: '4px'
                    }}>
                {userStats?.currentStreak || 0} 🔥
              </Text>
              <Text style={{ 
                fontSize: '12px', 
                color: '#FED7AA', 
                fontWeight: '500' 
              }}>
                Day Streak
                    </Text>
            </div>
                    <div style={{ 
              width: '1px', 
              height: '40px', 
              backgroundColor: '#FED7AA',
              opacity: 0.5
            }} />
            
            {/* Minutes */}
            <div style={{ flex: 1, minWidth: '100px', textAlign: 'center' }}>
              <Text style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: '#FFFFFF',
                display: 'block',
                marginBottom: '4px'
              }}>
                {userStats?.totalTimeSpentMinutes || 0}
              </Text>
              <Text style={{ 
                fontSize: '12px', 
                color: '#FED7AA', 
                fontWeight: '500' 
              }}>
                Minutes
              </Text>
            </div>
                    </div>
                  </div>

        {/* Leaderboard & AI Insights Section */}
        <div style={{ 
          marginBottom: '24px', 
          paddingLeft: '16px', 
          paddingRight: '16px' 
        }}>
          <Row gutter={[16, 16]}>
            {/* Leaderboard Section - Left Half */}
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Card
                style={{
                  borderRadius: '16px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  height: '100%'
                }}
                bodyStyle={{ padding: '24px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <TrophyOutlined style={{ fontSize: '24px', color: '#F59E0B' }} />
                  <Title level={4} style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1F2937' }}>
                    Leaderboard
                  </Title>
                </div>
                
                {userRank && (typeof userRank === 'object' ? userRank.rank : userRank) ? (
                  <div>
                    <div style={{
                      background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                      borderRadius: '12px',
                      padding: '20px',
                      textAlign: 'center',
                      marginBottom: '16px'
                    }}>
                      <Text style={{ 
                        fontSize: '14px', 
                        color: '#92400E', 
                        fontWeight: '600',
                        display: 'block',
                        marginBottom: '8px'
                      }}>
                        Your Current Rank
                      </Text>
                      <Text style={{ 
                        fontSize: '36px', 
                        fontWeight: '800', 
                        color: '#92400E',
                        display: 'block'
                      }}>
                        #{typeof userRank === 'object' ? userRank.rank : userRank}
                      </Text>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: '14px', color: '#6B7280', fontWeight: '500' }}>
                          Total Questions
                        </Text>
                        <Text style={{ fontSize: '16px', fontWeight: '700', color: '#1F2937' }}>
                          {userStats?.totalQuestionsAttempted || 0}
                        </Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: '14px', color: '#6B7280', fontWeight: '500' }}>
                          Overall Accuracy
                        </Text>
                        <Text style={{ fontSize: '16px', fontWeight: '700', color: '#1F2937' }}>
                          {Math.round(parseFloat(userStats?.overallAccuracy || '0'))}%
                        </Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: '14px', color: '#6B7280', fontWeight: '500' }}>
                          Current Streak
                        </Text>
                        <Text style={{ fontSize: '16px', fontWeight: '700', color: '#1F2937' }}>
                          {userStats?.currentStreak || 0} 🔥
                        </Text>
                      </div>
                    </div>
                    
                    <Link to="/leaderboard" style={{ textDecoration: 'none', display: 'block', marginTop: '16px' }}>
                      <div style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        background: '#2563EB',
                        color: '#FFFFFF',
                        textAlign: 'center',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#1E40AF';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#2563EB';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}>
                        View Full Leaderboard
                        <ArrowRightOutlined style={{ marginLeft: '6px', fontSize: '12px' }} />
                      </div>
                    </Link>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Text style={{ fontSize: '14px', color: '#6B7280' }}>
                      Start practicing to see your rank!
                    </Text>
                  </div>
                )}
              </Card>
            </Col>

            {/* AI Insights Section - Right Half */}
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Card
                style={{
                  borderRadius: '16px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  height: '100%',
                  background: '#FFF7ED'
                }}
                bodyStyle={{ padding: '24px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <BulbOutlined style={{ fontSize: '24px', color: '#F59E0B' }} />
                  <Title level={4} style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1F2937' }}>
                    AI Insights
                  </Title>
                </div>
                
                {(() => {
                  // Get weak areas using same logic as PerformanceInsightsCard
                  const getQuickInsights = (): { category: string; score: number; count: number; color: string }[] => {
                    const performance: Record<string, { scores: number[], count: number }> = {};
                    
                    // Process exam history
                    (examHistory as any[]).forEach((exam: any) => {
                      const percentage = typeof exam.percentage === 'string' 
                        ? parseFloat(exam.percentage) 
                        : (exam.percentage ?? 0);
                      
                      const examName = exam.examName || exam.name || '';
                      const category = extractCategory(examName);
                      
                      if (!performance[category]) {
                        performance[category] = { scores: [], count: 0 };
                      }
                      performance[category].scores.push(percentage);
                      performance[category].count++;
                    });
                    
                    // Process practice history
                    (practiceHistory as any[]).forEach((session: any) => {
                      const accuracy = session.accuracy || 0;
                      const category = session.category || 'General';
                      
                      if (!performance[category]) {
                        performance[category] = { scores: [], count: 0 };
                      }
                      performance[category].scores.push(accuracy);
                      performance[category].count++;
                    });
                    
                    // Get weak areas
                    const weakAreas: { category: string; score: number; count: number; color: string }[] = [];
                    
                    Object.entries(performance).forEach(([category, data]) => {
                      const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
                      
                      if (avgScore > 0 && avgScore < 60 && data.count >= 2) {
                        if ((category === 'Current Affairs' || category === 'General') && avgScore < 30) {
                          return;
                        }
                        
                        weakAreas.push({
                          category,
                          score: Math.round(avgScore),
                          count: data.count,
                          color: getCategoryColor(category)
                        });
                      }
                    });
                    
                    return weakAreas.sort((a, b) => a.score - b.score).slice(0, 4);
                  };
                  
                  const extractCategory = (examName: string): string => {
                    const name = examName.toLowerCase();
                    if (name.includes('english') || name.includes('grammar')) return 'English';
                    if (name.includes('history')) return 'History';
                    if (name.includes('economy') || name.includes('economic')) return 'Economy';
                    if (name.includes('geography') || name.includes('geo')) return 'Geography';
                    if (name.includes('polity') || name.includes('political')) return 'Polity';
                    if (name.includes('science')) return 'Science';
                    if (name.includes('current affairs') || name.includes('gk')) return 'Current Affairs';
                    if (name.includes('aptitude') || name.includes('math')) return 'Aptitude';
                    if (name.includes('agriculture')) return 'Agriculture';
                    return 'General';
                  };
                  
                  const getCategoryColor = (category: string): string => {
                    const colorMap: Record<string, string> = {
                      'English': '#3b82f6',
                      'History': '#ef4444',
                      'Economy': '#10b981',
                      'Geography': '#8b5cf6',
                      'Polity': '#f59e0b',
                      'Science': '#ec4899',
                      'Current Affairs': '#06b6d4',
                      'Aptitude': '#6366f1',
                      'Agriculture': '#84cc16',
                      'General': '#6b7280'
                    };
                    return colorMap[category] || '#6b7280';
                  };
                  
                  const weakAreas = getQuickInsights();
                  
                  // Get default topics when no weak areas are found
                  const getDefaultTopics = (): { category: string; color: string }[] => {
                    const defaultTopicsByCategory: Record<string, string[]> = {
                      'English': ['Grammar Fundamentals', 'Reading Comprehension', 'Vocabulary Building'],
                      'History': ['Ancient History', 'Medieval History', 'Modern History'],
                      'Economy': ['Basic Economics', 'Indian Economy', 'Economic Policies'],
                      'Geography': ['Physical Geography', 'Indian Geography', 'World Geography'],
                      'Polity': ['Constitution', 'Fundamental Rights', 'Governance'],
                      'Science': ['Physics Basics', 'Chemistry Fundamentals', 'Biology Concepts'],
                      'Current Affairs': ['National News', 'International Affairs', 'Government Schemes'],
                      'Aptitude': ['Quantitative Aptitude', 'Logical Reasoning', 'Data Interpretation'],
                      'Agriculture': ['Crop Production', 'Agricultural Policies', 'Rural Development'],
                      'General': ['General Knowledge', 'Current Events', 'Important Dates']
                    };
                    
                    // Get day of year (1-365/366) to rotate topics daily
                    const now = new Date();
                    const start = new Date(now.getFullYear(), 0, 0);
                    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                    
                    // Select categories based on day of year
                    const allCategories = Object.keys(defaultTopicsByCategory);
                    const selectedCategories: string[] = [];
                    
                    // Rotate through categories based on day
                    for (let i = 0; i < 4; i++) {
                      const categoryIndex = (dayOfYear + i) % allCategories.length;
                      selectedCategories.push(allCategories[categoryIndex]);
                    }
                    
                    // Get topics from selected categories
                    const defaultTopics: { category: string; color: string }[] = [];
                    selectedCategories.forEach((category, index) => {
                      const topics = defaultTopicsByCategory[category];
                      // Rotate through topics within category based on day
                      const topicIndex = Math.floor((dayOfYear + index) / allCategories.length) % topics.length;
                      defaultTopics.push({
                        category: topics[topicIndex],
                        color: getCategoryColor(category)
                      });
                    });
                    
                    return defaultTopics;
                  };
                  
                  const defaultTopics = getDefaultTopics();
                  
                  return weakAreas.length > 0 ? (
                    <div>
                      <Text style={{ 
                        fontSize: '13px', 
                        color: '#92400E', 
                        fontWeight: '500',
                        display: 'block',
                        marginBottom: '16px'
                      }}>
                        Topics that need your attention:
                      </Text>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {weakAreas.map((area, index) => (
                          <div 
                            key={index}
                            style={{
                              padding: '12px',
                              borderRadius: '10px',
                              background: '#FFFFFF',
                              border: `1px solid ${area.color}30`,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                              <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: area.color
                              }} />
                              <Text style={{ fontSize: '14px', fontWeight: '600', color: '#1F2937' }}>
                                {area.category}
                              </Text>
                            </div>
                            <Text style={{ 
                              fontSize: '14px', 
                              fontWeight: '700', 
                              color: area.color 
                            }}>
                              {area.score}%
                            </Text>
                          </div>
                        ))}
                      </div>
                      
                      <Link to="/performance-insights" style={{ textDecoration: 'none', display: 'block', marginTop: '16px' }}>
                        <div style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '8px',
                          background: '#F59E0B',
                          color: '#FFFFFF',
                          textAlign: 'center',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#D97706';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#F59E0B';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}>
                          View All Insights
                          <ArrowRightOutlined style={{ marginLeft: '6px', fontSize: '12px' }} />
                        </div>
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <Text style={{ 
                        fontSize: '13px', 
                        color: '#92400E', 
                        fontWeight: '500',
                        display: 'block',
                        marginBottom: '16px'
                      }}>
                        Recommended topics to practice today:
                      </Text>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {defaultTopics.map((topic, index) => (
                          <div 
                            key={index}
                            style={{
                              padding: '12px',
                              borderRadius: '10px',
                              background: '#FFFFFF',
                              border: `1px solid ${topic.color}30`,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}
                          >
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: topic.color
                            }} />
                            <Text style={{ fontSize: '14px', fontWeight: '600', color: '#1F2937', flex: 1 }}>
                              {topic.category}
                            </Text>
                          </div>
                        ))}
                      </div>
                      
                      <Link to="/practice" style={{ textDecoration: 'none', display: 'block', marginTop: '16px' }}>
                        <div style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '8px',
                          background: '#F59E0B',
                          color: '#FFFFFF',
                          textAlign: 'center',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#D97706';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#F59E0B';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}>
                          Start Practicing
                          <ArrowRightOutlined style={{ marginLeft: '6px', fontSize: '12px' }} />
                        </div>
                      </Link>
                    </div>
                  );
                })()}
              </Card>
            </Col>
          </Row>
        </div>

        {/* Practice Categories - Modern Design */}
        <div style={{ marginBottom: '24px', paddingLeft: '16px', paddingRight: '16px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <Title level={2} style={{ 
              margin: 0,
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#1F2937',
              paddingLeft: '0'
          }}>
            Practice Categories
          </Title>
            <Link to="/practice" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '10px',
                background: '#2563EB',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1E40AF';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(37, 99, 235, 0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#2563EB';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(37, 99, 235, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                <span>View All Categories</span>
                <ArrowRightOutlined style={{ fontSize: '13px' }} />
              </div>
            </Link>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px', color: '#6B7280' }}>
                Loading categories...
              </div>
            </div>
          ) : (
            <Row gutter={[16, 16]}>
              {(categories as any[]).slice(0, 4).map((category: any) => {
                return (
                  <CategoryCard key={category.id} category={category} />
                );
              })}
            </Row>
          )}
        </div>

        {/* Recent Questions Section */}
        {recentQuestions.length > 0 && recentQuestions.every((q: any) => q && typeof q === 'object') && (
          <div style={{ marginBottom: '24px', paddingLeft: '16px', paddingRight: '16px' }}>
            <Title level={2} style={{ 
              margin: '0 0 16px 0',
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#1F2937'
            }}>
              Recent Questions
            </Title>
            <Card style={{ 
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <List
                dataSource={recentQuestions}
                renderItem={(question: any, index: number) => (
                  <List.Item style={{ 
                    borderBottom: '1px solid #F3F4F6',
                    padding: '16px 0'
                  }}>
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          style={{ 
                            backgroundColor: '#2563EB',
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        >
                          {index + 1}
                        </Avatar>
                      }
                      title={
                        <Text strong style={{ 
                          fontSize: '16px',
                          color: '#1F2937'
                        }}>
                          {question.questionText || 'Question not available'}
                        </Text>
                      }
                      description={
                        <Space direction="vertical" size="small" style={{ width: '100%', marginTop: '8px' }}>
                          <Space wrap>
                            {question.options?.map((option: any, optIndex: number) => (
                              <Tag key={optIndex} style={{
                                backgroundColor: '#EFF6FF',
                                color: '#2563EB',
                                border: '1px solid #DBEAFE',
                                borderRadius: '6px'
                              }}>
                                {typeof option === 'string' ? option : (option?.text || option)}
                              </Tag>
                            ))}
                          </Space>
                          <Space>
                            <Text style={{ color: '#6B7280', fontSize: '13px' }}>Correct Answer: </Text>
                            <Text strong style={{ color: '#10B981', fontSize: '13px' }}>
                              {question.correctAnswer || 'Not available'}
                            </Text>
                          </Space>
                          <Space>
                            <Tag style={{
                              backgroundColor: '#FFF7ED',
                              color: '#F97316',
                              border: 'none',
                              borderRadius: '6px'
                            }}>
                              {question.category || 'Unknown'}
                            </Tag>
                            <Tag style={{
                              backgroundColor: '#F3E8FF',
                              color: '#7C3AED',
                              border: 'none',
                              borderRadius: '6px'
                            }}>
                              {question.difficulty || 'Unknown'}
                            </Tag>
                          </Space>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </div>
        )}

        {/* Recent Sessions */}
        <div style={{ paddingLeft: '16px', paddingRight: '16px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <Title level={2} style={{ 
              margin: 0,
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#1F2937'
            }}>
              Recent Sessions
            </Title>
            <Link to="/practice" style={{ textDecoration: 'none' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '10px',
                background: '#2563EB',
                color: '#FFFFFF',
                            fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1E40AF';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(37, 99, 235, 0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#2563EB';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(37, 99, 235, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                <span>View All Sessions</span>
                <ArrowRightOutlined style={{ fontSize: '13px' }} />
              </div>
            </Link>
            </div>
          <Row gutter={[16, 16]}>
              {allSessions.length > 0 ? allSessions.slice(0, 4).map((session: any, index: number) => (
                <Col xs={24} sm={12} md={6} lg={6} xl={6} key={session.sessionId || session.examId || index}>
                  <SessionCard session={session} />
                    </Col>
              )) : (
                <Col xs={24}>
                  <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: '#6B7280',
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB'
                  }}>
                    No recent sessions yet. Start practicing!
                  </div>
                    </Col>
              )}
                  </Row>
          </div>
        
      </div>
    </AppLayout>
  );
}