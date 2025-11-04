import { Router } from 'express';
import * as communityController from '../controllers/community';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Group routes
router.post('/groups', authenticateToken, communityController.createGroup);
router.get('/groups', authenticateToken, communityController.getGroups);
router.get('/groups/:groupId', authenticateToken, communityController.getGroup);
router.put('/groups/:groupId', authenticateToken, communityController.updateGroup);
router.delete('/groups/:groupId', authenticateToken, communityController.deleteGroup);

// Group member routes
router.post('/groups/:groupId/join', authenticateToken, communityController.joinGroup);
router.post('/groups/:groupId/leave', authenticateToken, communityController.leaveGroup);
router.get('/groups/:groupId/members', authenticateToken, communityController.getGroupMembers);

// Join request routes
router.post('/groups/:groupId/request', authenticateToken, communityController.requestToJoin);
router.get('/groups/:groupId/requests', authenticateToken, communityController.getJoinRequests);
router.post('/requests/:requestId/approve', authenticateToken, communityController.approveJoinRequest);
router.post('/requests/:requestId/reject', authenticateToken, communityController.rejectJoinRequest);

// Post routes
router.post('/groups/:groupId/posts', authenticateToken, communityController.createPost);
router.get('/groups/:groupId/posts', authenticateToken, communityController.getPosts);
router.get('/posts/:postId', authenticateToken, communityController.getPost);
router.put('/posts/:postId', authenticateToken, communityController.updatePost);
router.delete('/posts/:postId', authenticateToken, communityController.deletePost);

// Comment routes
router.post('/posts/:postId/comments', authenticateToken, communityController.createComment);
router.get('/posts/:postId/comments', authenticateToken, communityController.getComments);
router.put('/comments/:commentId', authenticateToken, communityController.updateComment);
router.delete('/comments/:commentId', authenticateToken, communityController.deleteComment);

// Like routes
router.post('/posts/:postId/like', authenticateToken, communityController.likePost);
router.post('/comments/:commentId/like', authenticateToken, communityController.likeComment);

export default router;
