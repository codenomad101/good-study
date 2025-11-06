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
import { useRouter, useLocalSearchParams } from 'expo-router';
import AppHeader from '@/components/AppHeader';
import { 
  ArrowLeft,
  MessageCircle,
  Plus,
  UserPlus,
  CheckCircle,
  User
} from 'lucide-react-native';
import { 
  useCreatePost,
  useJoinGroup,
  useRequestToJoinGroup
} from '@/hooks/useApi';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { responsiveValues } from '@/utils/responsive';
import { showToast } from '@/utils/toast';

interface Post {
  postId: string;
  postContent: string;
  userId: string;
  user?: {
    userId: string;
    fullName: string;
    email: string;
    profilePictureUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const GroupDetailScreen: React.FC = () => {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { user } = useAuth();
  const [isMember, setIsMember] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [group, setGroup] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoadingGroup, setIsLoadingGroup] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [requestsData, setRequestsData] = useState<any[]>([]);
  const [canViewRequests, setCanViewRequests] = useState(false);
  
  const createPostMutation = useCreatePost();
  const joinGroupMutation = useJoinGroup();
  const requestToJoinMutation = useRequestToJoinGroup();

  // Fetch group data
  useEffect(() => {
    if (groupId) {
      fetchGroup();
      checkMembership();
    }
  }, [groupId, user]);

  // Re-check authorization when group data is loaded
  useEffect(() => {
    if (group && members.length > 0 && user?.userId) {
      checkAuthorization();
    }
  }, [group, members, user]);

  // Fetch posts when member
  useEffect(() => {
    if (groupId && isMember) {
      fetchPosts();
    }
  }, [groupId, isMember]);

  const fetchGroup = async () => {
    if (!groupId) return;
    try {
      setIsLoadingGroup(true);
      const response = await apiService.getGroup(groupId);
      console.log('[GroupDetail] Group response:', JSON.stringify(response, null, 2));
      
      // Backend returns group object directly: { groupId, name, description, ... }
      // Our API service wraps it: { success: true, data: { groupId, name, ... } }
      let groupData: any = null;
      
      // The response should be { success: true, data: { groupId, name, ... } }
      if (response?.data && typeof response.data === 'object') {
        // Check if response.data is the group object (has groupId)
        if (response.data.groupId) {
          groupData = response.data;
        }
        // Check if response.data.data exists (double wrapped)
        else if (response.data.data && response.data.data.groupId) {
          groupData = response.data.data;
        }
      }
      
      // Fallback: if response itself has groupId (shouldn't happen but handle it)
      if (!groupData && (response as any)?.groupId) {
        groupData = response;
      }
      
      console.log('[GroupDetail] Extracted groupData:', groupData);
      setGroup(groupData);
    } catch (error: any) {
      console.error('[GroupDetail] Error fetching group:', error);
      showToast.error('Failed to load group. Please try again.');
      router.back();
    } finally {
      setIsLoadingGroup(false);
    }
  };

  const checkMembership = async () => {
    if (!groupId || !user?.userId) return;
    try {
      const membersResponse = await apiService.getGroupMembers(groupId);
      console.log('[GroupDetail] Members response:', JSON.stringify(membersResponse, null, 2));
      
      let membersArray: any[] = [];
      const membersData = membersResponse?.data as any;
      
      if (Array.isArray(membersData)) {
        membersArray = membersData;
      } else if (membersData?.data && Array.isArray(membersData.data)) {
        membersArray = membersData.data;
      } else if (typeof membersData === 'object' && !Array.isArray(membersData)) {
        const objectKeys = Object.keys(membersData).filter(key => key !== 'data' && !isNaN(Number(key)));
        if (objectKeys.length > 0) {
          membersArray = objectKeys
            .sort((a, b) => Number(a) - Number(b))
            .map(key => membersData[key])
            .filter((item: any) => item && (item.userId || item.user?.userId));
        }
      }
      
      setMembers(membersArray);
      
      const userIsMember = membersArray.some((m: any) => 
        m.userId === user.userId || m.user?.userId === user.userId
      );
      setIsMember(userIsMember);
    } catch (error) {
      console.error('[GroupDetail] Error checking membership:', error);
      setIsMember(false);
    }
  };

  const checkAuthorization = async () => {
    if (!groupId || !user?.userId || !group) return;
    
    try {
      // Check if user can view join requests (only for admins/moderators/creators)
      // First check if user is the group creator
      const isCreator = group.createdBy === user.userId;
      
      // Then check if user is a member with admin or moderator role
      const userMember = members.find((m: any) => 
        (m.userId === user.userId || m.user?.userId === user.userId)
      );
      const isAdminOrModerator = userMember && 
        (userMember.role === 'admin' || userMember.role === 'moderator');
      
      const canView = isCreator || isAdminOrModerator;
      setCanViewRequests(canView);

      // Only fetch join requests if user is authorized (admin/moderator/creator)
      if (canView) {
        try {
          const requestsResponse = await apiService.getJoinRequests(groupId);
          console.log('[GroupDetail] Join requests response:', JSON.stringify(requestsResponse, null, 2));
          
          let requestsArray: any[] = [];
          const requestsDataResp = requestsResponse?.data as any;
          
          if (Array.isArray(requestsDataResp)) {
            requestsArray = requestsDataResp;
          } else if (requestsDataResp?.data && Array.isArray(requestsDataResp.data)) {
            requestsArray = requestsDataResp.data;
          } else if (typeof requestsDataResp === 'object' && !Array.isArray(requestsDataResp)) {
            const objectKeys = Object.keys(requestsDataResp).filter(key => key !== 'data' && !isNaN(Number(key)));
            if (objectKeys.length > 0) {
              requestsArray = objectKeys
                .sort((a, b) => Number(a) - Number(b))
                .map(key => requestsDataResp[key])
                .filter((item: any) => item && item.requestId);
            }
          }
          
          setRequestsData(requestsArray);
          
          // Also check if current user has a pending request (for display purposes)
          const pending = requestsArray.find((r: any) => 
            (r.userId === user.userId || r.user?.userId === user.userId) && 
            r.status === 'pending'
          );
          setHasPendingRequest(!!pending);
        } catch (error: any) {
          console.error('[GroupDetail] Error fetching join requests:', error);
          // If error is 403 (unauthorized), user is not admin, set canViewRequests to false
          if (error?.message?.includes('403') || error?.message?.includes('not authorized')) {
            setCanViewRequests(false);
          }
          setRequestsData([]);
        }
      } else {
        // User is not authorized, don't try to fetch requests
        // This prevents the error from showing
        setRequestsData([]);
      }
    } catch (error) {
      console.error('[GroupDetail] Error checking authorization:', error);
      setCanViewRequests(false);
    }
  };

  const fetchPosts = async () => {
    if (!groupId) return;
    try {
      setIsLoadingPosts(true);
      const response = await apiService.getGroupPosts(groupId);
      console.log('[GroupDetail] Posts response:', JSON.stringify(response, null, 2));
      
      let postsArray: Post[] = [];
      const postsDataResp = response?.data as any;
      
      if (Array.isArray(postsDataResp)) {
        postsArray = postsDataResp;
      } else if (postsDataResp?.data && Array.isArray(postsDataResp.data)) {
        postsArray = postsDataResp.data;
      } else if (typeof postsDataResp === 'object' && !Array.isArray(postsDataResp)) {
        const objectKeys = Object.keys(postsDataResp).filter(key => key !== 'data' && !isNaN(Number(key)));
        if (objectKeys.length > 0) {
          postsArray = objectKeys
            .sort((a, b) => Number(a) - Number(b))
            .map(key => postsDataResp[key])
            .filter((item: any) => item && item.postId && typeof item === 'object');
        }
      }
      
      console.log('[GroupDetail] Extracted posts:', postsArray.length);
      setPosts(postsArray);
    } catch (error: any) {
      console.error('[GroupDetail] Error fetching posts:', error);
      showToast.error('Failed to load posts. Please try again.');
      setPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchGroup(),
      checkMembership(),
      isMember && fetchPosts()
    ]);
    setRefreshing(false);
  };

  const handleJoinGroup = async () => {
    if (!groupId) return;
    
    try {
      if (group?.isPublic) {
        await joinGroupMutation.mutateAsync(groupId);
        showToast.success('You have joined the group successfully!');
        await checkMembership();
        await fetchPosts();
      } else {
        await requestToJoinMutation.mutateAsync(groupId);
        showToast.success('Join request sent. Waiting for approval.');
        setHasPendingRequest(true);
        await checkMembership();
      }
    } catch (error: any) {
      console.error('[GroupDetail] Error joining group:', error);
      showToast.error(error?.message || 'Failed to join group. Please try again.');
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      showToast.error('Please enter post content');
      return;
    }

    if (!groupId) return;

    try {
      await createPostMutation.mutateAsync({
        groupId,
        postContent: postContent.trim()
      });
      setShowCreatePost(false);
      setPostContent('');
      await fetchPosts();
      showToast.success('Post created successfully!');
    } catch (error: any) {
      console.error('[GroupDetail] Error creating post:', error);
      showToast.error(error?.message || 'Failed to create post. Please try again.');
    }
  };

  const handlePostClick = (postId: string) => {
    router.push({
      pathname: '/(tabs)/community/[groupId]/[postId]',
      params: { groupId, postId }
    });
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';
  };

  if (isLoadingGroup) {
    return (
      <View style={styles.container}>
        <AppHeader title="Group" showLogo={true} extraTopSpacing={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading group...</Text>
        </View>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.container}>
        <AppHeader title="Group" showLogo={true} extraTopSpacing={true} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Group not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Back to Community</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Group" showLogo={true} extraTopSpacing={true} />
      
      {/* Group Header */}
      <View style={styles.groupHeader}>
        <TouchableOpacity
          style={styles.backIconButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupDescription}>{group.description}</Text>
          {group.creator && (
            <Text style={styles.groupCreator}>
              Created by {group.creator.fullName}
            </Text>
          )}
          <View style={styles.groupTags}>
            {group.examType && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{group.examType}</Text>
              </View>
            )}
            {!group.isPublic && (
              <View style={[styles.tag, styles.privateTag]}>
                <Text style={[styles.tagText, styles.privateTagText]}>Private</Text>
              </View>
            )}
          </View>
        </View>
        {!isMember && (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={handleJoinGroup}
            disabled={hasPendingRequest}
          >
            {hasPendingRequest ? (
              <>
                <CheckCircle size={16} color="#FFFFFF" />
                <Text style={styles.joinButtonText}>Request Pending</Text>
              </>
            ) : (
              <>
                <UserPlus size={16} color="#FFFFFF" />
                <Text style={styles.joinButtonText}>Join Group</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Posts List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {!isMember && !isLoadingGroup && (
          <View style={styles.joinPrompt}>
            <User size={48} color="#F59E0B" />
            <Text style={styles.joinPromptTitle}>Join to View Posts</Text>
            <Text style={styles.joinPromptText}>
              You need to join this group to view and create posts.
            </Text>
            <TouchableOpacity
              style={styles.joinPromptButton}
              onPress={handleJoinGroup}
              disabled={hasPendingRequest}
            >
              <Text style={styles.joinPromptButtonText}>
                {hasPendingRequest ? 'Request Pending' : 'Join Group'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isMember && (
          <>
            <View style={styles.postsHeader}>
              <Text style={styles.postsTitle}>Posts & Questions</Text>
              <TouchableOpacity
                style={styles.createPostButton}
                onPress={() => setShowCreatePost(true)}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.createPostButtonText}>New Post</Text>
              </TouchableOpacity>
            </View>

            {isLoadingPosts ? (
              <ActivityIndicator size="large" color="#2563EB" style={styles.loadingIndicator} />
            ) : posts.length === 0 ? (
              <View style={styles.emptyState}>
                <MessageCircle size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateText}>No posts yet</Text>
                <Text style={styles.emptyStateSubtext}>Be the first to post!</Text>
              </View>
            ) : (
              <View style={styles.postsList}>
                {posts.map((post) => (
                  <TouchableOpacity
                    key={post.postId}
                    style={styles.postCard}
                    onPress={() => handlePostClick(post.postId)}
                  >
                    <Text style={styles.postContent} numberOfLines={3}>
                      {post.postContent}
                    </Text>
                    <View style={styles.postFooter}>
                      <Text style={styles.postCreator}>
                        Created by {post.user?.fullName || 'Anonymous User'}
                      </Text>
                      <TouchableOpacity
                        style={styles.viewPostButton}
                        onPress={() => handlePostClick(post.postId)}
                      >
                        <MessageCircle size={14} color="#667eea" />
                        <Text style={styles.viewPostButtonText}>View & Comment</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Create Post Modal */}
      <Modal
        visible={showCreatePost}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreatePost(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Post</Text>
            <TouchableOpacity onPress={() => setShowCreatePost(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Post Content *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What's on your mind? Ask a question or share something..."
              value={postContent}
              onChangeText={setPostContent}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCreatePost(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreatePost}
              disabled={createPostMutation.isPending}
            >
              {createPostMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Post</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
  groupHeader: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  backIconButton: {
    padding: 4,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  groupCreator: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  groupTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '600',
  },
  privateTag: {
    backgroundColor: '#FEF3C7',
  },
  privateTagText: {
    color: '#F59E0B',
  },
  joinButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  joinPrompt: {
    backgroundColor: '#FFF3CD',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  joinPromptTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  joinPromptText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  joinPromptButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  joinPromptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  postsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  createPostButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  createPostButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingIndicator: {
    marginTop: 48,
  },
  postsList: {
    padding: 16,
  },
  postCard: {
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
  postContent: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 22,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  postCreator: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
    textAlign: 'right',
    marginRight: 12,
  },
  viewPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewPostButtonText: {
    color: '#667eea',
    fontSize: 12,
    fontWeight: '500',
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
  backButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 16,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  },
  textArea: {
    height: 160,
    textAlignVertical: 'top',
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

export default GroupDetailScreen;

