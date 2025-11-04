import React, { useState, useEffect } from 'react';
import { Layout, Card, Button, Modal, Form, Input, Select, message, Spin, Empty, Tabs, Tag, Statistic, Row, Col, Avatar } from 'antd';
import { PlusOutlined, MessageOutlined, CommentOutlined, TrophyOutlined, FireOutlined, TeamOutlined, BookOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useAPI';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SubscriptionGate } from '../components/SubscriptionGate';
import './Community.css';

const { Option } = Select;
const { TextArea } = Input;
const { Content } = Layout;

interface Group {
  groupId: string;
  name: string;
  description: string;
  createdBy: string;
  examType?: string;
  subjectId?: string;
  isPublic?: boolean;
  createdAt: string;
  postCount?: number;
  commentCount?: number;
  memberCount?: number;
  creator?: {
    userId: string;
    fullName: string;
    email: string;
  };
}

const Community = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [form] = Form.useForm();
  const api = useApi();

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    filterGroups();
  }, [groups, activeTab]);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const response = await api.client.get('/community/groups');
      let groupsData: Group[] = [];
      
      if (Array.isArray(response.data)) {
        groupsData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        groupsData = response.data.data;
      }

      // Fetch stats for each group
      const groupsWithStats = await Promise.all(
        groupsData.map(async (group) => {
          try {
            // Fetch posts count
            const postsResponse = await api.client.get(`/community/groups/${group.groupId}/posts`);
            const posts = Array.isArray(postsResponse.data) 
              ? postsResponse.data 
              : (postsResponse.data?.data || []);
            
            // Fetch comments count for all posts
            let totalComments = 0;
            for (const post of posts) {
              try {
                const commentsResponse = await api.client.get(`/community/posts/${post.postId}/comments`);
                const comments = Array.isArray(commentsResponse.data)
                  ? commentsResponse.data
                  : (commentsResponse.data?.data || []);
                totalComments += comments.length;
              } catch (error) {
                // Ignore errors for individual post comments
              }
            }

            // Fetch members count
            let memberCount = 0;
            try {
              const membersResponse = await api.client.get(`/community/groups/${group.groupId}/members`);
              const members = Array.isArray(membersResponse.data)
                ? membersResponse.data
                : (membersResponse.data?.data || []);
              memberCount = members.length;
            } catch (error) {
              // Ignore errors for members
            }

            return {
              ...group,
              postCount: posts.length,
              commentCount: totalComments,
              memberCount: memberCount
            };
          } catch (error) {
            return {
              ...group,
              postCount: 0,
              commentCount: 0,
              memberCount: 0
            };
          }
        })
      );

      setGroups(groupsWithStats);
    } catch (error: any) {
      console.error('Error fetching groups:', error);
      message.error('Failed to load groups. Please try again.');
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterGroups = () => {
    let sorted = [...groups];
    
    switch (activeTab) {
      case 'most-posts':
        sorted.sort((a, b) => (b.postCount || 0) - (a.postCount || 0));
        break;
      case 'most-comments':
        sorted.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
        break;
      case 'exam-based':
        sorted = sorted.filter(g => 
          g.name.toLowerCase().includes('exam') || 
          g.name.toLowerCase().includes('test') ||
          g.description?.toLowerCase().includes('exam') ||
          g.description?.toLowerCase().includes('test')
        );
        break;
      default:
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    setFilteredGroups(sorted);
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleCreate = async (values: any) => {
    try {
      await api.client.post('/community/groups', {
        name: values.name,
        description: values.description,
        examType: values.examType || null,
        subjectId: values.subjectId || null,
        isPublic: values.isPublic !== undefined ? values.isPublic : true
      });
      message.success('Group created successfully!');
      fetchGroups();
      setIsModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      console.error('Error creating group:', error);
      message.error(error?.response?.data?.message || 'Failed to create group. Please try again.');
    }
  };

  const handleGroupClick = (groupId: string) => {
    navigate(`/community/groups/${groupId}`);
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'G';
  };

  const topCommunities = filteredGroups.slice(0, 3);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      <SubscriptionGate requirePro={true} featureName="Community">
        <Content style={{ flex: 1 }}>
          <div className="community-container">
          {/* Hero Section */}
          <div className="community-hero">
            <div className="hero-content">
              <h1 className="hero-title">Community Hub</h1>
              <p className="hero-subtitle">Connect, Learn, and Grow Together</p>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={showModal}
                className="create-group-btn"
              >
                Create New Group
              </Button>
            </div>
          </div>

          {/* Top Communities Section */}
          {topCommunities.length > 0 && (
            <div className="top-communities-section">
              <div className="section-header">
                <TrophyOutlined className="section-icon" />
                <h2 className="section-title">Top Communities</h2>
              </div>
              <Row gutter={[16, 16]}>
                {topCommunities.map((group, index) => (
                  <Col xs={24} sm={12} md={8} key={group.groupId}>
                    <Card
                      className="top-community-card"
                      hoverable
                      onClick={() => handleGroupClick(group.groupId)}
                    >
                      <div className="rank-badge">{index + 1}</div>
                      <div className="top-community-content">
                        <Avatar className="top-community-avatar" size={56}>
                          {getInitials(group.name)}
                        </Avatar>
                        <h3 className="top-community-name">{group.name}</h3>
                        <p className="top-community-description">
                          {group.description?.substring(0, 80) || 'No description'}
                          {group.description && group.description.length > 80 ? '...' : ''}
                        </p>
                        {group.creator && (
                          <p className="top-community-creator" style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                            Created by {group.creator.fullName}
                          </p>
                        )}
                        {group.examType && (
                          <Tag color="blue" style={{ marginTop: '8px' }}>
                            {group.examType}
                          </Tag>
                        )}
                        <div className="top-community-stats">
                          <Statistic
                            title="Posts"
                            value={group.postCount || 0}
                            prefix={<MessageOutlined />}
                            valueStyle={{ fontSize: '18px', color: '#667eea' }}
                          />
                          <Statistic
                            title="Comments"
                            value={group.commentCount || 0}
                            prefix={<CommentOutlined />}
                            valueStyle={{ fontSize: '18px', color: '#764ba2' }}
                          />
                          <Statistic
                            title="Members"
                            value={group.memberCount || 0}
                            prefix={<TeamOutlined />}
                            valueStyle={{ fontSize: '18px', color: '#f59e0b' }}
                          />
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {/* All Communities Section */}
          <div className="all-communities-section">
            <div className="section-header">
              <TeamOutlined className="section-icon" />
              <h2 className="section-title">All Communities</h2>
            </div>
            
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              className="community-tabs"
              items={[
                {
                  key: 'all',
                  label: 'All Groups',
                  icon: <TeamOutlined />
                },
                {
                  key: 'most-posts',
                  label: 'Most Posts',
                  icon: <MessageOutlined />
                },
                {
                  key: 'most-comments',
                  label: 'Most Comments',
                  icon: <CommentOutlined />
                },
                {
                  key: 'exam-based',
                  label: 'Exam Based',
                  icon: <BookOutlined />
                }
              ]}
            />

            {isLoading ? (
              <div className="loading-container">
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>Loading communities...</div>
              </div>
            ) : filteredGroups.length === 0 ? (
              <Empty
                image={<TeamOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
                description="No communities found. Create your first group!"
                style={{ marginTop: '60px' }}
              />
            ) : (
              <Row gutter={[16, 16]}>
                {filteredGroups.map((group) => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={group.groupId}>
                    <Card
                      className="community-card"
                      hoverable
                      onClick={() => handleGroupClick(group.groupId)}
                    >
                      <div className="community-card-content">
                        <Avatar className="community-avatar" size={48}>
                          {getInitials(group.name)}
                        </Avatar>
                        <h3 className="community-name">{group.name}</h3>
                        <p className="community-description">
                          {group.description?.substring(0, 100) || 'No description'}
                          {group.description && group.description.length > 100 ? '...' : ''}
                        </p>
                        {group.creator && (
                          <p style={{ fontSize: '12px', color: '#999', marginTop: '4px', textAlign: 'center' }}>
                            Created by {group.creator.fullName}
                          </p>
                        )}
                        <div className="community-stats">
                          <Tag icon={<MessageOutlined />} color="blue">
                            {group.postCount || 0} Posts
                          </Tag>
                          <Tag icon={<CommentOutlined />} color="purple">
                            {group.commentCount || 0} Comments
                          </Tag>
                          <Tag icon={<TeamOutlined />} color="orange">
                            {group.memberCount || 0} Members
                          </Tag>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </div>
        </div>
        </Content>
      </SubscriptionGate>
      <Footer />

      {/* Create Group Modal */}
      <Modal
        title={
          <div className="modal-header">
            <PlusOutlined style={{ marginRight: '8px', color: '#667eea' }} />
            Create New Community
          </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
        className="create-group-modal"
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item
            name="name"
            label="Community Name"
            rules={[{ required: true, message: 'Please input the community name!' }]}
          >
            <Input 
              placeholder="e.g., UPSC Preparation Group, MPSC Study Circle"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="examType"
            label="Exam Type (Optional)"
            help="Select the exam this community is focused on"
          >
            <Select
              placeholder="Select exam type"
              size="large"
              allowClear
            >
              <Option value="UPSC">UPSC</Option>
              <Option value="MPSC">MPSC</Option>
              <Option value="SSC">SSC</Option>
              <Option value="Banking">Banking</Option>
              <Option value="Railway">Railway</Option>
              <Option value="Defense">Defense</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="isPublic"
            label="Group Type"
            initialValue={true}
          >
            <Select size="large">
              <Option value={true}>Public (Anyone can join)</Option>
              <Option value={false}>Private (Requires approval)</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please input the community description!' }]}
          >
            <TextArea
              placeholder="Describe what this community is about..."
              rows={4}
              showCount
              maxLength={500}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Create Community
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default Community;
