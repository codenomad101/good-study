import React, { useEffect, useState } from 'react';
import { Card, Button, Typography, Result, Space } from 'antd';
import { CrownOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useAPI';

const { Title, Text, Paragraph } = Typography;

interface SubscriptionStatus {
  active: boolean;
  type: 'free' | 'trial' | 'lite' | 'pro';
  expiresAt: string | null;
}

interface SubscriptionGateProps {
  children: React.ReactNode;
  requirePro?: boolean; // If true, requires trial or pro (not lite)
  featureName?: string;
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({
  children,
  requirePro = true,
  featureName = 'this feature'
}) => {
  const navigate = useNavigate();
  const api = useApi();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const response = await api.client.get('/subscription/status');
      if (response.data?.success) {
        setSubscriptionStatus(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching subscription status:', error);
      setSubscriptionStatus({ active: false, type: 'free', expiresAt: null });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // You can return a loading spinner here if needed
  }

  // Check if subscription is active
  const isSubscriptionActive = (status: SubscriptionStatus | null): boolean => {
    if (!status || status.type === 'free') {
      return false;
    }
    if (!status.expiresAt) {
      return false;
    }
    const now = new Date();
    const expiry = new Date(status.expiresAt);
    return expiry > now;
  };

  const active = isSubscriptionActive(subscriptionStatus);
  const hasProFeatures = active && (subscriptionStatus?.type === 'trial' || subscriptionStatus?.type === 'pro');

  // If requirePro is true, check for trial or pro
  // If requirePro is false, any active subscription is fine
  if (requirePro && !hasProFeatures) {
    return (
      <div style={{ padding: '40px 24px', maxWidth: '800px', margin: '0 auto' }}>
        <Result
          icon={<LockOutlined style={{ color: '#ff7846' }} />}
          title={
            subscriptionStatus?.type === 'lite'
              ? 'Upgrade to Pro for This Feature'
              : 'Premium Feature Required'
          }
          subTitle={
            subscriptionStatus?.type === 'lite' ? (
              <Paragraph>
                Your Lite plan doesn't include {featureName}. Upgrade to Pro or start a Trial to access this feature.
              </Paragraph>
            ) : (
              <Paragraph>
                {featureName} requires a Trial or Pro subscription. Start your free 7-day trial or subscribe to Pro plan.
              </Paragraph>
            )
          }
          extra={[
            <Button
              type="primary"
              size="large"
              icon={<CrownOutlined />}
              onClick={() => navigate('/pricing')}
              key="upgrade"
            >
              {subscriptionStatus?.type === 'lite' ? 'Upgrade to Pro' : 'View Plans'}
            </Button>,
            <Button
              key="back"
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>
          ]}
        />
      </div>
    );
  }

  // If subscription is not active at all
  if (!active && requirePro) {
    return (
      <div style={{ padding: '40px 24px', maxWidth: '800px', margin: '0 auto' }}>
        <Result
          icon={<LockOutlined style={{ color: '#ff7846' }} />}
          title="Premium Feature Required"
          subTitle={
            <Paragraph>
              {featureName} requires an active subscription. Start your free 7-day trial or subscribe to a plan.
            </Paragraph>
          }
          extra={[
            <Button
              type="primary"
              size="large"
              icon={<CrownOutlined />}
              onClick={() => navigate('/pricing')}
              key="subscribe"
            >
              View Plans & Pricing
            </Button>,
            <Button
              key="back"
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>
          ]}
        />
      </div>
    );
  }

  // User has access, render children
  return <>{children}</>;
};

