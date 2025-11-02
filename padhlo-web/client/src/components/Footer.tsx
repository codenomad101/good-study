import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Layout, 
  Row, 
  Col, 
  Typography, 
  Space,
  Divider,
  Button
} from 'antd';
import { 
  FacebookOutlined,
  TwitterOutlined,
  InstagramOutlined,
  LinkedinOutlined,
  YoutubeOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  BookOutlined,
  TrophyOutlined,
  QuestionCircleOutlined,
  InfoCircleOutlined,
  TeamOutlined,
  FileTextOutlined,
  BarChartOutlined,
  CrownOutlined
} from '@ant-design/icons';

const { Footer: AntFooter } = Layout;
const { Title, Text, Paragraph } = Typography;

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: 'Home', path: '/' },
    { label: 'Practice', path: '/practice' },
    { label: 'Exams', path: '/exams' },
    { label: 'Study Materials', path: '/study-materials' },
    { label: 'Analytics', path: '/analytics' },
  ];

  const studyResources = [
    { label: 'Question Bank', path: '/question-bank' },
    { label: 'Mock Tests', path: '/mock-tests' },
    { label: 'Previous Papers', path: '/previous-papers' },
    { label: 'Study Plans', path: '/study-plans' },
    { label: 'Performance Reports', path: '/reports' },
  ];

  const supportLinks = [
    { label: 'Help Center', path: '/help' },
    { label: 'Contact Us', path: '/contact' },
    { label: 'FAQ', path: '/faq' },
    { label: 'Feedback', path: '/feedback' },
    { label: 'Bug Report', path: '/bug-report' },
  ];

  const companyLinks = [
    { label: 'About Us', path: '/about' },
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Terms of Service', path: '/terms' },
    { label: 'Refund Policy', path: '/refund' },
    { label: 'Careers', path: '/careers' },
  ];

  const socialLinks = [
    { icon: <FacebookOutlined />, url: 'https://facebook.com/mantramanthan' },
    { icon: <TwitterOutlined />, url: 'https://twitter.com/mantramanthan' },
    { icon: <InstagramOutlined />, url: 'https://instagram.com/mantramanthan' },
    { icon: <LinkedinOutlined />, url: 'https://linkedin.com/company/mantramanthan' },
    { icon: <YoutubeOutlined />, url: 'https://youtube.com/mantramanthan' },
  ];

  return (
    <AntFooter style={{ 
      background: '#001529', 
      color: 'white',
      padding: '48px 24px 24px',
      marginTop: 'auto'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Row gutter={[32, 32]}>
          {/* Company Info */}
          <Col xs={24} sm={12} md={6}>
            <div style={{ marginBottom: '16px' }}>
              <Space>
                <img src="/vite.svg" alt="Siklo Logo" style={{ height: '24px' }} />
                <Title level={4} style={{ color: 'white', margin: 0, fontWeight: 'bold', fontStyle: 'italic' }}>
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
                </Title>
              </Space>
            </div>
            <Paragraph style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>
              Empowering students to achieve their academic goals through smart practice, 
              comprehensive study materials, and personalized learning experiences.
            </Paragraph>
            <Space size="middle">
              {socialLinks.map((social, index) => (
                <Button
                  key={index}
                  type="text"
                  icon={social.icon}
                  style={{ color: 'rgba(255,255,255,0.7)' }}
                  onClick={() => window.open(social.url, '_blank')}
                />
              ))}
            </Space>
          </Col>

          {/* Quick Links */}
          <Col xs={24} sm={12} md={6}>
            <Title level={5} style={{ color: 'white', marginBottom: '16px' }}>
              Quick Links
            </Title>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {quickLinks.map((link, index) => (
                <Link key={index} to={link.path} style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {link.label}
                </Link>
              ))}
            </Space>
          </Col>

          {/* Study Resources */}
          <Col xs={24} sm={12} md={6}>
            <Title level={5} style={{ color: 'white', marginBottom: '16px' }}>
              Study Resources
            </Title>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {studyResources.map((link, index) => (
                <Link key={index} to={link.path} style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {link.label}
                </Link>
              ))}
            </Space>
          </Col>

          {/* Support & Company */}
          <Col xs={24} sm={12} md={6}>
            <Title level={5} style={{ color: 'white', marginBottom: '16px' }}>
              Support & Company
            </Title>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {supportLinks.map((link, index) => (
                <Link key={index} to={link.path} style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {link.label}
                </Link>
              ))}
            </Space>
            <div style={{ marginTop: '16px' }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                {companyLinks.map((link, index) => (
                  <Link key={index} to={link.path} style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                    {link.label}
                  </Link>
                ))}
              </Space>
            </div>
          </Col>
        </Row>

        {/* Contact Info */}
        <Row gutter={[32, 16]} style={{ marginTop: '32px' }}>
          <Col xs={24} md={8}>
            <Space>
              <MailOutlined style={{ color: '#FF7846' }} />
              <Text style={{ color: 'rgba(255,255,255,0.7)' }}>
                support@mantramanthan.com
              </Text>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space>
              <PhoneOutlined style={{ color: '#FF7846' }} />
              <Text style={{ color: 'rgba(255,255,255,0.7)' }}>
                +91 9876543210
              </Text>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space>
              <EnvironmentOutlined style={{ color: '#FF7846' }} />
              <Text style={{ color: 'rgba(255,255,255,0.7)' }}>
                Mumbai, India
              </Text>
            </Space>
          </Col>
        </Row>

        <Divider style={{ borderColor: 'rgba(255,255,255,0.2)', margin: '32px 0 16px' }} />

        {/* Copyright */}
        <Row justify="space-between" align="middle">
          <Col>
            <Text style={{ color: 'rgba(255,255,255,0.7)' }}>
              © {currentYear} <span style={{ 
                color: '#7f8f9d',
                fontFamily: 'Anton, sans-serif',
                fontWeight: 'bold',
                fontStyle: 'italic'
              }}>G</span><span style={{ 
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
              </span>. All rights reserved. Made with ❤️ for students.
            </Text>
          </Col>
          <Col>
            <Space>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                Version 1.0.0
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                Last updated: {new Date().toLocaleDateString()}
              </Text>
            </Space>
          </Col>
        </Row>
      </div>
    </AntFooter>
  );
};
