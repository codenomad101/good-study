import { db } from '../db';
import { practiceSessions, NewPracticeSession, PracticeSession } from '../db/schema';
import { eq, and, desc, count } from 'drizzle-orm';

export class PracticeService {
  // Create a practice session (for tracking purposes)
  async createPracticeSession(userId: string, category: string, sessionData: any) {
    try {
      const newSession: NewPracticeSession = {
        userId,
        category: category as any,
        totalQuestions: sessionData.totalQuestions || 20,
        timeLimitMinutes: sessionData.timeLimitMinutes || 15,
        status: 'completed', // Since we're saving after completion
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
      return session;
    } catch (error) {
      console.error('Error creating practice session:', error);
      throw new Error('Failed to create practice session');
    }
  }

  // Get user's practice history
  async getUserPracticeHistory(userId: string, limit: number = 50, offset: number = 0) {
    try {
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

  // Get user's practice statistics
  async getUserPracticeStats(userId: string) {
    try {
      const [totalSessions] = await db
        .select({ count: count() })
        .from(practiceSessions)
        .where(eq(practiceSessions.userId, userId));

      const [completedSessions] = await db
        .select({ count: count() })
        .from(practiceSessions)
        .where(and(
          eq(practiceSessions.userId, userId),
          eq(practiceSessions.status, 'completed')
        ));

      const sessions = await db
        .select({
          correctAnswers: practiceSessions.correctAnswers,
          totalQuestions: practiceSessions.totalQuestions,
          timeSpentSeconds: practiceSessions.timeSpentSeconds
        })
        .from(practiceSessions)
        .where(and(
          eq(practiceSessions.userId, userId),
          eq(practiceSessions.status, 'completed')
        ));

      const totalCorrect = sessions.reduce((sum, s) => sum + (s.correctAnswers || 0), 0);
      const totalQuestions = sessions.reduce((sum, s) => sum + (s.totalQuestions || 0), 0);
      const totalTimeSpent = sessions.reduce((sum, s) => sum + (s.timeSpentSeconds || 0), 0);

      return {
        totalSessions: totalSessions.count,
        completedSessions: completedSessions.count,
        totalCorrectAnswers: totalCorrect,
        totalQuestionsAttempted: totalQuestions,
        averageAccuracy: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
        totalTimeSpentMinutes: Math.round(totalTimeSpent / 60),
        averageTimePerQuestion: totalQuestions > 0 ? Math.round(totalTimeSpent / totalQuestions) : 0
      };
    } catch (error) {
      console.error('Error fetching practice stats:', error);
      throw new Error('Failed to fetch practice statistics');
    }
  }
}
