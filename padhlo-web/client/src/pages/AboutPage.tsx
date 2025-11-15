import React from 'react';
import { AppLayout } from '../components/AppLayout';
import { Typography, Card, Row, Col, Space, Divider } from 'antd';
import { 
  BookOutlined, 
  TrophyOutlined, 
  TeamOutlined, 
  RocketOutlined,
  CheckCircleOutlined,
  GlobalOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function AboutPage() {
  const values = [
    {
      icon: <BookOutlined style={{ fontSize: '32px', color: '#FF7846' }} />,
      title: 'Comprehensive Learning',
      description: 'We provide extensive question banks covering all MPSC exam categories with detailed explanations.'
    },
    {
      icon: <TrophyOutlined style={{ fontSize: '32px', color: '#2563EB' }} />,
      title: 'Excellence in Preparation',
      description: 'Our platform is designed to help you achieve your best performance in competitive exams.'
    },
    {
      icon: <TeamOutlined style={{ fontSize: '32px', color: '#10B981' }} />,
      title: 'Community Support',
      description: 'Join a community of thousands of aspirants sharing knowledge and supporting each other.'
    },
    {
      icon: <RocketOutlined style={{ fontSize: '32px', color: '#F59E0B' }} />,
      title: 'Innovation',
      description: 'We continuously improve our platform with the latest technology and learning methodologies.'
    }
  ];

  const features = [
    '70,000+ Practice Questions',
    'Bilingual Support (Marathi & English)',
    'Real-time Performance Analytics',
    'Personalized Study Plans',
    'Mock Tests & Previous Year Papers',
    'Expert-curated Study Materials'
  ];

  return (
    <AppLayout>
      <div style={{ 
        padding: '80px 24px',
        background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
        minHeight: '100vh'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Hero Section */}
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <Title level={1} style={{ 
              fontSize: '48px',
              fontWeight: '800',
              color: '#1F2937',
              marginBottom: '24px',
              lineHeight: '1.2'
            }}>
              About Padhero
            </Title>
            <Paragraph style={{ 
              fontSize: '20px',
              color: '#6B7280',
              maxWidth: '800px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              Empowering Maharashtra's government exam aspirants with comprehensive preparation tools, 
              smart practice sessions, and personalized learning experiences.
            </Paragraph>
          </div>

          {/* Mission Section */}
          <Card style={{ 
            marginBottom: '48px',
            borderRadius: '24px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}>
            <Row gutter={[32, 32]}>
              <Col xs={24} md={12}>
                <Title level={2} style={{ color: '#1F2937', marginBottom: '16px' }}>
                  Our Mission
                </Title>
                <Paragraph style={{ fontSize: '16px', color: '#6B7280', lineHeight: '1.8' }}>
                  To democratize access to quality exam preparation resources for Maharashtra Public Service 
                  Commission (MPSC) and other state government examinations. We believe every aspirant deserves 
                  the best tools to succeed.
                </Paragraph>
              </Col>
              <Col xs={24} md={12}>
                <Title level={2} style={{ color: '#1F2937', marginBottom: '16px' }}>
                  Our Vision
                </Title>
                <Paragraph style={{ fontSize: '16px', color: '#6B7280', lineHeight: '1.8' }}>
                  To become the leading platform for government exam preparation in Maharashtra, helping 
                  thousands of aspirants achieve their career goals through innovative technology and 
                  comprehensive study resources.
                </Paragraph>
              </Col>
            </Row>
          </Card>

          {/* Values Section */}
          <div style={{ marginBottom: '64px' }}>
            <Title level={2} style={{ 
              textAlign: 'center',
              color: '#1F2937',
              marginBottom: '48px'
            }}>
              Our Core Values
            </Title>
            <Row gutter={[24, 24]}>
              {values.map((value, index) => (
                <Col xs={24} sm={12} lg={6} key={index}>
                  <Card
                    style={{
                      height: '100%',
                      borderRadius: '16px',
                      border: '1px solid #E5E7EB',
                      textAlign: 'center',
                      transition: 'all 0.3s ease'
                    }}
                    hoverable
                  >
                    <div style={{ marginBottom: '16px' }}>
                      {value.icon}
                    </div>
                    <Title level={4} style={{ color: '#1F2937', marginBottom: '12px' }}>
                      {value.title}
                    </Title>
                    <Text style={{ color: '#6B7280' }}>
                      {value.description}
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>

          {/* Features Section */}
          <Card style={{ 
            borderRadius: '24px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            marginBottom: '48px'
          }}>
            <Title level={2} style={{ 
              color: '#1F2937',
              marginBottom: '32px',
              textAlign: 'center'
            }}>
              What We Offer
            </Title>
            <Row gutter={[24, 16]}>
              {features.map((feature, index) => (
                <Col xs={24} sm={12} md={8} key={index}>
                  <Space>
                    <CheckCircleOutlined style={{ color: '#10B981', fontSize: '20px' }} />
                    <Text style={{ fontSize: '16px', color: '#1F2937' }}>{feature}</Text>
                  </Space>
                </Col>
              ))}
            </Row>
          </Card>

          {/* Stats Section */}
          <Row gutter={[24, 24]} style={{ marginBottom: '48px' }}>
            <Col xs={24} sm={8}>
              <Card style={{ 
                borderRadius: '16px',
                textAlign: 'center',
                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                border: 'none'
              }}>
                <Title level={1} style={{ color: '#2563EB', margin: '0 0 8px 0' }}>
                  70,000+
                </Title>
                <Text style={{ fontSize: '16px', color: '#6B7280' }}>
                  Practice Questions
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card style={{ 
                borderRadius: '16px',
                textAlign: 'center',
                background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                border: 'none'
              }}>
                <Title level={1} style={{ color: '#F59E0B', margin: '0 0 8px 0' }}>
                  10,000+
                </Title>
                <Text style={{ fontSize: '16px', color: '#6B7280' }}>
                  Active Users
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card style={{ 
                borderRadius: '16px',
                textAlign: 'center',
                background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
                border: 'none'
              }}>
                <Title level={1} style={{ color: '#10B981', margin: '0 0 8px 0' }}>
                  50+
                </Title>
                <Text style={{ fontSize: '16px', color: '#6B7280' }}>
                  Exam Categories
                </Text>
              </Card>
            </Col>
          </Row>

          {/* CTA Section */}
          <Card style={{ 
            borderRadius: '24px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)'
          }}>
            <GlobalOutlined style={{ fontSize: '48px', color: '#FF7846', marginBottom: '24px' }} />
            <Title level={2} style={{ color: '#1F2937', marginBottom: '16px' }}>
              Ready to Start Your Journey?
            </Title>
            <Paragraph style={{ fontSize: '18px', color: '#6B7280', marginBottom: '32px' }}>
              Join thousands of aspirants preparing for MPSC and state government exams
            </Paragraph>
            <a href="/register">
              <button style={{
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#FFFFFF',
                background: 'linear-gradient(135deg, #FF7846 0%, #FF5722 100%)',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                transition: 'all 0.3s ease'
              }}>
                Get Started Today
              </button>
            </a>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

