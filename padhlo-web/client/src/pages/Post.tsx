import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Input, Typography, message, Spin, Avatar } from 'antd';
import { ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useAPI';
import './Post.css';

const { TextArea } = Input;
const { Text } = Typography;

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

const Post = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const api = useApi();

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
    }
  }, [postId]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchPost = async () => {
    if (!postId) return;
    try {
      setIsLoading(true);
      const response = await api.client.get(`/community/posts/${postId}`);
      setPost(response.data);
    } catch (error: any) {
      console.error('Error fetching post:', error);
      message.error('Failed to load post. Please try again.');
      navigate('/community');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!postId) return;
    try {
      setIsLoadingComments(true);
      const response = await api.client.get(`/community/posts/${postId}/comments`);
      let commentsData: Comment[] = [];
      
      if (Array.isArray(response.data)) {
        commentsData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        commentsData = response.data.data;
      }

      setComments(commentsData);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      message.error('Failed to load comments. Please try again.');
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!postId || !commentInput.trim() || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      await api.client.post(`/community/posts/${postId}/comments`, {
        commentContent: commentInput.trim()
      });
      message.success('Comment sent!');
      setCommentInput('');
      await fetchComments();
    } catch (error: any) {
      console.error('Error creating comment:', error);
      message.error(error?.response?.data?.message || 'Failed to send comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';
  };

  if (isLoading) {
    return (
      <div className="post-container">
        <div className="loading-container">
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>Loading post...</div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-container">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/community')}>
          Back to Community
        </Button>
        <div className="empty-state">
          <div>Post not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="post-container">
      {/* Header */}
      <div className="post-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => {
            // Go back to previous page or community
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/community');
            }
          }}
          className="back-button"
        >
          Back
        </Button>
        <div className="post-header-info">
          <div className="post-header-title">Post Discussion</div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="messages-container">
        {/* Post Message */}
        <div className="messages-list">
          <div className="message-bubble post-message">
            <div className="message-header">
              <Avatar className="message-avatar" size={40}>
                {getInitials(post.user?.fullName || post.userId || 'User')}
              </Avatar>
              <div className="message-info">
                <div className="message-author">
                  {post.user?.fullName || 'Anonymous User'}
                </div>
                <div className="message-time">{formatTime(post.createdAt)}</div>
              </div>
            </div>
            <div className="message-content">{post.postContent}</div>
          </div>

          {/* Comments Section */}
          {isLoadingComments ? (
            <div className="loading-comments">
              <Spin size="small" />
              <span style={{ marginLeft: '12px' }}>Loading comments...</span>
            </div>
          ) : (
            <>
              {comments.length > 0 && (
                <div className="comments-divider">
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                  </Text>
                </div>
              )}
              
              {comments.map((comment: Comment) => (
                <div key={comment.commentId} className="comment-bubble">
                  <Avatar className="comment-avatar" size={32}>
                    {getInitials(comment.user?.fullName || comment.userId || 'User')}
                  </Avatar>
                  <div className="comment-content-wrapper">
                    <div className="comment-header">
                      <span className="comment-author">
                        {comment.user?.fullName || 'Anonymous User'}
                      </span>
                      <span className="comment-time">{formatTime(comment.createdAt)}</span>
                    </div>
                    <div className="comment-content">{comment.commentContent}</div>
                  </div>
                </div>
              ))}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Comment Input */}
      <div className="comment-input-container">
        <TextArea
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          placeholder="Type a comment..."
          autoSize={{ minRows: 1, maxRows: 4 }}
          onPressEnter={(e) => {
            if (e.shiftKey) return;
            e.preventDefault();
            handleCommentSubmit();
          }}
          className="comment-input"
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleCommentSubmit}
          disabled={!commentInput.trim() || isSubmitting}
          loading={isSubmitting}
          className="send-comment-button"
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default Post;
