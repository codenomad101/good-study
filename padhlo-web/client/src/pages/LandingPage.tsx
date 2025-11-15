import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Button, 
  Typography, 
  Row, 
  Col, 
  Card, 
  Space,
  Statistic,
  Avatar,
  Divider,
  Tag,
  Progress
} from 'antd';
import {
  BookOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  StarOutlined,
  UserOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  FlagOutlined,
  DatabaseOutlined,
  BarChartOutlined as ChartOutlined,
  TranslationOutlined,
  ReadOutlined,
  SafetyOutlined,
  BankOutlined,
  AuditOutlined,
  RocketOutlined,
  ArrowRightOutlined,
  BarChartOutlined as AnalyticsOutlined
} from '@ant-design/icons';
import { AppLayout } from '../components/AppLayout';

const { Title, Text, Paragraph } = Typography;

// Feature Card Component
const FeatureCard: React.FC<{ feature: any }> = ({ feature }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const IconComponent = feature.icon;
  
  return (
    <Col xs={12} sm={12} md={8} lg={8} xl={8}>
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
          background: feature.colors.bg,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${feature.colors.icon}20`
            }}>
              <IconComponent style={{ 
                fontSize: '24px', 
                color: feature.colors.icon
              }} />
            </div>
            <div>
              <Text 
                style={{ 
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#1F2937',
                  lineHeight: '1.2',
                  display: 'block'
                }}
              >
                {feature.name}
              </Text>
              <Text style={{ 
                fontSize: '12px',
                color: '#6B7280',
                fontWeight: '500',
                display: 'block',
                marginTop: '4px'
              }}>
                {feature.description}
              </Text>
            </div>
          </div>
        </div>
        
        {/* Center Section - Features List */}
        <div style={{ 
          flex: 1,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {feature.features.map((item: string, itemIndex: number) => (
            <div 
              key={itemIndex}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px',
                borderRadius: '12px',
                background: '#F9FAFB',
                transition: 'all 0.2s ease',
                transform: isHovered ? 'translateX(4px)' : 'translateX(0)'
              }}
            >
              {/* Check Icon */}
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: feature.colors.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: `1px solid ${feature.colors.icon}30`
              }}>
                <CheckCircleOutlined style={{ 
                  fontSize: '14px', 
                  color: feature.colors.icon
                }} />
              </div>
              {/* Feature Text */}
              <Text 
                style={{ 
                  fontSize: '13px',
                  color: '#1F2937',
                  fontWeight: '500',
                  lineHeight: '1.5',
                  flex: 1
                }}
              >
                {item}
              </Text>
            </div>
          ))}
        </div>
      </div>
    </Col>
  );
};

export default function LandingPage() {
  const primaryColor = '#FF7846';
  const gradient = 'linear-gradient(135deg, #FF7846 0%, #FF5722 100%)';

  const features = [
    {
      icon: <BookOutlined style={{ fontSize: '32px', color: primaryColor }} />,
      title: 'Smart Practice Sessions',
      description: 'GoodStudy delivers 20 carefully selected questions from multiple categories with adaptive difficulty and 15-minute timed sessions.'
    },
    {
      icon: <FileTextOutlined style={{ fontSize: '32px', color: primaryColor }} />,
      title: 'Dynamic Exam Builder',
      description: 'Create personalized exams with custom question distribution, flexible timing, and realistic negative marking.'
    },
    {
      icon: <BarChartOutlined style={{ fontSize: '32px', color: primaryColor }} />,
      title: 'Advanced Analytics',
      description: 'Get deep insights into your performance with detailed statistics, weak area identification, and improvement recommendations.'
    },
    {
      icon: <TrophyOutlined style={{ fontSize: '32px', color: primaryColor }} />,
      title: 'Progress Monitoring',
      description: 'Track your journey with weekly and monthly progress reports, streak counters, and achievement milestones.'
    }
  ];

  const examCategories = [
    {
      title: 'MPSC Grade A',
      description: 'Comprehensive preparation for Maharashtra Public Service Commission Grade A examinations',
      questions: '18,000+',
      color: '#FF7846'
    },
    {
      title: 'MPSC Grade B',
      description: 'Targeted practice and mock tests for MPSC Grade B level positions',
      questions: '16,000+',
      color: '#FF8A65'
    },
    {
      title: 'MPSC Grade C',
      description: 'Complete syllabus coverage for MPSC Grade C examinations',
      questions: '15,000+',
      color: '#FF5722'
    },
    {
      title: 'State Services',
      description: 'Specialized preparation for various state government service examinations',
      questions: '21,000+',
      color: '#FFAB91'
    }
  ];

  const difficultyLevels = [
    { 
      level: 'Easy', 
      color: '#52c41a', 
      questions: '25,000+',
      description: 'Perfect for beginners and concept building',
      icon: <CheckCircleOutlined />
    },
    { 
      level: 'Medium', 
      color: '#fa8c16', 
      questions: '30,000+',
      description: 'Ideal for intermediate practice and revision',
      icon: <BulbOutlined />
    },
    { 
      level: 'Hard', 
      color: '#f5222d', 
      questions: '15,000+',
      description: 'Challenging questions for advanced preparation',
      icon: <TrophyOutlined />
    }
  ];

  const languageFeatures = [
    {
      language: 'Marathi',
      icon: <FlagOutlined />,
      description: 'Complete coverage in Marathi with native language support',
      features: ['Full Question Bank', 'Marathi Interface', 'Native Explanations']
    },
    {
      language: 'English',
      icon: <GlobalOutlined />,
      description: 'Comprehensive English content for bilingual preparation',
      features: ['Bilingual Support', 'English Medium', 'International Standards']
    }
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'MPSC Aspirant',
      content: 'Siklo helped me improve my accuracy by 40% in just 3 months! The Marathi language support is excellent.',
      rating: 5
    },
    {
      name: 'Rajesh Kumar',
      role: 'MPSC Grade A Candidate',
      content: 'The 70,000+ questions and bilingual support made all the difference in my preparation.',
      rating: 5
    },
    {
      name: 'Anita Singh',
      role: 'State Services Aspirant',
      content: 'Best platform for MPSC and state service exam preparation. Highly recommended!',
      rating: 5
    },
    {
      name: 'Sandeep Patil',
      role: 'MPSC Grade B Candidate',
      content: 'The difficulty level categorization helped me focus on my weak areas effectively.',
      rating: 5
    }
  ];

  return (
    <AppLayout showAuth={true} showFooter={true}>
      {/* MPSC Exam Preparation Section - Coinbase Style */}
      <div style={{ 
        marginBottom: '0', 
        padding: '80px 16px',
        background: '#F8FAFC'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
            borderRadius: '24px',
            border: '1px solid #E5E7EB',
            padding: '64px 48px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative background elements */}
            <div style={{
              position: 'absolute',
              top: '-100px',
              right: '-100px',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(249, 115, 22, 0.05) 100%)',
              opacity: 0.6
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-80px',
              left: '-80px',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)',
              opacity: 0.5
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Main Heading */}
              <div style={{ 
                textAlign: 'center', 
                marginBottom: '48px' 
              }}>
                <Title level={1} style={{ 
                  margin: '0 0 16px 0',
                  fontSize: '42px',
                  fontWeight: '800',
                  color: '#1F2937',
                  lineHeight: '1.2',
                  letterSpacing: '-0.5px'
                }}>
                  Prepare for Maharashtra Government Exams
                </Title>
                <Text style={{ 
                  fontSize: '20px',
                  color: '#6B7280',
                  fontWeight: '500',
                  lineHeight: '1.6',
                  maxWidth: '700px',
                  margin: '0 auto',
                  display: 'block'
                }}>
                  Comprehensive preparation platform for MPSC, Talathi, Clerk, PSI, STI, and other Maharashtra state government examinations
                </Text>
              </div>

              {/* Exam Types Grid */}
              <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
                {[
                  { 
                    name: 'MPSC', 
                    fullName: 'Maharashtra Public Service Commission',
                    icon: TrophyOutlined,
                    color: '#2563EB',
                    bg: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)'
                  },
                  { 
                    name: 'Talathi', 
                    fullName: 'Talathi Exam',
                    icon: FileTextOutlined,
                    color: '#10B981',
                    bg: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)'
                  },
                  { 
                    name: 'Clerk', 
                    fullName: 'Clerk Exam',
                    icon: BankOutlined,
                    color: '#7C3AED',
                    bg: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)'
                  },
                  { 
                    name: 'PSI', 
                    fullName: 'Police Sub-Inspector',
                    icon: SafetyOutlined,
                    color: '#F97316',
                    bg: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)'
                  },
                  { 
                    name: 'STI', 
                    fullName: 'Sales Tax Inspector',
                    icon: AuditOutlined,
                    color: '#EC4899',
                    bg: 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)'
                  },
                  { 
                    name: 'Other Exams', 
                    fullName: 'Various State Exams',
                    icon: RocketOutlined,
                    color: '#6366F1',
                    bg: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)'
                  }
                ].map((exam, index) => {
                  const IconComponent = exam.icon;
                  return (
                    <Col xs={24} sm={12} md={8} lg={8} xl={8} key={index}>
                      <div style={{
                        background: '#FFFFFF',
                        borderRadius: '16px',
                        padding: '32px 24px',
                        border: '1px solid #E5E7EB',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
                        e.currentTarget.style.borderColor = exam.color;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                        e.currentTarget.style.borderColor = '#E5E7EB';
                      }}>
                        <div style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '16px',
                          background: exam.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '20px',
                          border: `2px solid ${exam.color}20`
                        }}>
                          <IconComponent style={{ 
                            fontSize: '32px', 
                            color: exam.color 
                          }} />
                        </div>
                        <Title level={4} style={{ 
                          margin: '0 0 8px 0',
                          fontSize: '22px',
                          fontWeight: '700',
                          color: '#1F2937'
                        }}>
                          {exam.name}
                        </Title>
                        <Text style={{ 
                          fontSize: '14px',
                          color: '#6B7280',
                          fontWeight: '500',
                          lineHeight: '1.5'
                        }}>
                          {exam.fullName}
                        </Text>
                      </div>
                    </Col>
                  );
                })}
              </Row>

              {/* Features Section */}
              <div style={{
                background: '#F9FAFB',
                borderRadius: '16px',
                padding: '40px 32px',
                border: '1px solid #E5E7EB',
                marginTop: '32px'
              }}>
                <Row gutter={[32, 24]}>
                  <Col xs={24} sm={12} md={6}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '36px',
                        fontWeight: '800',
                        color: '#2563EB',
                        marginBottom: '8px',
                        lineHeight: '1.2'
                      }}>
                        10,000+
                      </div>
                      <Text style={{ 
                        fontSize: '15px',
                        color: '#6B7280',
                        fontWeight: '600'
                      }}>
                        Practice Questions
                      </Text>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '36px',
                        fontWeight: '800',
                        color: '#10B981',
                        marginBottom: '8px',
                        lineHeight: '1.2'
                      }}>
                        50+
                      </div>
                      <Text style={{ 
                        fontSize: '15px',
                        color: '#6B7280',
                        fontWeight: '600'
                      }}>
                        Exam Categories
                      </Text>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '36px',
                        fontWeight: '800',
                        color: '#F97316',
                        marginBottom: '8px',
                        lineHeight: '1.2'
                      }}>
                        24/7
                      </div>
                      <Text style={{ 
                        fontSize: '15px',
                        color: '#6B7280',
                        fontWeight: '600'
                      }}>
                        Access Anytime
                      </Text>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '36px',
                        fontWeight: '800',
                        color: '#7C3AED',
                        marginBottom: '8px',
                        lineHeight: '1.2'
                      }}>
                        100%
                      </div>
                      <Text style={{ 
                        fontSize: '15px',
                        color: '#6B7280',
                        fontWeight: '600'
                      }}>
                        Free to Start
                      </Text>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* CTA Button */}
              <div style={{ 
                textAlign: 'center', 
                marginTop: '40px' 
              }}>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Button 
                    type="primary"
                    size="large"
                    style={{
                      height: '56px',
                      padding: '0 40px',
                      fontSize: '18px',
                      fontWeight: '700',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                    }}
                  >
                    Get Started Free
                    <ArrowRightOutlined style={{ marginLeft: '8px', fontSize: '18px' }} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section Below MPSC Card */}
      <div style={{ 
        padding: '80px 16px',
        background: '#FFFFFF'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <Title level={2} style={{ 
              margin: '0 0 16px 0',
              fontSize: '36px',
              fontWeight: '800',
              color: '#1F2937'
            }}>
              Features
            </Title>
            <Text style={{ 
              fontSize: '18px',
              color: '#6B7280',
              fontWeight: '500',
              maxWidth: '700px',
              margin: '0 auto',
              display: 'block'
            }}>
              Comprehensive tools and resources designed to help you excel in Maharashtra Government Exams
            </Text>
          </div>

          <Row gutter={[24, 24]}>
            {[
              {
                name: 'Leaderboard',
                icon: TrophyOutlined,
                description: 'Compete with thousands of aspirants and track your ranking',
                features: [
                  'Real-time ranking updates',
                  'Compare performance with peers',
                  'Track progress over time',
                  'See top performers'
                ],
                colors: { bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', icon: '#F59E0B', hover: '#D97706' }
              },
              {
                name: 'Exams',
                icon: BookOutlined,
                description: 'Create and take personalized mock exams with custom settings',
                features: [
                  'Custom question distribution',
                  'Flexible timing options',
                  'Realistic negative marking',
                  'Detailed performance analysis'
                ],
                colors: { bg: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)', icon: '#EF4444', hover: '#DC2626' }
              },
              {
                name: 'Practice',
                icon: PlayCircleOutlined,
                description: 'Smart practice sessions with adaptive difficulty',
                features: [
                  '15-minute focused sessions',
                  '20 questions per session',
                  'Adaptive difficulty system',
                  'Instant feedback and explanations'
                ],
                colors: { bg: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)', icon: '#6366F1', hover: '#4F46E5' }
              },
              {
                name: 'Notes',
                icon: FileTextOutlined,
                description: 'Save and organize your study notes efficiently',
                features: [
                  'Create and edit notes',
                  'Organize by categories',
                  'Quick search functionality',
                  'Access from anywhere'
                ],
                colors: { bg: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)', icon: '#10B981', hover: '#059669' }
              },
              {
                name: 'Analytics',
                icon: AnalyticsOutlined,
                description: 'Get deep insights into your performance',
                features: [
                  'Performance statistics',
                  'Weak area identification',
                  'Improvement trends',
                  'AI-powered recommendations'
                ],
                colors: { bg: 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)', icon: '#EC4899', hover: '#DB2777' }
              },
              {
                name: 'Progress Tracking',
                icon: RocketOutlined,
                description: 'Monitor your learning journey and achievements',
                features: [
                  'Daily streak tracking',
                  'Weekly progress reports',
                  'Achievement milestones',
                  'Visual progress indicators'
                ],
                colors: { bg: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', icon: '#2563EB', hover: '#1E40AF' }
              }
            ].map((feature, index) => (
              <FeatureCard key={index} feature={feature} />
            ))}
          </Row>

          {/* Quick Links Section */}
          <div style={{
            marginTop: '48px',
            background: '#F9FAFB',
            borderRadius: '20px',
            padding: '40px 32px',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Title level={3} style={{ 
                margin: '0 0 8px 0',
                fontSize: '24px',
                fontWeight: '700',
                color: '#1F2937'
              }}>
                Explore Our Platform
              </Title>
              <Text style={{ 
                fontSize: '16px',
                color: '#6B7280'
              }}>
                Access all features and resources
              </Text>
            </div>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8} md={6} lg={6}>
                <Link to="/leaderboard" style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '24px',
                    borderRadius: '12px',
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = '#2563EB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }}>
                    <TrophyOutlined style={{ fontSize: '32px', color: '#2563EB', marginBottom: '12px' }} />
                    <Text style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937' }}>Leaderboard</Text>
                  </div>
                </Link>
              </Col>
              <Col xs={12} sm={8} md={6} lg={6}>
                <Link to="/notes" style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '24px',
                    borderRadius: '12px',
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = '#10B981';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }}>
                    <FileTextOutlined style={{ fontSize: '32px', color: '#10B981', marginBottom: '12px' }} />
                    <Text style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937' }}>Notes</Text>
                  </div>
                </Link>
              </Col>
              <Col xs={12} sm={8} md={6} lg={6}>
                <Link to="/exams" style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '24px',
                    borderRadius: '12px',
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = '#F97316';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }}>
                    <BookOutlined style={{ fontSize: '32px', color: '#F97316', marginBottom: '12px' }} />
                    <Text style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937' }}>Exams</Text>
                  </div>
                </Link>
              </Col>
              <Col xs={12} sm={8} md={6} lg={6}>
                <Link to="/practice" style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '24px',
                    borderRadius: '12px',
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = '#7C3AED';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }}>
                    <PlayCircleOutlined style={{ fontSize: '32px', color: '#7C3AED', marginBottom: '12px' }} />
                    <Text style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937' }}>Practice</Text>
                  </div>
                </Link>
              </Col>
            </Row>
          </div>
        </div>
      </div>



      {/* Exam Coverage Section */}
      <div style={{ 
        padding: '80px 16px',
        background: '#FFFFFF'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <Title level={2} style={{ 
              margin: '0 0 16px 0',
              fontSize: '36px',
              fontWeight: '800',
              color: '#1F2937'
            }}>
              Complete Exam Coverage
            </Title>
            <Text style={{ 
              fontSize: '18px',
              color: '#6B7280',
              fontWeight: '500',
              maxWidth: '700px',
              margin: '0 auto',
              display: 'block'
            }}>
              Prepare for all major MPSC grades and state service examinations with specialized content
            </Text>
          </div>
          
          <Row gutter={[24, 24]}>
            {examCategories.map((exam, index) => (
              <Col xs={24} sm={12} md={6} key={index}>
                <Card 
                  hoverable
                  style={{ 
                    height: '100%',
                    borderRadius: '16px',
                    border: '1px solid #E5E7EB',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.3s ease'
                  }}
                  bodyStyle={{ padding: '32px 24px' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
                    e.currentTarget.style.borderColor = exam.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }}
                >
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${exam.color}15 0%, ${exam.color}25 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px auto',
                    border: `2px solid ${exam.color}30`
                  }}>
                    <SafetyCertificateOutlined style={{ 
                      fontSize: '32px', 
                      color: exam.color
                    }} />
                  </div>
                  <Title level={4} style={{ 
                    margin: '0 0 12px 0',
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#1F2937'
                  }}>
                    {exam.title}
                  </Title>
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong style={{ 
                      fontSize: '24px',
                      fontWeight: '800',
                      color: exam.color,
                      display: 'block',
                      marginBottom: '4px'
                    }}>
                      {exam.questions}
                    </Text>
                    <Text style={{ 
                      fontSize: '14px',
                      color: '#6B7280',
                      fontWeight: '500'
                    }}>
                      Questions
                    </Text>
                  </div>
                  <Text style={{ 
                    color: '#6B7280',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    display: 'block'
                  }}>
                    {exam.description}
                  </Text>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Language Support Section */}
      <div style={{ 
        padding: '80px 16px',
        background: '#F8FAFC'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <Title level={2} style={{ 
              margin: '0 0 16px 0',
              fontSize: '36px',
              fontWeight: '800',
              color: '#1F2937'
            }}>
              Bilingual Learning Experience
            </Title>
            <Text style={{ 
              fontSize: '18px',
              color: '#6B7280',
              fontWeight: '500',
              maxWidth: '700px',
              margin: '0 auto',
              display: 'block'
            }}>
              Study in your preferred language with complete Marathi and English support
            </Text>
          </div>
          
          <Row gutter={[24, 24]}>
            {languageFeatures.map((lang, index) => (
              <Col xs={24} md={12} key={index}>
                <Card 
                  hoverable
                  style={{ 
                    height: '100%',
                    borderRadius: '16px',
                    border: '1px solid #E5E7EB',
                    textAlign: 'center',
                    background: '#FFFFFF',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.3s ease'
                  }}
                  bodyStyle={{ padding: '40px 32px' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                  }}
                >
                  <div style={{ 
                    fontSize: '48px', 
                    color: '#2563EB', 
                    marginBottom: '24px' 
                  }}>
                    {lang.icon}
                  </div>
                  <Title level={3} style={{ 
                    margin: '0 0 16px 0',
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#1F2937'
                  }}>
                    {lang.language}
                  </Title>
                  <Text style={{ 
                    color: '#6B7280',
                    fontSize: '15px',
                    lineHeight: '1.6',
                    marginBottom: '24px',
                    display: 'block'
                  }}>
                    {lang.description}
                  </Text>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    {lang.features.map((feature, idx) => (
                      <div key={idx} style={{ 
                        padding: '12px 16px', 
                        background: '#F9FAFB',
                        borderRadius: '10px',
                        border: '1px solid #E5E7EB',
                        textAlign: 'left',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F3F4F6';
                        e.currentTarget.style.borderColor = '#D1D5DB';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#F9FAFB';
                        e.currentTarget.style.borderColor = '#E5E7EB';
                      }}>
                        <CheckCircleOutlined style={{ color: '#10B981', marginRight: '10px' }} />
                        <Text style={{ fontSize: '14px', color: '#1F2937', fontWeight: '500' }}>
                          {feature}
                        </Text>
                      </div>
                    ))}
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ 
        padding: '80px 16px',
        background: '#FFFFFF'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <Title level={2} style={{ 
              margin: '0 0 16px 0',
              fontSize: '36px',
              fontWeight: '800',
              color: '#1F2937'
            }}>
              Advanced Learning Features
            </Title>
            <Text style={{ 
              fontSize: '18px',
              color: '#6B7280',
              fontWeight: '500',
              maxWidth: '700px',
              margin: '0 auto',
              display: 'block'
            }}>
              Smart tools and features designed to maximize your preparation efficiency
            </Text>
          </div>
          
          <Row gutter={[24, 24]}>
            {features.map((feature, index) => (
              <Col xs={24} md={12} key={index}>
                <Card 
                  hoverable
                  style={{ 
                    height: '100%',
                    borderRadius: '16px',
                    border: '1px solid #E5E7EB',
                    background: '#FFFFFF',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.3s ease'
                  }}
                  bodyStyle={{ padding: '40px 32px' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '24px' }}>
                      {feature.icon}
                    </div>
                    <Title level={4} style={{ 
                      margin: '0 0 16px 0',
                      fontSize: '22px',
                      fontWeight: '700',
                      color: '#1F2937'
                    }}>
                      {feature.title}
                    </Title>
                    <Text style={{ 
                      color: '#6B7280',
                      fontSize: '15px',
                      lineHeight: '1.6',
                      display: 'block'
                    }}>
                      {feature.description}
                    </Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Testimonials Section */}
      <div style={{ 
        padding: '80px 16px',
        background: '#F8FAFC'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <Title level={2} style={{ 
              margin: '0 0 16px 0',
              fontSize: '36px',
              fontWeight: '800',
              color: '#1F2937'
            }}>
              Success Stories
            </Title>
            <Text style={{ 
              fontSize: '18px',
              color: '#6B7280',
              fontWeight: '500',
              maxWidth: '700px',
              margin: '0 auto',
              display: 'block'
            }}>
              Join thousands of successful MPSC aspirants who achieved their goals with Padhero
            </Text>
          </div>
          
          <Row gutter={[24, 24]}>
            {testimonials.map((testimonial, index) => (
              <Col xs={24} sm={12} md={6} key={index}>
                <Card 
                  style={{ 
                    height: '100%',
                    borderRadius: '16px',
                    border: '1px solid #E5E7EB',
                    background: '#FFFFFF',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.3s ease'
                  }}
                  bodyStyle={{ padding: '32px 24px' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <Avatar 
                      size={64} 
                      icon={<UserOutlined />} 
                      style={{ 
                        backgroundColor: '#2563EB', 
                        marginBottom: '20px',
                        border: '3px solid #EFF6FF'
                      }}
                    />
                    <div style={{ marginBottom: '16px' }}>
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <StarOutlined key={i} style={{ 
                          color: '#FCD34D', 
                          fontSize: '16px',
                          marginRight: '4px' 
                        }} />
                      ))}
                    </div>
                    <Text style={{ 
                      fontStyle: 'italic', 
                      marginBottom: '20px',
                      fontSize: '15px',
                      lineHeight: '1.6',
                      color: '#374151',
                      display: 'block'
                    }}>
                      "{testimonial.content}"
                    </Text>
                    <div>
                      <Text strong style={{ 
                        fontSize: '16px',
                        color: '#1F2937',
                        fontWeight: '700',
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        {testimonial.name}
                      </Text>
                      <Text style={{ 
                        fontSize: '13px',
                        color: '#6B7280',
                        fontWeight: '500'
                      }}>
                        {testimonial.role}
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ 
        padding: '80px 16px',
        background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
        textAlign: 'center',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          opacity: 0.5
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-80px',
          left: '-80px',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          opacity: 0.4
        }} />
        
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Title level={2} style={{ 
            color: 'white', 
            marginBottom: '20px',
            fontSize: '42px',
            fontWeight: '800',
            lineHeight: '1.2'
          }}>
            Start Your MPSC Journey Today
          </Title>
          <Text style={{ 
            fontSize: '20px', 
            color: 'rgba(255,255,255,0.9)', 
            marginBottom: '40px',
            lineHeight: '1.6',
            display: 'block'
          }}>
            Access comprehensive question bank in Marathi and English, complete exam coverage, 
            and advanced learning features.
          </Text>
          <Link to="/register" style={{ textDecoration: 'none' }}>
            <Button 
              type="primary" 
              size="large" 
              style={{ 
                background: 'white', 
                borderColor: 'white',
                color: '#2563EB',
                height: '56px',
                padding: '0 40px',
                fontSize: '18px',
                fontWeight: '700',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
            >
              Register Now - Free Trial
            </Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}