import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Avatar, 
  Typography, 
  Row, 
  Col, 
  Space, 
  Divider,
  Select,
  DatePicker,
  Upload,
  message,
  Tabs,
  Statistic,
  Progress,
  Tag
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  LockOutlined,
  EditOutlined,
  CameraOutlined,
  TrophyOutlined,
  FireOutlined,
  ClockCircleOutlined,
  BookOutlined
} from '@ant-design/icons';
import { useUserProfile, useUpdateProfile, useChangePassword } from '../hooks/useAPI';
import { AppLayout } from '../components/AppLayout';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

export default function Profile() {
  const { data: profileData, isLoading, error } = useUserProfile();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);

  const user = profileData?.data?.user;

  const handleProfileUpdate = async (values: any) => {
    try {
      await updateProfileMutation.mutateAsync(values);
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };

  const handlePasswordChange = async (values: any) => {
    try {
      await changePasswordMutation.mutateAsync(values);
      passwordForm.resetFields();
    } catch (error) {
      console.error('Password change error:', error);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    profileForm.setFieldsValue({
      fullName: user?.fullName,
      phone: user?.phone,
      profilePictureUrl: user?.profilePictureUrl,
      dateOfBirth: user?.dateOfBirth ? dayjs(user.dateOfBirth) : null,
      gender: user?.gender,
      preferredLanguage: user?.preferredLanguage,
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    profileForm.resetFields();
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Text>Loading profile...</Text>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Text type="danger">Error loading profile. Please try again.</Text>
          </div>
        </div>
      </AppLayout>
    );
  }

  const stats = [
    { title: 'Total Points', value: user?.totalPoints || 0, icon: <TrophyOutlined />, color: '#f59e0b' },
    { title: 'Current Level', value: user?.level || 1, icon: <FireOutlined />, color: '#ef4444' },
    { title: 'Coins Earned', value: user?.coins || 0, icon: <BookOutlined />, color: '#10b981' },
    { title: 'Study Time', value: `${Math.round((user?.totalStudyTimeMinutes || 0) / 60)}h`, icon: <ClockCircleOutlined />, color: '#3b82f6' },
  ];

  return (
    <AppLayout>
      <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <Title level={1} style={{ margin: '0 0 32px 0', fontSize: '32px', fontWeight: '800' }}>
          Profile Settings
        </Title>

        <Tabs defaultActiveKey="profile" size="large">
          <TabPane tab="Profile Information" key="profile">
            <Row gutter={[24, 24]}>
              {/* Profile Stats */}
              <Col xs={24} lg={8}>
                <Card title="Your Stats" style={{ height: '100%' }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    {stats.map((stat, index) => (
                      <div key={index} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', color: stat.color, marginBottom: '8px' }}>
                          {stat.icon}
                        </div>
                        <Statistic
                          title={stat.title}
                          value={stat.value}
                          valueStyle={{ color: stat.color, fontSize: '20px', fontWeight: '700' }}
                        />
                      </div>
                    ))}
                  </Space>
                </Card>
              </Col>

              {/* Profile Form */}
              <Col xs={24} lg={16}>
                <Card 
                  title="Personal Information"
                  extra={
                    !isEditing ? (
                      <Button 
                        type="primary" 
                        icon={<EditOutlined />} 
                        onClick={handleEditClick}
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <Space>
                        <Button onClick={handleCancelEdit}>Cancel</Button>
                        <Button 
                          type="primary" 
                          onClick={() => profileForm.submit()}
                          loading={updateProfileMutation.isPending}
                        >
                          Save Changes
                        </Button>
                      </Space>
                    )
                  }
                >
                  <Form
                    form={profileForm}
                    layout="vertical"
                    onFinish={handleProfileUpdate}
                    disabled={!isEditing}
                  >
                    <Row gutter={[16, 0]}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="Profile Picture"
                          name="profilePictureUrl"
                        >
                          <Input 
                            placeholder="Profile picture URL"
                            prefix={<CameraOutlined />}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                          <Avatar 
                            size={80} 
                            src={user?.profilePictureUrl}
                            icon={<UserOutlined />}
                            style={{ backgroundColor: '#6366f1' }}
                          />
                        </div>
                      </Col>
                    </Row>

                    <Row gutter={[16, 0]}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="Full Name"
                          name="fullName"
                          rules={[{ required: true, message: 'Please enter your full name' }]}
                        >
                          <Input prefix={<UserOutlined />} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="Email"
                        >
                          <Input 
                            value={user?.email} 
                            prefix={<MailOutlined />} 
                            disabled 
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={[16, 0]}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="Phone Number"
                          name="phone"
                        >
                          <Input prefix={<PhoneOutlined />} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="Date of Birth"
                          name="dateOfBirth"
                        >
                          <DatePicker 
                            style={{ width: '100%' }}
                            placeholder="Select date of birth"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={[16, 0]}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="Gender"
                          name="gender"
                        >
                          <Select placeholder="Select gender">
                            <Option value="male">Male</Option>
                            <Option value="female">Female</Option>
                            <Option value="other">Other</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="Preferred Language"
                          name="preferredLanguage"
                        >
                          <Select placeholder="Select language">
                            <Option value="en">English</Option>
                            <Option value="hi">Hindi</Option>
                            <Option value="mr">Marathi</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="Security" key="security">
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <Card title="Change Password">
                  <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={handlePasswordChange}
                  >
                    <Form.Item
                      label="Current Password"
                      name="currentPassword"
                      rules={[{ required: true, message: 'Please enter your current password' }]}
                    >
                      <Input.Password prefix={<LockOutlined />} />
                    </Form.Item>

                    <Form.Item
                      label="New Password"
                      name="newPassword"
                      rules={[
                        { required: true, message: 'Please enter a new password' },
                        { min: 6, message: 'Password must be at least 6 characters' }
                      ]}
                    >
                      <Input.Password prefix={<LockOutlined />} />
                    </Form.Item>

                    <Form.Item
                      label="Confirm New Password"
                      name="confirmPassword"
                      dependencies={['newPassword']}
                      rules={[
                        { required: true, message: 'Please confirm your new password' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('Passwords do not match'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password prefix={<LockOutlined />} />
                    </Form.Item>

                    <Form.Item>
                      <Button 
                        type="primary" 
                        htmlType="submit"
                        loading={changePasswordMutation.isPending}
                        style={{ width: '100%' }}
                      >
                        Change Password
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card title="Account Information">
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <div>
                      <Text strong>Account Status</Text>
                      <div>
                        <Tag color={user?.isActive ? 'green' : 'red'}>
                          {user?.isActive ? 'Active' : 'Inactive'}
                        </Tag>
                        <Tag color={user?.isVerified ? 'blue' : 'orange'}>
                          {user?.isVerified ? 'Verified' : 'Unverified'}
                        </Tag>
                      </div>
                    </div>

                    <Divider />

                    <div>
                      <Text strong>Subscription</Text>
                      <div>
                        <Tag color="purple" style={{ textTransform: 'capitalize' }}>
                          {user?.subscriptionType || 'Free'}
                        </Tag>
                      </div>
                    </div>

                    <Divider />

                    <div>
                      <Text strong>Member Since</Text>
                      <div>
                        <Text>{dayjs(user?.createdAt).format('MMMM DD, YYYY')}</Text>
                      </div>
                    </div>

                    <Divider />

                    <div>
                      <Text strong>Current Streak</Text>
                      <div>
                        <Text style={{ fontSize: '18px', fontWeight: '600', color: '#f59e0b' }}>
                          {user?.currentStreak || 0} days
                        </Text>
                        <Text type="secondary" style={{ marginLeft: '8px' }}>
                          (Longest: {user?.longestStreak || 0} days)
                        </Text>
                      </div>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="Progress" key="progress">
            <Row gutter={[24, 24]}>
              <Col xs={24}>
                <Card title="Learning Progress">
                  <Row gutter={[24, 24]}>
                    <Col xs={24} sm={12} md={6}>
                      <div style={{ textAlign: 'center' }}>
                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                          Practice Sessions
                        </Text>
                        <Text style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                          {user?.totalPracticeSessions || 0}
                        </Text>
                      </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <div style={{ textAlign: 'center' }}>
                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                          Weekly Sessions
                        </Text>
                        <Text style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                          {user?.weeklyPracticeCount || 0}
                        </Text>
                      </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <div style={{ textAlign: 'center' }}>
                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                          Monthly Sessions
                        </Text>
                        <Text style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                          {user?.monthlyPracticeCount || 0}
                        </Text>
                      </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <div style={{ textAlign: 'center' }}>
                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                          Average Score
                        </Text>
                        <Text style={{ fontSize: '24px', fontWeight: '700', color: '#8b5cf6' }}>
                          {user?.totalPracticeSessions > 0 
                            ? Math.round((user?.totalPracticeScore || 0) / user.totalPracticeSessions)
                            : 0}%
                        </Text>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </div>
    </AppLayout>
  );
}
