import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Typography, 
  Row, 
  Col, 
  Space,
  Spin
} from 'antd';
import { ReadOutlined, QuestionCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { AppLayout } from '../components/AppLayout';
import { useCategories, useTopics } from '../hooks/useCategories';
import { useUserStatistics } from '../hooks/useStatistics';

const { Title, Text } = Typography;

const PracticePage: React.FC = () => {
  const navigate = useNavigate();

  // Use custom hooks
  const { data: categories = [], isLoading: loading } = useCategories();
  const { data: userStats } = useUserStatistics();


  const handleViewCategory = (slug: string) => {
    navigate(`/category/${slug}`);
  };


  return (
    <AppLayout>
      <div style={{ padding: '32px 24px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>

        {/* User Statistics */}
        {userStats && (
          <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
            <Col xs={24} sm={6}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff', marginBottom: '4px' }}>
                    {userStats.totalQuestionsAttempted || 0}
                  </div>
                  <Text type="secondary">Total Questions Solved</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a', marginBottom: '4px' }}>
                    {userStats.totalCorrectAnswers || 0}
                  </div>
                  <Text type="secondary">Correct Answers</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14', marginBottom: '4px' }}>
                    {userStats.currentStreak || 0}
                  </div>
                  <Text type="secondary">Current Streak</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1', marginBottom: '4px' }}>
                    {Math.round(parseFloat(userStats.overallAccuracy || '0'))}%
                  </div>
                  <Text type="secondary">Overall Accuracy</Text>
                </div>
              </Card>
            </Col>
          </Row>
        )}

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ 
            margin: '0 0 8px 0',
            fontSize: '28px',
            fontWeight: '800',
            color: '#1f2937'
          }}>
            Practice Sessions
          </Title>
          <Text style={{ 
            fontSize: '16px', 
            color: '#6b7280',
            fontWeight: '500'
          }}>
            Choose a category to start practicing with 20 random questions and a 15-minute timer.
          </Text>
        </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px', color: '#6b7280' }}>
                  Loading categories...
                </div>
              </div>
            ) : (
              <Row gutter={[16, 16]} justify="center">
                {(categories || []).map((category) => (
                  <Col key={category.id} xs={24} sm={12} md={8} lg={6}>
                    <CategoryCard
                      name={category.name}
                      description={category.description}
                      color={category.color}
                      slug={category.slug}
                      onView={() => handleViewCategory(category.slug)}
                    />
                  </Col>
                ))}
              </Row>
            )}
      </div>
    </AppLayout>
  );
};

export default PracticePage;

// Local presentational component to avoid hooks-in-loop issues
function CategoryCard({ name, description, color, slug, onView }: { name: string; description?: string; color?: string; slug: string; onView: () => void; }) {
  const { data: topics = [] } = useTopics(slug);
  return (
    <Card
      hoverable
      style={{
        borderRadius: '12px',
        border: '2px solid #f3f4f6',
        transition: 'all 0.2s ease',
        height: '100%'
      }}
      bodyStyle={{ padding: '24px' }}
    >
      <div style={{ 
        width: '48px',
        height: '48px',
        borderRadius: '10px',
        background: color,
        marginBottom: '16px'
      }} />
      <Title level={4} style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>{name}</Title>
      <Text style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '8px' }}>{description}</Text>
      {Array.isArray(topics) && topics.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>Popular topics:</Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {topics.slice(0, 4).map((t: any) => (
              <span key={t.slug} style={{ background: '#f3f4f6', color: '#374151', borderRadius: 12, padding: '2px 8px', fontSize: 12 }}>{t.name}</span>
            ))}
          </div>
        </div>
      )}
      <Space style={{ marginBottom: '16px' }}>
        <ClockCircleOutlined style={{ color: '#6b7280' }} />
        <Text style={{ fontSize: '13px', color: '#6b7280' }}>15 min</Text>
        <QuestionCircleOutlined style={{ color: '#6b7280' }} />
        <Text style={{ fontSize: '13px', color: '#6b7280' }}>20 questions</Text>
      </Space>
      <Button type="primary" icon={<ReadOutlined />} onClick={onView} style={{ width: '100%', height: '40px', fontSize: '14px', fontWeight: '600', borderRadius: '8px' }}>View Topics</Button>
    </Card>
  );
}

function DistributionRow({ dist, categories, onChange, onRemove }: { dist: any; categories: any[]; onChange: (field: 'count' | 'marksPerQuestion' | 'topic' | 'category', value: any) => void; onRemove: () => void; }) {
  const category = categories.find((c: any) => c.id === dist.category);
  const { data: topics = [] } = useTopics(category?.slug);
  return (
    <Card size="small" style={{ marginBottom: 8 }}>
      <Row align="middle" gutter={12}>
        <Col xs={24} md={7}>
          <Select
            value={dist.category}
            onChange={(val) => onChange('category', val)}
            style={{ width: '100%' }}
          >
            {categories.map((c: any) => (
              <Option key={c.id} value={c.id}>{c.name}</Option>
            ))}
          </Select>
        </Col>
        <Col xs={12} md={5}>
          <InputNumber
            min={0}
            max={Math.min(50, category?.questionCount || 10)}
            value={dist.count}
            onChange={(value) => onChange('count', value || 0)}
            addonAfter="qs"
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={12} md={5}>
          <InputNumber
            min={1}
            value={dist.marksPerQuestion}
            onChange={(value) => onChange('marksPerQuestion', value || 1)}
            addonAfter="marks"
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={18} md={5}>
          <Select
            placeholder="Topic (optional)"
            allowClear
            value={dist.topic}
            onChange={(value) => onChange('topic', value)}
            style={{ width: '100%' }}
          >
            {Array.isArray(topics) && topics.map((t: any) => (
              <Option key={t.slug} value={t.slug}>{t.name}</Option>
            ))}
          </Select>
        </Col>
        <Col xs={6} md={2} style={{ textAlign: 'right' }}>
          <Button danger icon={<DeleteOutlined />} onClick={onRemove} />
        </Col>
      </Row>
    </Card>
  );
}