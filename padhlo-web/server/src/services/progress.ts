import { db } from '../db';
import { userProgress, type NewUserProgress } from '../db/schema';
import { eq, and, desc, asc, gte, lte, sql } from 'drizzle-orm';

export class ProgressService {
  // User Progress operations
  async getUserProgress(userId: string, subjectId?: string) {
    let query = db.select().from(userProgress).where(eq(userProgress.userId, userId));
    
    if (subjectId) {
      query = query.where(and(eq(userProgress.userId, userId), eq(userProgress.subjectId, subjectId)));
    }
    
    return await query.orderBy(desc(userProgress.updatedAt));
  }

  async getUserProgressByTopic(userId: string, topicId: string) {
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.topicId, topicId)))
      .limit(1);
    return progress;
  }

  async updateUserProgress(userId: string, topicId: string, subjectId: string, progressData: {
    totalQuestionsAttempted?: number;
    correctAnswers?: number;
    totalTimeSpentSeconds?: number;
    masteryLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    masteryPercentage?: number;
    averageAccuracy?: number;
    averageTimePerQuestionSeconds?: number;
    needsRevision?: boolean;
  }) {
    // Check if progress exists
    const existingProgress = await this.getUserProgressByTopic(userId, topicId);
    
    if (existingProgress) {
      // Update existing progress
      const [updatedProgress] = await db
        .update(userProgress)
        .set({
          ...progressData,
          practiceCount: existingProgress.practiceCount + 1,
          lastPracticedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userProgress.progressId, existingProgress.progressId))
        .returning();
      return updatedProgress;
    } else {
      // Create new progress
      const newProgress: NewUserProgress = {
        userId,
        topicId,
        subjectId,
        ...progressData,
        practiceCount: 1,
        lastPracticedAt: new Date(),
      };
      
      const [createdProgress] = await db.insert(userProgress).values(newProgress).returning();
      return createdProgress;
    }
  }

  // Daily Practice Sessions (simplified - using practiceSessions instead)
  async createDailyPracticeSession(sessionData: any) {
    // For now, return a mock response since dailyPracticeSessions table doesn't exist
    return { sessionId: 'mock-session-id', ...sessionData };
  }

  async getUserDailyPracticeSessions(userId: string, startDate?: string, endDate?: string) {
    // For now, return empty array since dailyPracticeSessions table doesn't exist
    return [];
  }

  async updateDailyPracticeSession(sessionId: string, updateData: any) {
    // For now, return mock response
    return { sessionId, ...updateData };
  }

  // User Question History (simplified)
  async addQuestionHistory(historyData: any) {
    // For now, return mock response since userQuestionHistory table doesn't exist
    return { historyId: 'mock-history-id', ...historyData };
  }

  async getUserQuestionHistory(userId: string, questionId?: string, limit: number = 50) {
    // For now, return empty array since userQuestionHistory table doesn't exist
    return [];
  }

  // Analytics and Statistics
  async getUserStats(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get daily practice sessions for the period
    const sessions = await this.getUserDailyPracticeSessions(
      userId,
      startDate.toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );

    // Calculate statistics
    const totalQuestions = sessions.reduce((sum, session) => sum + (session.questionsAttempted || 0), 0);
    const totalCorrect = sessions.reduce((sum, session) => sum + (session.correctAnswers || 0), 0);
    const totalTimeSpent = sessions.reduce((sum, session) => sum + (session.timeSpentSeconds || 0), 0);
    const totalPoints = sessions.reduce((sum, session) => sum + (session.pointsEarned || 0), 0);
    
    const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    const averageTimePerQuestion = totalQuestions > 0 ? totalTimeSpent / totalQuestions : 0;
    
    // Get current streak
    const completedSessions = sessions.filter(session => session.isCompleted);
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    // Calculate streaks (simplified logic)
    for (let i = 0; i < completedSessions.length; i++) {
      if (completedSessions[i].isCompleted) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    currentStreak = tempStreak;

    return {
      totalQuestions,
      totalCorrect,
      totalTimeSpent,
      totalPoints,
      accuracy: Math.round(accuracy * 100) / 100,
      averageTimePerQuestion: Math.round(averageTimePerQuestion),
      currentStreak,
      longestStreak,
      sessionsCompleted: completedSessions.length,
      totalSessions: sessions.length,
    };
  }

  async getSubjectWiseProgress(userId: string) {
    const progress = await this.getUserProgress(userId);
    
    // Group by subject
    const subjectProgress = progress.reduce((acc, item) => {
      if (!acc[item.subjectId]) {
        acc[item.subjectId] = {
          subjectId: item.subjectId,
          totalQuestions: 0,
          correctAnswers: 0,
          totalTime: 0,
          topics: [],
        };
      }
      
      acc[item.subjectId].totalQuestions += item.totalQuestionsAttempted || 0;
      acc[item.subjectId].correctAnswers += item.correctAnswers || 0;
      acc[item.subjectId].totalTime += item.totalTimeSpentSeconds || 0;
      acc[item.subjectId].topics.push({
        topicId: item.topicId,
        masteryLevel: item.masteryLevel,
        masteryPercentage: item.masteryPercentage,
        practiceCount: item.practiceCount,
        lastPracticedAt: item.lastPracticedAt,
      });
      
      return acc;
    }, {} as any);

    // Calculate accuracy for each subject
    Object.keys(subjectProgress).forEach(subjectId => {
      const subject = subjectProgress[subjectId];
      subject.accuracy = subject.totalQuestions > 0 
        ? Math.round((subject.correctAnswers / subject.totalQuestions) * 100 * 100) / 100 
        : 0;
    });

    return Object.values(subjectProgress);
  }

  async getWeakTopics(userId: string, limit: number = 10) {
    const progress = await this.getUserProgress(userId);
    
    return progress
      .filter(item => 
        item.masteryLevel === 'beginner' || 
        (item.masteryPercentage && item.masteryPercentage < 50) ||
        item.needsRevision
      )
      .sort((a, b) => (a.masteryPercentage || 0) - (b.masteryPercentage || 0))
      .slice(0, limit);
  }
}

