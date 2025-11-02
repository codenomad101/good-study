import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Button, 
  Card,
  Space 
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { AppLayout } from '../components/AppLayout';
import { PerformanceInsights } from '../components/PerformanceInsights';
import { AIInsights } from '../components/AIInsights';
import { useAuth } from '../contexts/AuthContext';
import { useUserStatistics } from '../hooks/useStatistics';
import { useExamHistory } from '../hooks/useExams';
import { useDataServicePracticeHistory } from '../hooks/useQuestions';

const { Title } = Typography;

export default function PerformanceInsightsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: userStats } = useUserStatistics();
  const { data: examHistory = [] } = useExamHistory();
  const { data: practiceHistory = [], isLoading } = useDataServicePracticeHistory();
  
  return (
    <AppLayout>
      <div style={{ padding: '32px 24px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/')}
            style={{ marginBottom: '24px' }}
          >
            Back to Dashboard
          </Button>
          <Title level={1} style={{ margin: 0, fontSize: '32px', fontWeight: '800' }}>
            📊 Your Performance Insights
          </Title>
        </div>
        
        {/* AI Insights - Shows at the top */}
        <AIInsights
          overallAccuracy={userStats ? Math.round(parseFloat(userStats.overallAccuracy || '0')) : 0}
          totalQuestionsAttempted={userStats?.totalQuestionsAttempted || 0}
          currentStreak={userStats?.currentStreak || 0}
          examHistory={examHistory}
          practiceHistory={practiceHistory}
          weakAreas={[]}
        />
        
        {/* Performance Insights */}
        <PerformanceInsights 
          examHistory={examHistory}
          practiceHistory={practiceHistory}
          userStats={userStats}
        />
      </div>
    </AppLayout>
  );
}

