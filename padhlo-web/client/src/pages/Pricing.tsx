import React, { useState, useEffect } from 'react';
import { Layout, Card, Button, Typography, Row, Col, Tag, message, Spin, Modal, Alert } from 'antd';
import { CheckOutlined, CrownOutlined, RocketOutlined, StarOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useAPI';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import './Pricing.css';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;

interface SubscriptionStatus {
  active: boolean;
  type: 'free' | 'trial' | 'lite' | 'pro';
  expiresAt: string | null;
  startDate: string | null;
}

const Pricing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      setLoadingStatus(true);
      const response = await api.client.get('/subscription/status');
      if (response.data?.success) {
        setSubscriptionStatus(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleStartTrial = async () => {
    try {
      setLoading(true);
      const response = await api.client.post('/subscription/trial');
      if (response.data?.success) {
        message.success('Trial started successfully! You have 7 days of full access.');
        await fetchSubscriptionStatus();
        Modal.success({
          title: 'Trial Activated!',
          content: 'Your 7-day trial has started. You now have access to all Pro features including Community, Leaderboard, and AI Insights.',
          onOk: () => {
            navigate('/dashboard');
          }
        });
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to start trial. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planType: 'lite' | 'pro') => {
    try {
      setLoading(true);
      const endpoint = planType === 'pro' ? '/subscription/pro' : '/subscription/lite';
      const response = await api.client.post(endpoint);
      if (response.data?.success) {
        const messageText = planType === 'pro' 
          ? 'Pro subscription activated successfully! (₹59/month)'
          : 'Lite plan activated successfully! (Free)';
        message.success(messageText);
        await fetchSubscriptionStatus();
        Modal.success({
          title: 'Subscription Activated!',
          content: planType === 'pro'
            ? 'Your Pro subscription is active for 30 days at ₹59/month. You have access to all features including Community, Leaderboard, and AI Insights!'
            : 'Your Lite plan is active for 30 days (Free). Note: Lite plan does not include Community, Leaderboard, or AI Insights.',
          onOk: () => {
            navigate('/dashboard');
          }
        });
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || `Failed to subscribe to ${planType} plan. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return 0;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const isCurrentPlan = (planType: string) => {
    return subscriptionStatus?.type === planType && subscriptionStatus?.active;
  };

  const plans = [
    {
      name: 'Trial',
      icon: <RocketOutlined style={{ fontSize: '32px' }} />,
      price: 'Free',
      duration: '7 days',
      description: 'Full access to all Pro features',
      features: [
        'All Pro features',
        'Community access',
        'Leaderboard',
        'AI Insights',
        'Practice & Exams',
        'Progress tracking',
        'Study materials',
        'Notes & bookmarks'
      ],
      type: 'trial' as const,
      color: '#52c41a',
      badge: 'Best to Start'
    },
    {
      name: 'Lite',
      icon: <StarOutlined style={{ fontSize: '32px' }} />,
      price: 'Free',
      duration: '30 days',
      description: 'Essential features for focused learning',
      features: [
        'Practice & Exams',
        'Progress tracking',
        'Study materials',
        'Notes & bookmarks',
        'Performance analytics',
        'Exam preparation',
        'Daily practice sessions',
        'Unlimited questions'
      ],
      excludedFeatures: [
        'No Community access',
        'No Leaderboard',
        'No AI Insights'
      ],
      type: 'lite' as const,
      color: '#1890ff',
      badge: 'Popular'
    },
    {
      name: 'Pro',
      icon: <CrownOutlined style={{ fontSize: '32px' }} />,
      price: '₹59',
      duration: '30 days',
      description: 'Complete learning experience with all features',
      features: [
        'Everything in Lite',
        'Community access',
        'Leaderboard',
        'AI Insights',
        'Advanced analytics',
        'Priority support',
        'Early access to features',
        'Auto-renewal every 30 days'
      ],
      type: 'pro' as const,
      color: '#ff7846',
      badge: 'Premium'
    }
  ];

  if (loadingStatus) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      <div className="pricing-page">
        <div className="pricing-header">
        <Title level={1} style={{ color: 'white', marginBottom: '16px' }}>
          Choose Your Plan
        </Title>
        <Paragraph style={{ color: 'white', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
          Select the perfect plan for your exam preparation journey
        </Paragraph>
        {subscriptionStatus?.active && (
          <Alert
            message={`Current Plan: ${subscriptionStatus.type.toUpperCase()}`}
            description={
              subscriptionStatus.expiresAt
                ? `Expires in ${getDaysRemaining(subscriptionStatus.expiresAt)} days`
                : 'Active subscription'
            }
            type="info"
            showIcon
            style={{ marginTop: '24px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}
          />
        )}
      </div>

      <div className="pricing-content">
        <Row gutter={[24, 24]} justify="center">
          {plans.map((plan) => (
            <Col xs={24} sm={24} md={8} key={plan.name}>
              <Card
                className={`pricing-card ${isCurrentPlan(plan.type) ? 'current-plan' : ''}`}
                style={{
                  borderColor: plan.color,
                  borderWidth: isCurrentPlan(plan.type) ? '3px' : '1px',
                  height: '100%',
                  position: 'relative'
                }}
              >
                {plan.badge && (
                  <Tag
                    color={plan.color}
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      fontSize: '12px',
                      padding: '4px 12px'
                    }}
                  >
                    {plan.badge}
                  </Tag>
                )}
                {isCurrentPlan(plan.type) && (
                  <Tag
                    color="success"
                    style={{
                      position: 'absolute',
                      top: '16px',
                      left: '16px',
                      fontSize: '12px',
                      padding: '4px 12px'
                    }}
                  >
                    Current Plan
                  </Tag>
                )}
                <div className="plan-icon" style={{ color: plan.color, marginBottom: '16px' }}>
                  {plan.icon}
                </div>
                <Title level={3} style={{ marginBottom: '8px' }}>
                  {plan.name}
                </Title>
                <div className="plan-price">
                  <Text strong style={{ fontSize: '36px', color: plan.color }}>
                    {plan.price}
                  </Text>
                  {plan.price !== 'Free' && (
                    <Text type="secondary" style={{ marginLeft: '8px' }}>
                      /month
                    </Text>
                  )}
                </div>
                <Paragraph type="secondary" style={{ marginBottom: '24px', minHeight: '40px' }}>
                  {plan.description}
                </Paragraph>
                <div className="plan-features">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="feature-item">
                      <CheckOutlined style={{ color: plan.color, marginRight: '8px' }} />
                      <Text>{feature}</Text>
                    </div>
                  ))}
                  {plan.excludedFeatures && (
                    <>
                      {plan.excludedFeatures.map((feature, index) => (
                        <div key={`excluded-${index}`} className="feature-item excluded">
                          <Text type="secondary" delete>
                            {feature}
                          </Text>
                        </div>
                      ))}
                    </>
                  )}
                </div>
                <Button
                  type="primary"
                  size="large"
                  block
                  style={{
                    marginTop: '24px',
                    backgroundColor: plan.color,
                    borderColor: plan.color,
                    height: '48px',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                  loading={loading}
                  disabled={
                    (plan.type === 'trial' && isCurrentPlan('trial')) ||
                    (plan.type === 'lite' && isCurrentPlan('lite')) ||
                    (plan.type === 'pro' && isCurrentPlan('pro'))
                  }
                  onClick={() => {
                    if (plan.type === 'trial') {
                      handleStartTrial();
                    } else {
                      handleSubscribe(plan.type);
                    }
                  }}
                >
                  {isCurrentPlan(plan.type)
                    ? 'Current Plan'
                    : plan.type === 'trial'
                    ? 'Start Free Trial'
                    : `Subscribe to ${plan.name}`}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>

        <div className="pricing-footer">
          <Title level={4}>Frequently Asked Questions</Title>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card size="small">
                <Title level={5}>What's the difference between Lite and Pro?</Title>
                <Text>
                  Lite plan is free and includes all core learning features but excludes Community, Leaderboard, and AI Insights.
                  Pro plan is ₹59/month and includes everything with access to social features and AI-powered insights.
                </Text>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card size="small">
                <Title level={5}>How long is the trial period?</Title>
                <Text>
                  The trial period lasts 7 days with full access to all Pro features. After 7 days, you'll need to
                  subscribe to continue using premium features.
                </Text>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card size="small">
                <Title level={5}>Do plans auto-renew?</Title>
                <Text>
                  Pro plan renews automatically every 30 days at ₹59/month. Lite plan is free and doesn't require renewal.
                  You can cancel Pro subscription anytime from your profile settings.
                </Text>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card size="small">
                <Title level={5}>Can I switch plans?</Title>
                <Text>
                  Yes! You can upgrade from Lite to Pro anytime. Your subscription will be prorated based on remaining
                  days.
                </Text>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
      </div>
      <Footer />
    </Layout>
  );
};

export default Pricing;

