import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Button, Typography, Empty, Spin, Divider } from 'antd';
import { BellOutlined, MessageOutlined, TrophyOutlined, CheckCircleOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useAPI';
import { formatDistanceToNow } from 'date-fns';
import './NotificationDropdown.css';

const { Text } = Typography;

interface Notification {
  notificationId: string;
  notificationType: string;
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationDropdownProps {
  onNotificationClick?: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onNotificationClick }) => {
  const navigate = useNavigate();
  const api = useApi();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

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
        setNotifications(data.notifications?.slice(0, 10) || []); // Show latest 10
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.notificationId, new MouseEvent('click') as any);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
    if (onNotificationClick) {
      onNotificationClick();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'exam_result':
      case 'practice_result':
        return <TrophyOutlined style={{ color: '#52c41a' }} />;
      case 'comment_reply':
      case 'post_comment':
        return <MessageOutlined style={{ color: '#1890ff' }} />;
      case 'join_request':
        return <UserOutlined style={{ color: '#ff7846' }} />;
      case 'note_shared':
        return <FileTextOutlined style={{ color: '#722ed1' }} />;
      default:
        return <BellOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  const notificationMenu = (
    <div className="notification-dropdown">
      <div className="notification-header">
        <Text strong>Notifications</Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>
      <Divider style={{ margin: '8px 0' }} />
      <div className="notification-list-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <Empty 
            description="No notifications" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: '20px' }}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(notification) => (
              <List.Item
                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-content">
                  <div className="notification-icon">
                    {getNotificationIcon(notification.notificationType)}
                  </div>
                  <div className="notification-text">
                    <Text strong={!notification.isRead} className="notification-title">
                      {notification.title}
                    </Text>
                    <Text type="secondary" className="notification-message">
                      {notification.message}
                    </Text>
                    <Text type="secondary" className="notification-time">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </Text>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
      <Divider style={{ margin: '8px 0' }} />
      <div className="notification-footer">
        <Button 
          type="link" 
          block 
          onClick={() => {
            navigate('/notifications');
            if (onNotificationClick) {
              onNotificationClick();
            }
          }}
        >
          View All Notifications
        </Button>
      </div>
    </div>
  );

  return (
    <Dropdown
      overlay={notificationMenu}
      placement="bottomRight"
      trigger={['click']}
      overlayClassName="notification-dropdown-overlay"
      onOpenChange={(open) => {
        if (open) {
          fetchNotifications();
        }
      }}
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button 
          type="text" 
          icon={<BellOutlined />} 
          className="notification-btn"
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationDropdown;

