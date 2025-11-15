import React, { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { Typography, Card, Row, Col, Form, Input, Button, message, Space } from 'antd';
import { 
  MailOutlined, 
  PhoneOutlined, 
  EnvironmentOutlined,
  SendOutlined,
  MessageOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export default function ContactPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // TODO: Implement contact form submission API
      console.log('Contact form submitted:', values);
      message.success('Thank you for contacting us! We will get back to you soon.');
      form.resetFields();
    } catch (error) {
      message.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: <MailOutlined style={{ fontSize: '24px', color: '#FF7846' }} />,
      title: 'Email',
      content: 'support@padhero.com',
      link: 'mailto:support@padhero.com'
    },
    {
      icon: <PhoneOutlined style={{ fontSize: '24px', color: '#2563EB' }} />,
      title: 'Phone',
      content: '+91 123 456 7890',
      link: 'tel:+911234567890'
    },
    {
      icon: <EnvironmentOutlined style={{ fontSize: '24px', color: '#10B981' }} />,
      title: 'Address',
      content: 'Maharashtra, India',
      link: null
    }
  ];

  return (
    <AppLayout>
      <div style={{ 
        padding: '80px 24px',
        background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
        minHeight: '100vh'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Hero Section */}
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <Title level={1} style={{ 
              fontSize: '48px',
              fontWeight: '800',
              color: '#1F2937',
              marginBottom: '24px',
              lineHeight: '1.2'
            }}>
              Get in Touch
            </Title>
            <Paragraph style={{ 
              fontSize: '20px',
              color: '#6B7280',
              maxWidth: '700px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              Have questions or need support? We're here to help! Reach out to us and we'll respond as soon as possible.
            </Paragraph>
          </div>

          <Row gutter={[32, 32]}>
            {/* Contact Form */}
            <Col xs={24} lg={14}>
              <Card style={{ 
                borderRadius: '24px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                height: '100%'
              }}>
                <Title level={2} style={{ color: '#1F2937', marginBottom: '32px' }}>
                  Send us a Message
                </Title>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  size="large"
                >
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="name"
                        label="Your Name"
                        rules={[{ required: true, message: 'Please enter your name!' }]}
                      >
                        <Input 
                          placeholder="Enter your name"
                          style={{ borderRadius: '12px' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="email"
                        label="Email Address"
                        rules={[
                          { required: true, message: 'Please enter your email!' },
                          { type: 'email', message: 'Please enter a valid email!' }
                        ]}
                      >
                        <Input 
                          placeholder="Enter your email"
                          style={{ borderRadius: '12px' }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item
                    name="subject"
                    label="Subject"
                    rules={[{ required: true, message: 'Please enter a subject!' }]}
                  >
                    <Input 
                      placeholder="What is this regarding?"
                      style={{ borderRadius: '12px' }}
                    />
                  </Form.Item>
                  <Form.Item
                    name="message"
                    label="Message"
                    rules={[{ required: true, message: 'Please enter your message!' }]}
                  >
                    <TextArea 
                      rows={6}
                      placeholder="Tell us how we can help you..."
                      style={{ borderRadius: '12px' }}
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      size="large"
                      icon={<SendOutlined />}
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
                      Send Message
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            {/* Contact Information */}
            <Col xs={24} lg={10}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {contactInfo.map((info, index) => (
                  <Card
                    key={index}
                    style={{
                      borderRadius: '16px',
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                    }}
                    hoverable={!!info.link}
                  >
                    <Space size="large" style={{ width: '100%' }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {info.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <Text strong style={{ fontSize: '14px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>
                          {info.title}
                        </Text>
                        {info.link ? (
                          <a 
                            href={info.link}
                            style={{ 
                              fontSize: '16px', 
                              color: '#1F2937',
                              textDecoration: 'none',
                              fontWeight: '500'
                            }}
                          >
                            {info.content}
                          </a>
                        ) : (
                          <Text style={{ fontSize: '16px', color: '#1F2937', fontWeight: '500' }}>
                            {info.content}
                          </Text>
                        )}
                      </div>
                    </Space>
                  </Card>
                ))}

                {/* Support Hours */}
                <Card style={{
                  borderRadius: '16px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)'
                }}>
                  <MessageOutlined style={{ fontSize: '24px', color: '#F59E0B', marginBottom: '16px' }} />
                  <Title level={4} style={{ color: '#1F2937', marginBottom: '8px' }}>
                    Support Hours
                  </Title>
                  <Text style={{ color: '#6B7280', display: 'block', marginBottom: '4px' }}>
                    Monday - Friday: 9:00 AM - 6:00 PM IST
                  </Text>
                  <Text style={{ color: '#6B7280' }}>
                    Saturday: 10:00 AM - 4:00 PM IST
                  </Text>
                </Card>

                {/* FAQ Link */}
                <Card style={{
                  borderRadius: '16px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  textAlign: 'center'
                }}>
                  <Paragraph style={{ color: '#6B7280', marginBottom: '16px' }}>
                    Have a quick question?
                  </Paragraph>
                  <a href="/help">
                    <Button 
                      type="link"
                      style={{ 
                        color: '#FF7846',
                        fontWeight: '600',
                        padding: 0
                      }}
                    >
                      Check our Help Center →
                    </Button>
                  </a>
                </Card>
              </Space>
            </Col>
          </Row>
        </div>
      </div>
    </AppLayout>
  );
}

