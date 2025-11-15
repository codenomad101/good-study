import React, { useState } from 'react';
import { Typography, Row, Col } from 'antd';
import { 
  QuestionCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { 
  DollarOutlined,
  HistoryOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  ExperimentOutlined,
  GlobalOutlined,
  BookOutlined
} from '@ant-design/icons';

const { Text } = Typography;

// Icon mapping for categories
const getCategoryIcon = (category: string) => {
  const slug = category?.toLowerCase().replace(/\s+/g, '-') || '';
  const iconMap: Record<string, any> = {
    'economy': DollarOutlined,
    'history': HistoryOutlined,
    'geography': EnvironmentOutlined,
    'english': FileTextOutlined,
    'aptitude': CalculatorOutlined,
    'science': ExperimentOutlined,
    'agriculture': GlobalOutlined,
    'polity': BookOutlined,
    'current-affairs': FileTextOutlined,
    'gk': GlobalOutlined,
  };
  return iconMap[slug] || BookOutlined;
};

// Get category colors
const getCategoryColors = (category: string) => {
  const slug = category?.toLowerCase().replace(/\s+/g, '-') || '';
  const colorMap: Record<string, { bg: string; icon: string }> = {
    'economy': { bg: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', icon: '#2563EB' },
    'history': { bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', icon: '#F59E0B' },
    'geography': { bg: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)', icon: '#10B981' },
    'english': { bg: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)', icon: '#7C3AED' },
    'aptitude': { bg: 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)', icon: '#EC4899' },
    'science': { bg: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)', icon: '#6366F1' },
    'agriculture': { bg: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', icon: '#059669' },
    'polity': { bg: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)', icon: '#EF4444' },
    'current-affairs': { bg: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)', icon: '#F97316' },
    'gk': { bg: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)', icon: '#0EA5E9' },
  };
  return colorMap[slug] || { bg: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)', icon: '#6B7280' };
};

interface SessionCardProps {
  session: {
    sessionId?: string;
    examId?: string;
    category: string;
    type?: 'practice' | 'exam';
    questionsAttempted?: number;
    totalQuestions?: number;
    correctAnswers?: number;
    time?: string;
    timeSpentSeconds?: number;
    durationMinutes?: number;
    date?: string;
    completedAt?: string;
    createdAt?: string;
    score?: number;
    percentage?: string | number;
    accuracy?: string | number;
  };
  onClick?: () => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const categoryColors = getCategoryColors(session.category);
  const IconComponent = getCategoryIcon(session.category);
  
  // Calculate score/percentage
  const score = session.score || 
    (session.percentage ? Math.round(parseFloat(String(session.percentage))) : 
    (session.accuracy ? Math.round(parseFloat(String(session.accuracy))) : 0));
  
  // Format date
  const date = session.date || 
    (session.completedAt ? new Date(session.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) :
    (session.createdAt ? new Date(session.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''));
  
  // Format time
  const time = session.time || 
    (session.durationMinutes ? `${session.durationMinutes} min` :
    (session.timeSpentSeconds ? `${Math.round(session.timeSpentSeconds / 60)} min` : ''));
  
  const sessionType = session.type || 'practice';
  const questionsAttempted = session.questionsAttempted || session.totalQuestions || 0;
  const correctAnswers = session.correctAnswers || 0;

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: '20px',
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: '380px',
        boxShadow: isHovered ? '0 12px 24px rgba(0, 0, 0, 0.12)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
        transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
        position: 'relative'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header Section */}
      <div style={{
        background: categoryColors.bg,
        padding: '20px 20px 16px 20px',
        borderBottom: '1px solid #E5E7EB',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background element */}
        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.4)',
          opacity: 0.6
        }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <Text 
            style={{ 
              fontSize: '20px',
              fontWeight: '700',
              color: '#1F2937',
              lineHeight: '1.2'
            }}
          >
            {session.category || 'Unknown Category'}
          </Text>
          <div style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#FFFFFF',
            background: sessionType === 'exam' ? '#7C3AED' : '#2563EB',
            padding: '4px 10px',
            borderRadius: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {sessionType === 'exam' ? 'Exam' : 'Practice'}
          </div>
        </div>
      </div>
      
      {/* Center Section - Session Details */}
      <div style={{ 
        flex: 1,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Questions Attempted */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          borderRadius: '12px',
          background: '#F9FAFB',
          transition: 'all 0.2s ease',
          transform: isHovered ? 'translateX(4px)' : 'translateX(0)'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            background: categoryColors.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: `2px solid ${categoryColors.icon}20`
          }}>
            <QuestionCircleOutlined style={{ 
              fontSize: '24px', 
              color: categoryColors.icon
            }} />
          </div>
          <div style={{ flex: 1 }}>
            <Text style={{ 
              fontSize: '12px',
              color: '#6B7280',
              fontWeight: '500',
              display: 'block',
              marginBottom: '4px'
            }}>
              Questions Attempted
            </Text>
            <Text style={{ 
              fontSize: '16px',
              color: '#1F2937',
              fontWeight: '700'
            }}>
              {questionsAttempted}
            </Text>
          </div>
        </div>

        {/* Correct Answers */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          borderRadius: '12px',
          background: '#F9FAFB',
          transition: 'all 0.2s ease',
          transform: isHovered ? 'translateX(4px)' : 'translateX(0)'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            background: categoryColors.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: `2px solid ${categoryColors.icon}20`
          }}>
            <CheckCircleOutlined style={{ 
              fontSize: '24px', 
              color: categoryColors.icon
            }} />
          </div>
          <div style={{ flex: 1 }}>
            <Text style={{ 
              fontSize: '12px',
              color: '#6B7280',
              fontWeight: '500',
              display: 'block',
              marginBottom: '4px'
            }}>
              Correct Answers
            </Text>
            <Text style={{ 
              fontSize: '16px',
              color: '#1F2937',
              fontWeight: '700'
            }}>
              {correctAnswers}
            </Text>
          </div>
        </div>

        {/* Time Spent */}
        {time && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            borderRadius: '12px',
            background: '#F9FAFB',
            transition: 'all 0.2s ease',
            transform: isHovered ? 'translateX(4px)' : 'translateX(0)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: categoryColors.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: `2px solid ${categoryColors.icon}20`
            }}>
              <ClockCircleOutlined style={{ 
                fontSize: '24px', 
                color: categoryColors.icon
              }} />
            </div>
            <div style={{ flex: 1 }}>
              <Text style={{ 
                fontSize: '12px',
                color: '#6B7280',
                fontWeight: '500',
                display: 'block',
                marginBottom: '4px'
              }}>
                Time Spent
              </Text>
              <Text style={{ 
                fontSize: '16px',
                color: '#1F2937',
                fontWeight: '700'
              }}>
                {time}
              </Text>
            </div>
          </div>
        )}

        {/* Date */}
        {date && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            borderRadius: '12px',
            background: '#F9FAFB',
            transition: 'all 0.2s ease',
            transform: isHovered ? 'translateX(4px)' : 'translateX(0)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: categoryColors.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: `2px solid ${categoryColors.icon}20`
            }}>
              <CalendarOutlined style={{ 
                fontSize: '24px', 
                color: categoryColors.icon
              }} />
            </div>
            <div style={{ flex: 1 }}>
              <Text style={{ 
                fontSize: '12px',
                color: '#6B7280',
                fontWeight: '500',
                display: 'block',
                marginBottom: '4px'
              }}>
                Date
              </Text>
              <Text style={{ 
                fontSize: '16px',
                color: '#1F2937',
                fontWeight: '700'
              }}>
                {date}
              </Text>
            </div>
          </div>
        )}
      </div>
      
      {/* Score Section */}
      {score > 0 && (
        <div style={{
          padding: '16px 20px 20px 20px',
          borderTop: '1px solid #E5E7EB',
          background: '#FAFBFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrophyOutlined style={{ 
              fontSize: '20px', 
              color: score >= 70 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444'
            }} />
            <Text style={{ 
              fontSize: '14px',
              color: '#6B7280',
              fontWeight: '600'
            }}>
              Score
            </Text>
          </div>
          <div style={{
            background: score >= 70 ? '#D1FAE5' : score >= 50 ? '#FEF3C7' : '#FEE2E2',
            color: score >= 70 ? '#166534' : score >= 50 ? '#92400E' : '#991B1B',
            fontWeight: '700',
            fontSize: '18px',
            padding: '6px 16px',
            borderRadius: '8px',
            minWidth: '60px',
            textAlign: 'center'
          }}>
            {score}%
          </div>
        </div>
      )}
    </div>
  );
};

