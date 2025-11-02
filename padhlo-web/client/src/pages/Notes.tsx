import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/AppLayout';
import { 
  Card, 
  Input, 
  Button, 
  Space, 
  Row, 
  Col, 
  Select, 
  DatePicker, 
  Empty, 
  Tag, 
  message, 
  Popconfirm,
  Statistic,
  Modal
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  PushpinOutlined, 
  PushpinFilled,
  FileTextOutlined,
  CalendarOutlined,
  FolderOutlined
} from '@ant-design/icons';
import { notesAPI } from '../services/api';
import dayjs, { Dayjs } from 'dayjs';
import { useCategories } from '../hooks/useCategories';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface Note {
  noteId: string;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  isArchived: boolean;
  tags: string[];
  categorySlug?: string;
  createdAt: string;
  updatedAt: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  
  const { data: categories = [] } = useCategories();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: '#fffacd',
    tags: [] as string[],
    isPinned: false,
    categorySlug: '',
  });

  useEffect(() => {
    loadNotes();
  }, [selectedCategory, dateRange]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const params: any = { archived: 'false' };
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      const data = await notesAPI.getNotes(params);
      let filteredData = data || [];

      // Filter by date range if selected
      if (dateRange && dateRange[0] && dateRange[1]) {
        filteredData = filteredData.filter((note: Note) => {
          const noteDate = dayjs(note.createdAt);
          return noteDate.isAfter(dateRange[0]) && noteDate.isBefore(dateRange[1].add(1, 'day'));
        });
      }

      setNotes(filteredData);
    } catch (error) {
      message.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      message.warning('Please fill in title and content');
      return;
    }
    try {
      await notesAPI.createNote(formData);
      message.success('Note created successfully');
      closeEditor();
      loadNotes();
    } catch (error) {
      message.error('Failed to create note');
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote) return;
    if (!formData.title.trim() || !formData.content.trim()) {
      message.warning('Please fill in title and content');
      return;
    }
    try {
      await notesAPI.updateNote(editingNote.noteId, formData);
      message.success('Note updated successfully');
      closeEditor();
      loadNotes();
    } catch (error) {
      message.error('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await notesAPI.deleteNote(noteId);
      message.success('Note deleted successfully');
      loadNotes();
    } catch (error) {
      message.error('Failed to delete note');
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      color: note.color,
      tags: note.tags || [],
      isPinned: note.isPinned,
      categorySlug: note.categorySlug || '',
    });
    setShowEditor(true);
  };

  const handleTogglePin = async (note: Note) => {
    try {
      await notesAPI.updateNote(note.noteId, { isPinned: !note.isPinned });
      loadNotes();
    } catch (error) {
      message.error('Failed to update note');
    }
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingNote(null);
    setFormData({ title: '', content: '', color: '#fffacd', tags: [], isPinned: false, categorySlug: '' });
  };

  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query);
  });

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const unpinnedNotes = filteredNotes.filter(n => !n.isPinned);

  const totalNotes = notes.length;
  const totalPinned = notes.filter(n => n.isPinned).length;

  return (
    <AppLayout>
      <div style={{ padding: '32px 24px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
                  <FileTextOutlined style={{ marginRight: '12px', color: '#FF7846' }} />
                  My Notes
                </h1>
                <p style={{ margin: '8px 0 0 0', color: '#666' }}>
                  Keep track of your study notes and important information
                </p>
              </div>
              <Button 
                type="primary" 
                size="large" 
                icon={<PlusOutlined />}
                onClick={() => setShowEditor(true)}
              >
                New Note
              </Button>
            </div>

            {/* Statistics */}
            <Row gutter={16}>
              <Col span={8}>
                <Card>
                  <Statistic title="Total Notes" value={totalNotes} prefix={<FileTextOutlined />} />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic title="Pinned Notes" value={totalPinned} prefix={<PushpinFilled />} />
                </Card>
              </Col>
            </Row>
          </Space>
        </div>

        {/* Filters */}
        <Card style={{ marginBottom: '24px' }}>
          <Space wrap style={{ width: '100%' }}>
            <Input
              placeholder="Search notes..."
              prefix={<FileTextOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 300 }}
            />
            <Select
              placeholder="Filter by Category"
              prefix={<FolderOutlined />}
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ width: 200 }}
            >
              <Select.Option value="all">All Categories</Select.Option>
              {categories.map(cat => (
                <Select.Option key={cat.slug} value={cat.slug}>{cat.name}</Select.Option>
              ))}
            </Select>
            <RangePicker
              placeholder={['Start Date', 'End Date']}
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null] | null)}
              style={{ width: 300 }}
            />
          </Space>
        </Card>

        {/* Notes Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>Loading...</div>
        ) : filteredNotes.length === 0 ? (
          <Empty description="No notes found" />
        ) : (
          <>
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ marginBottom: '16px', color: '#666', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Pinned
                </h3>
                <Row gutter={[16, 16]}>
                  {pinnedNotes.map(note => (
                    <Col key={note.noteId} xs={24} sm={12} md={8} lg={6}>
                      <Card
                        style={{ backgroundColor: note.color, height: '100%' }}
                        actions={[
                          <PushpinFilled 
                            key="pin" 
                            onClick={() => handleTogglePin(note)}
                            style={{ color: '#FF7846' }}
                          />,
                          <EditOutlined key="edit" onClick={() => handleEditNote(note)} />,
                          <Popconfirm 
                            title="Delete this note?" 
                            onConfirm={() => handleDeleteNote(note.noteId)}
                            okText="Delete"
                            cancelText="Cancel"
                          >
                            <DeleteOutlined key="delete" />
                          </Popconfirm>,
                        ]}
                      >
                        <div>
                          <h3 style={{ marginBottom: '12px', fontWeight: '600' }}>{note.title}</h3>
                          <p style={{ marginBottom: '12px', color: '#666', minHeight: '60px' }}>
                            {note.content.substring(0, 100)}
                            {note.content.length > 100 ? '...' : ''}
                          </p>
                          {note.tags && note.tags.length > 0 && (
                            <div style={{ marginBottom: '8px' }}>
                              {note.tags.map(tag => (
                                <Tag key={tag} size="small" style={{ marginBottom: '4px' }}>{tag}</Tag>
                              ))}
                            </div>
                          )}
                          {note.categorySlug && (
                            <Tag style={{ marginTop: '8px' }}>
                              {categories.find(c => c.slug === note.categorySlug)?.name || note.categorySlug}
                            </Tag>
                          )}
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {/* Regular Notes */}
            {unpinnedNotes.length > 0 && (
              <div>
                {pinnedNotes.length > 0 && (
                  <h3 style={{ marginBottom: '16px', color: '#666', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Others
                  </h3>
                )}
                <Row gutter={[16, 16]}>
                  {unpinnedNotes.map(note => (
                    <Col key={note.noteId} xs={24} sm={12} md={8} lg={6}>
                      <Card
                        style={{ backgroundColor: note.color, height: '100%' }}
                        actions={[
                          <PushpinOutlined key="pin" onClick={() => handleTogglePin(note)} />,
                          <EditOutlined key="edit" onClick={() => handleEditNote(note)} />,
                          <Popconfirm 
                            title="Delete this note?" 
                            onConfirm={() => handleDeleteNote(note.noteId)}
                            okText="Delete"
                            cancelText="Cancel"
                          >
                            <DeleteOutlined key="delete" />
                          </Popconfirm>,
                        ]}
                      >
                        <div>
                          <h3 style={{ marginBottom: '12px', fontWeight: '600' }}>{note.title}</h3>
                          <p style={{ marginBottom: '12px', color: '#666', minHeight: '60px' }}>
                            {note.content.substring(0, 100)}
                            {note.content.length > 100 ? '...' : ''}
                          </p>
                          {note.tags && note.tags.length > 0 && (
                            <div style={{ marginBottom: '8px' }}>
                              {note.tags.map(tag => (
                                <Tag key={tag} size="small" style={{ marginBottom: '4px' }}>{tag}</Tag>
                              ))}
                            </div>
                          )}
                          {note.categorySlug && (
                            <Tag style={{ marginTop: '8px' }}>
                              {categories.find(c => c.slug === note.categorySlug)?.name || note.categorySlug}
                            </Tag>
                          )}
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </>
        )}
      </div>

      {/* Editor Modal */}
      <Modal
        title={editingNote ? 'Edit Note' : 'New Note'}
        open={showEditor}
        onOk={editingNote ? handleUpdateNote : handleCreateNote}
        onCancel={closeEditor}
        okText="Save"
        width={700}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Input
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            size="large"
          />
          <TextArea
            placeholder="Write your note..."
            rows={10}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          />
          <Space wrap>
            <span>Category:</span>
            <Select
              placeholder="Select category"
              style={{ width: 200 }}
              value={formData.categorySlug || undefined}
              onChange={(value) => setFormData({ ...formData, categorySlug: value })}
              allowClear
            >
              {categories.map(cat => (
                <Select.Option key={cat.slug} value={cat.slug}>{cat.name}</Select.Option>
              ))}
            </Select>
          </Space>
          <Input
            placeholder="Tags (press Enter to add)"
            onPressEnter={(e) => {
              const tags = e.currentTarget.value.split(',').map(t => t.trim()).filter(t => t);
              setFormData({ ...formData, tags: [...formData.tags, ...tags] });
              e.currentTarget.value = '';
            }}
          />
          {formData.tags.length > 0 && (
            <div>
              {formData.tags.map((tag, idx) => (
                <Tag 
                  key={idx} 
                  closable 
                  onClose={() => {
                    setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== idx) });
                  }}
                >
                  {tag}
                </Tag>
              ))}
            </div>
          )}
        </Space>
      </Modal>
    </AppLayout>
  );
}

