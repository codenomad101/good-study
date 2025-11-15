import React from 'react';
import { AppLayout } from '../components/AppLayout';
import { Typography, Card, Space, Row, Col, Collapse } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

export default function HelpPage() {
  const faqs = [
    {
      question: 'How do I start a practice session?',
      answer: 'Navigate to the Practice page, select a category that interests you, choose a topic, and click "Start Practice" to begin your 15-minute practice session with 20 carefully selected questions.'
    },
    {
      question: 'How do dynamic exams work?',
      answer: 'Go to the Exams page and click "Create New Exam". You can configure question distribution across categories, set optional topics, choose duration, enable negative marking, and start your personalized exam.'
    },
    {
      question: 'Where can I study notes?',
      answer: 'Visit the Study page, select a category, and optionally choose a specific topic. You\'ll find concise, well-organized study materials covering all important concepts for your exam preparation.'
    },
    {
      question: 'How do I track my progress?',
      answer: 'Check the Performance Insights page to see detailed analytics including accuracy by category, weak areas, improvement trends, and personalized recommendations for better performance.'
    },
    {
      question: 'Can I practice in Marathi?',
      answer: 'Yes! Padhero supports both Marathi and English. You can switch languages when starting a practice session or exam. All questions and explanations are available in both languages.'
    },
    {
      question: 'How are questions selected for practice?',
      answer: 'Our smart algorithm selects 20 questions from multiple categories with adaptive difficulty levels, ensuring a balanced practice session that covers various topics and difficulty ranges.'
    },
    {
      question: 'What is the difference between Practice and Exams?',
      answer: 'Practice sessions are quick 15-minute sessions with 20 questions for daily practice. Exams are customizable, longer tests that simulate real exam conditions with configurable settings.'
    },
    {
      question: 'How do I reset my password?',
      answer: 'Click "Forgot Password?" on the login page, enter your email, and you\'ll receive an OTP. Enter the OTP and set your new password to complete the reset process.'
    }
  ];

  const quickGuides = [
    {
      title: 'Getting Started',
      steps: [
        'Create an account or sign in',
        'Explore the Practice page to see available categories',
        'Start your first practice session',
        'Check your performance in the dashboard'
      ]
    },
    {
      title: 'Taking an Exam',
      steps: [
        'Go to the Exams page',
        'Click "Create New Exam"',
        'Configure your exam settings',
        'Start the exam and complete all questions',
        'Review your results and explanations'
      ]
    },
    {
      title: 'Improving Performance',
      steps: [
        'Review Performance Insights regularly',
        'Focus on weak areas identified by AI',
        'Practice daily to maintain your streak',
        'Study notes for topics you struggle with',
        'Take mock exams to simulate real conditions'
      ]
    }
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
            <QuestionCircleOutlined style={{ fontSize: '64px', color: '#FF7846', marginBottom: '24px' }} />
            <Title level={1} style={{ 
              fontSize: '48px',
              fontWeight: '800',
              color: '#1F2937',
              marginBottom: '24px',
              lineHeight: '1.2'
            }}>
              Help Center
            </Title>
            <Paragraph style={{ 
              fontSize: '20px',
              color: '#6B7280',
              maxWidth: '700px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              Find answers to common questions and learn how to make the most of Padhero
            </Paragraph>
          </div>

          {/* Quick Guides */}
          <div style={{ marginBottom: '64px' }}>
            <Title level={2} style={{ color: '#1F2937', marginBottom: '32px' }}>
              Quick Guides
            </Title>
            <Row gutter={[24, 24]}>
              {quickGuides.map((guide, index) => (
                <Col xs={24} md={8} key={index}>
                  <Card style={{
                    height: '100%',
                    borderRadius: '16px',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                  }}>
                    <Title level={4} style={{ color: '#1F2937', marginBottom: '16px' }}>
                      {guide.title}
                    </Title>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      {guide.steps.map((step, stepIndex) => (
                        <div key={stepIndex} style={{ display: 'flex', alignItems: 'flex-start' }}>
                          <Text strong style={{ color: '#FF7846', marginRight: '8px', minWidth: '24px' }}>
                            {stepIndex + 1}.
                          </Text>
                          <Text style={{ color: '#6B7280', flex: 1 }}>{step}</Text>
                        </div>
                      ))}
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>

          {/* FAQs */}
          <div>
            <Title level={2} style={{ color: '#1F2937', marginBottom: '32px' }}>
              Frequently Asked Questions
            </Title>
            <Card style={{
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
            }}>
              <Collapse
                accordion
                items={faqs.map((faq, index) => ({
                  key: index,
                  label: (
                    <Text strong style={{ fontSize: '16px', color: '#1F2937' }}>
                      {faq.question}
                    </Text>
                  ),
                  children: (
                    <Paragraph style={{ color: '#6B7280', margin: 0, lineHeight: '1.8' }}>
                      {faq.answer}
                    </Paragraph>
                  ),
                  style: {
                    marginBottom: '12px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB'
                  }
                }))}
              />
            </Card>
          </div>

          {/* Contact Support */}
          <Card style={{
            marginTop: '48px',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)'
          }}>
            <Title level={3} style={{ color: '#1F2937', marginBottom: '16px' }}>
              Still Need Help?
            </Title>
            <Paragraph style={{ color: '#6B7280', marginBottom: '24px', fontSize: '16px' }}>
              Can't find what you're looking for? Our support team is here to help you.
            </Paragraph>
            <a href="/contact">
              <button style={{
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#FFFFFF',
                background: 'linear-gradient(135deg, #FF7846 0%, #FF5722 100%)',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
              }}>
                Contact Support
              </button>
            </a>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

