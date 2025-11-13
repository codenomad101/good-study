import React from 'react';
import { Card, Typography, Space, Button, Spin, Alert } from 'antd';
import { BulbOutlined, StarOutlined } from '@ant-design/icons';
import { useAIInsights } from '../hooks/useAIInsights';

const { Title, Text, Paragraph } = Typography;

interface AIInsightsProps {
  overallAccuracy: number;
  totalQuestionsAttempted: number;
  currentStreak: number;
  examHistory: any[];
  practiceHistory: any[];
  weakAreas: Array<{ category: string; score: number; testCount: number }>;
}

export const AIInsights: React.FC<AIInsightsProps> = ({
  overallAccuracy,
  totalQuestionsAttempted,
  currentStreak,
  examHistory,
  practiceHistory,
  weakAreas
}) => {
  
  const data = {
    overallAccuracy,
    totalQuestionsAttempted,
    currentStreak,
    examHistory: examHistory as any[],
    practiceHistory: practiceHistory as any[],
    weakAreas
  };
  
  const { insights, loading } = useAIInsights(data);
  
  return (
    <Card
      style={{
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        marginTop: '24px'
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StarOutlined style={{ fontSize: '20px', color: 'white' }} />
          <Title level={4} style={{ margin: 0, color: 'white' }}>
            AI-Powered Performance Insights
          </Title>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
            <Text style={{ color: 'white', display: 'block', marginTop: '12px' }}>
              Analyzing your performance...
            </Text>
          </div>
        ) : insights ? (
          <Paragraph style={{ 
            color: 'white', 
            fontSize: '14px',
            lineHeight: '1.8',
            margin: 0,
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '16px',
            borderRadius: '8px'
          }}>
            {insights}
          </Paragraph>
        ) : (
          <Alert
            message="Unable to generate insights"
            type="info"
            style={{ background: 'rgba(255, 255, 255, 0.9)' }}
          />
        )}
        
        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '11px' }}>
          💡 Insight powered by {import.meta.env.VITE_HUGGINGFACE_API_KEY ? 'Pythia-160m AI' : 'smart analysis'}. 
          {!import.meta.env.VITE_HUGGINGFACE_API_KEY && ' Set up API keys for enhanced AI analysis.'}
        </Text>
      </Space>
    </Card>
  );
};


