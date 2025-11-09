import { db } from '../db';
import { users, practiceSessions, dynamicExamSessions } from '../db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

export class SessionLimitsService {
  // Check if user can create a practice session (free plan: 3 per day)
  async canCreatePracticeSession(userId: string): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
    try {
      const [user] = await db.select().from(users).where(eq(users.userId, userId)).limit(1);
      
      if (!user) {
        return { allowed: false, reason: 'User not found' };
      }

      // Check subscription status
      const subscriptionType = user.subscriptionType || 'free';
      const subscriptionEndDate = user.subscriptionEndDate;
      
      // Helper to check if subscription is active
      const isSubscriptionActive = (type: string | null, endDate: Date | null): boolean => {
        if (!type || type === 'free') return false;
        if (!endDate) return false;
        return new Date(endDate) > new Date();
      };

      const hasActiveSubscription = isSubscriptionActive(subscriptionType, subscriptionEndDate);

      // Free plan: limit to 3 practice sessions per day
      if (subscriptionType === 'free' || !hasActiveSubscription) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todaySessions = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(practiceSessions)
          .where(
            and(
              eq(practiceSessions.userId, userId),
              gte(practiceSessions.createdAt, today),
              sql`${practiceSessions.createdAt} < ${tomorrow}`
            )
          );

        const sessionCount = todaySessions[0]?.count || 0;
        const maxSessions = 3;

        if (sessionCount >= maxSessions) {
          return {
            allowed: false,
            reason: `Free plan limit reached. You can only create ${maxSessions} practice sessions per day. Upgrade to Pro for unlimited sessions.`,
            remaining: 0
          };
        }

        return {
          allowed: true,
          remaining: maxSessions - sessionCount
        };
      }

      // Trial, Pro, Lite plans: unlimited
      return { allowed: true };
    } catch (error) {
      console.error('Error checking practice session limit:', error);
      return { allowed: false, reason: 'Error checking session limits' };
    }
  }

  // Check if user can create an exam session (free plan: 3 per day)
  async canCreateExamSession(userId: string): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
    try {
      const [user] = await db.select().from(users).where(eq(users.userId, userId)).limit(1);
      
      if (!user) {
        return { allowed: false, reason: 'User not found' };
      }

      // Check subscription status
      const subscriptionType = user.subscriptionType || 'free';
      const subscriptionEndDate = user.subscriptionEndDate;
      
      // Helper to check if subscription is active
      const isSubscriptionActive = (type: string | null, endDate: Date | null): boolean => {
        if (!type || type === 'free') return false;
        if (!endDate) return false;
        return new Date(endDate) > new Date();
      };

      const hasActiveSubscription = isSubscriptionActive(subscriptionType, subscriptionEndDate);

      // Free plan: limit to 3 exam sessions per day
      if (subscriptionType === 'free' || !hasActiveSubscription) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todaySessions = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(dynamicExamSessions)
          .where(
            and(
              eq(dynamicExamSessions.userId, userId),
              gte(dynamicExamSessions.createdAt, today),
              sql`${dynamicExamSessions.createdAt} < ${tomorrow}`
            )
          );

        const sessionCount = todaySessions[0]?.count || 0;
        const maxSessions = 3;

        if (sessionCount >= maxSessions) {
          return {
            allowed: false,
            reason: `Free plan limit reached. You can only create ${maxSessions} exam sessions per day. Upgrade to Pro for unlimited sessions.`,
            remaining: 0
          };
        }

        return {
          allowed: true,
          remaining: maxSessions - sessionCount
        };
      }

      // Trial, Pro, Lite plans: unlimited
      return { allowed: true };
    } catch (error) {
      console.error('Error checking exam session limit:', error);
      return { allowed: false, reason: 'Error checking session limits' };
    }
  }

  // Get remaining sessions for today
  async getRemainingSessions(userId: string): Promise<{ practice: number; exam: number }> {
    try {
      const [user] = await db.select().from(users).where(eq(users.userId, userId)).limit(1);
      
      if (!user) {
        return { practice: 0, exam: 0 };
      }

      const subscriptionType = user.subscriptionType || 'free';
      const subscriptionEndDate = user.subscriptionEndDate;
      
      const isSubscriptionActive = (type: string | null, endDate: Date | null): boolean => {
        if (!type || type === 'free') return false;
        if (!endDate) return false;
        return new Date(endDate) > new Date();
      };

      const hasActiveSubscription = isSubscriptionActive(subscriptionType, subscriptionEndDate);

      // If not free plan, return unlimited (represented as -1)
      if (subscriptionType !== 'free' && hasActiveSubscription) {
        return { practice: -1, exam: -1 }; // -1 means unlimited
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const practiceCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(practiceSessions)
        .where(
          and(
            eq(practiceSessions.userId, userId),
            gte(practiceSessions.createdAt, today),
            sql`${practiceSessions.createdAt} < ${tomorrow}`
          )
        );

      const examCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(dynamicExamSessions)
        .where(
          and(
            eq(dynamicExamSessions.userId, userId),
            gte(dynamicExamSessions.createdAt, today),
            sql`${dynamicExamSessions.createdAt} < ${tomorrow}`
          )
        );

      const practiceSessionsToday = practiceCount[0]?.count || 0;
      const examSessionsToday = examCount[0]?.count || 0;

      return {
        practice: Math.max(0, 3 - practiceSessionsToday),
        exam: Math.max(0, 3 - examSessionsToday)
      };
    } catch (error) {
      console.error('Error getting remaining sessions:', error);
      return { practice: 0, exam: 0 };
    }
  }
}

