import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Space, Typography, Spin, Avatar, List } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { askAIAboutPerformance, type PerformanceData } from '../services/aiInsights';

const { TextArea } = Input;
const { Text } = Typography;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  performanceData: PerformanceData;
}

const SUGGESTED_QUESTIONS = [
  "How can I improve my performance?",
  "What are my weak areas?",
  "How is my history performance?",
  "How many questions did I attempt for history?",
  "What should I focus on next?"
];

export const AIChat: React.FC<AIChatProps> = ({ performanceData }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI performance assistant. Ask me anything about your performance, weak areas, improvement tips, or study strategies!",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasAskedFirstQuestion, setHasAskedFirstQuestion] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);
    setHasAskedFirstQuestion(true);

    try {
      const response = await askAIAboutPerformance(userMessage.content, performanceData);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble processing your question right now. Please try again in a moment, or rephrase your question.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card
      style={{
        borderRadius: '12px',
        marginTop: '24px',
        height: '600px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Space direction="vertical" style={{ width: '100%', height: '100%' }} size="middle">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <RobotOutlined style={{ fontSize: '20px', color: '#667eea' }} />
          <Text strong style={{ fontSize: '16px' }}>Ask AI About Your Performance</Text>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            background: '#f5f5f5',
            borderRadius: '8px',
            minHeight: '300px',
            maxHeight: '400px'
          }}
        >
          <List
            dataSource={messages}
            renderItem={(message) => (
              <List.Item style={{ border: 'none', padding: '8px 0' }}>
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    width: '100%',
                    flexDirection: message.role === 'user' ? 'row-reverse' : 'row'
                  }}
                >
                  <Avatar
                    icon={message.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                    style={{
                      backgroundColor: message.role === 'user' ? '#667eea' : '#52c41a',
                      flexShrink: 0
                    }}
                  />
                  <div
                    style={{
                      maxWidth: '75%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: message.role === 'user' ? '#667eea' : 'white',
                      color: message.role === 'user' ? 'white' : '#333',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <Text style={{ color: message.role === 'user' ? 'white' : '#333', whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </Text>
                  </div>
                </div>
              </List.Item>
            )}
          />
          {loading && (
            <div style={{ display: 'flex', gap: '12px', padding: '8px 0' }}>
              <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#52c41a', flexShrink: 0 }} />
              <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'white' }}>
                <Spin size="small" />
                <Text style={{ marginLeft: '8px' }}>AI is thinking...</Text>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions (only show before first question) */}
        {!hasAskedFirstQuestion && (
          <div>
            <Text type="secondary" style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>
              Suggested questions:
            </Text>
            <Space wrap size="small">
              {SUGGESTED_QUESTIONS.map((question, index) => (
                <Button
                  key={index}
                  size="small"
                  type="dashed"
                  onClick={() => handleSuggestedQuestion(question)}
                  style={{ fontSize: '12px' }}
                >
                  {question}
                </Button>
              ))}
            </Space>
          </div>
        )}

        {/* Input Area */}
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your performance..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={loading}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={loading}
            disabled={!inputValue.trim()}
            style={{ height: 'auto' }}
          >
            Send
          </Button>
        </Space.Compact>

        <Text type="secondary" style={{ fontSize: '11px', textAlign: 'center', display: 'block' }}>
          💡 AI responses are based on your performance data.{' '}
          {import.meta.env.VITE_HUGGINGFACE_API_KEY 
            ? 'Using Pythia-160m AI model for enhanced insights.' 
            : 'Set up your Hugging Face API key for AI-powered responses.'}
        </Text>
      </Space>
    </Card>
  );
};

