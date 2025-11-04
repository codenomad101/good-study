import { Request, Response } from 'express';
import { db } from '../db';
import { notifications } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Helper function to create a notification
export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  actionUrl?: string
) => {
  try {
    const [notification] = await db.insert(notifications).values({
      userId,
      notificationType: type as any,
      title,
      message,
      actionUrl: actionUrl || null,
      isRead: false,
    }).returning();
    return notification;
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Get all notifications for a user
export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const allNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    const unreadCount = allNotifications.filter(n => !n.isRead).length;

    res.json({
      success: true,
      data: {
        notifications: allNotifications,
        unreadCount
      }
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Error fetching notifications' });
  }
};

// Get unread notifications count
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const allNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));

    const unreadCount = allNotifications.filter(n => !n.isRead).length;

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error: any) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, message: 'Error fetching unread count' });
  }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { notificationId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Verify the notification belongs to the user
    const [notification] = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.notificationId, notificationId),
          eq(notifications.userId, userId)
        )
      )
      .limit(1);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date()
      })
      .where(eq(notifications.notificationId, notificationId));

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Error marking notification as read' });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date()
      })
      .where(eq(notifications.userId, userId));

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Error marking all notifications as read' });
  }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { notificationId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Verify the notification belongs to the user
    const [notification] = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.notificationId, notificationId),
          eq(notifications.userId, userId)
        )
      )
      .limit(1);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await db
      .delete(notifications)
      .where(eq(notifications.notificationId, notificationId));

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Error deleting notification' });
  }
};

// Export the helper function for use in other controllers
export { createNotification as createNotificationHelper };

