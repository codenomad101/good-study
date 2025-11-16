import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Row, 
  Col, 
  Space,
  Spin
} from 'antd';
import { 
  QuestionCircleOutlined, 
  ClockCircleOutlined,
  DollarOutlined,
  HistoryOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  ExperimentOutlined,
  GlobalOutlined,
  BookOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { AppLayout } from '../components/AppLayout';
import { SessionCard } from '../components/SessionCard';
import { useCategories, useTopics } from '../hooks/useCategories';
import { useDataServicePracticeHistory, useDataServicePracticeStats } from '../hooks/useQuestions';
import { useUserStatistics } from '../hooks/useStatistics';
import { Link } from 'react-router-dom';
import { ArrowRightOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

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

// Get category colors
const getCategoryColors = (slug: string) => {
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
  const normalizedCategory = slug.toLowerCase().replace(/\s+/g, '-');
  return colorMap[normalizedCategory] || { bg: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)', icon: '#6B7280' };
};

// Category Card Component with Topics (same as Home page)
const CategoryCard: React.FC<{ category: any }> = ({ category }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const { data: topicsData, isLoading: topicsLoading } = useTopics(category.slug);
  const IconComponent = getCategoryIcon(category.slug);
  const colors = { bg: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', icon: '#2563EB', hover: '#1E40AF' };
  
  // Extract topics from API response
  const topics = (topicsData as any)?.data || (Array.isArray(topicsData) ? topicsData : []);
  
  // Get first 3 topics
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
                padding: '12px 20px',
                borderRadius: '10px',
                background: isHovered ? colors.hover : colors.icon,
                color: '#FFFFFF',
                fontSize: '14px',
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

const PracticePage: React.FC = () => {
  const navigate = useNavigate();

  // Use custom hooks
  const { data: categories = [], isLoading: loading } = useCategories();
  const { data: practiceHistory = [] } = useDataServicePracticeHistory();
  const { data: userStats, isLoading: statsLoading } = useUserStatistics();
  const { data: practiceStats } = useDataServicePracticeStats();

  const handleViewCategory = (slug: string) => {
    navigate(`/category/${slug}`);
  };

  // Get recent practice sessions
  const recentSessions = ((practiceHistory as any[]) || [])
    .filter((session: any) => session.completedAt)
    .sort((a: any, b: any) => {
      const dateA = new Date(a.completedAt).getTime();
      const dateB = new Date(b.completedAt).getTime();
      return dateB - dateA;
    })
    .slice(0, 5)
    .map((session: any, index: number) => {
      const categoryColors = getCategoryColors(session.category || '');
      const IconComponent = getCategoryIcon(session.category?.toLowerCase().replace(/\s+/g, '-') || '');
      return {
        ...session,
        rank: index + 1,
        score: Math.round(parseFloat(session.accuracy || session.percentage || '0')),
        date: new Date(session.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        time: `${session.durationMinutes || Math.round((session.timeSpentSeconds || 0) / 60)} min`,
        categoryColors,
        IconComponent
      };
    });


  return (
    <AppLayout>
      <div style={{ 
        padding: '24px 16px', 
        maxWidth: '1400px', 
        margin: '0 auto',
        backgroundColor: '#F8FAFC',
        minHeight: '100vh'
      }}>
        {/* Page Header */}
        <div style={{ 
          marginBottom: '24px',
          paddingLeft: '16px',
          paddingRight: '16px'
        }}>
          <Title level={1} style={{ 
            margin: '0 0 8px 0',
            fontSize: '28px',
            fontWeight: '800',
            color: '#1F2937'
          }}>
            Practice Sessions
          </Title>
          <Text style={{ 
            fontSize: '16px', 
            color: '#6B7280',
            fontWeight: '500'
          }}>
            Choose a category to start practicing with 20 random questions and a 15-minute timer.
          </Text>
        </div>

        {/* Practice Statistics */}
        <div style={{ 
          marginBottom: '32px',
          paddingLeft: '16px',
          paddingRight: '16px'
        }}>
          {statsLoading ? (
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
                      <QuestionCircleOutlined style={{ 
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
                      {practiceStats?.totalQuestionsAttempted || userStats?.totalQuestionsAttempted || 0}
                    </Text>
                    <Text style={{
                      fontSize: '13px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '600'
                    }}>
                      Questions Solved
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
                      <CheckCircleOutlined style={{ 
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
                      {practiceStats?.averageAccuracy 
                        ? `${Math.round(practiceStats.averageAccuracy)}%`
                        : userStats?.practiceAccuracy 
                        ? `${Math.round(parseFloat(String(userStats.practiceAccuracy)))}%`
                        : userStats?.overallAccuracy
                        ? `${Math.round(parseFloat(String(userStats.overallAccuracy)))}%`
                        : '0%'}
                    </Text>
                    <Text style={{
                      fontSize: '13px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '600'
                    }}>
                      Accuracy
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
                      {practiceStats?.totalTimeSpentMinutes 
                        ? `${practiceStats.totalTimeSpentMinutes}`
                        : userStats?.totalTimeSpentMinutes 
                        ? `${userStats.totalTimeSpentMinutes}`
                        : '0'}
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
                <Col xs={12} sm={12} md={6} lg={6} xl={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '8px'
                    }}>
                      <ThunderboltOutlined style={{ 
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
                      {practiceStats?.totalSessions || practiceStats?.completedSessions || userStats?.totalPracticeSessions || 0}
                    </Text>
                    <Text style={{
                      fontSize: '13px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '600'
                    }}>
                      Sessions
                    </Text>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </div>

        {/* Practice Categories - Matching Homepage Design */}
        <div style={{ marginBottom: '24px', paddingLeft: '16px', paddingRight: '16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px', color: '#6B7280' }}>
                Loading categories...
              </div>
            </div>
          ) : (
            <Row gutter={[16, 16]}>
              {(categories || []).map((category: any) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </Row>
          )}
        </div>

        {/* Recent Practice Sessions */}
        {recentSessions.length > 0 && (
          <div style={{ marginTop: '48px', paddingLeft: '16px', paddingRight: '16px' }}>
            <Title level={2} style={{ 
              margin: '0 0 20px 0',
              fontSize: '22px',
              fontWeight: 'bold',
              color: '#1F2937',
              paddingLeft: '0'
            }}>
              Recent Practice Sessions
            </Title>
            <Row gutter={[16, 16]}>
              {recentSessions.map((session: any, index: number) => (
                <Col xs={24} sm={12} md={8} lg={6} xl={6} key={session.sessionId || index}>
                  <SessionCard session={{ ...session, type: 'practice' }} />
                </Col>
              ))}
            </Row>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default PracticePage;