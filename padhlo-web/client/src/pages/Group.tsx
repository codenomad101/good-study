import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Typography, message, Spin, List, Empty, Tag } from 'antd';
import { ArrowLeftOutlined, MessageOutlined, UserOutlined, UserAddOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useAPI';
import JoinRequestsManager from '../components/JoinRequestsManager';
import './Group.css';

const { Title, Text } = Typography;

interface Post {
  postId: string;
  postContent: string;
  userId: string;
  user?: {
    userId: string;
    fullName: string;
    email: string;
    profilePictureUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const Group = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const api = useApi();

  useEffect(() => {
    if (groupId) {
      fetchGroup();
      checkMembership();
    }
  }, [groupId, user]);

  useEffect(() => {
    if (groupId && isMember) {
      fetchPosts();
    }
  }, [groupId, isMember]);

  const fetchGroup = async () => {
    if (!groupId) return;
    try {
      setIsLoading(true);
      const response = await api.client.get(`/community/groups/${groupId}`);
      setGroup(response.data);
    } catch (error: any) {
      console.error('Error fetching group:', error);
      message.error('Failed to load group. Please try again.');
      navigate('/community');
    } finally {
      setIsLoading(false);
    }
  };

  const checkMembership = async () => {
    if (!groupId || !user?.userId) return;
    try {
      const membersResponse = await api.client.get(`/community/groups/${groupId}/members`);
      const members = Array.isArray(membersResponse.data) 
        ? membersResponse.data 
        : (membersResponse.data?.data || []);
      const isUserMember = members.some((m: any) => m.userId === user.userId || m.user?.userId === user.userId);
      setIsMember(isUserMember);

      // Check for pending join request
      try {
        const requestsResponse = await api.client.get(`/community/groups/${groupId}/requests`);
        const requests = Array.isArray(requestsResponse.data?.data) ? requestsResponse.data.data : [];
        const pendingRequest = requests.find((r: any) => 
          (r.userId === user.userId || r.user?.userId === user.userId) && r.status === 'pending'
        );
        setHasPendingRequest(!!pendingRequest);
      } catch (error) {
        // User might not have permission to view requests, that's okay
        setHasPendingRequest(false);
      }
    } catch (error) {
      setIsMember(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!groupId) return;
    try {
      await api.client.post(`/community/groups/${groupId}/join`);
      message.success('Successfully joined group!');
      await checkMembership();
      await fetchPosts();
    } catch (error: any) {
      if (error?.response?.data?.message?.includes('pending')) {
        message.info('Join request sent. Waiting for approval.');
        setHasPendingRequest(true);
      } else {
        message.error(error?.response?.data?.message || 'Failed to join group. Please try again.');
      }
    }
  };

  const fetchPosts = async () => {
    if (!groupId) return;
    try {
      setIsLoadingPosts(true);
      const response = await api.client.get(`/community/groups/${groupId}/posts`);
      let postsData: Post[] = [];
      
      if (Array.isArray(response.data)) {
        postsData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        postsData = response.data.data;
      }

      setPosts(postsData);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      message.error('Failed to load posts. Please try again.');
      setPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };


  if (isLoading) {
    return (
      <div className="group-list-container">
        <div className="loading-container">
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>Loading group...</div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="group-list-container">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/community')}>
          Back to Community
        </Button>
        <div className="empty-state">
          <div>Group not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="group-list-container">
      {/* Header */}
      <div className="group-list-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/community')}
          className="back-button"
        >
          Back
        </Button>
        <div className="group-info">
          <Title level={3} style={{ margin: 0 }}>{group.name || group.groupName}</Title>
          <Text type="secondary">{group.description}</Text>
          {group.creator && (
            <Text type="secondary" style={{ display: 'block', marginTop: '4px', fontSize: '13px' }}>
              Created by {group.creator.fullName}
            </Text>
          )}
          {group.examType && (
            <Tag color="blue" style={{ marginTop: '8px' }}>
              {group.examType}
            </Tag>
          )}
          {!group.isPublic && (
            <Tag color="orange" style={{ marginLeft: '8px', marginTop: '8px' }}>
              Private Group
            </Tag>
          )}
        </div>
        {!isMember && (
          <Button
            type="primary"
            icon={hasPendingRequest ? <CheckCircleOutlined /> : <UserAddOutlined />}
            onClick={handleJoinGroup}
            disabled={hasPendingRequest}
          >
            {hasPendingRequest ? 'Request Pending' : 'Join Group'}
          </Button>
        )}
      </div>

      {/* Posts List */}
      <div className="posts-list-container">
        {!isMember && !isLoading && (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            background: '#fff3cd', 
            borderRadius: '8px',
            marginBottom: '24px',
            border: '1px solid #ffc107'
          }}>
            <UserOutlined style={{ fontSize: '48px', color: '#ffc107', marginBottom: '16px' }} />
            <Title level={4}>Join to View Posts</Title>
            <Text>You need to join this group to view and create posts.</Text>
            <br />
            <Button 
              type="primary" 
              icon={<UserAddOutlined />} 
              onClick={handleJoinGroup}
              disabled={hasPendingRequest}
              style={{ marginTop: '16px' }}
            >
              {hasPendingRequest ? 'Request Pending' : 'Join Group'}
            </Button>
          </div>
        )}
        {isMember && isLoadingPosts ? (
          <div className="loading-container">
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>Loading posts...</div>
          </div>
        ) : isMember && posts.length === 0 ? (
          <Empty
            image={<MessageOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
            description="No posts yet. Be the first to post!"
            style={{ marginTop: '60px' }}
          />
        ) : isMember ? (
          <List
            dataSource={posts}
            renderItem={(post) => (
              <List.Item
                className="post-list-item"
                onClick={() => navigate(`/community/posts/${post.postId}`)}
              >
                <Card className="post-card" hoverable>
                  <div className="post-card-content">
                    <div className="post-preview">
                      {post.postContent}
                    </div>
                    <div className="post-footer">
                      <div className="post-creator-info">
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Created by {post.user?.fullName || 'Anonymous User'}
                        </Text>
                      </div>
                      <Button 
                        type="text" 
                        icon={<MessageOutlined />}
                        className="view-post-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/community/posts/${post.postId}`);
                        }}
                      >
                        View & Comment
                      </Button>
                    </div>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        ) : null}
      </div>

      {/* Join Requests Section (for admins) - Below posts */}
      {isMember && group && (group.createdBy === user?.userId) && (
        <div style={{ padding: '24px', background: '#f5f5f5', borderTop: '1px solid #e8e8e8' }}>
          <JoinRequestsManager groupId={groupId!} />
        </div>
      )}
    </div>
  );
};

export default Group;
