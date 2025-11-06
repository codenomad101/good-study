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
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AppHeader from './AppHeader';
import { 
  Users, 
  MessageCircle, 
  Plus, 
  Trophy,
  Filter,
  ArrowRight,
  Lock,
  Unlock
} from 'lucide-react-native';
import { 
  useGroups,
  useCreateGroup
} from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { responsiveValues } from '../utils/responsive';
import { apiService } from '../services/api';
import { showToast } from '../utils/toast';

interface Group {
  groupId: string;
  name: string;
  description: string;
  createdBy: string;
  examType?: string;
  subjectId?: string;
  isPublic?: boolean;
  createdAt: string;
  postCount?: number;
  commentCount?: number;
  memberCount?: number;
  creator?: {
    userId: string;
    fullName: string;
    email: string;
  };
}

const CommunityContent: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // Form states
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    examType: '',
    isPublic: true
  });

  const createGroupMutation = useCreateGroup();
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);

  // Fetch groups manually like the web app does
  const fetchGroups = async () => {
      try {
        setIsLoadingGroups(true);
        console.log('[CommunityContent] Fetching groups...');
        const response = await apiService.getGroups();
        console.log('[CommunityContent] Raw response:', JSON.stringify(response, null, 2));
        
        let groupsArray: Group[] = [];
        
        // Handle different response structures
        // The backend returns an array directly, but our API service wraps it
        const responseData = response?.data as any;
        
        if (responseData) {
          if (Array.isArray(responseData)) {
            groupsArray = responseData;
          } else if (responseData.data && Array.isArray(responseData.data)) {
            groupsArray = responseData.data;
          } else if (typeof responseData === 'object' && !Array.isArray(responseData)) {
            // Handle object with numeric keys (like {"0": {...}, "data": []})
            // This happens when the response is converted to an object
            const objectKeys = Object.keys(responseData).filter(key => key !== 'data' && !isNaN(Number(key)));
            if (objectKeys.length > 0) {
              // Convert object with numeric keys to array, sorted by key
              groupsArray = objectKeys
                .sort((a, b) => Number(a) - Number(b))
                .map(key => responseData[key])
                .filter((item: any) => item && item.groupId && typeof item === 'object');
            }
          }
        } else if (Array.isArray(response)) {
          groupsArray = response as Group[];
        }
        
        console.log('[CommunityContent] Extracted groupsArray:', groupsArray.length, groupsArray);
        
        if (groupsArray.length === 0) {
          setGroups([]);
          return;
        }
        
        // Show groups immediately with default stats
        const groupsWithDefaultStats = groupsArray.map((group: any) => ({
          ...group,
          postCount: 0,
          commentCount: 0,
          memberCount: 0
        }));
        setGroups(groupsWithDefaultStats);
        
        // Fetch stats for each group asynchronously
        const groupsWithStats = await Promise.all(
          groupsArray.map(async (group: any) => {
            try {
              // Fetch posts count
              const postsResponse = await apiService.getGroupPosts(group.groupId);
              const postsResponseData = postsResponse?.data as any;
              const posts = Array.isArray(postsResponseData) 
                ? postsResponseData 
                : (postsResponseData?.data || []);
              
              // Fetch comments count for all posts (limit to avoid too many requests)
              let totalComments = 0;
              const postsToCheck = posts.slice(0, 10); // Limit to first 10 posts
              for (const post of postsToCheck) {
                try {
                  const commentsResponse = await apiService.getPostComments(post.postId);
                  const commentsResponseData = commentsResponse?.data as any;
                  const comments = Array.isArray(commentsResponseData)
                    ? commentsResponseData
                    : (commentsResponseData?.data || []);
                  totalComments += comments.length;
                } catch (error) {
                  // Ignore errors for individual post comments
                }
              }

              // Fetch members count
              let memberCount = 0;
              try {
                const membersResponse = await apiService.getGroupMembers(group.groupId);
                const membersResponseData = membersResponse?.data as any;
                const members = Array.isArray(membersResponseData)
                  ? membersResponseData
                  : (membersResponseData?.data || []);
                memberCount = members.length;
              } catch (error) {
                // Ignore errors for members
              }

              return {
                ...group,
                postCount: posts.length,
                commentCount: totalComments,
                memberCount: memberCount
              };
            } catch (error) {
              console.warn('[CommunityContent] Error fetching stats for group:', group.groupId, error);
              // Return group with default stats if fetching fails
              return {
                ...group,
                postCount: 0,
                commentCount: 0,
                memberCount: 0
              };
            }
          })
        );
        
        console.log('[CommunityContent] Setting groups with stats:', groupsWithStats.length);
        setGroups(groupsWithStats);
      } catch (error: any) {
        console.error('[CommunityContent] Error fetching groups:', error);
        showToast.error('Failed to load groups. Please try again.');
        setGroups([]);
      } finally {
        setIsLoadingGroups(false);
      }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    filterGroups();
  }, [groups, activeTab]);

  const filterGroups = () => {
    let sorted = [...groups];
    
    switch (activeTab) {
      case 'most-posts':
        sorted.sort((a, b) => (b.postCount || 0) - (a.postCount || 0));
        break;
      case 'most-comments':
        sorted.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
        break;
      case 'exam-based':
        sorted = sorted.filter(g => g.examType);
        break;
      default:
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    setFilteredGroups(sorted);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroups();
    setRefreshing(false);
  };

  const handleCreateGroup = async () => {
    if (!groupForm.name.trim() || !groupForm.description.trim()) {
      showToast.error('Please fill in all required fields');
      return;
    }

    try {
      await createGroupMutation.mutateAsync({
        name: groupForm.name,
        description: groupForm.description,
        examType: groupForm.examType || undefined,
        isPublic: groupForm.isPublic
      });
      
      setIsModalVisible(false);
      setGroupForm({ name: '', description: '', examType: '', isPublic: true });
      await fetchGroups();
      showToast.success('Group created successfully!');
    } catch (error: any) {
      console.error('[CommunityContent] Error creating group:', error);
      showToast.error(error?.message || 'Failed to create group');
    }
  };

  const handleGroupClick = (groupId: string) => {
    router.push({
      pathname: '/(tabs)/community/[groupId]',
      params: { groupId }
    });
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'G';
  };

  const topCommunities = filteredGroups.slice(0, 3);

  const renderTopCommunities = () => {
    if (topCommunities.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Trophy size={20} color="#F59E0B" />
          <Text style={styles.sectionTitle}>Top Communities</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topCommunitiesScroll}>
          {topCommunities.map((group: Group, index: number) => (
            <TouchableOpacity
              key={group.groupId}
              style={[styles.topCommunityCard, { width: 200 }]}
              onPress={() => handleGroupClick(group.groupId)}
            >
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <View style={styles.topCommunityAvatar}>
                <Text style={styles.avatarText}>{getInitials(group.name)}</Text>
              </View>
              <Text style={styles.topCommunityName} numberOfLines={1}>
                {group.name}
              </Text>
              <Text style={styles.topCommunityDescription} numberOfLines={1}>
                {group.description || 'No description'}
              </Text>
              {group.examType && (
                <View style={styles.examTypeTag}>
                  <Text style={styles.examTypeText}>{group.examType}</Text>
                </View>
              )}
              <View style={styles.topCommunityStats}>
                <View style={styles.statItem}>
                  <MessageCircle size={12} color="#667eea" />
                  <Text style={styles.statNumber}>{group.postCount || 0}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
                <View style={styles.statItem}>
                  <MessageCircle size={12} color="#764ba2" />
                  <Text style={styles.statNumber}>{group.commentCount || 0}</Text>
                  <Text style={styles.statLabel}>Comments</Text>
                </View>
                <View style={styles.statItem}>
                  <Users size={12} color="#f59e0b" />
                  <Text style={styles.statNumber}>{group.memberCount || 0}</Text>
                  <Text style={styles.statLabel}>Members</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderGroupCard = ({ item: group }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => handleGroupClick(group.groupId)}
    >
      <View style={styles.groupHeader}>
        <View style={styles.groupAvatar}>
          <Text style={styles.avatarTextSmall}>{getInitials(group.name)}</Text>
        </View>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName} numberOfLines={1}>
            {group.name}
          </Text>
          <Text style={styles.groupDescription} numberOfLines={2}>
            {group.description || 'No description'}
          </Text>
          {group.creator && (
            <Text style={styles.groupCreator}>
              Created by {group.creator.fullName}
            </Text>
          )}
        </View>
        {!group.isPublic && (
          <Lock size={16} color="#EF4444" style={styles.lockIcon} />
        )}
      </View>
      <View style={styles.groupFooter}>
        {group.examType && (
          <View style={styles.examTypeTag}>
            <Text style={styles.examTypeText}>{group.examType}</Text>
          </View>
        )}
        <View style={styles.groupStats}>
          <View style={styles.statItemSmall}>
            <MessageCircle size={12} color="#667eea" />
            <Text style={styles.statNumberSmall}>{group.postCount || 0}</Text>
          </View>
          <View style={styles.statItemSmall}>
            <MessageCircle size={12} color="#764ba2" />
            <Text style={styles.statNumberSmall}>{group.commentCount || 0}</Text>
          </View>
          <View style={styles.statItemSmall}>
            <Users size={12} color="#f59e0b" />
            <Text style={styles.statNumberSmall}>{group.memberCount || 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Community" showLogo={true} extraTopSpacing={true} />
      
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Community Hub</Text>
        <Text style={styles.heroSubtitle}>Connect, Learn, and Grow Together</Text>
        <TouchableOpacity
          style={styles.createGroupButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.createGroupButtonText}>Create New Group</Text>
        </TouchableOpacity>
      </View>

      {/* Top Communities */}
      {renderTopCommunities()}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              All Groups
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'most-posts' && styles.tabActive]}
            onPress={() => setActiveTab('most-posts')}
          >
            <Text style={[styles.tabText, activeTab === 'most-posts' && styles.tabTextActive]}>
              Most Posts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'most-comments' && styles.tabActive]}
            onPress={() => setActiveTab('most-comments')}
          >
            <Text style={[styles.tabText, activeTab === 'most-comments' && styles.tabTextActive]}>
              Most Comments
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'exam-based' && styles.tabActive]}
            onPress={() => setActiveTab('exam-based')}
          >
            <Text style={[styles.tabText, activeTab === 'exam-based' && styles.tabTextActive]}>
              Exam Based
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Groups List */}
      {isLoadingGroups && groups.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading communities...</Text>
        </View>
      ) : filteredGroups.length === 0 ? (
        <View style={styles.emptyState}>
          <Users size={48} color="#9CA3AF" />
          <Text style={styles.emptyStateText}>No communities found</Text>
          <Text style={styles.emptyStateSubtext}>Create your first group to get started!</Text>
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          renderItem={renderGroupCard}
          keyExtractor={(item) => item.groupId}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListFooterComponent={
            isLoadingGroups ? (
              <View style={{ padding: 20 }}>
                <ActivityIndicator size="small" color="#2563EB" />
              </View>
            ) : null
          }
        />
      )}

      {/* Create Group Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Community</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Community Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., UPSC Preparation Group"
              value={groupForm.name}
              onChangeText={(text) => setGroupForm(prev => ({ ...prev, name: text }))}
            />

            <Text style={styles.inputLabel}>Exam Type (Optional)</Text>
            <View style={styles.selectContainer}>
              <TextInput
                style={styles.input}
                placeholder="UPSC, MPSC, SSC, Banking, etc."
                value={groupForm.examType}
                onChangeText={(text) => setGroupForm(prev => ({ ...prev, examType: text }))}
              />
            </View>

            <Text style={styles.inputLabel}>Group Type</Text>
            <View style={styles.groupTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.groupTypeOption,
                  groupForm.isPublic && styles.groupTypeOptionActive
                ]}
                onPress={() => setGroupForm(prev => ({ ...prev, isPublic: true }))}
              >
                <Unlock size={16} color={groupForm.isPublic ? "#FFFFFF" : "#6B7280"} />
                <Text style={[
                  styles.groupTypeText,
                  groupForm.isPublic && styles.groupTypeTextActive
                ]}>
                  Public
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.groupTypeOption,
                  !groupForm.isPublic && styles.groupTypeOptionActive
                ]}
                onPress={() => setGroupForm(prev => ({ ...prev, isPublic: false }))}
              >
                <Lock size={16} color={!groupForm.isPublic ? "#FFFFFF" : "#6B7280"} />
                <Text style={[
                  styles.groupTypeText,
                  !groupForm.isPublic && styles.groupTypeTextActive
                ]}>
                  Private
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your community, its purpose, and what members can expect."
              value={groupForm.description}
              onChangeText={(text) => setGroupForm(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateGroup}
              disabled={createGroupMutation.isPending}
            >
              {createGroupMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Create Community</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  heroSection: {
    backgroundColor: '#F97316',
    padding: 24,
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 32,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#FED7AA',
    marginBottom: 20,
    textAlign: 'center',
  },
  createGroupButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createGroupButtonText: {
    color: '#F97316',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  topCommunitiesScroll: {
    paddingHorizontal: 16,
  },
  topCommunityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  rankBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  topCommunityAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    alignSelf: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#667eea',
  },
  avatarTextSmall: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
  topCommunityName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 3,
    textAlign: 'center',
  },
  topCommunityDescription: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  topCommunityCreator: {
    fontSize: 9,
    color: '#9CA3AF',
    marginBottom: 4,
    textAlign: 'center',
  },
  examTypeTag: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  examTypeText: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '600',
  },
  topCommunityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
  },
  statItem: {
    alignItems: 'center',
    gap: 3,
  },
  statNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 9,
    color: '#6B7280',
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  listContainer: {
    padding: 12,
    paddingBottom: 16,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  groupAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 3,
  },
  groupDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 3,
  },
  groupCreator: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  lockIcon: {
    marginLeft: 6,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  groupStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItemSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statNumberSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
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
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
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
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  selectContainer: {
    marginBottom: 16,
  },
  groupTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  groupTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  groupTypeOptionActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  groupTypeText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  groupTypeTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CommunityContent;
