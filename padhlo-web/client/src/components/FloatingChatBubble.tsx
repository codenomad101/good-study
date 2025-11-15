import React, { useState } from 'react';
import { FloatButton, Drawer } from 'antd';
import { MessageOutlined, CloseOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useUserStatistics } from '../hooks/useStatistics';
import { useExamHistory } from '../hooks/useExams';
import { useDataServicePracticeHistory } from '../hooks/useQuestions';
import { AIChatModal } from './AIChatModal';

export const FloatingChatBubble: React.FC = () => {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const { isAuthenticated } = useAuth();
  
  // Fetch performance data
  const { data: userStats } = useUserStatistics();
  const { data: examHistory = [] } = useExamHistory();
  const { data: practiceHistory = [] } = useDataServicePracticeHistory();
  
  // Don't show if not authenticated
  if (!isAuthenticated) {
    return null;
  }
  
  // Extract data from API responses
  const statsData = userStats?.data || userStats;
  const examData = examHistory?.data || examHistory || [];
  const practiceData = practiceHistory?.data || practiceHistory || [];
  
  // Calculate weak areas (simplified version)
  const weakAreas: Array<{ category: string; score: number; testCount: number }> = [];
  
  const performanceData = {
    overallAccuracy: statsData?.overallAccuracy ? Math.round(parseFloat(String(statsData.overallAccuracy))) : 0,
    totalQuestionsAttempted: statsData?.totalQuestionsAttempted || 0,
    currentStreak: statsData?.currentStreak || 0,
    examHistory: Array.isArray(examData) ? examData : [],
    practiceHistory: Array.isArray(practiceData) ? practiceData : [],
    weakAreas: weakAreas
  };
  
  return (
    <>
      <FloatButton
        icon={<MessageOutlined />}
        type="primary"
        style={{
          right: 24,
          bottom: 24,
          width: 56,
          height: 56,
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
          backgroundColor: '#2563EB',
          border: 'none'
        }}
        onClick={() => setIsDrawerVisible(true)}
      />
      
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageOutlined style={{ fontSize: '20px', color: '#2563EB' }} />
            <span style={{ fontSize: '18px', fontWeight: '600' }}>AI Performance Assistant</span>
          </div>
        }
        placement="right"
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
        width={420}
        closable={true}
        maskClosable={true}
        style={{ zIndex: 1001 }}
        styles={{
          body: {
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }
        }}
      >
        <AIChatModal
          performanceData={performanceData}
          onClose={() => setIsDrawerVisible(false)}
        />
      </Drawer>
    </>
  );
};

