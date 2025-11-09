import { Request, Response } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { SessionLimitsService } from '../services/sessionLimits';

const sessionLimitsService = new SessionLimitsService();

// Helper function to check if subscription is active
export const isSubscriptionActive = (subscriptionType: string | null, subscriptionEndDate: Date | null): boolean => {
  if (!subscriptionType || subscriptionType === 'free') {
    return false;
  }
  
  if (!subscriptionEndDate) {
    return false;
  }
  
  const now = new Date();
  const endDate = new Date(subscriptionEndDate);
  return endDate > now;
};

// Helper function to get subscription status
export const getSubscriptionStatus = async (userId: string) => {
  const [user] = await db.select().from(users).where(eq(users.userId, userId)).limit(1);
  
  if (!user) {
    return { active: false, type: 'free', expiresAt: null };
  }
  
  const active = isSubscriptionActive(user.subscriptionType, user.subscriptionEndDate);
  return {
    active,
    type: user.subscriptionType || 'free',
    expiresAt: user.subscriptionEndDate,
    startDate: user.subscriptionStartDate
  };
};

// Get current subscription status
export const getCurrentSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const status = await getSubscriptionStatus(userId);
    res.json({ success: true, data: status });
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ success: false, message: 'Error fetching subscription status' });
  }
};

// Start trial (7 days)
export const startTrial = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    // Check if user already has an active subscription
    const [user] = await db.select().from(users).where(eq(users.userId, userId)).limit(1);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check if user already had a trial
    if (user.subscriptionType === 'trial' || user.subscriptionType === 'pro' || user.subscriptionType === 'lite') {
      const active = isSubscriptionActive(user.subscriptionType, user.subscriptionEndDate);
      if (active) {
        return res.status(400).json({ 
          success: false, 
          message: 'You already have an active subscription or have used your trial' 
        });
      }
    }
    
    // Check if user has ever had a trial (we'll check by looking at subscription history)
    // For now, we'll allow one trial per user
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3); // 3 days trial
    
    await db.update(users)
      .set({
        subscriptionType: 'trial',
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
        updatedAt: new Date()
      })
      .where(eq(users.userId, userId));
    
    res.json({ 
      success: true, 
      message: 'Trial started successfully',
      data: {
        type: 'trial',
        startDate,
        endDate,
        expiresIn: 3
      }
    });
  } catch (error: any) {
    console.error('Error starting trial:', error);
    res.status(500).json({ success: false, message: 'Error starting trial' });
  }
};

// Subscribe to Pro plan (30 days)
export const subscribeToPro = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const [user] = await db.select().from(users).where(eq(users.userId, userId)).limit(1);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 days
    
    await db.update(users)
      .set({
        subscriptionType: 'pro',
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
        updatedAt: new Date()
      })
      .where(eq(users.userId, userId));
    
    res.json({ 
      success: true, 
      message: 'Pro subscription activated successfully (₹59/month)',
      data: {
        type: 'pro',
        startDate,
        endDate,
        expiresIn: 30,
        price: 59
      }
    });
  } catch (error: any) {
    console.error('Error subscribing to Pro:', error);
    res.status(500).json({ success: false, message: 'Error activating Pro subscription' });
  }
};

// Subscribe to Lite plan (Free, 30 days)
export const subscribeToLite = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const [user] = await db.select().from(users).where(eq(users.userId, userId)).limit(1);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 days (free)
    
    await db.update(users)
      .set({
        subscriptionType: 'lite',
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
        updatedAt: new Date()
      })
      .where(eq(users.userId, userId));
    
    res.json({ 
      success: true, 
      message: 'Lite plan activated successfully (Free)',
      data: {
        type: 'lite',
        startDate,
        endDate,
        expiresIn: 30
      }
    });
  } catch (error: any) {
    console.error('Error subscribing to Lite:', error);
    res.status(500).json({ success: false, message: 'Error activating Lite plan' });
  }
};

// Renew subscription (extend by 30 days)
export const renewSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const [user] = await db.select().from(users).where(eq(users.userId, userId)).limit(1);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (!user.subscriptionType || user.subscriptionType === 'free' || user.subscriptionType === 'trial') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot renew. Please subscribe to Pro or Lite plan first.' 
      });
    }
    
    // Extend subscription by 30 days from current end date or from now if expired
    const currentEndDate = user.subscriptionEndDate ? new Date(user.subscriptionEndDate) : new Date();
    const now = new Date();
    const baseDate = currentEndDate > now ? currentEndDate : now;
    const newEndDate = new Date(baseDate);
    newEndDate.setDate(newEndDate.getDate() + 30);
    
    await db.update(users)
      .set({
        subscriptionEndDate: newEndDate,
        updatedAt: new Date()
      })
      .where(eq(users.userId, userId));
    
    res.json({ 
      success: true, 
      message: 'Subscription renewed successfully',
      data: {
        type: user.subscriptionType,
        endDate: newEndDate,
        expiresIn: 30
      }
    });
  } catch (error: any) {
    console.error('Error renewing subscription:', error);
    res.status(500).json({ success: false, message: 'Error renewing subscription' });
  }
};

// Cancel subscription (set to free)
export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    await db.update(users)
      .set({
        subscriptionType: 'free',
        subscriptionStartDate: null,
        subscriptionEndDate: null,
        updatedAt: new Date()
      })
      .where(eq(users.userId, userId));
    
    res.json({ 
      success: true, 
      message: 'Subscription cancelled successfully'
    });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ success: false, message: 'Error cancelling subscription' });
  }
};

// Get remaining sessions for today
export const getRemainingSessions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const remaining = await sessionLimitsService.getRemainingSessions(userId);
    
    res.json({
      success: true,
      data: remaining
    });
  } catch (error: any) {
    console.error('Error getting remaining sessions:', error);
    res.status(500).json({ success: false, message: 'Error getting remaining sessions' });
  }
};

// Auto-pay after trial expires (switch to pro or free)
// This should be called by a cron job or scheduled task
export const handleTrialExpiry = async (userId: string, autoPayToPro: boolean = false) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.userId, userId)).limit(1);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if user is on trial and trial has expired
    if (user.subscriptionType === 'trial' && user.subscriptionEndDate) {
      const now = new Date();
      const endDate = new Date(user.subscriptionEndDate);
      
      if (endDate <= now) {
        // Trial expired
        if (autoPayToPro) {
          // Auto-pay to Pro (₹59/month)
          const startDate = new Date();
          const newEndDate = new Date();
          newEndDate.setDate(newEndDate.getDate() + 30);
          
          await db.update(users)
            .set({
              subscriptionType: 'pro',
              subscriptionStartDate: startDate,
              subscriptionEndDate: newEndDate,
              updatedAt: new Date()
            })
            .where(eq(users.userId, userId));
          
          return { success: true, newPlan: 'pro', message: 'Trial expired. Auto-paid to Pro plan (₹59/month)' };
        } else {
          // Switch back to free plan
          await db.update(users)
            .set({
              subscriptionType: 'free',
              subscriptionStartDate: null,
              subscriptionEndDate: null,
              updatedAt: new Date()
            })
            .where(eq(users.userId, userId));
          
          return { success: true, newPlan: 'free', message: 'Trial expired. Switched to free plan' };
        }
      }
    }
    
    return { success: false, message: 'Trial not expired or user not on trial' };
  } catch (error: any) {
    console.error('Error handling trial expiry:', error);
    throw error;
  }
};

