import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { Card, Typography, Row, Col, Select, Button, Space, Spin } from 'antd';
import { useCategories, useTopics } from '../hooks/useCategories';

const { Title, Text } = Typography;
const { Option } = Select;

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: categories = [], isLoading } = useCategories();
  const { data: topics = [], isLoading: topicsLoading } = useTopics(slug);

  const category = (categories || []).find((c: any) => c.slug === slug);

  const handleStartPractice = (topic?: string) => {
    if (!category) return;
    // Navigate to existing practice-test route with category id
    navigate(`/practice-test/${category.id}`);
  };

  const handleViewNotes = (topicSlug: string) => {
    if (!slug) return;
    navigate(`/study?category=${slug}&topic=${topicSlug}`);
  };

  return (
    <AppLayout>
      <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin />
          </div>
        ) : !category ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Title level={3}>Category not found</Title>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Title level={2} style={{ marginBottom: 8 }}>{category.name}</Title>
              <Text type="secondary">Select a topic to begin practicing</Text>
            </div>

            <Card>
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <Text strong>Topics</Text>
                  <div style={{ marginTop: 12 }}>
                    {topicsLoading ? (
                      <Spin />
                    ) : (
                      <Row gutter={[16, 16]}>
                        {Array.isArray(topics) && topics.map((t: any) => (
                          <Col key={t.slug} xs={24} sm={12} md={8}>
                            <Card hoverable>
                              <Space direction="vertical" style={{ width: '100%' }}>
                                <Text strong>{t.name}</Text>
                                <Space>
                                  <Button onClick={() => handleViewNotes(t.slug)}>View Notes</Button>
                                  <Button type="primary" onClick={() => handleStartPractice(t.slug)}>
                                    Practice
                                  </Button>
                                </Space>
                              </Space>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    )}
                  </div>
                </div>
              </Space>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
