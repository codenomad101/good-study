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

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await registerMutation.mutateAsync({
        username: values.username,
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phone: values.phone,
        role: values.role || 'student', // Default to student
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
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
                  Join <span style={{ 
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
                  </span>
                </Title>
                <Paragraph style={{ color: '#666', margin: 0 }}>
                  Create your account to get started
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
                      borderRadius: '8px',
                      height: '48px',
                      fontSize: '16px',
                      fontWeight: 'bold'
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