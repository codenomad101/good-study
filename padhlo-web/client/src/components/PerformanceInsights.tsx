import React from 'react';
import { 
  Card, 
  Typography, 
  Row, 
  Col, 
  Tag, 
  Progress, 
  Alert,
  Space,
  Button,
  Empty
} from 'antd';
import {
  BulbOutlined,
  BookOutlined,
  TrophyOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

interface PerformanceInsightsProps {
  examHistory?: any[];
  practiceHistory?: any[];
  userStats?: any;
}

interface WeakArea {
  category: string;
  avgScore: number;
  testCount: number;
  suggestions: string[];
  color: string;
}

export const PerformanceInsights: React.FC<PerformanceInsightsProps> = ({
  examHistory = [],
  practiceHistory = [],
  userStats
}) => {
  
  // Analyze performance to identify weak areas
  const analyzePerformance = (): WeakArea[] => {
    const performance: Record<string, { scores: number[], count: number }> = {};
    
    // Process exam history
    examHistory.forEach((exam: any) => {
      const percentage = typeof exam.percentage === 'string' 
        ? parseFloat(exam.percentage) 
        : (exam.percentage ?? 0);
      
      // Extract category from exam name
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
      const accuracy = session.accuracy || 0;
      const category = session.category || 'General';
      
      if (!performance[category]) {
        performance[category] = { scores: [], count: 0 };
      }
      performance[category].scores.push(accuracy);
      performance[category].count++;
    });
    
    // Calculate average scores and identify weak areas (< 60%)
    const weakAreas: WeakArea[] = [];
    
    Object.entries(performance).forEach(([category, data]) => {
      const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
      
      // Filter out 0% scores and only show meaningful weak areas
      // Skip "Current Affairs" and "General" with very low scores as they're not meaningful
      if (avgScore > 0 && avgScore < 60 && data.count >= 2) {
        // Skip "Current Affairs" and "General" with very low scores
        if ((category === 'Current Affairs' || category === 'General') && avgScore < 30) {
          return;
        }
        
        const suggestions = getSuggestions(category, avgScore);
        weakAreas.push({
          category,
          avgScore: Math.round(avgScore),
          testCount: data.count,
          suggestions,
          color: getCategoryColor(category)
        });
      }
    });
    
    // Sort by average score (lowest first)
    return weakAreas.sort((a, b) => a.avgScore - b.avgScore);
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
  
  const getSuggestions = (category: string, score: number): string[] => {
    const baseSuggestions: Record<string, string[]> = {
      'English': [
        'Review grammar fundamentals daily for 15 minutes',
        'Practice reading comprehension passages regularly',
        'Build vocabulary with daily word lists',
        'Focus on sentence correction and error detection',
        'Study common idioms and phrases'
      ],
      'History': [
        'Create chronological timelines of major events',
        'Focus on key battles and their outcomes',
        'Study important historical personalities in detail',
        'Practice questions on historical dates and periods',
        'Review Mahrashtra and Indian history thoroughly'
      ],
      'Economy': [
        'Understand basic economic concepts and terminologies',
        'Study current economic policies and trends',
        'Practice calculation problems from economics',
        'Learn about different economic models and theories',
        'Stay updated with economic current affairs'
      ],
      'Geography': [
        'Study physical geography features thoroughly',
        'Learn about climate patterns and weather',
        'Practice map reading and locations',
        'Focus on regional geography of India',
        'Understand geological processes'
      ],
      'Polity': [
        'Study constitutional provisions in detail',
        'Focus on fundamental rights and duties',
        'Understand parliamentary procedures',
        'Learn about governance structures',
        'Review important constitutional amendments'
      ],
      'Science': [
        'Practice basic scientific concepts regularly',
        'Focus on chemical reactions and equations',
        'Study biological processes in detail',
        'Work on physics calculation problems',
        'Understand scientific laws and principles'
      ],
      'Current Affairs': [
        'Stay updated with daily news and events',
        'Read newspapers and magazines regularly',
        'Focus on national and international affairs',
        'Study government schemes and policies',
        'Practice monthly current affairs quizzes'
      ],
      'Aptitude': [
        'Practice mathematical calculations daily',
        'Work on logical reasoning problems',
        'Focus on quantitative aptitude',
        'Practice data interpretation regularly',
        'Study shortcut methods for calculations'
      ],
      'Agriculture': [
        'Study agricultural processes and techniques',
        'Learn about crop cultivation methods',
        'Understand agricultural policies and schemes',
        'Focus on soil and crop management',
        'Review agricultural economics'
      ],
      'General': [
        'Practice regularly across all subjects',
        'Focus on weak areas identified',
        'Review mistakes from previous tests',
        'Take mock tests to improve speed',
        'Maintain a balanced study schedule'
      ]
    };
    
    return baseSuggestions[category] || baseSuggestions['General'];
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
  
  const weakAreas = analyzePerformance();
  
  // If no weak areas found
  if (weakAreas.length === 0) {
    return (
      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical" size="small">
              <Text>No areas need immediate improvement!</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Keep up the excellent work. Continue practicing to maintain your performance.
              </Text>
            </Space>
          }
        >
          <Link to="/practice">
            <Button type="primary" icon={<TrophyOutlined />}>
              Continue Practicing
            </Button>
          </Link>
        </Empty>
      </Card>
    );
  }
  
  return (
    <div>
      <Alert
        message="Performance Improvement Needed"
        description={`You have ${weakAreas.length} area${weakAreas.length > 1 ? 's' : ''} where your performance needs attention. Focus on these areas to improve your overall score.`}
        type="warning"
        icon={<WarningOutlined />}
        style={{ marginBottom: '24px' }}
        showIcon
      />
      
      <Row gutter={[16, 16]}>
        {weakAreas.map((area, index) => (
          <Col xs={24} md={12} lg={8} key={index}>
            <Card
              style={{
                height: '100%',
                borderRadius: '12px',
                border: `2px solid ${area.color}20`,
                background: `${area.color}05`
              }}
              hoverable
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {/* Category Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Tag 
                      color={area.color}
                      style={{ 
                        fontSize: '16px',
                        fontWeight: 'bold',
                        padding: '4px 12px',
                        marginBottom: '8px'
                      }}
                    >
                      {area.category}
                    </Tag>
                    <div style={{ marginTop: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {area.testCount} test{area.testCount > 1 ? 's' : ''} analyzed
                      </Text>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Text strong style={{ fontSize: '20px', color: area.color }}>
                      {area.avgScore}%
                    </Text>
                    <div>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        Average Score
                      </Text>
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <Progress 
                  percent={area.avgScore} 
                  strokeColor={area.color}
                  status={area.avgScore < 40 ? 'exception' : area.avgScore < 60 ? 'active' : 'success'}
                  showInfo={false}
                  strokeWidth={6}
                />
                
                {/* Suggestions */}
                <div style={{ marginTop: '8px' }}>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BulbOutlined style={{ color: area.color }} />
                    <Text strong style={{ fontSize: '13px' }}>
                      What You Can Do
                    </Text>
                  </div>
                  <ul style={{ 
                    margin: 0, 
                    paddingLeft: '20px',
                    fontSize: '12px',
                    lineHeight: '1.6'
                  }}>
                    {area.suggestions.slice(0, 3).map((suggestion, idx) => (
                      <li key={idx} style={{ color: '#374151', marginBottom: '6px' }}>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Action Button */}
                <Link to="/practice">
                  <Button 
                    type="text" 
                    size="small"
                    block
                    icon={<BookOutlined />}
                    style={{
                      borderTop: `1px solid ${area.color}20`,
                      marginTop: '8px',
                      paddingTop: '12px'
                    }}
                  >
                    Practice {area.category}
                  </Button>
                </Link>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
      
      {/* Overall Stats */}
      {userStats && (
        <Card 
          style={{ 
            marginTop: '24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none'
          }}
        >
          <Row gutter={24}>
            <Col xs={24} sm={8}>
              <div style={{ textAlign: 'center' }}>
                <Text style={{ display: 'block', color: 'rgba(255,255,255,0.8)', fontSize: '12px', marginBottom: '4px' }}>
                  Overall Accuracy
                </Text>
                <Text style={{ display: 'block', color: 'white', fontSize: '28px', fontWeight: 'bold' }}>
                  {Math.round(parseFloat(userStats.overallAccuracy || '0'))}%
                </Text>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ textAlign: 'center' }}>
                <Text style={{ display: 'block', color: 'rgba(255,255,255,0.8)', fontSize: '12px', marginBottom: '4px' }}>
                  Questions Solved
                </Text>
                <Text style={{ display: 'block', color: 'white', fontSize: '28px', fontWeight: 'bold' }}>
                  {userStats.totalQuestionsAttempted || 0}
                </Text>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ textAlign: 'center' }}>
                <Text style={{ display: 'block', color: 'rgba(255,255,255,0.8)', fontSize: '12px', marginBottom: '4px' }}>
                  Current Streak
                </Text>
                <Text style={{ display: 'block', color: 'white', fontSize: '28px', fontWeight: 'bold' }}>
                  {userStats.currentStreak || 0} 🔥
                </Text>
              </div>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

