import { Router } from 'express';
import * as communityController from '../controllers/community';
import { authenticateToken } from '../middleware/auth';
import { requireCommunityAccess } from '../middleware/subscription';

const router = Router();

// All community routes require community access (not available in free plan)
// Group routes
router.post('/groups', authenticateToken, requireCommunityAccess, communityController.createGroup);
router.get('/groups', authenticateToken, requireCommunityAccess, communityController.getGroups);
router.get('/groups/:groupId', authenticateToken, requireCommunityAccess, communityController.getGroup);
router.put('/groups/:groupId', authenticateToken, requireCommunityAccess, communityController.updateGroup);
router.delete('/groups/:groupId', authenticateToken, requireCommunityAccess, communityController.deleteGroup);

// Group member routes
router.post('/groups/:groupId/join', authenticateToken, requireCommunityAccess, communityController.joinGroup);
router.post('/groups/:groupId/leave', authenticateToken, requireCommunityAccess, communityController.leaveGroup);
router.get('/groups/:groupId/members', authenticateToken, requireCommunityAccess, communityController.getGroupMembers);

// Join request routes
router.post('/groups/:groupId/request', authenticateToken, requireCommunityAccess, communityController.requestToJoin);
router.get('/groups/:groupId/requests', authenticateToken, requireCommunityAccess, communityController.getJoinRequests);
router.post('/requests/:requestId/approve', authenticateToken, requireCommunityAccess, communityController.approveJoinRequest);
router.post('/requests/:requestId/reject', authenticateToken, requireCommunityAccess, communityController.rejectJoinRequest);

// Post routes
router.post('/groups/:groupId/posts', authenticateToken, requireCommunityAccess, communityController.createPost);
router.get('/groups/:groupId/posts', authenticateToken, requireCommunityAccess, communityController.getPosts);
router.get('/posts/:postId', authenticateToken, requireCommunityAccess, communityController.getPost);
router.put('/posts/:postId', authenticateToken, requireCommunityAccess, communityController.updatePost);
router.delete('/posts/:postId', authenticateToken, requireCommunityAccess, communityController.deletePost);

// Comment routes
router.post('/posts/:postId/comments', authenticateToken, requireCommunityAccess, communityController.createComment);
router.get('/posts/:postId/comments', authenticateToken, requireCommunityAccess, communityController.getComments);
router.put('/comments/:commentId', authenticateToken, requireCommunityAccess, communityController.updateComment);
router.delete('/comments/:commentId', authenticateToken, requireCommunityAccess, communityController.deleteComment);

// Like routes
router.post('/posts/:postId/like', authenticateToken, requireCommunityAccess, communityController.likePost);
router.post('/comments/:commentId/like', authenticateToken, requireCommunityAccess, communityController.likeComment);

export default router;
