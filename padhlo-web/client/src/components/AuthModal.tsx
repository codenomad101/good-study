import React, { useState } from 'react';
import { Modal, Form, Input, Button, Typography, Space, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLogin, useRegister } from '../hooks/useAPI';

const { Title, Text } = Typography;

interface AuthModalProps {
  visible: boolean;
  onCancel: () => void;
  mode: 'login' | 'register';
  onModeChange: (mode: 'login' | 'register') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onCancel, mode, onModeChange }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const handleSubmit = async (values: any) => {
    try {
      if (mode === 'login') {
        await loginMutation.mutateAsync(values);
      } else {
        await registerMutation.mutateAsync(values);
      }
      onCancel();
      form.resetFields();
      navigate('/dashboard');
    } catch (error) {
      // Error handling is done in the hooks
    }
  };

  const switchMode = () => {
    const newMode = mode === 'login' ? 'register' : 'login';
    onModeChange(newMode);
    form.resetFields();
  };

  return (
    <Modal
      title={
        <div style={{ textAlign: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>
            {mode === 'login' ? 'Welcome Back!' : 'Join Padhlo'}
          </Title>
          <Text type="secondary">
            {mode === 'login' ? 'Sign in to continue your learning journey' : 'Create your account to get started'}
          </Text>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={400}
      centered
    >
      <Form
        form={form}
        name={mode}
        onFinish={handleSubmit}
        layout="vertical"
        size="large"
      >
        {mode === 'register' && (
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
            />
          </Form.Item>
        )}

        <Form.Item
          name={mode === 'login' ? 'emailOrUsername' : 'email'}
          label={mode === 'login' ? 'Email or Username' : 'Email'}
          rules={[
            { required: true, message: `Please enter your ${mode === 'login' ? 'email or username' : 'email'}!` },
            ...(mode === 'register' ? [{ type: 'email' as const, message: 'Please enter a valid email!' }] : [])
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder={mode === 'login' ? 'Enter your email or username' : 'Enter your email'}
          />
        </Form.Item>

        {mode === 'register' && (
          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter your full name!' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter your full name"
            />
          </Form.Item>
        )}

        {mode === 'register' && (
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
            />
          </Form.Item>
        )}

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
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={mode === 'login' ? loginMutation.isPending : registerMutation.isPending}
            block
            size="large"
          >
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </Form.Item>

        <Divider>
          <Text type="secondary">or</Text>
        </Divider>

        <div style={{ textAlign: 'center' }}>
          <Space>
            <Text type="secondary">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            </Text>
            <Button type="link" onClick={switchMode}>
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};
