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
  Steps,
  message
} from 'antd';
import { 
  MailOutlined, 
  LockOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { AppLayout } from '../components/AppLayout';
import { authAPI } from '../services/api';

const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0: email, 1: OTP, 2: new password, 3: success
  const [email, setEmail] = useState('');

  const handleRequestOTP = async (values: { email: string }) => {
    setLoading(true);
    try {
      const result = await authAPI.forgotPassword(values.email);
      if (result.success) {
        setEmail(values.email);
        setStep(1);
        message.success('OTP has been sent to your email!');
      } else {
        message.error(result.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      message.error(error.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (values: { otp: string }) => {
    setStep(2);
  };

  const handleResetPassword = async (values: { newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Passwords do not match!');
      return;
    }

    setLoading(true);
    try {
      const otp = form.getFieldValue('otp');
      const result = await authAPI.resetPassword({
        email,
        otp,
        newPassword: values.newPassword,
      });
      
      if (result.success) {
        setStep(3);
        message.success('Password reset successfully!');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        message.error(result.message || 'Failed to reset password');
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      message.error(error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const result = await authAPI.forgotPassword(email);
      if (result.success) {
        message.success('OTP has been resent to your email!');
      } else {
        message.error(result.message || 'Failed to resend OTP');
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      message.error(error.response?.data?.message || 'Failed to resend OTP. Please try again.');
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
                  Reset Password
                </Title>
                <Text type="secondary">
                  Follow the steps to reset your password
                </Text>
              </div>

              <Steps
                current={step}
                items={[
                  { title: 'Enter Email' },
                  { title: 'Verify OTP' },
                  { title: 'New Password' },
                  { title: 'Complete' },
                ]}
                style={{ marginBottom: '32px' }}
              />

              {step === 0 && (
                <Form
                  form={form}
                  name="forgotPassword"
                  onFinish={handleRequestOTP}
                  layout="vertical"
                  size="large"
                >
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
                      Send OTP
                    </Button>
                  </Form.Item>

                  <Divider>
                    <Text type="secondary">or</Text>
                  </Divider>

                  <div style={{ textAlign: 'center' }}>
                    <Space>
                      <Text type="secondary">Remember your password?</Text>
                      <Link to="/login">
                        <Button type="link" style={{ padding: 0 }}>
                          Sign In
                        </Button>
                      </Link>
                    </Space>
                  </div>
                </Form>
              )}

              {step === 1 && (
                <Form
                  form={form}
                  name="verifyOTP"
                  onFinish={handleVerifyOTP}
                  layout="vertical"
                  size="large"
                >
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <Text>
                      We've sent a 6-digit OTP to <strong>{email}</strong>
                    </Text>
                  </div>

                  <Form.Item
                    name="otp"
                    label="Enter OTP"
                    rules={[
                      { required: true, message: 'Please enter the OTP!' },
                      { pattern: /^\d{6}$/, message: 'OTP must be 6 digits!' }
                    ]}
                  >
                    <Input
                      placeholder="Enter 6-digit OTP"
                      style={{ borderRadius: '8px' }}
                      maxLength={6}
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
                      Verify OTP
                    </Button>
                  </Form.Item>

                  <div style={{ textAlign: 'center' }}>
                    <Text type="secondary">Didn't receive the OTP? </Text>
                    <Button type="link" onClick={handleResendOTP} loading={loading}>
                      Resend OTP
                    </Button>
                  </div>
                </Form>
              )}

              {step === 2 && (
                <Form
                  form={form}
                  name="resetPassword"
                  onFinish={handleResetPassword}
                  layout="vertical"
                  size="large"
                >
                  <Form.Item
                    name="newPassword"
                    label="New Password"
                    rules={[
                      { required: true, message: 'Please enter your new password!' },
                      { min: 6, message: 'Password must be at least 6 characters!' }
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="Enter new password"
                      style={{ borderRadius: '8px' }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="confirmPassword"
                    label="Confirm Password"
                    dependencies={['newPassword']}
                    rules={[
                      { required: true, message: 'Please confirm your password!' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Passwords do not match!'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="Confirm new password"
                      style={{ borderRadius: '8px' }}
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
                      Reset Password
                    </Button>
                  </Form.Item>
                </Form>
              )}

              {step === 3 && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <CheckCircleOutlined style={{ fontSize: '64px', color: '#52c41a', marginBottom: '24px' }} />
                  <Title level={3} style={{ margin: '0 0 16px 0' }}>
                    Password Reset Successful!
                  </Title>
                  <Text type="secondary">
                    Your password has been reset successfully. Redirecting to login...
                  </Text>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </AppLayout>
  );
}

