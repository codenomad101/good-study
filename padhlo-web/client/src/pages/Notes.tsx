import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/AppLayout';
import { 
  Input, 
  Button, 
  Space, 
  Row, 
  Col, 
  Empty, 
  Tag, 
  message, 
  Popconfirm,
  Modal,
  Typography,
  Spin,
  Card
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  PushpinOutlined, 
  PushpinFilled,
  SearchOutlined,
  CloseOutlined,
  CheckOutlined,
  BgColorsOutlined
} from '@ant-design/icons';
import { notesAPI } from '../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Text, Title } = Typography;

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

const NOTE_COLORS = [
  '#FFFFFF', '#FFFACD', '#FFE4E1', '#E6E6FA', '#F0F8FF',
  '#E0FFFF', '#F5FFFA', '#FFF8DC', '#FFEFD5', '#FDF5E6',
];

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: '#FFFFFF',
    isPinned: false,
  });

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const data = await notesAPI.getNotes({ archived: 'false' });
      setNotes(data || []);
    } catch (error) {
      message.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!formData.title.trim() && !formData.content.trim()) {
      message.warning('Please enter some content');
      return;
    }
    try {
      await notesAPI.createNote({
        title: formData.title.trim() || 'Untitled',
        content: formData.content.trim(),
        color: formData.color,
        isPinned: formData.isPinned,
      });
      message.success('Note created successfully');
      closeEditor();
      loadNotes();
    } catch (error) {
      message.error('Failed to create note');
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote) return;
    if (!formData.title.trim() && !formData.content.trim()) {
      message.warning('Please enter some content');
      return;
    }
    try {
      await notesAPI.updateNote(editingNote.noteId, {
        title: formData.title.trim() || 'Untitled',
        content: formData.content.trim(),
        color: formData.color,
        isPinned: formData.isPinned,
      });
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
      isPinned: note.isPinned,
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
    setFormData({ title: '', content: '', color: '#FFFFFF', isPinned: false });
    setShowColorPicker(false);
  };

  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query);
  });

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const unpinnedNotes = filteredNotes.filter(n => !n.isPinned);

  // Group notes by date
  const groupNotesByDate = (notesList: Note[]) => {
    const grouped: { [key: string]: Note[] } = {};
    
    notesList.forEach((note) => {
      const dateStr = note.createdAt 
        ? dayjs(note.createdAt).format('MMMM D, YYYY')
        : 'No Date';
      
      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }
      grouped[dateStr].push(note);
    });
    
    // Sort notes within each date group (newest first)
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    });
    
    return grouped;
  };

  const getSortedDates = (grouped: { [key: string]: Note[] }) => {
    return Object.keys(grouped).sort((a, b) => {
      const dateA = grouped[a][0]?.createdAt ? new Date(grouped[a][0].createdAt).getTime() : 0;
      const dateB = grouped[b][0]?.createdAt ? new Date(grouped[b][0].createdAt).getTime() : 0;
      return dateB - dateA;
    });
  };

  return (
    <AppLayout>
      <div style={{ 
        padding: '24px', 
        width: '1400px', 
        margin: '0 auto',
        backgroundColor: '#F8FAFC',
        minHeight: '100vh'
      }}>
        {/* Header Card */}
        <Card
          style={{
            marginBottom: '24px',
            borderRadius: '20px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            background: '#FFFFFF'
          }}
          bodyStyle={{ padding: '20px' }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <Title level={1} style={{ 
                margin: '0 0 8px 0',
                fontSize: '28px',
                fontWeight: '800',
                color: '#1F2937'
              }}>
                Notes
              </Title>
              <Text style={{ 
                fontSize: '16px', 
                color: '#6B7280',
                fontWeight: '500'
              }}>
                Keep track of your study notes and important information
              </Text>
            </div>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => setShowEditor(true)}
              style={{
                borderRadius: '12px',
                height: '44px',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #FF7846 0%, #FF5722 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                padding: '0 24px'
              }}
            >
              New Note
            </Button>
          </div>
        </Card>

        {/* Search Bar */}
        <div style={{ marginBottom: '24px' }}>
          <Input
            placeholder="Search notes..."
            prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="large"
            style={{
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              padding: '12px 16px'
            }}
          />
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <Spin size="large" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <Empty 
            description="No notes found" 
            style={{ marginTop: '60px' }}
          />
        ) : (
          <>
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <Text style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '16px',
                  display: 'block'
                }}>
                  Pinned
                </Text>
                <Row gutter={[16, 16]}>
                  {pinnedNotes.map(note => (
                    <Col key={note.noteId} xs={24} sm={12} md={8} lg={6}>
                      <div
                        style={{
                          backgroundColor: note.color || '#FFFFFF',
                          borderRadius: '12px',
                          padding: '16px',
                          minHeight: '140px',
                          border: '1px solid #E5E7EB',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                        onMouseEnter={() => setExpandedNoteId(note.noteId)}
                        onMouseLeave={() => setExpandedNoteId(null)}
                        onClick={() => handleEditNote(note)}
                      >
                        {note.isPinned && (
                          <PushpinFilled 
                            style={{ 
                              position: 'absolute',
                              top: '12px',
                              right: '12px',
                              color: '#F59E0B',
                              fontSize: '16px'
                            }} 
                          />
                        )}
                        <div>
                          {note.title && note.title !== 'Untitled' && (
                            <Text strong style={{ 
                              display: 'block',
                              marginBottom: '8px',
                              fontSize: '16px',
                              color: '#1F2937',
                              fontWeight: '600'
                            }}>
                              {note.title}
                            </Text>
                          )}
                          <Text style={{ 
                            display: 'block',
                            color: '#4B5563',
                            fontSize: '14px',
                            lineHeight: '1.5',
                            minHeight: '60px',
                            wordBreak: 'break-word'
                          }}>
                            {note.content.substring(0, 150)}
                            {note.content.length > 150 ? '...' : ''}
                          </Text>
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: '8px',
                          marginTop: '12px',
                          opacity: expandedNoteId === note.noteId ? 1 : 0,
                          transition: 'opacity 0.2s ease'
                        }}>
                          <Button
                            type="text"
                            size="small"
                            icon={<PushpinFilled />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePin(note);
                            }}
                            style={{ color: '#F59E0B' }}
                          />
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditNote(note);
                            }}
                          />
                          <Popconfirm
                            title="Delete this note?"
                            onConfirm={(e) => {
                              e?.stopPropagation();
                              handleDeleteNote(note.noteId);
                            }}
                            okText="Delete"
                            cancelText="Cancel"
                            onCancel={(e) => e?.stopPropagation()}
                          >
                            <Button
                              type="text"
                              size="small"
                              icon={<DeleteOutlined />}
                              danger
                              onClick={(e) => e.stopPropagation()}
                            />
                          </Popconfirm>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {/* Notes Grouped by Date */}
            {unpinnedNotes.length > 0 && (() => {
              const groupedByDate = groupNotesByDate(unpinnedNotes);
              const sortedDates = getSortedDates(groupedByDate);
              
              return sortedDates.map((date) => {
                const dateNotes = groupedByDate[date];
                
                return (
                  <div key={date} style={{ marginBottom: '32px' }}>
                    <Text style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '16px',
                      display: 'block'
                    }}>
                      {date}
                    </Text>
                    <Row gutter={[16, 16]}>
                      {dateNotes.map(note => (
                        <Col key={note.noteId} xs={24} sm={12} md={8} lg={6}>
                          <div
                            style={{
                              backgroundColor: note.color || '#FFFFFF',
                              borderRadius: '12px',
                              padding: '16px',
                              minHeight: '140px',
                              border: '1px solid #E5E7EB',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              position: 'relative',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between'
                            }}
                            onMouseEnter={() => setExpandedNoteId(note.noteId)}
                            onMouseLeave={() => setExpandedNoteId(null)}
                            onClick={() => handleEditNote(note)}
                          >
                            <div>
                              {note.title && note.title !== 'Untitled' && (
                                <Text strong style={{ 
                                  display: 'block',
                                  marginBottom: '8px',
                                  fontSize: '16px',
                                  color: '#1F2937',
                                  fontWeight: '600'
                                }}>
                                  {note.title}
                                </Text>
                              )}
                              <Text style={{ 
                                display: 'block',
                                color: '#4B5563',
                                fontSize: '14px',
                                lineHeight: '1.5',
                                minHeight: '60px',
                                wordBreak: 'break-word'
                              }}>
                                {note.content.substring(0, 150)}
                                {note.content.length > 150 ? '...' : ''}
                              </Text>
                            </div>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'flex-end',
                              gap: '8px',
                              marginTop: '12px',
                              opacity: expandedNoteId === note.noteId ? 1 : 0,
                              transition: 'opacity 0.2s ease'
                            }}>
                              <Button
                                type="text"
                                size="small"
                                icon={<PushpinOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTogglePin(note);
                                }}
                              />
                              <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditNote(note);
                                }}
                              />
                              <Popconfirm
                                title="Delete this note?"
                                onConfirm={(e) => {
                                  e?.stopPropagation();
                                  handleDeleteNote(note.noteId);
                                }}
                                okText="Delete"
                                cancelText="Cancel"
                                onCancel={(e) => e?.stopPropagation()}
                              >
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  danger
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </Popconfirm>
                            </div>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>
                );
              });
            })()}
          </>
        )}
      </div>

      {/* Editor Modal */}
      <Modal
        title={null}
        open={showEditor}
        onCancel={closeEditor}
        footer={null}
        width={600}
        style={{ top: 40 }}
        styles={{
          body: {
            padding: 0,
            backgroundColor: formData.color || '#FFFFFF'
          }
        }}
      >
        <div style={{
          padding: '24px',
          backgroundColor: formData.color || '#FFFFFF',
          minHeight: '400px'
        }}>
          {/* Editor Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            paddingBottom: '16px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                type="text"
                icon={<BgColorsOutlined />}
                onClick={() => setShowColorPicker(!showColorPicker)}
              />
              <Button
                type="text"
                icon={formData.isPinned ? <PushpinFilled style={{ color: '#F59E0B' }} /> : <PushpinOutlined />}
                onClick={() => setFormData({ ...formData, isPinned: !formData.isPinned })}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button onClick={closeEditor} icon={<CloseOutlined />}>
                Close
              </Button>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={editingNote ? handleUpdateNote : handleCreateNote}
                style={{
                  background: 'linear-gradient(135deg, #FF7846 0%, #FF5722 100%)',
                  border: 'none'
                }}
              >
                Save
              </Button>
            </div>
          </div>

          {/* Color Picker */}
          {showColorPicker && (
            <div style={{
              display: 'flex',
              gap: '12px',
              padding: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '8px',
              marginBottom: '16px',
              flexWrap: 'wrap'
            }}>
              {NOTE_COLORS.map((color) => (
                <div
                  key={color}
                  onClick={() => {
                    setFormData({ ...formData, color });
                    setShowColorPicker(false);
                  }}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: formData.color === color ? '3px solid #2563EB' : '2px solid #E5E7EB',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                />
              ))}
            </div>
          )}

          {/* Editor Content */}
          <Input
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            style={{
              border: 'none',
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '12px',
              padding: '8px 0',
              backgroundColor: 'transparent'
            }}
            variant="borderless"
          />
          <TextArea
            placeholder="Take a note..."
            rows={12}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            style={{
              border: 'none',
              fontSize: '16px',
              padding: '8px 0',
              backgroundColor: 'transparent',
              resize: 'none'
            }}
            variant="borderless"
            autoSize={{ minRows: 8, maxRows: 20 }}
          />
        </div>
      </Modal>
    </AppLayout>
  );
}
