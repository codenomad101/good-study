import React, { useState, useEffect } from 'react';
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
  Spin,
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
  BookOutlined,
  UploadOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useUserProfile, useUpdateProfile, useChangePassword } from '../hooks/useAPI';
import { AppLayout } from '../components/AppLayout';
import { useApi } from '../hooks/useAPI';
import dayjs from 'dayjs';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import type { RcFile } from 'antd/es/upload';

const { Title, Text } = Typography;
const { Option } = Select;

export default function Settings() {
  const { data: profileData, isLoading, error, refetch } = useUserProfile();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const api = useApi();
  
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');

  const user = profileData?.data?.user;

  useEffect(() => {
    if (user) {
      setImageUrl(user.profilePictureUrl || '');
      profileForm.setFieldsValue({
        fullName: user.fullName,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null,
        gender: user.gender,
        preferredLanguage: user.preferredLanguage,
      });
    }
  }, [user, profileForm]);

  const handleProfileUpdate = async (values: any) => {
    try {
      const updateData: any = {
        fullName: values.fullName,
        phone: values.phone,
        gender: values.gender,
        preferredLanguage: values.preferredLanguage,
      };
      
      if (values.dateOfBirth) {
        updateData.dateOfBirth = values.dateOfBirth.format('YYYY-MM-DD');
      }
      
      await updateProfileMutation.mutateAsync(updateData);
      message.success('Profile updated successfully');
      setIsEditing(false);
      refetch();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to update profile');
    }
  };

  const handlePasswordChange = async (values: any) => {
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success('Password changed successfully');
      passwordForm.resetFields();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to change password');
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    profileForm.resetFields();
    if (user) {
      profileForm.setFieldsValue({
        fullName: user.fullName,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null,
        gender: user.gender,
        preferredLanguage: user.preferredLanguage,
      });
    }
  };

  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return Upload.LIST_IGNORE;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!');
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const handleUpload = async (file: RcFile) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.client.post('/auth/upload-profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setImageUrl(response.data.data.url);
        message.success('Profile picture uploaded successfully');
        refetch();
      } else {
        message.error(response.data.message || 'Failed to upload profile picture');
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }

    return false; // Prevent default upload behavior
  };

  const uploadProps: UploadProps = {
    name: 'file',
    showUploadList: false,
    beforeUpload,
    customRequest: ({ file, onSuccess, onError }) => {
      handleUpload(file as RcFile)
        .then(() => {
          onSuccess?.(null);
        })
        .catch((error) => {
          onError?.(error);
        });
    },
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div style={{ 
          padding: '24px', 
          width: '1400px', 
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh'
        }}>
          <Spin size="large" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div style={{ 
          padding: '24px', 
          width: '1400px', 
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <Text type="danger">Error loading profile. Please try again.</Text>
        </div>
      </AppLayout>
    );
  }

  const stats = [
    { title: 'Total Points', value: user?.totalPoints || 0, icon: <TrophyOutlined />, color: '#F59E0B' },
    { title: 'Current Level', value: user?.level || 1, icon: <FireOutlined />, color: '#EF4444' },
    { title: 'Current Streak', value: `${user?.currentStreak || 0} days`, icon: <ClockCircleOutlined />, color: '#10B981' },
    { title: 'Study Time', value: `${Math.round((user?.totalStudyTimeMinutes || 0) / 60)}h`, icon: <BookOutlined />, color: '#3B82F6' },
  ];

  return (
    <AppLayout>
      <div style={{ 
        padding: '24px', 
        width: '1400px', 
        margin: '0 auto',
        backgroundColor: '#F8FAFC',
        minHeight: '100vh'
      }}>
        {/* Header Card */}
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
                Settings
              </Title>
              <Text style={{ 
                fontSize: '16px', 
                color: '#6B7280',
                fontWeight: '500'
              }}>
                Manage your profile and account settings
              </Text>
            </div>
            {!isEditing && (
              <Button
                type="primary"
                size="large"
                icon={<EditOutlined />}
                onClick={handleEditClick}
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
                Edit Profile
              </Button>
            )}
          </div>
        </Card>

        {/* Stats Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          {stats.map((stat, index) => (
            <Col key={index} xs={12} sm={12} md={6}>
              <Card
                style={{
                  borderRadius: '16px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  textAlign: 'center',
                  background: '#FFFFFF'
                }}
                bodyStyle={{ padding: '20px' }}
              >
                <div style={{ 
                  fontSize: '32px', 
                  color: stat.color, 
                  marginBottom: '12px' 
                }}>
                  {stat.icon}
                </div>
                <Text strong style={{ 
                  display: 'block',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: stat.color,
                  marginBottom: '4px'
                }}>
                  {stat.value}
                </Text>
                <Text style={{ 
                  fontSize: '14px',
                  color: '#6B7280',
                  fontWeight: '500'
                }}>
                  {stat.title}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[24, 24]}>
          {/* Profile Information */}
          <Col xs={24} lg={16}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <UserOutlined style={{ fontSize: '20px', color: '#FF7846' }} />
                  <span style={{ fontSize: '20px', fontWeight: '700' }}>Personal Information</span>
                </div>
              }
              extra={
                isEditing && (
                  <Space>
                    <Button onClick={handleCancelEdit} icon={<CloseOutlined />}>
                      Cancel
                    </Button>
                    <Button 
                      type="primary" 
                      onClick={() => profileForm.submit()}
                      loading={updateProfileMutation.isPending}
                      icon={<CheckOutlined />}
                      style={{
                        background: 'linear-gradient(135deg, #FF7846 0%, #FF5722 100%)',
                        border: 'none'
                      }}
                    >
                      Save Changes
                    </Button>
                  </Space>
                )
              }
              style={{
                borderRadius: '20px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                background: '#FFFFFF'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              {/* Profile Picture Upload */}
              <div style={{ 
                textAlign: 'center', 
                marginBottom: '32px',
                padding: '24px',
                background: '#F9FAFB',
                borderRadius: '16px'
              }}>
                <Avatar 
                  size={120} 
                  src={imageUrl}
                  icon={<UserOutlined />}
                  style={{ 
                    backgroundColor: '#FF7846',
                    marginBottom: '16px',
                    border: '4px solid #FFFFFF',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <div>
                  <Upload {...uploadProps}>
                    <Button
                      icon={<CameraOutlined />}
                      loading={uploading}
                      style={{
                        borderRadius: '12px',
                        height: '40px',
                        fontWeight: '600'
                      }}
                    >
                      {uploading ? 'Uploading...' : 'Change Photo'}
                    </Button>
                  </Upload>
                  <div style={{ marginTop: '8px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      JPG, PNG or GIF. Max size 5MB
                    </Text>
                  </div>
                </div>
              </div>

              <Form
                form={profileForm}
                layout="vertical"
                onFinish={handleProfileUpdate}
                disabled={!isEditing}
              >
                <Row gutter={[16, 0]}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Full Name"
                      name="fullName"
                      rules={[{ required: true, message: 'Please enter your full name' }]}
                    >
                      <Input 
                        prefix={<UserOutlined />} 
                        size="large"
                        style={{ borderRadius: '12px' }}
                      />
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
                        size="large"
                        style={{ borderRadius: '12px' }}
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
                      <Input 
                        prefix={<PhoneOutlined />}
                        size="large"
                        style={{ borderRadius: '12px' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Date of Birth"
                      name="dateOfBirth"
                    >
                      <DatePicker 
                        style={{ width: '100%', borderRadius: '12px' }}
                        size="large"
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
                      <Select 
                        placeholder="Select gender"
                        size="large"
                        style={{ borderRadius: '12px' }}
                      >
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
                      <Select 
                        placeholder="Select language"
                        size="large"
                        style={{ borderRadius: '12px' }}
                      >
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

          {/* Security & Account Info */}
          <Col xs={24} lg={8}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* Change Password */}
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <LockOutlined style={{ fontSize: '18px', color: '#FF7846' }} />
                    <span style={{ fontSize: '18px', fontWeight: '700' }}>Change Password</span>
                  </div>
                }
                style={{
                  borderRadius: '20px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  background: '#FFFFFF'
                }}
                bodyStyle={{ padding: '24px' }}
              >
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
                    <Input.Password 
                      prefix={<LockOutlined />}
                      size="large"
                      style={{ borderRadius: '12px' }}
                    />
                  </Form.Item>

                  <Form.Item
                    label="New Password"
                    name="newPassword"
                    rules={[
                      { required: true, message: 'Please enter a new password' },
                      { min: 6, message: 'Password must be at least 6 characters' }
                    ]}
                  >
                    <Input.Password 
                      prefix={<LockOutlined />}
                      size="large"
                      style={{ borderRadius: '12px' }}
                    />
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
                    <Input.Password 
                      prefix={<LockOutlined />}
                      size="large"
                      style={{ borderRadius: '12px' }}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit"
                      loading={changePasswordMutation.isPending}
                      block
                      size="large"
                      style={{
                        borderRadius: '12px',
                        height: '44px',
                        fontWeight: '600',
                        background: 'linear-gradient(135deg, #FF7846 0%, #FF5722 100%)',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
                      }}
                    >
                      Change Password
                    </Button>
                  </Form.Item>
                </Form>
              </Card>

              {/* Account Information */}
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <UserOutlined style={{ fontSize: '18px', color: '#FF7846' }} />
                    <span style={{ fontSize: '18px', fontWeight: '700' }}>Account Information</span>
                  </div>
                }
                style={{
                  borderRadius: '20px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  background: '#FFFFFF'
                }}
                bodyStyle={{ padding: '24px' }}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>Account Status</Text>
                    <Space>
                      <Tag color={user?.isActive ? 'green' : 'red'}>
                        {user?.isActive ? 'Active' : 'Inactive'}
                      </Tag>
                      <Tag color={user?.isVerified ? 'blue' : 'orange'}>
                        {user?.isVerified ? 'Verified' : 'Unverified'}
                      </Tag>
                    </Space>
                  </div>

                  <Divider style={{ margin: '16px 0' }} />

                  <div>
                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>Subscription</Text>
                    <Tag color="purple" style={{ textTransform: 'capitalize', fontSize: '14px', padding: '4px 12px' }}>
                      {user?.subscriptionType || 'Free'}
                    </Tag>
                  </div>

                  <Divider style={{ margin: '16px 0' }} />

                  <div>
                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>Member Since</Text>
                    <Text>{dayjs(user?.createdAt).format('MMMM DD, YYYY')}</Text>
                  </div>

                  <Divider style={{ margin: '16px 0' }} />

                  <div>
                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>Longest Streak</Text>
                    <Text style={{ fontSize: '18px', fontWeight: '600', color: '#F59E0B' }}>
                      {user?.longestStreak || 0} days
                    </Text>
                  </div>
                </Space>
              </Card>
            </Space>
          </Col>
        </Row>
      </div>
    </AppLayout>
  );
}

