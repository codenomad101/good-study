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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                borderRadius: '16px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                border: 'none'
              }}
              bodyStyle={{ padding: '48px' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <Title level={2} style={{ margin: '0 0 8px 0', color: '#FF7846' }}>
                  Welcome to <span style={{ 
                    color: '#7f8f9d',
                    fontFamily: 'Anton, sans-serif',
                    fontWeight: 'bold',
                    fontStyle: 'italic'
                  }}>G</span><span style={{ 
                    color: '#160676',
                    fontFamily: 'Anton, sans-serif',
                    fontWeight: 'bold',
                    fontStyle: 'italic',
                    position: 'relative'
                  }}>
                    S
                    <span style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-2px',
                      color: '#160676',
                      fontSize: '10px',
                      transform: 'rotate(-45deg)',
                      fontWeight: 'bold'
                    }}>&gt;</span>
                  </span>!
                </Title>
                <Paragraph style={{ color: '#666', margin: 0 }}>
                  Sign in to continue your learning journey
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

                <Form.Item style={{ marginBottom: '24px' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    size="large"
                    style={{ 
                      borderRadius: '8px',
                      height: '48px',
                      fontSize: '16px',
                      fontWeight: 'bold'
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