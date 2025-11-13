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
  ReadOutlined
} from '@ant-design/icons';
import { AppLayout } from '../components/AppLayout';

const { Title, Text, Paragraph } = Typography;

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
    <AppLayout showAuth={true} showFooter={false}>
      {/* Compact Hero Section */}
      <div style={{ 
        background: gradient,
        padding: '60px 24px',
        textAlign: 'center',
        color: 'white'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img 
              src="/assets/padhero logo.svg" 
              alt="Padhero" 
              style={{ height: '52px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)', borderRadius: '10px' }} 
            />
          </div>
          <Title level={1} style={{ color: 'white', fontSize: '2.5rem', marginBottom: '16px' }}>
            Master MPSC with Padhero
          </Title>
          
          <Paragraph style={{ 
            fontSize: '1.1rem', 
            color: 'rgba(255,255,255,0.9)', 
            marginBottom: '30px',
            maxWidth: '600px',
            margin: '0 auto 30px auto'
          }}>
            70,000+ Questions • Bilingual Support • All MPSC Grades
          </Paragraph>
          
          <Space size="large">
            <Link to="/register">
              <Button 
                type="primary" 
                size="large" 
                style={{ 
                  background: 'white', 
                  borderColor: 'white',
                  color: primaryColor,
                  height: '50px',
                  padding: '0 32px',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Register Now
              </Button>
            </Link>
            <Button 
              size="large" 
              style={{ 
                background: 'rgba(255,255,255,0.1)', 
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'white',
                height: '50px',
                padding: '0 32px',
                fontSize: '16px'
              }}
            >
              Watch Demo
            </Button>
          </Space>
        </div>
      </div>

      {/* Stats Section */}
      <div style={{ padding: '50px 24px', background: '#f8f9fa' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Row gutter={[32, 32]} justify="center">
            <Col xs={24} sm={6}>
              <Card style={{ textAlign: 'center', border: 'none', boxShadow: 'none' }}>
                <Statistic
                  title="Students"
                  value={10000}
                  suffix="+"
                  valueStyle={{ color: primaryColor, fontSize: '2rem' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card style={{ textAlign: 'center', border: 'none', boxShadow: 'none' }}>
                <Statistic
                  title="Questions"
                  value={70000}
                  suffix="+"
                  valueStyle={{ color: primaryColor, fontSize: '2rem' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card style={{ textAlign: 'center', border: 'none', boxShadow: 'none' }}>
                <Statistic
                  title="Success Rate"
                  value={95}
                  suffix="%"
                  valueStyle={{ color: primaryColor, fontSize: '2rem' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card style={{ textAlign: 'center', border: 'none', boxShadow: 'none' }}>
                <Statistic
                  title="Exam Categories"
                  value={4}
                  valueStyle={{ color: primaryColor, fontSize: '2rem' }}
                />
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      {/* Question Bank Section */}
      <div style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <Title level={2}>70,000+ Practice Questions</Title>
            <Paragraph style={{ fontSize: '1.1rem', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
              Comprehensive question bank covering all topics and difficulty levels for complete preparation
            </Paragraph>
          </div>
          
          <Row gutter={[32, 32]}>
            {difficultyLevels.map((difficulty, index) => (
              <Col xs={24} md={8} key={index}>
                <Card 
                  hoverable
                  style={{ 
                    height: '100%',
                    borderRadius: '12px',
                    border: `2px solid ${difficulty.color}20`,
                    textAlign: 'center'
                  }}
                  bodyStyle={{ padding: '32px' }}
                >
                  <div style={{ 
                    fontSize: '48px', 
                    color: difficulty.color, 
                    marginBottom: '20px' 
                  }}>
                    {difficulty.icon}
                  </div>
                  <Title level={3} style={{ color: difficulty.color, marginBottom: '16px' }}>
                    {difficulty.level}
                  </Title>
                  <div style={{ marginBottom: '16px' }}>
                    <Text strong style={{ fontSize: '1.5rem', color: primaryColor }}>
                      {difficulty.questions}
                    </Text>
                    <br />
                    <Text type="secondary">Questions</Text>
                  </div>
                  <Paragraph style={{ color: '#666', marginBottom: '0' }}>
                    {difficulty.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Total Questions Progress */}
          <div style={{ marginTop: '60px', textAlign: 'center' }}>
            <Card style={{ borderRadius: '12px', background: '#fffaf0' }}>
              <DatabaseOutlined style={{ fontSize: '48px', color: primaryColor, marginBottom: '20px' }} />
              <Title level={4} style={{ color: primaryColor }}>
                Total Question Bank: 70,000+ Questions
              </Title>
              <Progress 
                percent={100}
                strokeColor={{
                  '0%': '#FF7846',
                  '100%': '#FF5722',
                }}
                style={{ maxWidth: '400px', margin: '0 auto' }}
              />
              <Text type="secondary" style={{ marginTop: '16px', display: 'block' }}>
                Continuously updated with latest exam patterns
              </Text>
            </Card>
          </div>
        </div>
      </div>

      {/* Exam Coverage Section */}
      <div style={{ padding: '80px 24px', background: '#f8f9fa' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <Title level={2}>Complete Exam Coverage</Title>
            <Paragraph style={{ fontSize: '1.1rem', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
              Prepare for all major MPSC grades and state service examinations with specialized content
            </Paragraph>
          </div>
          
          <Row gutter={[32, 32]}>
            {examCategories.map((exam, index) => (
              <Col xs={24} md={6} key={index}>
                <Card 
                  hoverable
                  style={{ 
                    height: '100%',
                    borderRadius: '12px',
                    border: `2px solid ${exam.color}20`,
                    textAlign: 'center'
                  }}
                  bodyStyle={{ padding: '24px' }}
                >
                  <SafetyCertificateOutlined style={{ 
                    fontSize: '48px', 
                    color: exam.color, 
                    marginBottom: '16px' 
                  }} />
                  <Title level={4} style={{ marginBottom: '12px', color: exam.color }}>
                    {exam.title}
                  </Title>
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong style={{ fontSize: '1.2rem', color: primaryColor }}>
                      {exam.questions}
                    </Text>
                    <br />
                    <Text type="secondary">Questions</Text>
                  </div>
                  <Paragraph style={{ color: '#666', margin: 0, fontSize: '14px' }}>
                    {exam.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Language Support Section */}
      <div style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <Title level={2}>Bilingual Learning Experience</Title>
            <Paragraph style={{ fontSize: '1.1rem', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
              Study in your preferred language with complete Marathi and English support
            </Paragraph>
          </div>
          
          <Row gutter={[32, 32]}>
            {languageFeatures.map((lang, index) => (
              <Col xs={24} md={12} key={index}>
                <Card 
                  hoverable
                  style={{ 
                    height: '100%',
                    borderRadius: '12px',
                    border: `2px solid ${primaryColor}20`,
                    textAlign: 'center'
                  }}
                  bodyStyle={{ padding: '32px' }}
                >
                  <div style={{ 
                    fontSize: '48px', 
                    color: primaryColor, 
                    marginBottom: '20px' 
                  }}>
                    {lang.icon}
                  </div>
                  <Title level={3} style={{ marginBottom: '16px', color: primaryColor }}>
                    {lang.language}
                  </Title>
                  <Paragraph style={{ color: '#666', marginBottom: '24px' }}>
                    {lang.description}
                  </Paragraph>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    {lang.features.map((feature, idx) => (
                      <div key={idx} style={{ 
                        padding: '8px 16px', 
                        background: `${primaryColor}10`,
                        borderRadius: '6px',
                        border: `1px solid ${primaryColor}20`
                      }}>
                        <CheckCircleOutlined style={{ color: primaryColor, marginRight: '8px' }} />
                        {feature}
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
      <div style={{ padding: '80px 24px', background: '#f8f9fa' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <Title level={2}>Advanced Learning Features</Title>
            <Paragraph style={{ fontSize: '1.1rem', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
              Smart tools and features designed to maximize your preparation efficiency
            </Paragraph>
          </div>
          
          <Row gutter={[32, 32]}>
            {features.map((feature, index) => (
              <Col xs={24} md={12} key={index}>
                <Card 
                  hoverable
                  style={{ 
                    height: '100%',
                    borderRadius: '12px',
                    border: `2px solid ${primaryColor}20`
                  }}
                  bodyStyle={{ padding: '32px' }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '20px' }}>
                      {feature.icon}
                    </div>
                    <Title level={4} style={{ marginBottom: '16px', color: primaryColor }}>
                      {feature.title}
                    </Title>
                    <Paragraph style={{ color: '#666', margin: 0 }}>
                      {feature.description}
                    </Paragraph>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Testimonials Section */}
      <div style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <Title level={2}>Success Stories</Title>
            <Paragraph style={{ fontSize: '1.1rem', color: '#666' }}>
              Join thousands of successful MPSC aspirants who achieved their goals with{' '}
              <span style={{ 
                color: '#7f8f9d',
                fontFamily: 'Anton, sans-serif',
                fontWeight: 'bold',
                fontStyle: 'italic'
              }}>G</span>
              <span style={{ 
                color: '#160676',
                fontFamily: 'Anton, sans-serif',
                fontWeight: 'bold',
                fontStyle: 'italic',
                position: 'relative'
              }}>
                S
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-2px',
                  color: '#160676',
                  fontSize: '10px',
                  transform: 'rotate(-45deg)',
                  fontWeight: 'bold'
                }}>&gt;</span>
              </span>
            </Paragraph>
          </div>
          
          <Row gutter={[32, 32]}>
            {testimonials.map((testimonial, index) => (
              <Col xs={24} md={6} key={index}>
                <Card 
                  style={{ 
                    height: '100%',
                    borderRadius: '12px',
                    border: `2px solid ${primaryColor}20`
                  }}
                  bodyStyle={{ padding: '24px' }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <Avatar 
                      size={64} 
                      icon={<UserOutlined />} 
                      style={{ backgroundColor: primaryColor, marginBottom: '16px' }}
                    />
                    <div style={{ marginBottom: '12px' }}>
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <StarOutlined key={i} style={{ color: '#ffd700', marginRight: '2px' }} />
                      ))}
                    </div>
                    <Paragraph style={{ 
                      fontStyle: 'italic', 
                      marginBottom: '16px',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      "{testimonial.content}"
                    </Paragraph>
                    <div>
                      <Text strong style={{ fontSize: '14px' }}>{testimonial.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>{testimonial.role}</Text>
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
        padding: '80px 24px',
        background: gradient,
        textAlign: 'center',
        color: 'white'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <Title level={2} style={{ color: 'white', marginBottom: '20px' }}>
            Start Your MPSC Journey Today
          </Title>
          <Paragraph style={{ 
            fontSize: '1.1rem', 
            color: 'rgba(255,255,255,0.9)', 
            marginBottom: '40px' 
          }}>
            Access 70,000+ questions in Marathi and English, complete exam coverage, 
            and advanced learning features.
          </Paragraph>
          <Link to="/register">
            <Button 
              type="primary" 
              size="large" 
              style={{ 
                background: 'white', 
                borderColor: 'white',
                color: primaryColor,
                height: '50px',
                padding: '0 32px',
                fontSize: '16px',
                fontWeight: 'bold'
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