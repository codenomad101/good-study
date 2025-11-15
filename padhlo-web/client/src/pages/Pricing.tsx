import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Row, Col, Tag, message, Spin, Modal, Alert } from 'antd';
import { CheckOutlined, CrownOutlined, RocketOutlined, StarOutlined, CloseOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useAPI';
import { AppLayout } from '../components/AppLayout';

const { Title, Text, Paragraph } = Typography;

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
        message.success('Trial started successfully! You have 3 days of full access.');
        await fetchSubscriptionStatus();
        Modal.success({
          title: 'Trial Activated!',
          content: 'Your 3-day trial has started. You now have access to all Pro features including Community, Leaderboard, and AI Insights. After 3 days, you can choose to auto-pay to Pro (₹79/month) or switch to the free plan.',
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
          ? 'Pro subscription activated successfully! (₹79/month)'
          : 'Lite plan activated successfully! (₹59/month)';
        message.success(messageText);
        await fetchSubscriptionStatus();
        Modal.success({
          title: 'Subscription Activated!',
          content: planType === 'pro'
            ? 'Your Pro subscription is active for 30 days at ₹79/month. You have access to all features including Community, Leaderboard, and AI Insights!'
            : 'Your Lite plan is active for 30 days at ₹59/month. Note: Lite plan does not include Community, Leaderboard, or AI Insights.',
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
      name: 'Free',
      icon: <StarOutlined style={{ fontSize: '32px' }} />,
      price: 'Free',
      duration: 'Forever',
      description: 'Basic features with daily limits',
      features: [
        'Practice & Exams',
        '3 practice sessions per day',
        '3 exam sessions per day',
        'Progress tracking',
        'Study materials'
      ],
      excludedFeatures: [
        'No Community access',
        'No Notes access',
        'No Leaderboard',
        'No AI Insights'
      ],
      type: 'free' as const,
      color: '#8c8c8c'
    },
    {
      name: 'Trial',
      icon: <RocketOutlined style={{ fontSize: '32px' }} />,
      price: 'Free',
      duration: '3 days',
      description: 'Full access to all Pro features for 3 days',
      features: [
        'All Pro features',
        'Community access',
        'Leaderboard',
        'AI Insights',
        'Unlimited Practice & Exams',
        'Progress tracking',
        'Study materials',
        'Notes & bookmarks',
        'Auto-pay to Pro (₹79/month) or switch to Free after 3 days'
      ],
      type: 'trial' as const,
      color: '#52c41a',
      badge: 'Best to Start'
    },
    {
      name: 'Lite',
      icon: <StarOutlined style={{ fontSize: '32px' }} />,
      price: '₹59',
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
      price: '₹79',
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
      <AppLayout>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh' 
        }}>
          <Spin size="large" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ 
        padding: '24px', 
        maxWidth: '1400px', 
        margin: '0 auto',
        backgroundColor: '#F8FAFC',
        minHeight: '100vh'
      }}>
        {/* Header Card */}
        <Card
          style={{
            marginBottom: '32px',
            borderRadius: '20px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            background: '#FFFFFF',
            textAlign: 'center'
          }}
          bodyStyle={{ padding: '40px 24px' }}
        >
          <Title level={1} style={{ 
            margin: '0 0 12px 0',
            fontSize: '32px',
            fontWeight: '800',
            color: '#1F2937'
          }}>
            Choose Your Plan
          </Title>
          <Text style={{ 
            fontSize: '16px', 
            color: '#6B7280',
            fontWeight: '500'
          }}>
            Unlock your learning potential with our flexible subscription plans
          </Text>
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
              style={{ 
                marginTop: '24px',
                maxWidth: '500px',
                margin: '24px auto 0'
              }}
            />
          )}
        </Card>

        {/* Plans Grid */}
        <Row gutter={[24, 24]} justify="center">
          {plans.map((plan) => (
            <Col xs={24} sm={24} md={12} lg={6} key={plan.name}>
              <Card
                style={{
                  borderRadius: '20px',
                  border: isCurrentPlan(plan.type) ? `2px solid ${plan.color}` : '1px solid #E5E7EB',
                  boxShadow: isCurrentPlan(plan.type) 
                    ? `0 4px 12px rgba(0, 0, 0, 0.1)` 
                    : '0 2px 8px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.3s ease',
                  height: '100%',
                  position: 'relative',
                  backgroundColor: isCurrentPlan(plan.type) ? '#F0F9FF' : '#FFFFFF'
                }}
                bodyStyle={{ padding: '24px' }}
              >
                {plan.badge && (
                  <Tag
                    color={plan.color}
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      fontSize: '12px',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontWeight: '600'
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
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontWeight: '600'
                    }}
                  >
                    Current Plan
                  </Tag>
                )}
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  marginBottom: '16px',
                  marginTop: plan.badge || isCurrentPlan(plan.type) ? '32px' : '0'
                }}>
                  <div style={{ color: plan.color }}>
                    {plan.icon}
                  </div>
                  <Title level={3} style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
                    {plan.name}
                  </Title>
                </div>

                <div style={{ 
                  display: 'flex', 
                  alignItems: 'baseline', 
                  marginBottom: '8px' 
                }}>
                  <Text strong style={{ 
                    fontSize: '36px', 
                    fontWeight: '800',
                    color: plan.color 
                  }}>
                    {plan.price}
                  </Text>
                  {plan.price !== 'Free' && (
                    <Text type="secondary" style={{ marginLeft: '8px', fontSize: '16px' }}>
                      /month
                    </Text>
                  )}
                </div>
                <Text type="secondary" style={{ 
                  display: 'block',
                  marginBottom: '24px',
                  fontSize: '14px',
                  minHeight: '40px'
                }}>
                  {plan.description}
                </Text>

                <div style={{ marginBottom: '24px', minHeight: '300px' }}>
                  {plan.features.map((feature, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: '12px',
                      gap: '8px'
                    }}>
                      <CheckOutlined style={{ 
                        color: '#52c41a', 
                        marginTop: '4px',
                        fontSize: '16px'
                      }} />
                      <Text style={{ 
                        fontSize: '14px',
                        color: '#1F2937',
                        lineHeight: '1.5'
                      }}>
                        {feature}
                      </Text>
                    </div>
                  ))}
                  {plan.excludedFeatures && (
                    <>
                      {plan.excludedFeatures.map((feature, index) => (
                        <div key={`excluded-${index}`} style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          marginBottom: '12px',
                          gap: '8px'
                        }}>
                          <CloseOutlined style={{ 
                            color: '#ff4d4f', 
                            marginTop: '4px',
                            fontSize: '16px'
                          }} />
                          <Text type="secondary" style={{ 
                            fontSize: '14px',
                            textDecoration: 'line-through',
                            lineHeight: '1.5'
                          }}>
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
                    marginTop: 'auto',
                    borderRadius: '12px',
                    height: '48px',
                    fontSize: '16px',
                    fontWeight: '600',
                    backgroundColor: plan.color,
                    borderColor: plan.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
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
                    } else if (plan.type !== 'free') {
                      handleSubscribe(plan.type);
                    }
                  }}
                >
                  {isCurrentPlan(plan.type)
                    ? 'Current Plan'
                    : plan.type === 'trial'
                    ? 'Start Free Trial'
                    : plan.type === 'free'
                    ? 'Current Plan'
                    : `Subscribe to ${plan.name}`}
                  {!isCurrentPlan(plan.type) && plan.type !== 'free' && (
                    <ArrowRightOutlined />
                  )}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>

        {/* FAQ Section */}
        <Card
          style={{
            marginTop: '48px',
            borderRadius: '20px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            background: '#FFFFFF'
          }}
          bodyStyle={{ padding: '32px' }}
        >
          <Title level={2} style={{ 
            margin: '0 0 24px 0',
            fontSize: '24px',
            fontWeight: '700',
            color: '#1F2937',
            textAlign: 'center'
          }}>
            Frequently Asked Questions
          </Title>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card 
                size="small"
                style={{
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  height: '100%'
                }}
                bodyStyle={{ padding: '20px' }}
              >
                <Title level={4} style={{ 
                  margin: '0 0 12px 0',
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#1F2937'
                }}>
                  What's the difference between Lite and Pro?
                </Title>
                <Text style={{ 
                  fontSize: '14px',
                  color: '#6B7280',
                  lineHeight: '1.6'
                }}>
                  Lite plan is ₹59/month and includes all core learning features but excludes Community, Leaderboard, and AI Insights.
                  Pro plan is ₹79/month and includes everything with access to social features and AI-powered insights.
                </Text>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card 
                size="small"
                style={{
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  height: '100%'
                }}
                bodyStyle={{ padding: '20px' }}
              >
                <Title level={4} style={{ 
                  margin: '0 0 12px 0',
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#1F2937'
                }}>
                  How long is the trial period?
                </Title>
                <Text style={{ 
                  fontSize: '14px',
                  color: '#6B7280',
                  lineHeight: '1.6'
                }}>
                  The trial period lasts 3 days with full access to all Pro features. After 3 days, you can choose to
                  subscribe to Pro (₹79/month) or switch to the free plan.
                </Text>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card 
                size="small"
                style={{
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  height: '100%'
                }}
                bodyStyle={{ padding: '20px' }}
              >
                <Title level={4} style={{ 
                  margin: '0 0 12px 0',
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#1F2937'
                }}>
                  Do plans auto-renew?
                </Title>
                <Text style={{ 
                  fontSize: '14px',
                  color: '#6B7280',
                  lineHeight: '1.6'
                }}>
                  Pro plan renews automatically every 30 days at ₹79/month. Lite plan renews automatically every 30 days at ₹59/month.
                  You can cancel any subscription anytime from your profile settings.
                </Text>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card 
                size="small"
                style={{
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  height: '100%'
                }}
                bodyStyle={{ padding: '20px' }}
              >
                <Title level={4} style={{ 
                  margin: '0 0 12px 0',
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#1F2937'
                }}>
                  Can I switch plans?
                </Title>
                <Text style={{ 
                  fontSize: '14px',
                  color: '#6B7280',
                  lineHeight: '1.6'
                }}>
                  Yes! You can upgrade from Lite to Pro anytime. Your subscription will be prorated based on remaining
                  days.
                </Text>
              </Card>
            </Col>
          </Row>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Pricing;
