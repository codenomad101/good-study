import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

// Helper function to check if subscription is active
const isSubscriptionActive = (subscriptionType: string | null, subscriptionEndDate: Date | null): boolean => {
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

// Check if user has access to premium features (trial, pro)
export const requirePremiumFeatures = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const [user] = await db.select().from(users).where(eq(users.userId, userId)).limit(1);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check if user has trial or pro subscription
    const hasPremium = (user.subscriptionType === 'trial' || user.subscriptionType === 'pro') && 
                       isSubscriptionActive(user.subscriptionType, user.subscriptionEndDate);
    
    if (!hasPremium) {
      return res.status(403).json({ 
        success: false, 
        message: 'This feature requires a Trial or Pro subscription',
        requiresSubscription: true,
        currentPlan: user.subscriptionType || 'free'
      });
    }
    
    next();
  } catch (error: any) {
    console.error('Error checking subscription:', error);
    res.status(500).json({ success: false, message: 'Error checking subscription status' });
  }
};

// Check if user has access to community/leaderboard features (only pro, not lite)
export const requireProFeatures = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const [user] = await db.select().from(users).where(eq(users.userId, userId)).limit(1);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Only trial and pro have access to community/leaderboard/AI insights
    const hasPro = (user.subscriptionType === 'trial' || user.subscriptionType === 'pro') && 
                   isSubscriptionActive(user.subscriptionType, user.subscriptionEndDate);
    
    if (!hasPro) {
      return res.status(403).json({ 
        success: false, 
        message: 'This feature requires a Trial or Pro subscription. Lite plan does not include this feature.',
        requiresSubscription: true,
        currentPlan: user.subscriptionType || 'free',
        availablePlans: ['trial', 'pro']
      });
    }
    
    next();
  } catch (error: any) {
    console.error('Error checking subscription:', error);
    res.status(500).json({ success: false, message: 'Error checking subscription status' });
  }
};

// Helper function to get subscription info (can be used in controllers)
export const getSubscriptionInfo = async (userId: string) => {
  const [user] = await db.select().from(users).where(eq(users.userId, userId)).limit(1);
  
  if (!user) {
    return { active: false, type: 'free', hasProFeatures: false };
  }
  
  const active = isSubscriptionActive(user.subscriptionType, user.subscriptionEndDate);
  const hasProFeatures = (user.subscriptionType === 'trial' || user.subscriptionType === 'pro') && active;
  
  return {
    active,
    type: user.subscriptionType || 'free',
    hasProFeatures,
    expiresAt: user.subscriptionEndDate
  };
};

