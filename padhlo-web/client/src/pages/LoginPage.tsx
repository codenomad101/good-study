import React, { useState } from 'react';
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
  Col
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone
} from '@ant-design/icons';
import { useLogin } from '../hooks/useAPI';
import { AppLayout } from '../components/AppLayout';

const { Title, Text, Paragraph } = Typography;

export default function LoginPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await loginMutation.mutateAsync({
        emailOrUsername: values.emailOrUsername,
        password: values.password,
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
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
                  Welcome Back!
                </Title>
                <Paragraph style={{ color: '#6B7280', margin: 0, fontSize: '16px' }}>
                  Sign in to continue your MPSC preparation journey
                </Paragraph>
              </div>

              <Form
                form={form}
                name="login"
                onFinish={handleSubmit}
                layout="vertical"
                size="large"
              >
                <Form.Item
                  name="emailOrUsername"
                  label="Email or Username"
                  rules={[
                    { required: true, message: 'Please enter your email or username!' }
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="Enter your email or username"
                    style={{ borderRadius: '8px' }}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: 'Please enter your password!' }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Enter your password"
                    style={{ borderRadius: '8px' }}
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: '8px', textAlign: 'right' }}>
                  <Link to="/forgot-password">
                    <Button type="link" style={{ padding: 0, fontSize: '14px' }}>
                      Forgot Password?
                    </Button>
                  </Link>
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
                    Sign In
                  </Button>
                </Form.Item>

                <Divider>
                  <Text type="secondary">or</Text>
                </Divider>

                <div style={{ textAlign: 'center' }}>
                  <Space>
                    <Text type="secondary">Don't have an account?</Text>
                    <Link to="/register">
                      <Button type="link" style={{ padding: 0 }}>
                        Sign Up
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
                  <strong>Test Credentials:</strong><br />
                  Admin: admin@mantramanthan.com / admin123<br />
                  Student: student1@mantramanthan.com / student123<br />
                  Moderator: moderator@mantramanthan.com / moderator123
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </AppLayout>
  );
}