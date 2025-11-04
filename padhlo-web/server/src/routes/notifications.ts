import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notifications';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all notifications for the current user
router.get('/', getUserNotifications);

// Get unread notifications count
router.get('/unread-count', getUnreadCount);

// Mark notification as read
router.put('/:notificationId/read', markAsRead);

// Mark all notifications as read
router.put('/read-all', markAllAsRead);

// Delete notification
router.delete('/:notificationId', deleteNotification);

export default router;

