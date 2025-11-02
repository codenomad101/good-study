import React, { useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { useCategories, useTopics } from '../hooks/useCategories';
import { Card, Row, Col, Typography, Select, Space, Spin, Empty, Pagination, Tag } from 'antd';
import { studyAPI } from '../services/api';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function StudyPage() {
  const navigate = useNavigate();
  const params = useParams<{ category?: string; topic?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCategory = params.category || searchParams.get('category') || undefined;
  const initialTopic = params.topic || searchParams.get('topic') || undefined;

  const { data: categories = [], isLoading } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(initialCategory);
  const { data: topics = [] } = useTopics(selectedCategory);
  const [selectedTopic, setSelectedTopic] = useState<string | undefined>(initialTopic || undefined);
  const [materials, setMaterials] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const syncUrl = (cat?: string, topic?: string) => {
    const qp: any = {};
    if (cat) qp.category = cat;
    if (topic) qp.topic = topic;
    setSearchParams(qp);
  };

  const loadMaterials = async (cat: string | undefined, topic?: string, p: number = page, ps: number = pageSize) => {
    if (!cat) return;
    setLoading(true);
    try {
      const data = await studyAPI.getMaterials(cat, topic, p, ps);
      setMaterials(data.items || []);
      setTotal(data.total || 0);
      setPage(p);
      setPageSize(ps);
    } finally {
      setLoading(false);
    }
  };

  // Initialize from URL
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
      setSelectedTopic(initialTopic || undefined);
      loadMaterials(initialCategory, initialTopic || undefined, 1, pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle category change
  const onCategoryChange = (val: string) => {
    setSelectedCategory(val);
    setSelectedTopic(undefined);
    syncUrl(val, undefined);
    loadMaterials(val, undefined, 1, pageSize);
  };

  // Handle topic change
  const onTopicChange = (val?: string) => {
    setSelectedTopic(val);
    syncUrl(selectedCategory, val);
    loadMaterials(selectedCategory, val, 1, pageSize);
  };

  return (
    <AppLayout>
      <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 8 }}>Study Materials</Title>
          <Text type="secondary">Browse concise notes by category and topic</Text>
        </div>
        <Space size="middle" style={{ marginBottom: 16 }}>
          <Select
            placeholder="Select Category"
            style={{ minWidth: 260 }}
            loading={isLoading}
            value={selectedCategory}
            onChange={onCategoryChange}
          >
            {(categories || []).map((c: any) => (
              <Option key={c.slug} value={c.slug}>{c.name}</Option>
            ))}
          </Select>
          <Select
            placeholder="Select Topic (optional)"
            style={{ minWidth: 260 }}
            allowClear
            value={selectedTopic}
            onChange={onTopicChange}
            disabled={!selectedCategory}
          >
            {Array.isArray(topics) && topics.map((t: any) => (
              <Option key={t.slug} value={t.slug}>{t.name}</Option>
            ))}
          </Select>
        </Space>

        {/* Topic chips */}
        {selectedCategory && Array.isArray(topics) && topics.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ marginRight: 8 }}>Topics:</Text>
            {topics.map((t: any) => (
              <Tag
                key={t.slug}
                color={selectedTopic === t.slug ? 'processing' : 'default'}
                style={{ cursor: 'pointer', marginBottom: 6 }}
                onClick={() => onTopicChange(t.slug)}
              >
                {t.name}
              </Tag>
            ))}
          </div>
        )}

        {loading ? (
          <Spin />
        ) : materials.length === 0 ? (
          <Empty description="No materials yet. Select a category/topic." />
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {materials.map((m) => (
                <Col key={m.materialId} xs={24} md={12}>
                  <Card>
                    <Title level={4} style={{ marginBottom: 8 }}>{m.title}</Title>
                    <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-line' }}>{m.content}</Paragraph>
                  </Card>
                </Col>
              ))}
            </Row>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                showSizeChanger
                onChange={(p, ps) => loadMaterials(selectedCategory, selectedTopic, p, ps)}
              />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
