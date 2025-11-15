import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Space, Typography, Spin, Avatar, List } from 'antd';
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

interface AIChatModalProps {
  performanceData: PerformanceData;
  onClose: () => void;
}

const SUGGESTED_QUESTIONS = [
  "How can I improve my performance?",
  "What are my weak areas?",
  "How is my history performance?",
  "How many questions did I attempt for history?",
  "What should I focus on next?"
];

export const AIChatModal: React.FC<AIChatModalProps> = ({ performanceData, onClose }) => {
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
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
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
    // Auto-send suggested questions
    setTimeout(() => {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: question,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setLoading(true);
      setHasAskedFirstQuestion(true);
      
      askAIAboutPerformance(question, performanceData)
        .then(response => {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
        })
        .catch(error => {
          console.error('Error getting AI response:', error);
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "I'm having trouble processing your question right now. Please try again in a moment.",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      backgroundColor: '#FFFFFF'
    }}>
      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          background: '#F8FAFC',
          minHeight: 0
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
                    backgroundColor: message.role === 'user' ? '#2563EB' : '#10B981',
                    flexShrink: 0
                  }}
                />
                <div
                  style={{
                    maxWidth: '75%',
                    padding: '12px 16px',
                    borderRadius: message.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: message.role === 'user' ? '#2563EB' : '#FFFFFF',
                    color: message.role === 'user' ? '#FFFFFF' : '#1F2937',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    wordWrap: 'break-word'
                  }}
                >
                  <Text style={{ 
                    color: message.role === 'user' ? '#FFFFFF' : '#1F2937', 
                    whiteSpace: 'pre-wrap',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}>
                    {message.content}
                  </Text>
                </div>
              </div>
            </List.Item>
          )}
        />
        {loading && (
          <div style={{ display: 'flex', gap: '12px', padding: '8px 0' }}>
            <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#10B981', flexShrink: 0 }} />
            <div style={{ 
              padding: '12px 16px', 
              borderRadius: '16px 16px 16px 4px', 
              background: '#FFFFFF',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Spin size="small" />
              <Text style={{ color: '#6B7280', fontSize: '14px' }}>AI is thinking...</Text>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions (only show before first question) */}
      {!hasAskedFirstQuestion && (
        <div style={{ 
          padding: '12px 16px',
          borderTop: '1px solid #E5E7EB',
          borderBottom: '1px solid #E5E7EB',
          background: '#FFFFFF'
        }}>
          <Text type="secondary" style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>
            Suggested questions:
          </Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {SUGGESTED_QUESTIONS.map((question, index) => (
              <Button
                key={index}
                size="small"
                type="dashed"
                onClick={() => handleSuggestedQuestion(question)}
                style={{ 
                  fontSize: '12px',
                  borderRadius: '16px',
                  borderColor: '#2563EB',
                  color: '#2563EB'
                }}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div style={{ 
        padding: '16px',
        borderTop: '1px solid #E5E7EB',
        background: '#FFFFFF'
      }}>
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your performance..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={loading}
            style={{ 
              flex: 1,
              borderRadius: '20px',
              border: '1px solid #E5E7EB'
            }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={loading}
            disabled={!inputValue.trim()}
            style={{ 
              height: 'auto',
              borderRadius: '20px',
              backgroundColor: '#2563EB',
              border: 'none',
              marginLeft: '8px'
            }}
          >
            Send
          </Button>
        </Space.Compact>
        
        <Text type="secondary" style={{ 
          fontSize: '11px', 
          textAlign: 'center', 
          display: 'block',
          marginTop: '8px',
          color: '#9CA3AF'
        }}>
          💡 AI responses are based on your performance data
        </Text>
      </div>
    </div>
  );
};

