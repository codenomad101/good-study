import React from 'react';
import { AppLayout } from '../components/AppLayout';
import { Typography, Card, Space } from 'antd';

const { Title, Paragraph, Text } = Typography;

export default function HelpPage() {
  return (
    <AppLayout>
      <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
        <Title level={2}>Help & FAQs</Title>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card>
            <Title level={4}>How do I start a practice session?</Title>
            <Paragraph>Select a category from the Practice page, pick a topic on the category page, and begin.</Paragraph>
          </Card>
          <Card>
            <Title level={4}>How do dynamic exams work?</Title>
            <Paragraph>Use the Dynamic Exams tab to configure categories, counts, optional topics, duration, and start.</Paragraph>
          </Card>
          <Card>
            <Title level={4}>Where can I study notes?</Title>
            <Paragraph>Go to the Study page, choose a category and optionally a topic to view concise notes.</Paragraph>
          </Card>
        </Space>
      </div>
    </AppLayout>
  );
}

