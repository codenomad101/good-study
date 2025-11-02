import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput,
  Modal,
  FlatList,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from './AppHeader';
import { 
  Users, 
  MessageCircle, 
  Plus, 
  Search, 
  Filter,
  ThumbsUp,
  Reply,
  Pin,
  Lock,
  Calendar,
  User,
  Send,
  BookOpen,
  Trophy,
  Star
} from 'lucide-react-native';
import { 
  useForums,
  useForumThreads,
  useForumReplies,
  useStudyGroups,
  useStudyGroupMembers,
  useCreateThread,
  useCreateReply,
  useJoinStudyGroup,
  useCreateStudyGroup
} from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { responsiveValues } from '../utils/responsive';

interface Forum {
  forumId: string;
  examId: string;
  forumName: string;
  description: string;
  totalThreads: number;
  totalPosts: number;
}

interface Thread {
  threadId: string;
  forumId: string;
  userId: string;
  title: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    fullName: string;
    profilePictureUrl?: string;
  };
}

interface Reply {
  replyId: string;
  threadId: string;
  userId: string;
  parentReplyId?: string;
  content: string;
  upvotes: number;
  isSolution: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    fullName: string;
    profilePictureUrl?: string;
  };
}

interface StudyGroup {
  groupId: string;
  examId: string;
  createdBy: string;
  groupName: string;
  description: string;
  groupCode: string;
  isPrivate: boolean;
  maxMembers: number;
  currentMembers: number;
  createdAt: string;
  creator?: {
    fullName: string;
  };
}

const CommunityContent: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'forums' | 'groups' | 'discussions'>('forums');
  const [selectedForum, setSelectedForum] = useState<string>('');
  const [selectedThread, setSelectedThread] = useState<string>('');
  const [showCreateThread, setShowCreateThread] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupCode, setGroupCode] = useState('');

  // Form states
  const [threadForm, setThreadForm] = useState({
    title: '',
    content: ''
  });
  const [replyForm, setReplyForm] = useState({
    content: ''
  });
  const [groupForm, setGroupForm] = useState({
    groupName: '',
    description: '',
    isPrivate: false
  });

  // React Query hooks
  const { data: forumsData, isLoading: forumsLoading, refetch: refetchForums } = useForums();
  const { data: threadsData, isLoading: threadsLoading, refetch: refetchThreads } = useForumThreads(selectedForum);
  const { data: repliesData, isLoading: repliesLoading, refetch: refetchReplies } = useForumReplies(selectedThread);
  const { data: groupsData, isLoading: groupsLoading, refetch: refetchGroups } = useStudyGroups();
  const { data: membersData, isLoading: membersLoading, refetch: refetchMembers } = useStudyGroupMembers(selectedForum);

  // Mutations
  const createThreadMutation = useCreateThread();
  const createReplyMutation = useCreateReply();
  const joinGroupMutation = useJoinStudyGroup();
  const createGroupMutation = useCreateStudyGroup();

  const forums: Forum[] = forumsData?.data || [];
  const threads: Thread[] = threadsData?.data || [];
  const replies: Reply[] = repliesData?.data || [];
  const groups: StudyGroup[] = groupsData?.data || [];
  const members = membersData?.data || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchForums(),
      refetchThreads(),
      refetchReplies(),
      refetchGroups(),
      refetchMembers()
    ]);
    setRefreshing(false);
  };

  const handleCreateThread = async () => {
    if (!threadForm.title.trim() || !threadForm.content.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await createThreadMutation.mutateAsync({
        forumId: selectedForum,
        title: threadForm.title,
        content: threadForm.content
      });
      
      setShowCreateThread(false);
      setThreadForm({ title: '', content: '' });
      refetchThreads();
      Alert.alert('Success', 'Thread created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create thread');
    }
  };

  const handleCreateReply = async () => {
    if (!replyForm.content.trim()) {
      Alert.alert('Error', 'Please enter a reply');
      return;
    }

    try {
      await createReplyMutation.mutateAsync({
        threadId: selectedThread,
        content: replyForm.content
      });
      
      setReplyForm({ content: '' });
      refetchReplies();
      Alert.alert('Success', 'Reply posted successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to post reply');
    }
  };

  const handleJoinGroup = async () => {
    if (!groupCode.trim()) {
      Alert.alert('Error', 'Please enter a group code');
      return;
    }

    try {
      await joinGroupMutation.mutateAsync(groupCode);
      setShowJoinGroup(false);
      setGroupCode('');
      refetchGroups();
      Alert.alert('Success', 'Joined group successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to join group');
    }
  };

  const handleCreateGroup = async () => {
    if (!groupForm.groupName.trim() || !groupForm.description.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await createGroupMutation.mutateAsync({
        groupName: groupForm.groupName,
        description: groupForm.description,
        isPrivate: groupForm.isPrivate
      });
      
      setShowCreateGroup(false);
      setGroupForm({ groupName: '', description: '', isPrivate: false });
      refetchGroups();
      Alert.alert('Success', 'Study group created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create study group');
    }
  };

  const renderForumsTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.searchContainer}>
        <Search size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search forums..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {forumsLoading ? (
        <ActivityIndicator size="large" color="#2563EB" style={styles.loadingIndicator} />
      ) : (
        <View style={styles.forumsList}>
          {forums.map((forum) => (
            <TouchableOpacity
              key={forum.forumId}
              style={styles.forumCard}
              onPress={() => setSelectedForum(forum.forumId)}
            >
              <View style={styles.forumHeader}>
                <View style={styles.forumIcon}>
                  <MessageCircle size={24} color="#2563EB" />
                </View>
                <View style={styles.forumInfo}>
                  <Text style={styles.forumName}>{forum.forumName}</Text>
                  <Text style={styles.forumDescription}>{forum.description}</Text>
                </View>
              </View>
              <View style={styles.forumStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{forum.totalThreads}</Text>
                  <Text style={styles.statLabel}>Threads</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{forum.totalPosts}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selectedForum && (
        <View style={styles.threadsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Threads</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateThread(true)}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.createButtonText}>New Thread</Text>
            </TouchableOpacity>
          </View>

          {threadsLoading ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <View style={styles.threadsList}>
              {threads.map((thread) => (
                <TouchableOpacity
                  key={thread.threadId}
                  style={styles.threadCard}
                  onPress={() => setSelectedThread(thread.threadId)}
                >
                  <View style={styles.threadHeader}>
                    <View style={styles.threadInfo}>
                      <Text style={styles.threadTitle}>{thread.title}</Text>
                      <Text style={styles.threadAuthor}>
                        by {thread.user?.fullName || 'Anonymous'}
                      </Text>
                    </View>
                    <View style={styles.threadMeta}>
                      {thread.isPinned && <Pin size={16} color="#F59E0B" />}
                      {thread.isLocked && <Lock size={16} color="#EF4444" />}
                    </View>
                  </View>
                  <View style={styles.threadStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{thread.replyCount}</Text>
                      <Text style={styles.statLabel}>Replies</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{thread.viewCount}</Text>
                      <Text style={styles.statLabel}>Views</Text>
                    </View>
                    <Text style={styles.threadDate}>
                      {new Date(thread.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {selectedThread && (
        <View style={styles.repliesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Replies</Text>
            <TouchableOpacity
              style={styles.replyButton}
              onPress={() => setReplyForm({ content: '' })}
            >
              <Reply size={16} color="#2563EB" />
              <Text style={styles.replyButtonText}>Reply</Text>
            </TouchableOpacity>
          </View>

          {repliesLoading ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <View style={styles.repliesList}>
              {replies.map((reply) => (
                <View key={reply.replyId} style={styles.replyCard}>
                  <View style={styles.replyHeader}>
                    <View style={styles.replyAuthor}>
                      <User size={16} color="#6B7280" />
                      <Text style={styles.replyAuthorName}>
                        {reply.user?.fullName || 'Anonymous'}
                      </Text>
                    </View>
                    <View style={styles.replyMeta}>
                      {reply.isSolution && (
                        <View style={styles.solutionBadge}>
                          <Star size={12} color="#FFFFFF" />
                          <Text style={styles.solutionText}>Solution</Text>
                        </View>
                      )}
                      <Text style={styles.replyDate}>
                        {new Date(reply.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.replyContent}>{reply.content}</Text>
                  <View style={styles.replyActions}>
                    <TouchableOpacity style={styles.upvoteButton}>
                      <ThumbsUp size={16} color="#6B7280" />
                      <Text style={styles.upvoteText}>{reply.upvotes}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );

  const renderGroupsTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.groupsHeader}>
        <TouchableOpacity
          style={styles.createGroupButton}
          onPress={() => setShowCreateGroup(true)}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.createGroupButtonText}>Create Group</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.joinGroupButton}
          onPress={() => setShowJoinGroup(true)}
        >
          <Users size={16} color="#2563EB" />
          <Text style={styles.joinGroupButtonText}>Join Group</Text>
        </TouchableOpacity>
      </View>

      {groupsLoading ? (
        <ActivityIndicator size="large" color="#2563EB" style={styles.loadingIndicator} />
      ) : (
        <View style={styles.groupsList}>
          {groups.map((group) => (
            <View key={group.groupId} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <View style={styles.groupIcon}>
                  <Users size={24} color="#2563EB" />
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.groupName}</Text>
                  <Text style={styles.groupDescription}>{group.description}</Text>
                  <Text style={styles.groupCreator}>
                    Created by {group.creator?.fullName || 'Anonymous'}
                  </Text>
                </View>
                {group.isPrivate && <Lock size={16} color="#EF4444" />}
              </View>
              <View style={styles.groupStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{group.currentMembers}</Text>
                  <Text style={styles.statLabel}>Members</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{group.maxMembers}</Text>
                  <Text style={styles.statLabel}>Max</Text>
                </View>
                <Text style={styles.groupCode}>Code: {group.groupCode}</Text>
              </View>
              <Text style={styles.groupDate}>
                Created {new Date(group.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {groups.length === 0 && (
        <View style={styles.emptyState}>
          <Users size={48} color="#9CA3AF" />
          <Text style={styles.emptyStateText}>No study groups yet</Text>
          <Text style={styles.emptyStateSubtext}>Create or join a study group to start collaborating</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderDiscussionsTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.sectionTitle}>Recent Discussions</Text>
      
      <View style={styles.discussionsList}>
        {threads.slice(0, 10).map((thread) => (
          <View key={thread.threadId} style={styles.discussionCard}>
            <View style={styles.discussionHeader}>
              <Text style={styles.discussionTitle}>{thread.title}</Text>
              <Text style={styles.discussionForum}>
                in {forums.find(f => f.forumId === thread.forumId)?.forumName}
              </Text>
            </View>
            <Text style={styles.discussionContent} numberOfLines={2}>
              {thread.content}
            </Text>
            <View style={styles.discussionMeta}>
              <Text style={styles.discussionAuthor}>
                by {thread.user?.fullName || 'Anonymous'}
              </Text>
              <Text style={styles.discussionDate}>
                {new Date(thread.createdAt).toLocaleDateString()}
              </Text>
              <View style={styles.discussionStats}>
                <Text style={styles.discussionReplies}>{thread.replyCount} replies</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {threads.length === 0 && (
        <View style={styles.emptyState}>
          <MessageCircle size={48} color="#9CA3AF" />
          <Text style={styles.emptyStateText}>No discussions yet</Text>
          <Text style={styles.emptyStateSubtext}>Start a discussion in any forum</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'forums':
        return renderForumsTab();
      case 'groups':
        return renderGroupsTab();
      case 'discussions':
        return renderDiscussionsTab();
      default:
        return renderForumsTab();
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Community" showLogo={true} extraTopSpacing={true} />
      
      {/* Subtitle */}
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>Connect and learn together</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'forums' && styles.tabButtonActive]}
          onPress={() => setActiveTab('forums')}
        >
          <MessageCircle size={20} color={activeTab === 'forums' ? '#2563EB' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'forums' && styles.tabTextActive]}>
            Forums
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'groups' && styles.tabButtonActive]}
          onPress={() => setActiveTab('groups')}
        >
          <Users size={20} color={activeTab === 'groups' ? '#2563EB' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'groups' && styles.tabTextActive]}>
            Groups
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'discussions' && styles.tabButtonActive]}
          onPress={() => setActiveTab('discussions')}
        >
          <BookOpen size={20} color={activeTab === 'discussions' ? '#2563EB' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'discussions' && styles.tabTextActive]}>
            Discussions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Create Thread Modal */}
      <Modal
        visible={showCreateThread}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Thread</Text>
            <TouchableOpacity onPress={() => setShowCreateThread(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Thread Title"
              value={threadForm.title}
              onChangeText={(text) => setThreadForm(prev => ({ ...prev, title: text }))}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Thread Content"
              value={threadForm.content}
              onChangeText={(text) => setThreadForm(prev => ({ ...prev, content: text }))}
              multiline
              numberOfLines={6}
            />
          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCreateThread(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateThread}
            >
              <Text style={styles.submitButtonText}>Create Thread</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Group Modal */}
      <Modal
        visible={showCreateGroup}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Study Group</Text>
            <TouchableOpacity onPress={() => setShowCreateGroup(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Group Name"
              value={groupForm.groupName}
              onChangeText={(text) => setGroupForm(prev => ({ ...prev, groupName: text }))}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Group Description"
              value={groupForm.description}
              onChangeText={(text) => setGroupForm(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={4}
            />
          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCreateGroup(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateGroup}
            >
              <Text style={styles.submitButtonText}>Create Group</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Join Group Modal */}
      <Modal
        visible={showJoinGroup}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Join Study Group</Text>
            <TouchableOpacity onPress={() => setShowJoinGroup(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Enter Group Code"
              value={groupCode}
              onChangeText={setGroupCode}
            />
          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowJoinGroup(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleJoinGroup}
            >
              <Text style={styles.submitButtonText}>Join Group</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  subtitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontSize: responsiveValues.fontSize.small,
    color: '#6B7280',
    marginLeft: 8,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: responsiveValues.padding.medium,
  },
  loadingIndicator: {
    marginTop: 48,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: responsiveValues.fontSize.medium,
    color: '#1F2937',
  },
  forumsList: {
    marginBottom: 24,
  },
  forumCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  forumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  forumIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  forumInfo: {
    flex: 1,
  },
  forumName: {
    fontSize: responsiveValues.fontSize.large,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  forumDescription: {
    fontSize: responsiveValues.fontSize.medium,
    color: '#6B7280',
  },
  forumStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: responsiveValues.fontSize.large,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: responsiveValues.fontSize.small,
    color: '#6B7280',
    marginTop: 2,
  },
  threadsSection: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: responsiveValues.fontSize.large,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  createButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: responsiveValues.fontSize.small,
    fontWeight: '600',
    marginLeft: 4,
  },
  threadsList: {
    marginBottom: 24,
  },
  threadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  threadInfo: {
    flex: 1,
  },
  threadTitle: {
    fontSize: responsiveValues.fontSize.medium,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  threadAuthor: {
    fontSize: responsiveValues.fontSize.small,
    color: '#6B7280',
  },
  threadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  threadStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  threadDate: {
    fontSize: responsiveValues.fontSize.small,
    color: '#9CA3AF',
  },
  repliesSection: {
    marginTop: 24,
  },
  replyButton: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyButtonText: {
    color: '#2563EB',
    fontSize: responsiveValues.fontSize.small,
    fontWeight: '600',
    marginLeft: 4,
  },
  repliesList: {
    marginTop: 16,
  },
  replyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyAuthorName: {
    fontSize: responsiveValues.fontSize.small,
    color: '#6B7280',
    marginLeft: 4,
  },
  replyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  solutionBadge: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  solutionText: {
    color: '#FFFFFF',
    fontSize: responsiveValues.fontSize.small,
    fontWeight: '600',
    marginLeft: 4,
  },
  replyDate: {
    fontSize: responsiveValues.fontSize.small,
    color: '#9CA3AF',
  },
  replyContent: {
    fontSize: responsiveValues.fontSize.medium,
    color: '#1F2937',
    lineHeight: 20,
    marginBottom: 12,
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upvoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  upvoteText: {
    fontSize: responsiveValues.fontSize.small,
    color: '#6B7280',
    marginLeft: 4,
  },
  groupsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  createGroupButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  createGroupButtonText: {
    color: '#FFFFFF',
    fontSize: responsiveValues.fontSize.medium,
    fontWeight: '600',
    marginLeft: 4,
  },
  joinGroupButton: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  joinGroupButtonText: {
    color: '#2563EB',
    fontSize: responsiveValues.fontSize.medium,
    fontWeight: '600',
    marginLeft: 4,
  },
  groupsList: {
    marginBottom: 24,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: responsiveValues.fontSize.large,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: responsiveValues.fontSize.medium,
    color: '#6B7280',
    marginBottom: 4,
  },
  groupCreator: {
    fontSize: responsiveValues.fontSize.small,
    color: '#9CA3AF',
  },
  groupStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupCode: {
    fontSize: responsiveValues.fontSize.small,
    color: '#2563EB',
    fontWeight: '600',
  },
  groupDate: {
    fontSize: responsiveValues.fontSize.small,
    color: '#9CA3AF',
  },
  discussionsList: {
    marginBottom: 24,
  },
  discussionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  discussionHeader: {
    marginBottom: 8,
  },
  discussionTitle: {
    fontSize: responsiveValues.fontSize.medium,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  discussionForum: {
    fontSize: responsiveValues.fontSize.small,
    color: '#6B7280',
  },
  discussionContent: {
    fontSize: responsiveValues.fontSize.medium,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  discussionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discussionAuthor: {
    fontSize: responsiveValues.fontSize.small,
    color: '#6B7280',
  },
  discussionDate: {
    fontSize: responsiveValues.fontSize.small,
    color: '#9CA3AF',
  },
  discussionStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discussionReplies: {
    fontSize: responsiveValues.fontSize.small,
    color: '#2563EB',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: responsiveValues.fontSize.large,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: responsiveValues.fontSize.medium,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: responsiveValues.padding.medium,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: responsiveValues.fontSize.large,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    fontSize: responsiveValues.fontSize.large,
    color: '#6B7280',
  },
  modalContent: {
    flex: 1,
    padding: responsiveValues.padding.medium,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: responsiveValues.fontSize.medium,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    padding: responsiveValues.padding.medium,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: responsiveValues.fontSize.medium,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: responsiveValues.fontSize.medium,
    fontWeight: '600',
  },
});

export default CommunityContent;
