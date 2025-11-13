import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Button, 
  Card,
  Space 
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { AppLayout } from '../components/AppLayout';
import { SubscriptionGate } from '../components/SubscriptionGate';
import { PerformanceInsights } from '../components/PerformanceInsights';
import { AIInsights } from '../components/AIInsights';
import { AIChat } from '../components/AIChat';
import { useAuth } from '../contexts/AuthContext';
import { useUserStatistics } from '../hooks/useStatistics';
import { useExamHistory } from '../hooks/useExams';
import { useDataServicePracticeHistory } from '../hooks/useQuestions';

const { Title } = Typography;

// Extract category helper function
const extractCategory = (examName: string): string => {
  const name = examName.toLowerCase();
  
  if (name.includes('english') || name.includes('grammar')) return 'English';
  if (name.includes('history')) return 'History';
  if (name.includes('economy') || name.includes('economic')) return 'Economy';
  if (name.includes('geography') || name.includes('geo')) return 'Geography';
  if (name.includes('polity') || name.includes('political')) return 'Polity';
  if (name.includes('science')) return 'Science';
  if (name.includes('current affairs') || name.includes('gk')) return 'Current Affairs';
  if (name.includes('aptitude') || name.includes('math')) return 'Aptitude';
  if (name.includes('agriculture')) return 'Agriculture';
  
  return 'General';
};

export default function PerformanceInsightsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: userStats } = useUserStatistics();
  const { data: examHistory = [] } = useExamHistory();
  const { data: practiceHistory = [], isLoading } = useDataServicePracticeHistory();
  
  // Calculate weak areas
  const weakAreas = useMemo(() => {
    const performance: Record<string, { scores: number[], count: number }> = {};
    
    // Process exam history
    examHistory.forEach((exam: any) => {
      const percentage = typeof exam.percentage === 'string' 
        ? parseFloat(exam.percentage) 
        : (exam.percentage ?? 0);
      
      const examName = exam.examName || exam.name || '';
      const category = extractCategory(examName);
      
      if (!performance[category]) {
        performance[category] = { scores: [], count: 0 };
      }
      performance[category].scores.push(percentage);
      performance[category].count++;
    });
    
    // Process practice history
    practiceHistory.forEach((session: any) => {
      const percentage = session.percentage 
        ? (typeof session.percentage === 'string' ? parseFloat(session.percentage) : session.percentage)
        : (session.accuracy || 0);
      const category = session.category || 'General';
      
      if (!performance[category]) {
        performance[category] = { scores: [], count: 0 };
      }
      performance[category].scores.push(percentage);
      performance[category].count++;
    });
    
    // Calculate weak areas
    const weak: Array<{ category: string; score: number; testCount: number }> = [];
    
    Object.entries(performance).forEach(([category, data]) => {
      if (data.scores.length === 0) return;
      const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
      
      if (avgScore > 0 && avgScore < 60 && data.count >= 2) {
        if ((category === 'Current Affairs' || category === 'General') && avgScore < 30) {
          return;
        }
        
        weak.push({
          category,
          score: Math.round(avgScore),
          testCount: data.count
        });
      }
    });
    
    return weak.sort((a, b) => a.score - b.score);
  }, [examHistory, practiceHistory]);
  
  // Prepare performance data for AI
  const performanceData = useMemo(() => ({
    overallAccuracy: userStats ? Math.round(parseFloat(userStats.overallAccuracy || '0')) : 0,
    totalQuestionsAttempted: userStats?.totalQuestionsAttempted || 0,
    currentStreak: userStats?.currentStreak || 0,
    examHistory: examHistory as any[],
    practiceHistory: practiceHistory as any[],
    weakAreas: weakAreas
  }), [userStats, examHistory, practiceHistory, weakAreas]);
  
  return (
    <SubscriptionGate requirePro={true} featureName="AI Insights">
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
          overallAccuracy={performanceData.overallAccuracy}
          totalQuestionsAttempted={performanceData.totalQuestionsAttempted}
          currentStreak={performanceData.currentStreak}
          examHistory={performanceData.examHistory}
          practiceHistory={performanceData.practiceHistory}
          weakAreas={weakAreas}
        />
        
        {/* AI Chat - Ask questions about performance */}
        <AIChat performanceData={performanceData} />
        
        {/* Performance Insights */}
        <PerformanceInsights 
          examHistory={examHistory}
          practiceHistory={practiceHistory}
          userStats={userStats}
        />
      </div>
      </AppLayout>
    </SubscriptionGate>
  );
}

