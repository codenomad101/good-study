import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Input, Select, message, Spin, Empty, Tabs, Tag, Statistic, Row, Col, Avatar, Typography } from 'antd';
import { PlusOutlined, MessageOutlined, CommentOutlined, TrophyOutlined, FireOutlined, TeamOutlined, BookOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useAPI';
import { AppLayout } from '../components/AppLayout';
import { SubscriptionGate } from '../components/SubscriptionGate';
import './Community.css';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

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
    <AppLayout>
      <SubscriptionGate requirePro={true} featureName="Community">
        <div style={{ 
          padding: '24px', 
          width: '1400px', 
          margin: '0 auto',
          backgroundColor: '#F8FAFC',
          minHeight: '100vh'
        }}>
          {/* Page Header Card */}
          <Card
            style={{
              marginBottom: '32px',
              borderRadius: '20px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              background: '#FFFFFF'
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <Title level={1} style={{ 
                  margin: '0 0 8px 0',
                  fontSize: '28px',
                  fontWeight: '800',
                  color: '#1F2937'
                }}>
                  Community Hub
                </Title>
                <Text style={{ 
                  fontSize: '16px', 
                  color: '#6B7280',
                  fontWeight: '500'
                }}>
                  Connect, Learn, and Grow Together
                </Text>
              </div>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={showModal}
                style={{
                  borderRadius: '12px',
                  height: '44px',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #FF7846 0%, #FF5722 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                  padding: '0 24px'
                }}
              >
                Create New Group
              </Button>
            </div>
          </Card>

          {/* Top Communities Section */}
          {topCommunities.length > 0 && (
            <div style={{ 
              marginBottom: '48px'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                marginBottom: '24px' 
              }}>
                <TrophyOutlined style={{ fontSize: '24px', color: '#FF7846' }} />
                <Title level={2} style={{ 
                  margin: 0,
                  fontSize: '22px',
                  fontWeight: '700',
                  color: '#1F2937'
                }}>
                  Top Communities
                </Title>
              </div>
              <Row gutter={[16, 16]}>
                {topCommunities.map((group, index) => (
                  <Col xs={24} sm={12} md={8} key={group.groupId}>
                    <Card
                      hoverable
                      onClick={() => handleGroupClick(group.groupId)}
                      style={{
                        borderRadius: '20px',
                        border: '1px solid #E5E7EB',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        height: '100%'
                      }}
                      bodyStyle={{ padding: '16px' }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FF7846 0%, #FF5722 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '14px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                        zIndex: 1
                      }}>
                        {index + 1}
                      </div>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        alignItems: 'center',
                        textAlign: 'center'
                      }}>
                        <Avatar 
                          size={48}
                          style={{ 
                            background: 'linear-gradient(135deg, #FF7846 0%, #FF5722 100%)',
                            color: 'white',
                            fontWeight: '600',
                            marginBottom: '4px'
                          }}
                        >
                          {getInitials(group.name)}
                        </Avatar>
                        <Title level={4} style={{ 
                          margin: 0,
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#1F2937'
                        }}>
                          {group.name}
                        </Title>
                        <Text style={{ 
                          color: '#6B7280',
                          fontSize: '13px',
                          margin: 0,
                          minHeight: '40px',
                          lineHeight: '1.4'
                        }}>
                          {group.description?.substring(0, 60) || 'No description'}
                          {group.description && group.description.length > 60 ? '...' : ''}
                        </Text>
                        {group.creator && (
                          <Text style={{ 
                            fontSize: '11px', 
                            color: '#9CA3AF', 
                            marginTop: '4px'
                          }}>
                            Created by {group.creator.fullName}
                          </Text>
                        )}
                        {group.examType && (
                          <Tag color="blue" style={{ margin: '4px 0', fontSize: '11px' }}>
                            {group.examType}
                          </Tag>
                        )}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-around',
                          gap: '12px',
                          marginTop: '12px',
                          paddingTop: '12px',
                          borderTop: '1px solid #E5E7EB',
                          width: '100%'
                        }}>
                          <div style={{ textAlign: 'center' }}>
                            <Text style={{
                              display: 'block',
                              fontSize: '16px',
                              fontWeight: '700',
                              color: '#2563EB',
                              marginBottom: '2px'
                            }}>
                              {group.postCount || 0}
                            </Text>
                            <Text style={{
                              fontSize: '11px',
                              color: '#6B7280',
                              fontWeight: '500'
                            }}>
                              Posts
                            </Text>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <Text style={{
                              display: 'block',
                              fontSize: '16px',
                              fontWeight: '700',
                              color: '#7C3AED',
                              marginBottom: '2px'
                            }}>
                              {group.commentCount || 0}
                            </Text>
                            <Text style={{
                              fontSize: '11px',
                              color: '#6B7280',
                              fontWeight: '500'
                            }}>
                              Comments
                            </Text>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <Text style={{
                              display: 'block',
                              fontSize: '16px',
                              fontWeight: '700',
                              color: '#F59E0B',
                              marginBottom: '2px'
                            }}>
                              {group.memberCount || 0}
                            </Text>
                            <Text style={{
                              fontSize: '11px',
                              color: '#6B7280',
                              fontWeight: '500'
                            }}>
                              Members
                            </Text>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {/* All Communities Section */}
          <div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '24px' 
            }}>
              <TeamOutlined style={{ fontSize: '24px', color: '#FF7846' }} />
              <Title level={2} style={{ 
                margin: 0,
                fontSize: '22px',
                fontWeight: '700',
                color: '#1F2937'
              }}>
                All Communities
              </Title>
            </div>
            
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              style={{ marginBottom: '24px' }}
              items={[
                {
                  key: 'all',
                  label: (
                    <span>
                      <TeamOutlined /> All Groups
                    </span>
                  )
                },
                {
                  key: 'most-posts',
                  label: (
                    <span>
                      <MessageOutlined /> Most Posts
                    </span>
                  )
                },
                {
                  key: 'most-comments',
                  label: (
                    <span>
                      <CommentOutlined /> Most Comments
                    </span>
                  )
                },
                {
                  key: 'exam-based',
                  label: (
                    <span>
                      <BookOutlined /> Exam Based
                    </span>
                  )
                }
              ]}
            />

            {isLoading ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                color: '#6B7280'
              }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>Loading communities...</div>
              </div>
            ) : filteredGroups.length === 0 ? (
              <Empty
                image={<TeamOutlined style={{ fontSize: '64px', color: '#D1D5DB' }} />}
                description="No communities found. Create your first group!"
                style={{ marginTop: '60px' }}
              />
            ) : (
              <Row gutter={[16, 16]}>
                {filteredGroups.map((group) => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={group.groupId}>
                    <Card
                      hoverable
                      onClick={() => handleGroupClick(group.groupId)}
                      style={{
                        borderRadius: '20px',
                        border: '1px solid #E5E7EB',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.3s ease',
                        height: '100%'
                      }}
                      bodyStyle={{ padding: '20px' }}
                    >
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        alignItems: 'center',
                        textAlign: 'center'
                      }}>
                        <Avatar 
                          size={48}
                          style={{ 
                            background: 'linear-gradient(135deg, #FF7846 0%, #FF5722 100%)',
                            color: 'white',
                            fontWeight: '600',
                            marginBottom: '8px'
                          }}
                        >
                          {getInitials(group.name)}
                        </Avatar>
                        <Title level={4} style={{ 
                          margin: 0,
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#1F2937'
                        }}>
                          {group.name}
                        </Title>
                        <Text style={{ 
                          color: '#6B7280',
                          fontSize: '13px',
                          margin: 0,
                          minHeight: '60px',
                          lineHeight: '1.5'
                        }}>
                          {group.description?.substring(0, 100) || 'No description'}
                          {group.description && group.description.length > 100 ? '...' : ''}
                        </Text>
                        {group.creator && (
                          <Text style={{ 
                            fontSize: '12px', 
                            color: '#9CA3AF', 
                            marginTop: '4px'
                          }}>
                            Created by {group.creator.fullName}
                          </Text>
                        )}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'center',
                          flexWrap: 'wrap',
                          gap: '8px',
                          marginTop: '12px'
                        }}>
                          <Tag icon={<MessageOutlined />} color="blue" style={{ margin: 0 }}>
                            {group.postCount || 0} Posts
                          </Tag>
                          <Tag icon={<CommentOutlined />} color="purple" style={{ margin: 0 }}>
                            {group.commentCount || 0} Comments
                          </Tag>
                          <Tag icon={<TeamOutlined />} color="orange" style={{ margin: 0 }}>
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
      </SubscriptionGate>

      {/* Create Group Modal */}
      <Modal
        title={
          <div style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '20px',
            fontWeight: '600',
            color: '#1F2937'
          }}>
            <PlusOutlined style={{ marginRight: '8px', color: '#FF7846' }} />
            Create New Community
          </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
        style={{ borderRadius: '20px' }}
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
    </AppLayout>
  );
};

export default Community;
