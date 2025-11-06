import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '@/components/AppHeader';
import {
  Plus,
  Search,
  Pin,
  PinOff,
  Edit,
  Trash2,
  X,
  Check,
  Palette,
  Archive,
  Image as ImageIcon,
  Paperclip,
  ChevronDown,
  ChevronUp,
  Calendar,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  useNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
} from '@/hooks/useApi';
import { showToast } from '@/utils/toast';
import { apiService } from '@/services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

interface Attachment {
  url: string;
  type: string; // 'image', 'pdf', 'document', etc.
  filename?: string;
}

interface Note {
  noteId: string;
  noteTitle: string;
  noteContent: string;
  noteColor: string;
  isPinned: boolean;
  isArchived?: boolean;
  tags?: string[];
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

const COLORS = [
  '#FFFFFF', '#FFFACD', '#FFE4E1', '#E6E6FA', '#F0F8FF',
  '#E0FFFF', '#F5FFFA', '#FFF8DC', '#FFEFD5', '#FDF5E6',
];

export default function NotesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: '#FFFFFF',
    isPinned: false,
    attachments: [] as Attachment[],
  });
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const { data: notesResponse, isLoading, refetch } = useNotes({
    archived: 'false',
  });
  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();

  // Parse notes from response - handle different response structures
  const notes: Note[] = useMemo(() => {
    if (!notesResponse) {
      console.log('[Notes] No notesResponse yet');
      return [];
    }
    
    console.log('[Notes] Raw notesResponse:', JSON.stringify(notesResponse, null, 2));
    
    let notesArray: any[] = [];
    const responseData = notesResponse?.data as any;
    
    // Backend returns: { success: true, data: [...] }
    // Our API service wraps it: { success: true, data: { success: true, data: [...] } }
    // So we need to check both levels
    if (Array.isArray(responseData)) {
      notesArray = responseData;
    } else if (responseData?.data && Array.isArray(responseData.data)) {
      notesArray = responseData.data;
    } else if (typeof responseData === 'object' && !Array.isArray(responseData)) {
      // Handle object with numeric keys (like {"0": {...}, "data": []})
      const objectKeys = Object.keys(responseData).filter(key => key !== 'data' && !isNaN(Number(key)));
      if (objectKeys.length > 0) {
        notesArray = objectKeys
          .sort((a, b) => Number(a) - Number(b))
          .map(key => responseData[key])
          .filter((item: any) => item && (item.noteId || item.note_id) && typeof item === 'object');
      } else if (responseData.noteId || responseData.note_id) {
        // Single note object
        notesArray = [responseData];
      }
    }
    
    console.log('[Notes] Extracted notesArray:', notesArray.length, notesArray);
    
    // Map backend field names to frontend field names
    // Backend schema (userPersonalNotes) uses: noteId, title, content, color, isPinned, isArchived
    // Drizzle returns them in camelCase: noteId, title, content, color, isPinned, isArchived
    const mappedNotes = notesArray
      .filter((note: any) => note && (note.noteId || note.note_id))
      .map((note: any) => {
        const mapped = {
          noteId: note.noteId || note.note_id || '',
          noteTitle: note.title || note.noteTitle || note.note_title || '',
          noteContent: note.content || note.noteContent || note.note_content || '',
          noteColor: note.color || note.noteColor || note.note_color || '#FFFFFF',
          isPinned: note.isPinned !== undefined ? note.isPinned : (note.is_pinned !== undefined ? note.is_pinned : false),
          isArchived: note.isArchived !== undefined ? note.isArchived : (note.is_archived !== undefined ? note.is_archived : false),
          tags: Array.isArray(note.tags) ? note.tags : [],
          attachments: Array.isArray(note.attachments) ? note.attachments : (note.attachments ? [note.attachments] : []),
          createdAt: note.createdAt || note.created_at || '',
          updatedAt: note.updatedAt || note.updated_at || '',
        };
        console.log('[Notes] Mapped note:', mapped);
        return mapped;
      });
    
    console.log('[Notes] Final mapped notes count:', mappedNotes.length);
    return mappedNotes;
  }, [notesResponse]);

  useEffect(() => {
    if (editingNote) {
      setFormData({
        title: editingNote.noteTitle || '',
        content: editingNote.noteContent || '',
        color: editingNote.noteColor || '#FFFFFF',
        isPinned: editingNote.isPinned || false,
        attachments: editingNote.attachments || [],
      });
      setSelectedColor(editingNote.noteColor || '#FFFFFF');
    }
  }, [editingNote]);

  const filteredNotes = notes.filter((note) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (note.noteTitle || '').toLowerCase().includes(query) ||
      (note.noteContent || '').toLowerCase().includes(query)
    );
  });

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const unpinnedNotes = filteredNotes.filter((n) => !n.isPinned);

  // Group notes by date
  const groupNotesByDate = (notesList: Note[]) => {
    const grouped: { [key: string]: Note[] } = {};
    
    notesList.forEach((note) => {
      const dateStr = note.createdAt ? new Date(note.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'No Date';
      
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

  // Get sorted dates (newest first)
  const getSortedDates = (grouped: { [key: string]: Note[] }) => {
    return Object.keys(grouped).sort((a, b) => {
      // Try to parse dates, fallback to string comparison
      const dateA = grouped[a][0]?.createdAt ? new Date(grouped[a][0].createdAt).getTime() : 0;
      const dateB = grouped[b][0]?.createdAt ? new Date(grouped[b][0].createdAt).getTime() : 0;
      return dateB - dateA;
    });
  };

  const toggleDateSection = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  // Initialize all dates as expanded by default when notes change
  useEffect(() => {
    if (unpinnedNotes.length > 0) {
      const grouped = groupNotesByDate(unpinnedNotes);
      const dates = getSortedDates(grouped);
      // Add new dates to expanded set, but keep existing expanded state
      setExpandedDates(prev => {
        const newSet = new Set(prev);
        dates.forEach(date => {
          if (!newSet.has(date)) {
            newSet.add(date);
          }
        });
        return newSet;
      });
    }
  }, [unpinnedNotes.length]);

  const handleCreateNote = async () => {
    if (!formData.title.trim() && !formData.content.trim()) {
      showToast.error('Please enter a title or content');
      return;
    }

    try {
      await createNoteMutation.mutateAsync({
        title: formData.title.trim() || 'Untitled',
        content: formData.content.trim(),
        color: formData.color,
        isPinned: formData.isPinned,
        attachments: formData.attachments,
      });
      showToast.success('Note created successfully');
      await refetch();
      closeEditor();
    } catch (error: any) {
      console.error('[Notes] Error creating note:', error);
      showToast.error(error?.message || 'Failed to create note');
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote) return;
    if (!formData.title.trim() && !formData.content.trim()) {
      showToast.error('Please enter a title or content');
      return;
    }

    try {
      await updateNoteMutation.mutateAsync({
        noteId: editingNote.noteId,
        note: {
          title: formData.title.trim() || 'Untitled',
          content: formData.content.trim(),
          color: formData.color,
          isPinned: formData.isPinned,
          attachments: formData.attachments,
        },
      });
      showToast.success('Note updated successfully');
      await refetch();
      closeEditor();
    } catch (error: any) {
      console.error('[Notes] Error updating note:', error);
      showToast.error(error?.message || 'Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNoteMutation.mutateAsync(noteId);
      showToast.success('Note deleted successfully');
      await refetch();
    } catch (error: any) {
      console.error('[Notes] Error deleting note:', error);
      showToast.error(error?.message || 'Failed to delete note');
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      await updateNoteMutation.mutateAsync({
        noteId: note.noteId,
        note: { isPinned: !note.isPinned },
      });
      await refetch();
    } catch (error: any) {
      console.error('[Notes] Error toggling pin:', error);
      showToast.error(error?.message || 'Failed to update note');
    }
  };

  const openEditor = (note?: Note) => {
    if (note) {
      setEditingNote(note);
    } else {
      setEditingNote(null);
      setFormData({
        title: '',
        content: '',
        color: '#FFFFFF',
        isPinned: false,
        attachments: [],
      });
      setSelectedColor('#FFFFFF');
    }
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingNote(null);
    setFormData({
      title: '',
      content: '',
      color: '#FFFFFF',
      isPinned: false,
      attachments: [],
    });
    setSelectedColor('#FFFFFF');
    setShowColorPicker(false);
  };

  const handlePickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast.error('Permission to access camera roll is required!');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Upload the image
        showToast.info('Uploading image...');
        try {
          const uploadResponse = await apiService.uploadNoteAttachment(
            asset.uri,
            asset.fileName || `image-${Date.now()}.jpg`,
            asset.mimeType || 'image/jpeg'
          );

          if (uploadResponse.success && uploadResponse.data) {
            const newAttachment: Attachment = {
              url: uploadResponse.data.url,
              type: uploadResponse.data.type || 'image',
              filename: uploadResponse.data.filename,
            };
            
            setFormData({
              ...formData,
              attachments: [...formData.attachments, newAttachment],
            });
            showToast.success('Image attached successfully');
          } else {
            showToast.error('Failed to upload image');
          }
        } catch (uploadError: any) {
          console.error('[Notes] Error uploading image:', uploadError);
          showToast.error(uploadError?.message || 'Failed to upload image');
        }
      }
    } catch (error: any) {
      console.error('[Notes] Error picking image:', error);
      showToast.error('Failed to pick image');
    }
  };

  const handleRemoveAttachment = (index: number) => {
    const newAttachments = formData.attachments.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      attachments: newAttachments,
    });
  };

  const renderNoteCard = ({ item: note }: { item: Note }) => (
    <TouchableOpacity
      style={[
        styles.noteCard,
        { backgroundColor: note.noteColor || '#FFFFFF' },
      ]}
      onPress={() => openEditor(note)}
      activeOpacity={0.7}
    >
      {note.isPinned && (
        <View style={styles.pinIcon}>
          <Pin size={16} color="#666" />
        </View>
      )}
      
      {note.noteTitle && (
        <Text style={styles.noteTitle} numberOfLines={2}>
          {note.noteTitle}
        </Text>
      )}
      
      {note.noteContent && (
        <Text style={styles.noteContent} numberOfLines={8}>
          {note.noteContent}
        </Text>
      )}

      {/* Attachments Preview */}
      {note.attachments && note.attachments.length > 0 && (
        <View style={styles.attachmentsPreview}>
          {note.attachments.slice(0, 2).map((attachment, index) => {
            if (attachment.type === 'image' || attachment.type?.startsWith('image')) {
              return (
                <Image
                  key={index}
                  source={{ uri: attachment.url }}
                  style={styles.attachmentThumbnail}
                  resizeMode="cover"
                />
              );
            }
            return null;
          })}
          {note.attachments.length > 2 && (
            <View style={styles.moreAttachments}>
              <Text style={styles.moreAttachmentsText}>+{note.attachments.length - 2}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.noteActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleTogglePin(note);
          }}
        >
          {note.isPinned ? (
            <Pin size={16} color="#F59E0B" />
          ) : (
            <PinOff size={16} color="#9CA3AF" />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            openEditor(note);
          }}
        >
          <Edit size={16} color="#6B7280" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteNote(note.noteId);
          }}
        >
          <Trash2 size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Notes" showLogo={true} extraTopSpacing={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading notes...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Notes" showLogo={true} extraTopSpacing={true} />
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search notes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Pinned Notes Section */}
        {pinnedNotes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pinned</Text>
            <FlatList
              data={pinnedNotes}
              renderItem={renderNoteCard}
              keyExtractor={(item) => item.noteId}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.row}
            />
          </View>
        )}

        {/* Notes Grouped by Date */}
        {unpinnedNotes.length > 0 && (() => {
          const groupedByDate = groupNotesByDate(unpinnedNotes);
          const sortedDates = getSortedDates(groupedByDate);
          
          return sortedDates.map((date) => {
            const dateNotes = groupedByDate[date];
            const isExpanded = expandedDates.has(date);
            
            return (
              <View key={date} style={styles.dateSection}>
                <TouchableOpacity
                  style={styles.dateHeader}
                  onPress={() => toggleDateSection(date)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dateHeaderContent}>
                    <Calendar size={18} color="#6B7280" />
                    <Text style={styles.dateHeaderText}>{date}</Text>
                    <Text style={styles.dateNoteCount}>({dateNotes.length})</Text>
                  </View>
                  {isExpanded ? (
                    <ChevronUp size={20} color="#6B7280" />
                  ) : (
                    <ChevronDown size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>
                
                {isExpanded && (
                  <View style={styles.dateNotesContainer}>
                    <FlatList
                      data={dateNotes}
                      renderItem={renderNoteCard}
                      keyExtractor={(item) => item.noteId}
                      numColumns={2}
                      scrollEnabled={false}
                      columnWrapperStyle={styles.row}
                    />
                  </View>
                )}
              </View>
            );
          });
        })()}

        {/* Empty State */}
        {filteredNotes.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery
                ? 'Try a different search term'
                : 'Tap the + button to create your first note'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => openEditor()}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Note Editor Modal */}
      <Modal
        visible={showEditor}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeEditor}
      >
        <SafeAreaView style={[styles.editorContainer, { backgroundColor: formData.color }]}>
          {/* Editor Header */}
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={closeEditor} style={styles.closeButton}>
              <X size={24} color="#1F2937" />
            </TouchableOpacity>
            <View style={styles.editorActions}>
              <TouchableOpacity
                style={styles.editorActionButton}
                onPress={handlePickImage}
              >
                <ImageIcon size={20} color="#1F2937" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editorActionButton}
                onPress={() => setShowColorPicker(!showColorPicker)}
              >
                <Palette size={20} color="#1F2937" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editorActionButton}
                onPress={() => setFormData({ ...formData, isPinned: !formData.isPinned })}
              >
                {formData.isPinned ? (
                  <Pin size={20} color="#F59E0B" />
                ) : (
                  <PinOff size={20} color="#1F2937" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={editingNote ? handleUpdateNote : handleCreateNote}
                disabled={createNoteMutation.isPending || updateNoteMutation.isPending}
              >
                {(createNoteMutation.isPending || updateNoteMutation.isPending) ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Check size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Color Picker */}
          {showColorPicker && (
            <View style={styles.colorPicker}>
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColor,
                  ]}
                  onPress={() => {
                    setSelectedColor(color);
                    setFormData({ ...formData, color });
                    setShowColorPicker(false);
                  }}
                />
              ))}
            </View>
          )}

          {/* Editor Content */}
          <ScrollView style={styles.editorContent}>
            <TextInput
              style={styles.editorTitle}
              placeholder="Title"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholderTextColor="#9CA3AF"
              multiline
            />
            <TextInput
              style={styles.editorContentInput}
              placeholder="Take a note..."
              value={formData.content}
              onChangeText={(text) => setFormData({ ...formData, content: text })}
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
            />

            {/* Attachments in Editor */}
            {formData.attachments && formData.attachments.length > 0 && (
              <View style={styles.editorAttachments}>
                {formData.attachments.map((attachment, index) => (
                  <View key={index} style={styles.editorAttachmentItem}>
                    {attachment.type === 'image' || attachment.type?.startsWith('image') ? (
                      <Image
                        source={{ uri: attachment.url }}
                        style={styles.editorAttachmentImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.editorAttachmentFile}>
                        <Paperclip size={20} color="#6B7280" />
                        <Text style={styles.editorAttachmentFilename} numberOfLines={1}>
                          {attachment.filename || 'Attachment'}
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.removeAttachmentButton}
                      onPress={() => handleRemoveAttachment(index)}
                    >
                      <X size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateSection: {
    marginBottom: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dateHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  dateNoteCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  dateNotesContainer: {
    paddingHorizontal: 0,
  },
  row: {
    justifyContent: 'space-between',
  },
  noteCard: {
    width: CARD_WIDTH,
    minHeight: 120,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pinIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  noteContent: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    flex: 1,
  },
  attachmentsPreview: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
    marginBottom: 4,
  },
  attachmentThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  moreAttachments: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreAttachmentsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  noteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  editorContainer: {
    flex: 1,
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 4,
  },
  editorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editorActionButton: {
    padding: 8,
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#2563EB',
    borderWidth: 3,
  },
  editorContent: {
    flex: 1,
    padding: 16,
  },
  editorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    minHeight: 40,
  },
  editorContentInput: {
    fontSize: 16,
    color: '#1F2937',
    minHeight: 200,
    lineHeight: 24,
  },
  editorAttachments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  editorAttachmentItem: {
    position: 'relative',
    marginBottom: 8,
  },
  editorAttachmentImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  editorAttachmentFile: {
    width: 120,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  editorAttachmentFilename: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  removeAttachmentButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

