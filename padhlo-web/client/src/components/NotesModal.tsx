import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Space, Card, Tag, Empty, message, Popconfirm, ColorPicker, Row, Col } from 'antd';
import { FileTextOutlined, PlusOutlined, DeleteOutlined, EditOutlined, PushpinOutlined, PushpinFilled, LockOutlined } from '@ant-design/icons';
import { notesAPI } from '../services/api';
import './NotesModal.css';

const { TextArea } = Input;

interface Note {
  noteId: string;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  isArchived: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const NotesModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterArchived, setFilterArchived] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: '#fffacd',
    tags: [] as string[],
    isPinned: false,
  });

  useEffect(() => {
    if (visible) {
      loadNotes();
    }
  }, [visible, filterArchived]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const params: any = { archived: filterArchived ? 'true' : 'false' };
      if (searchQuery) params.search = searchQuery;
      const data = await notesAPI.getNotes(params);
      setNotes(data || []);
    } catch (error) {
      message.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    try {
      await notesAPI.createNote(formData);
      message.success('Note created successfully');
      setShowEditor(false);
      setFormData({ title: '', content: '', color: '#fffacd', tags: [], isPinned: false });
      loadNotes();
    } catch (error) {
      message.error('Failed to create note');
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote) return;
    try {
      await notesAPI.updateNote(editingNote.noteId, formData);
      message.success('Note updated successfully');
      setShowEditor(false);
      setEditingNote(null);
      setFormData({ title: '', content: '', color: '#fffacd', tags: [], isPinned: false });
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

  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query);
  });

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const unpinnedNotes = filteredNotes.filter(n => !n.isPinned);

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          <span>My Notes</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      className="notes-modal"
    >
      <div className="notes-container">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* Search and Actions */}
          <Space style={{ width: '100%' }} size="middle">
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <Button
              type="text"
              onClick={() => setFilterArchived(!filterArchived)}
            >
              {filterArchived ? 'Active Notes' : 'Archived Notes'}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowEditor(true)}>
              New Note
            </Button>
          </Space>

          {/* Note List */}
          <div className="notes-list">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px' }}>Loading...</div>
            ) : filteredNotes.length === 0 ? (
              <Empty description="No notes yet" />
            ) : (
              <>
                {/* Pinned Notes */}
                {pinnedNotes.length > 0 && (
                  <div className="notes-section">
                    <div className="section-header">Pinned</div>
                    <Row gutter={[16, 16]}>
                      {pinnedNotes.map(note => (
                        <Col key={note.noteId} xs={24} sm={12} md={8}>
                          <Card
                            style={{ backgroundColor: note.color }}
                            actions={[
                              <PushpinFilled key="pin" onClick={() => handleTogglePin(note)} />,
                              <EditOutlined key="edit" onClick={() => handleEditNote(note)} />,
                              <Popconfirm title="Delete this note?" onConfirm={() => handleDeleteNote(note.noteId)}>
                                <DeleteOutlined key="delete" />
                              </Popconfirm>,
                            ]}
                          >
                            <Card.Meta
                              title={note.title}
                              description={
                                <div>
                                  <div style={{ marginBottom: 8 }}>
                                    {note.content.substring(0, 80)}
                                    {note.content.length > 80 ? '...' : ''}
                                  </div>
                                  {note.tags && note.tags.length > 0 && (
                                    <div>
                                      {note.tags.map(tag => (
                                        <Tag key={tag} size="small">{tag}</Tag>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              }
                            />
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}

                {/* Regular Notes */}
                {unpinnedNotes.length > 0 && (
                  <div className="notes-section">
                    {pinnedNotes.length > 0 && <div className="section-header">Others</div>}
                    <Row gutter={[16, 16]}>
                      {unpinnedNotes.map(note => (
                        <Col key={note.noteId} xs={24} sm={12} md={8}>
                          <Card
                            style={{ backgroundColor: note.color }}
                            actions={[
                              <PushpinOutlined key="pin" onClick={() => handleTogglePin(note)} />,
                              <EditOutlined key="edit" onClick={() => handleEditNote(note)} />,
                              <Popconfirm title="Delete this note?" onConfirm={() => handleDeleteNote(note.noteId)}>
                                <DeleteOutlined key="delete" />
                              </Popconfirm>,
                            ]}
                          >
                            <Card.Meta
                              title={note.title}
                              description={
                                <div>
                                  <div style={{ marginBottom: 8 }}>
                                    {note.content.substring(0, 80)}
                                    {note.content.length > 80 ? '...' : ''}
                                  </div>
                                  {note.tags && note.tags.length > 0 && (
                                    <div>
                                      {note.tags.map(tag => (
                                        <Tag key={tag} size="small">{tag}</Tag>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              }
                            />
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}
              </>
            )}
          </div>
        </Space>
      </div>

      {/* Editor Modal */}
      <Modal
        title={editingNote ? 'Edit Note' : 'New Note'}
        open={showEditor}
        onOk={editingNote ? handleUpdateNote : handleCreateNote}
        onCancel={() => {
          setShowEditor(false);
          setEditingNote(null);
          setFormData({ title: '', content: '', color: '#fffacd', tags: [], isPinned: false });
        }}
        okText="Save"
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Input
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <TextArea
            placeholder="Write your note..."
            rows={6}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          />
          <Space>
            <span>Color:</span>
            <ColorPicker
              value={formData.color}
              onChange={(_, hex) => setFormData({ ...formData, color: hex })}
            />
          </Space>
          <Input
            placeholder="Tags (comma separated)"
            onPressEnter={(e) => {
              const tags = e.currentTarget.value.split(',').map(t => t.trim()).filter(t => t);
              setFormData({ ...formData, tags });
              e.currentTarget.value = '';
            }}
          />
          {formData.tags.length > 0 && (
            <div>
              {formData.tags.map((tag, idx) => (
                <Tag key={idx} closable onClose={() => {
                  setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== idx) });
                }}>
                  {tag}
                </Tag>
              ))}
            </div>
          )}
        </Space>
      </Modal>
    </Modal>
  );
};

