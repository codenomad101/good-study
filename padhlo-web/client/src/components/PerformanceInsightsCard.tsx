import React from 'react';
import { Card, Typography, Row, Col, Tag, Space, Button, Progress, List, Divider } from 'antd';
import { 
  InfoCircleOutlined, 
  ArrowRightOutlined,
  BulbOutlined,
  WarningOutlined,
  TrophyOutlined 
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

interface PerformanceInsightsCardProps {
  examHistory?: any[];
  practiceHistory?: any[];
  userStats?: any;
}

export const PerformanceInsightsCard: React.FC<PerformanceInsightsCardProps> = ({
  examHistory = [],
  practiceHistory = [],
  userStats
}) => {
  
  // Type assertions for arrays
  const examHistoryArray = (examHistory as any[]) || [];
  const practiceHistoryArray = (practiceHistory as any[]) || [];
  
  // Quick analysis to identify weak areas
  const getQuickInsights = (): { category: string; score: number; count: number; color: string }[] => {
    const performance: Record<string, { scores: number[], count: number }> = {};
    
    // Process exam history
    examHistoryArray.forEach((exam: any) => {
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
    practiceHistoryArray.forEach((session: any) => {
      const accuracy = session.accuracy || 0;
      const category = session.category || 'General';
      
      if (!performance[category]) {
        performance[category] = { scores: [], count: 0 };
      }
      performance[category].scores.push(accuracy);
      performance[category].count++;
    });
    
    // Get weak areas
    const weakAreas: { category: string; score: number; count: number; color: string }[] = [];
    
    Object.entries(performance).forEach(([category, data]) => {
      const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
      
      // Filter out 0% scores and only show meaningful weak areas
      // Skip "Current Affairs" if it has very low scores
      if (avgScore > 0 && avgScore < 60 && data.count >= 2) {
        // Skip "Current Affairs" and "General" with very low scores as they're not meaningful
        if ((category === 'Current Affairs' || category === 'General') && avgScore < 30) {
          return;
        }
        
        weakAreas.push({
          category,
          score: Math.round(avgScore),
          count: data.count,
          color: getCategoryColor(category)
        });
      }
    });
    
    return weakAreas.sort((a, b) => a.score - b.score).slice(0, 3);
  };
  
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
  
  const getCategoryColor = (category: string): string => {
    const colorMap: Record<string, string> = {
      'English': '#3b82f6',
      'History': '#ef4444',
      'Economy': '#10b981',
      'Geography': '#8b5cf6',
      'Polity': '#f59e0b',
      'Science': '#ec4899',
      'Current Affairs': '#06b6d4',
      'Aptitude': '#6366f1',
      'Agriculture': '#84cc16',
      'General': '#6b7280'
    };
    
    return colorMap[category] || '#6b7280';
  };
  
  const weakAreas = getQuickInsights();
  
  const overallAccuracy = userStats 
    ? Math.round(parseFloat(userStats.overallAccuracy || '0')) 
    : 0;
  
  // Get suggestions for weak areas
  const getSuggestions = (category: string): string[] => {
    const baseSuggestions: Record<string, string[]> = {
      'English': ['Review grammar fundamentals', 'Practice reading comprehension', 'Build vocabulary daily', 'Focus on error detection'],
      'History': ['Create chronological timelines', 'Study key battles', 'Learn historical personalities', 'Practice dates'],
      'Economy': ['Understand basic concepts', 'Study current trends', 'Practice calculations', 'Learn economic models'],
      'Geography': ['Study physical features', 'Learn climate patterns', 'Practice map reading', 'Focus on regional geography'],
      'Polity': ['Study constitutional provisions', 'Focus on fundamental rights', 'Understand procedures', 'Review governance'],
      'Science': ['Practice scientific concepts', 'Focus on reactions', 'Study biological processes', 'Work on calculations'],
      'Current Affairs': ['Stay updated with news', 'Read newspapers regularly', 'Focus on national affairs', 'Study policies'],
      'Aptitude': ['Practice calculations daily', 'Work on logical reasoning', 'Focus on quantitative', 'Learn shortcuts'],
      'Agriculture': ['Study processes', 'Learn cultivation methods', 'Understand policies', 'Focus on management'],
      'General': ['Practice regularly', 'Focus on weak areas', 'Review mistakes', 'Take mock tests']
    };
    
    return baseSuggestions[category] || baseSuggestions['General'];
  };
  
  return (
    <Card
      style={{
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        background: weakAreas.length > 0 ? '#fff7ed' : '#f0fdf4',
        height: '100%'
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0, fontSize: '18px' }}>
              📊 Performance Insights
            </Title>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {weakAreas.length > 0 
                ? `${weakAreas.length} area${weakAreas.length > 1 ? 's' : ''} need attention`
                : 'You\'re doing great!'}
            </Text>
          </div>
          {weakAreas.length > 0 && (
            <WarningOutlined style={{ fontSize: '24px', color: '#f59e0b' }} />
          )}
        </div>
        
        {/* Overall Accuracy */}
        <div style={{ 
          padding: '12px',
          background: '#f9fafb',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Text strong style={{ fontSize: '14px' }}>
            Overall Accuracy
          </Text>
          <Text strong style={{ fontSize: '18px', color: overallAccuracy >= 70 ? '#10b981' : overallAccuracy >= 50 ? '#f59e0b' : '#ef4444' }}>
            {overallAccuracy}%
          </Text>
        </div>
        
        {/* Main Content */}
        {weakAreas.length > 0 ? (
          <>
            {/* Show first weak area with suggestions */}
            <div>
              <Tag color={weakAreas[0].color} style={{ fontWeight: '600', fontSize: '12px', marginBottom: '8px' }}>
                {weakAreas[0].category} - {weakAreas[0].score}%
              </Tag>
              <Progress 
                percent={weakAreas[0].score} 
                strokeColor={weakAreas[0].color}
                showInfo={false}
                strokeWidth={6}
                style={{ marginBottom: '12px' }}
              />
              
              {/* Quick Suggestions - Top 3 */}
              <div style={{ marginBottom: '12px' }}>
                {getSuggestions(weakAreas[0].category).slice(0, 3).map((suggestion, idx) => (
                  <div key={idx} style={{ 
                    fontSize: '12px', 
                    color: '#374151',
                    padding: '4px 0',
                    display: 'flex',
                    alignItems: 'flex-start'
                  }}>
                    <BulbOutlined style={{ color: weakAreas[0].color, marginRight: '6px', marginTop: '2px', fontSize: '10px' }} />
                    <Text style={{ fontSize: '12px' }}>{suggestion}</Text>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Show additional areas indicator */}
            {weakAreas.length > 1 && (
              <div style={{ 
                padding: '6px 10px',
                background: 'rgba(251, 191, 36, 0.1)',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#92400e',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                +{weakAreas.length - 1} more area{weakAreas.length > 2 ? 's' : ''} need attention
              </div>
            )}
            
            <Link to="/performance-insights">
              <Button 
                type="primary"
                block
                icon={<ArrowRightOutlined />}
                style={{ height: '36px', fontWeight: '600', fontSize: '13px' }}
              >
                View All Insights
              </Button>
            </Link>
          </>
        ) : (
          <>
            <div style={{ 
              padding: '12px',
              background: '#ecfdf5',
              borderRadius: '8px',
              textAlign: 'center',
              marginBottom: '12px'
            }}>
              <Text style={{ fontSize: '13px', color: '#059669' }}>
                🎉 Great work! Keep practicing to excel.
              </Text>
            </div>
            
            <Link to="/performance-insights">
              <Button 
                type="default"
                block
                icon={<ArrowRightOutlined />}
                style={{ height: '36px', fontWeight: '600', fontSize: '13px' }}
              >
                View Detailed Insights
              </Button>
            </Link>
          </>
        )}
      </Space>
    </Card>
  );
};

