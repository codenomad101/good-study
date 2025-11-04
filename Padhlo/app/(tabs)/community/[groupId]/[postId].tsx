import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AppHeader from '@/components/AppHeader';
import { 
  ArrowLeft,
  Send,
  User
} from 'lucide-react-native';
import { 
  useCreateComment
} from '@/hooks/useApi';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface Comment {
  commentId: string;
  commentContent: string;
  userId: string;
  user?: {
    userId: string;
    fullName: string;
    email: string;
    profilePictureUrl?: string;
  };
  createdAt: string;
  postId: string;
}

const PostDetailScreen: React.FC = () => {
  const router = useRouter();
  const { groupId, postId } = useLocalSearchParams<{ groupId: string; postId: string }>();
  const { user } = useAuth();
  const [commentContent, setCommentContent] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  
  const createCommentMutation = useCreateComment();

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
    }
  }, [postId]);

  const fetchPost = async () => {
    if (!postId) return;
    try {
      setIsLoadingPost(true);
      const response = await apiService.getPost(postId);
      console.log('[PostDetail] Post response:', JSON.stringify(response, null, 2));
      
      // Backend returns post object directly: { postId, postContent, ... }
      // Our API service wraps it: { success: true, data: { postId, postContent, ... } }
      let postData: Post | null = null;
      
      // The response should be { success: true, data: { postId, postContent, ... } }
      if (response?.data && typeof response.data === 'object') {
        // Check if response.data is the post object (has postId)
        if (response.data.postId) {
          postData = response.data as Post;
        }
        // Check if response.data.data exists (double wrapped)
        else if (response.data.data && response.data.data.postId) {
          postData = response.data.data as Post;
        }
      }
      
      // Fallback: if response itself has postId (shouldn't happen but handle it)
      if (!postData && (response as any)?.postId) {
        postData = response as Post;
      }
      
      console.log('[PostDetail] Extracted postData:', postData);
      
      setPost(postData);
    } catch (error: any) {
      console.error('[PostDetail] Error fetching post:', error);
      Alert.alert('Error', 'Failed to load post. Please try again.');
      router.back();
    } finally {
      setIsLoadingPost(false);
    }
  };

  const fetchComments = async () => {
    if (!postId) return;
    try {
      setIsLoadingComments(true);
      const response = await apiService.getPostComments(postId);
      console.log('[PostDetail] Comments response:', JSON.stringify(response, null, 2));
      
      let commentsArray: Comment[] = [];
      const commentsDataResp = response?.data as any;
      
      if (Array.isArray(commentsDataResp)) {
        commentsArray = commentsDataResp;
      } else if (commentsDataResp?.data && Array.isArray(commentsDataResp.data)) {
        commentsArray = commentsDataResp.data;
      } else if (typeof commentsDataResp === 'object' && !Array.isArray(commentsDataResp)) {
        const objectKeys = Object.keys(commentsDataResp).filter(key => key !== 'data' && !isNaN(Number(key)));
        if (objectKeys.length > 0) {
          commentsArray = objectKeys
            .sort((a, b) => Number(a) - Number(b))
            .map(key => commentsDataResp[key])
            .filter((item: any) => item && item.commentId && typeof item === 'object');
        }
      }
      
      console.log('[PostDetail] Extracted comments:', commentsArray.length);
      setComments(commentsArray);
    } catch (error: any) {
      console.error('[PostDetail] Error fetching comments:', error);
      Alert.alert('Error', 'Failed to load comments. Please try again.');
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleSendComment = async () => {
    if (!commentContent.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    if (!postId) return;

    try {
      await createCommentMutation.mutateAsync({
        postId,
        commentContent: commentContent.trim()
      });
      setCommentContent('');
      await fetchComments();
      // Scroll to bottom after sending
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to post comment');
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoadingPost) {
    return (
      <View style={styles.container}>
        <AppHeader title="Post" showLogo={true} extraTopSpacing={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading post...</Text>
        </View>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <AppHeader title="Post" showLogo={true} extraTopSpacing={true} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Post not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <AppHeader title="Post" showLogo={true} extraTopSpacing={true} />
      
      {/* Post Content */}
      <View style={styles.postHeader}>
        <TouchableOpacity
          style={styles.backIconButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.postContentContainer}>
          <Text style={styles.postContent}>{post.postContent}</Text>
          <View style={styles.postMeta}>
            <View style={styles.postAuthor}>
              <View style={styles.avatarSmall}>
                <Text style={styles.avatarTextSmall}>
                  {getInitials(post.user?.fullName || 'Anonymous')}
                </Text>
              </View>
              <Text style={styles.authorName}>{post.user?.fullName || 'Anonymous User'}</Text>
            </View>
            <Text style={styles.postTime}>{formatTime(post.createdAt)}</Text>
          </View>
        </View>
      </View>

      {/* Comments Section - WhatsApp-like */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.commentsContainer}
        contentContainerStyle={styles.commentsContent}
      >
        {isLoadingComments ? (
          <ActivityIndicator size="large" color="#2563EB" style={styles.loadingIndicator} />
        ) : comments.length === 0 ? (
          <View style={styles.emptyComments}>
            <Text style={styles.emptyCommentsText}>No comments yet</Text>
            <Text style={styles.emptyCommentsSubtext}>Be the first to comment!</Text>
          </View>
        ) : (
          comments.map((comment) => (
            <View key={comment.commentId} style={styles.commentBubble}>
              <View style={styles.commentHeader}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>
                    {getInitials(comment.user?.fullName || 'Anonymous')}
                  </Text>
                </View>
                <View style={styles.commentInfo}>
                  <Text style={styles.commentAuthor}>{comment.user?.fullName || 'Anonymous User'}</Text>
                  <Text style={styles.commentTime}>{formatTime(comment.createdAt)}</Text>
                </View>
              </View>
              <Text style={styles.commentContent}>{comment.commentContent}</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Comment Input - Fixed at bottom */}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Type a comment..."
          value={commentContent}
          onChangeText={setCommentContent}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !commentContent.trim() && styles.sendButtonDisabled]}
          onPress={handleSendComment}
          disabled={!commentContent.trim() || createCommentMutation.isPending}
        >
          {createCommentMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Send size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
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
  postHeader: {
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
  postContentContainer: {
    flex: 1,
  },
  postContent: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 24,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextSmall: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#667eea',
  },
  authorName: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  postTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  commentsContainer: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  commentsContent: {
    padding: 16,
    paddingBottom: 80,
  },
  loadingIndicator: {
    marginTop: 48,
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyCommentsText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyCommentsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  commentBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#667eea',
  },
  commentInfo: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  commentTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  commentContent: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1F2937',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PostDetailScreen;

