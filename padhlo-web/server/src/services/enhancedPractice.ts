import { db } from '../db';
import { practiceSessions, NewPracticeSession, PracticeSession, users } from '../db/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';

export class EnhancedPracticeService {
  // Create a practice session with detailed tracking
  async createPracticeSession(userId: string, category: string, sessionData: any) {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        throw new Error('Invalid user ID format');
      }

      const newSession: NewPracticeSession = {
        userId,
        category: category as any,
        totalQuestions: sessionData.totalQuestions || 20,
        timeLimitMinutes: sessionData.timeLimitMinutes || 15,
        status: 'completed',
        questionsData: sessionData.questionsData || [],
        timeSpentSeconds: sessionData.timeSpentSeconds || 0,
        correctAnswers: sessionData.correctAnswers || 0,
        incorrectAnswers: sessionData.incorrectAnswers || 0,
        questionsAttempted: sessionData.questionsAttempted || 0,
        skippedQuestions: sessionData.skippedQuestions || 0,
        percentage: sessionData.percentage?.toString() || '0',
        completedAt: new Date()
      };

      const [session] = await db.insert(practiceSessions).values(newSession).returning();
      
      // Update user profile statistics
      await this.updateUserPracticeStats(userId, sessionData);
      
      return session;
    } catch (error) {
      console.error('Error creating practice session:', error);
      throw new Error('Failed to create practice session');
    }
  }

  // Update user practice statistics in profile
  async updateUserPracticeStats(userId: string, sessionData: any) {
    try {
      const currentDate = new Date();
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      // Get current user stats
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.userId, userId))
        .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      // Calculate new totals
      const newTotalSessions = (user.totalPracticeSessions || 0) + 1;
      const newTotalScore = (user.totalPracticeScore || 0) + (sessionData.correctAnswers || 0);
      
      // Calculate weekly stats
      const weeklySessions = await db
        .select({ count: count() })
        .from(practiceSessions)
        .where(and(
          eq(practiceSessions.userId, userId),
          sql`${practiceSessions.createdAt} >= ${weekStart}`
        ));

      const weeklyScores = await db
        .select({ total: sql<number>`COALESCE(SUM(${practiceSessions.correctAnswers}), 0)` })
        .from(practiceSessions)
        .where(and(
          eq(practiceSessions.userId, userId),
          sql`${practiceSessions.createdAt} >= ${weekStart}`
        ));

      // Calculate monthly stats
      const monthlySessions = await db
        .select({ count: count() })
        .from(practiceSessions)
        .where(and(
          eq(practiceSessions.userId, userId),
          sql`${practiceSessions.createdAt} >= ${monthStart}`
        ));

      const monthlyScores = await db
        .select({ total: sql<number>`COALESCE(SUM(${practiceSessions.correctAnswers}), 0)` })
        .from(practiceSessions)
        .where(and(
          eq(practiceSessions.userId, userId),
          sql`${practiceSessions.createdAt} >= ${monthStart}`
        ));

      // Update user profile
      await db
        .update(users)
        .set({
          totalPracticeSessions: newTotalSessions,
          totalPracticeScore: newTotalScore,
          weeklyPracticeScore: weeklyScores[0]?.total || 0,
          monthlyPracticeScore: monthlyScores[0]?.total || 0,
          weeklyPracticeCount: weeklySessions[0]?.count || 0,
          monthlyPracticeCount: monthlySessions[0]?.count || 0,
          lastPracticeDate: currentDate,
          lastActivityDate: currentDate.toISOString().split('T')[0],
          updatedAt: currentDate
        })
        .where(eq(users.userId, userId));

    } catch (error) {
      console.error('Error updating user practice stats:', error);
      throw new Error('Failed to update user statistics');
    }
  }

  // Get user's practice history with detailed question data
  async getUserPracticeHistory(userId: string, limit: number = 50, offset: number = 0) {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        throw new Error('Invalid user ID format');
      }

      const sessions = await db
        .select()
        .from(practiceSessions)
        .where(eq(practiceSessions.userId, userId))
        .orderBy(desc(practiceSessions.createdAt))
        .limit(limit)
        .offset(offset);

      return sessions;
    } catch (error) {
      console.error('Error fetching practice history:', error);
      throw new Error('Failed to fetch practice history');
    }
  }

  // Get user's comprehensive practice statistics
  async getUserPracticeStats(userId: string) {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        throw new Error('Invalid user ID format');
      }

      // Get user profile stats
      const [user] = await db
        .select({
          totalPracticeSessions: users.totalPracticeSessions,
          totalPracticeScore: users.totalPracticeScore,
          weeklyPracticeScore: users.weeklyPracticeScore,
          monthlyPracticeScore: users.monthlyPracticeScore,
          weeklyPracticeCount: users.weeklyPracticeCount,
          monthlyPracticeCount: users.monthlyPracticeCount,
          lastPracticeDate: users.lastPracticeDate,
          currentStreak: users.currentStreak,
          longestStreak: users.longestStreak
        })
        .from(users)
        .where(eq(users.userId, userId))
        .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      // Get detailed session stats
      const sessions = await db
        .select({
          correctAnswers: practiceSessions.correctAnswers,
          totalQuestions: practiceSessions.totalQuestions,
          timeSpentSeconds: practiceSessions.timeSpentSeconds,
          percentage: practiceSessions.percentage,
          category: practiceSessions.category,
          createdAt: practiceSessions.createdAt
        })
        .from(practiceSessions)
        .where(and(
          eq(practiceSessions.userId, userId),
          eq(practiceSessions.status, 'completed')
        ))
        .orderBy(desc(practiceSessions.createdAt))
        .limit(100); // Last 100 sessions for detailed analysis

      const totalCorrect = sessions.reduce((sum, s) => sum + (s.correctAnswers || 0), 0);
      const totalQuestions = sessions.reduce((sum, s) => sum + (s.totalQuestions || 0), 0);
      const totalTimeSpent = sessions.reduce((sum, s) => sum + (s.timeSpentSeconds || 0), 0);

      // Calculate category-wise performance
      const categoryStats = sessions.reduce((acc: any, session) => {
        const category = session.category || 'unknown';
        if (!acc[category]) {
          acc[category] = { correct: 0, total: 0, sessions: 0 };
        }
        acc[category].correct += session.correctAnswers || 0;
        acc[category].total += session.totalQuestions || 0;
        acc[category].sessions += 1;
        return acc;
      }, {});

      return {
        // Profile stats
        totalPracticeSessions: user.totalPracticeSessions || 0,
        totalPracticeScore: user.totalPracticeScore || 0,
        weeklyPracticeScore: user.weeklyPracticeScore || 0,
        monthlyPracticeScore: user.monthlyPracticeScore || 0,
        weeklyPracticeCount: user.weeklyPracticeCount || 0,
        monthlyPracticeCount: user.monthlyPracticeCount || 0,
        lastPracticeDate: user.lastPracticeDate,
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0,
        
        // Calculated stats
        totalCorrectAnswers: totalCorrect,
        totalQuestionsAttempted: totalQuestions,
        averageAccuracy: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
        totalTimeSpentMinutes: Math.round(totalTimeSpent / 60),
        averageTimePerQuestion: totalQuestions > 0 ? Math.round(totalTimeSpent / totalQuestions) : 0,
        
        // Category performance
        categoryPerformance: categoryStats,
        
        // Recent performance (last 10 sessions)
        recentSessions: sessions.slice(0, 10).map(s => ({
          correctAnswers: s.correctAnswers,
          totalQuestions: s.totalQuestions,
          percentage: parseFloat(s.percentage || '0'),
          category: s.category,
          timeSpentMinutes: Math.round((s.timeSpentSeconds || 0) / 60),
          createdAt: s.createdAt
        }))
      };
    } catch (error) {
      console.error('Error fetching practice stats:', error);
      throw new Error('Failed to fetch practice statistics');
    }
  }

  // Get detailed session with explanations
  async getSessionWithExplanations(sessionId: string, userId: string) {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        throw new Error('Invalid user ID format');
      }

      const [session] = await db
        .select()
        .from(practiceSessions)
        .where(and(
          eq(practiceSessions.sessionId, sessionId),
          eq(practiceSessions.userId, userId)
        ))
        .limit(1);

      return session;
    } catch (error) {
      console.error('Error fetching session details:', error);
      throw new Error('Failed to fetch session details');
    }
  }
}
