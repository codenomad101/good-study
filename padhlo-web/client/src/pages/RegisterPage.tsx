import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Typography, 
  Space,
  Divider,
  Row,
  Col,
  Select
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined,
  PhoneOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone
} from '@ant-design/icons';
import { useRegister } from '../hooks/useAPI';
import { AppLayout } from '../components/AppLayout';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function RegisterPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const [loading, setLoading] = useState(false);
  
  // Prevent any automatic redirects - register page should always be accessible
  useEffect(() => {
    // Ensure this page stays accessible regardless of auth state
    // The navigation to dashboard only happens after successful registration
  }, []);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const result = await registerMutation.mutateAsync({
        username: values.username,
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phone: values.phone,
        role: values.role || 'student', // Default to student
      });
      
      // Wait for auth state to update, then navigate
      // Use a longer delay to ensure auth context is updated
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 300);
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout showAuth={false} showFooter={false}>
      <div style={{ 
        background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
        minHeight: '100vh',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '40px 24px'
      }}>
        <Row justify="center" style={{ width: '100%' }}>
          <Col xs={24} sm={20} md={16} lg={12} xl={8}>
            <Card 
              style={{ 
                borderRadius: '24px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: '1px solid #E5E7EB',
                background: '#FFFFFF'
              }}
              bodyStyle={{ padding: '48px' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <img 
                    src="/assets/padhero logo.svg" 
                    alt="Padhero" 
                    style={{ 
                      height: '60px', 
                      width: 'auto', 
                      objectFit: 'contain',
                      marginBottom: '16px'
                    }} 
                  />
                </div>
                <Title level={2} style={{ margin: '0 0 8px 0', color: '#1F2937', fontWeight: '700' }}>
                  Join Padhero
                </Title>
                <Paragraph style={{ color: '#6B7280', margin: 0, fontSize: '16px' }}>
                  Create your account and start your MPSC preparation journey
                </Paragraph>
              </div>

              <Form
                form={form}
                name="register"
                onFinish={handleSubmit}
                layout="vertical"
                size="large"
                initialValues={{ role: 'student' }}
              >
                <Form.Item
                  name="username"
                  label="Username (Optional)"
                  rules={[
                    { min: 3, message: 'Username must be at least 3 characters!' }
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="Choose a username"
                    style={{ borderRadius: '8px' }}
                  />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Please enter your email!' },
                    { type: 'email', message: 'Please enter a valid email!' }
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="Enter your email"
                    style={{ borderRadius: '8px' }}
                  />
                </Form.Item>

                <Form.Item
                  name="fullName"
                  label="Full Name"
                  rules={[
                    { required: true, message: 'Please enter your full name!' }
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="Enter your full name"
                    style={{ borderRadius: '8px' }}
                  />
                </Form.Item>

                <Form.Item
                  name="phone"
                  label="Phone Number (Optional)"
                  rules={[
                    { pattern: /^[0-9+\-\s()]+$/, message: 'Please enter a valid phone number!' }
                  ]}
                >
                  <Input
                    prefix={<PhoneOutlined />}
                    placeholder="Enter your phone number"
                    style={{ borderRadius: '8px' }}
                  />
                </Form.Item>

                <Form.Item
                  name="role"
                  label="Account Type"
                  rules={[
                    { required: true, message: 'Please select your account type!' }
                  ]}
                >
                  <Select
                    placeholder="Select account type"
                    style={{ borderRadius: '8px' }}
                  >
                    <Option value="student">Student</Option>
                    <Option value="moderator">Moderator</Option>
                    <Option value="admin">Admin</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: 'Please enter your password!' },
                    { min: 6, message: 'Password must be at least 6 characters!' }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Enter your password"
                    style={{ borderRadius: '8px' }}
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: '24px' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    size="large"
                    style={{ 
                      borderRadius: '12px',
                      height: '48px',
                      fontSize: '16px',
                      fontWeight: '600',
                      background: 'linear-gradient(135deg, #FF7846 0%, #FF5722 100%)',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
                    }}
                  >
                    Create Account
                  </Button>
                </Form.Item>

                <Divider>
                  <Text type="secondary">or</Text>
                </Divider>

                <div style={{ textAlign: 'center' }}>
                  <Space>
                    <Text type="secondary">Already have an account?</Text>
                    <Link to="/login">
                      <Button type="link" style={{ padding: 0 }}>
                        Sign In
                      </Button>
                    </Link>
                  </Space>
                </div>
              </Form>

              <div style={{ 
                marginTop: '32px', 
                padding: '16px', 
                background: '#f8f9fa', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  <strong>Note:</strong> By default, new accounts are created as Student accounts. 
                  Admin and Moderator roles are typically assigned by existing administrators.
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </AppLayout>
  );
}