import React, { useState, useEffect } from 'react';
import { Layout, List, Card, Typography, Button, Empty, Spin, Tag, Divider } from 'antd';
import { 
  BellOutlined, 
  MessageOutlined, 
  TrophyOutlined, 
  CheckCircleOutlined, 
  UserOutlined, 
  FileTextOutlined,
  DeleteOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useAPI';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { formatDistanceToNow } from 'date-fns';
import './Notifications.css';

const { Title, Text } = Typography;
const { Content } = Layout;

interface Notification {
  notificationId: string;
  notificationType: string;
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const api = useApi();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.client.get('/notifications');
      if (response.data?.success) {
        const data = response.data.data;
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.client.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n.notificationId === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.client.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.client.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.notificationId !== notificationId));
      // Update unread count if deleted notification was unread
      const deleted = notifications.find(n => n.notificationId === notificationId);
      if (deleted && !deleted.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.notificationId);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'exam_result':
      case 'practice_result':
        return <TrophyOutlined style={{ fontSize: '24px', color: '#52c41a' }} />;
      case 'comment_reply':
      case 'post_comment':
        return <MessageOutlined style={{ fontSize: '24px', color: '#1890ff' }} />;
      case 'join_request':
        return <UserOutlined style={{ fontSize: '24px', color: '#ff7846' }} />;
      case 'note_shared':
        return <FileTextOutlined style={{ fontSize: '24px', color: '#722ed1' }} />;
      default:
        return <BellOutlined style={{ fontSize: '24px', color: '#8c8c8c' }} />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'exam_result': 'Exam Result',
      'practice_result': 'Practice Result',
      'comment_reply': 'Comment Reply',
      'post_comment': 'Post Comment',
      'join_request': 'Join Request',
      'note_shared': 'Note Shared',
      'practice_reminder': 'Practice Reminder',
      'test_available': 'Test Available',
      'achievement': 'Achievement',
      'streak_alert': 'Streak Alert',
      'community': 'Community',
      'general': 'General'
    };
    return labels[type] || type;
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      <Content style={{ flex: 1 }}>
        <div className="notifications-page">
          <div className="notifications-header">
            <div>
              <Title level={2} style={{ margin: 0 }}>
                <BellOutlined style={{ marginRight: '12px' }} />
                Notifications
              </Title>
              {unreadCount > 0 && (
                <Text type="secondary">
                  You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </Text>
              )}
            </div>
            {unreadCount > 0 && (
              <Button type="primary" onClick={handleMarkAllAsRead}>
                Mark All as Read
              </Button>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <Spin size="large" />
            </div>
          ) : notifications.length === 0 ? (
            <Empty 
              description="No notifications yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ marginTop: '60px' }}
            />
          ) : (
            <List
              dataSource={notifications}
              renderItem={(notification) => (
                <List.Item className="notification-list-item">
                  <Card
                    className={`notification-card ${!notification.isRead ? 'unread' : ''}`}
                    hoverable
                    onClick={() => handleNotificationClick(notification)}
                    actions={[
                      <Button
                        key="delete"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => handleDelete(notification.notificationId, e)}
                      >
                        Delete
                      </Button>
                    ]}
                  >
                    <div className="notification-card-content">
                      <div className="notification-icon-wrapper">
                        {getNotificationIcon(notification.notificationType)}
                      </div>
                      <div className="notification-details">
                        <div className="notification-header-row">
                          <Text strong={!notification.isRead} className="notification-title">
                            {notification.title}
                          </Text>
                          {!notification.isRead && (
                            <Tag color="blue">New</Tag>
                          )}
                          <Tag color="default">{getNotificationTypeLabel(notification.notificationType)}</Tag>
                        </div>
                        <Text className="notification-message">{notification.message}</Text>
                        <Text type="secondary" className="notification-time">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </Text>
                      </div>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          )}
        </div>
      </Content>
      <Footer />
    </Layout>
  );
};

export default Notifications;

