import { db } from '../db';
import { userStatistics, userRankings, users, practiceSessions, dynamicExamSessions, subjectStatistics, subjectRankings, practiceCategories } from '../db/schema';
import { eq, desc, and, gte, lte, sql, count, sum, avg } from 'drizzle-orm';

export class StatisticsService {
  // Helper method to resolve categoryId (UUID) from slug or UUID
  private async resolveCategoryId(categoryIdentifier: string): Promise<string> {
    // Check if it's already a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(categoryIdentifier)) {
      return categoryIdentifier;
    }

    // Try to find category by slug
    try {
      const [category] = await db
        .select({ categoryId: practiceCategories.categoryId })
        .from(practiceCategories)
        .where(eq(practiceCategories.slug, categoryIdentifier))
        .limit(1);

      if (category) {
        return category.categoryId;
      }
    } catch (error) {
      console.error(`Error resolving category ID for ${categoryIdentifier}:`, error);
    }

    // If not found, return the original identifier (will cause error but better than crashing)
    console.warn(`Could not resolve category ID for ${categoryIdentifier}, using as-is`);
    return categoryIdentifier;
  }

  // Initialize user statistics if not exists
  async initializeUserStatistics(userId: string) {
    try {
      const existing = await db
        .select()
        .from(userStatistics)
        .where(eq(userStatistics.userId, userId))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(userStatistics).values({
          userId,
          totalPracticeSessions: 0,
          totalQuestionsAttempted: 0,
          totalCorrectAnswers: 0,
          totalIncorrectAnswers: 0,
          totalSkippedQuestions: 0,
          totalExamSessions: 0,
          totalExamQuestionsAttempted: 0,
          totalExamCorrectAnswers: 0,
          totalExamIncorrectAnswers: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalTimeSpentMinutes: 0,
          averageTimePerQuestion: '0',
          overallAccuracy: '0',
          practiceAccuracy: '0',
          examAccuracy: '0',
          rankingPoints: 0,
        });
      }
    } catch (error) {
      console.error('Error initializing user statistics:', error);
      throw new Error('Failed to initialize user statistics');
    }
  }

  // Update practice session statistics
  async updatePracticeStatistics(userId: string, sessionData: {
    questionsAttempted: number;
    correctAnswers: number;
    incorrectAnswers: number;
    skippedQuestions: number;
    timeSpentMinutes: number;
  }) {
    try {
      console.log('StatisticsService: updatePracticeStatistics called for user:', userId, sessionData);
      await this.initializeUserStatistics(userId);

      // Calculate accuracy
      const totalAttempted = sessionData.questionsAttempted;
      const accuracy = totalAttempted > 0 ? (sessionData.correctAnswers / totalAttempted) * 100 : 0;

      console.log('StatisticsService: Updating statistics with accuracy:', accuracy);

      // Update statistics
      await db
        .update(userStatistics)
        .set({
          totalPracticeSessions: sql`${userStatistics.totalPracticeSessions} + 1`,
          totalQuestionsAttempted: sql`${userStatistics.totalQuestionsAttempted} + ${sessionData.questionsAttempted}`,
          totalCorrectAnswers: sql`${userStatistics.totalCorrectAnswers} + ${sessionData.correctAnswers}`,
          totalIncorrectAnswers: sql`${userStatistics.totalIncorrectAnswers} + ${sessionData.incorrectAnswers}`,
          totalSkippedQuestions: sql`${userStatistics.totalSkippedQuestions} + ${sessionData.skippedQuestions}`,
          totalTimeSpentMinutes: sql`${userStatistics.totalTimeSpentMinutes} + ${sessionData.timeSpentMinutes}`,
          updatedAt: new Date(),
        })
        .where(eq(userStatistics.userId, userId));

      console.log('StatisticsService: Basic statistics updated, now updating accuracy and ranking');

      // Update accuracy and ranking points
      await this.updateAccuracyAndRanking(userId);
      
      // Update streak
      await this.updateStreak(userId);
      
      console.log('StatisticsService: Practice statistics update completed successfully');
    } catch (error) {
      console.error('Error updating practice statistics:', error);
      throw new Error('Failed to update practice statistics');
    }
  }

  // Update exam session statistics
  async updateExamStatistics(userId: string, sessionData: {
    questionsAttempted: number;
    correctAnswers: number;
    incorrectAnswers: number;
    timeSpentMinutes: number;
  }) {
    try {
      await this.initializeUserStatistics(userId);

      // Update statistics
      await db
        .update(userStatistics)
        .set({
          totalExamSessions: sql`${userStatistics.totalExamSessions} + 1`,
          totalExamQuestionsAttempted: sql`${userStatistics.totalExamQuestionsAttempted} + ${sessionData.questionsAttempted}`,
          totalExamCorrectAnswers: sql`${userStatistics.totalExamCorrectAnswers} + ${sessionData.correctAnswers}`,
          totalExamIncorrectAnswers: sql`${userStatistics.totalExamIncorrectAnswers} + ${sessionData.incorrectAnswers}`,
          totalTimeSpentMinutes: sql`${userStatistics.totalTimeSpentMinutes} + ${sessionData.timeSpentMinutes}`,
          updatedAt: new Date(),
        })
        .where(eq(userStatistics.userId, userId));

      // Update accuracy and ranking points
      await this.updateAccuracyAndRanking(userId);
      
      // Update streak
      await this.updateStreak(userId);
    } catch (error) {
      console.error('Error updating exam statistics:', error);
      throw new Error('Failed to update exam statistics');
    }
  }

  // Update accuracy and ranking points
  async updateAccuracyAndRanking(userId: string) {
    try {
      console.log('StatisticsService: updateAccuracyAndRanking called for user:', userId);
      const [stats] = await db
        .select()
        .from(userStatistics)
        .where(eq(userStatistics.userId, userId))
        .limit(1);

      if (!stats) {
        console.log('StatisticsService: No stats found for user:', userId);
        return;
      }

      console.log('StatisticsService: Current stats:', {
        totalQuestionsAttempted: stats.totalQuestionsAttempted,
        totalCorrectAnswers: stats.totalCorrectAnswers,
        totalExamQuestionsAttempted: stats.totalExamQuestionsAttempted,
        totalExamCorrectAnswers: stats.totalExamCorrectAnswers
      });

      // Calculate accuracies
      const practiceAccuracy = stats.totalQuestionsAttempted > 0 
        ? (stats.totalCorrectAnswers / stats.totalQuestionsAttempted) * 100 
        : 0;

      const examAccuracy = stats.totalExamQuestionsAttempted > 0 
        ? (stats.totalExamCorrectAnswers / stats.totalExamQuestionsAttempted) * 100 
        : 0;

      const overallAccuracy = (stats.totalQuestionsAttempted + stats.totalExamQuestionsAttempted) > 0 
        ? ((stats.totalCorrectAnswers + stats.totalExamCorrectAnswers) / (stats.totalQuestionsAttempted + stats.totalExamQuestionsAttempted)) * 100 
        : 0;

      console.log('StatisticsService: Calculated accuracies:', {
        practiceAccuracy,
        examAccuracy,
        overallAccuracy
      });

      // Calculate average time per question
      const totalQuestions = stats.totalQuestionsAttempted + stats.totalExamQuestionsAttempted;
      const averageTimePerQuestion = totalQuestions > 0 
        ? stats.totalTimeSpentMinutes / totalQuestions 
        : 0;

      // Calculate ranking points using algorithm
      const rankingPoints = this.calculateRankingPoints(stats, practiceAccuracy, examAccuracy, overallAccuracy);

      console.log('StatisticsService: Calculated ranking points:', rankingPoints);

      await db
        .update(userStatistics)
        .set({
          practiceAccuracy: practiceAccuracy.toString(),
          examAccuracy: examAccuracy.toString(),
          overallAccuracy: overallAccuracy.toString(),
          averageTimePerQuestion: averageTimePerQuestion.toString(),
          rankingPoints,
          updatedAt: new Date(),
        })
        .where(eq(userStatistics.userId, userId));

      console.log('StatisticsService: Accuracy and ranking updated successfully');
    } catch (error) {
      console.error('Error updating accuracy and ranking:', error);
      throw new Error('Failed to update accuracy and ranking');
    }
  }

  // Calculate ranking points using algorithm
  private calculateRankingPoints(stats: any, practiceAccuracy: number, examAccuracy: number, overallAccuracy: number): number {
    // Base points for activity
    const practicePoints = stats.totalPracticeSessions * 10;
    const examPoints = stats.totalExamSessions * 20;
    
    // Accuracy bonus points
    const accuracyPoints = Math.round(overallAccuracy * 2);
    
    // Streak bonus points
    const streakPoints = stats.currentStreak * 5;
    
    // Question volume bonus
    const volumePoints = Math.floor((stats.totalQuestionsAttempted + stats.totalExamQuestionsAttempted) / 10) * 2;
    
    // Time efficiency bonus (lower average time = higher points)
    const avgTime = parseFloat(stats.averageTimePerQuestion || '0');
    const efficiencyPoints = avgTime > 0 ? Math.max(0, 50 - Math.floor(avgTime)) : 0;
    
    return practicePoints + examPoints + accuracyPoints + streakPoints + volumePoints + efficiencyPoints;
  }

  // Update streak information
  async updateStreak(userId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [stats] = await db
        .select()
        .from(userStatistics)
        .where(eq(userStatistics.userId, userId))
        .limit(1);

      if (!stats) return;

      const lastActivity = stats.lastActivityDate;
      
      if (!lastActivity) {
        // First activity
        await db
          .update(userStatistics)
          .set({
            currentStreak: 1,
            longestStreak: 1,
            lastActivityDate: today,
            updatedAt: new Date(),
          })
          .where(eq(userStatistics.userId, userId));
      } else {
        const lastActivityDate = new Date(lastActivity);
        const todayDate = new Date(today);
        const diffTime = todayDate.getTime() - lastActivityDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Consecutive day
          const newStreak = stats.currentStreak + 1;
          await db
            .update(userStatistics)
            .set({
              currentStreak: newStreak,
              longestStreak: Math.max(stats.longestStreak, newStreak),
              lastActivityDate: today,
              updatedAt: new Date(),
            })
            .where(eq(userStatistics.userId, userId));
        } else if (diffDays === 0) {
          // Same day, no change needed
          return;
        } else {
          // Streak broken
          await db
            .update(userStatistics)
            .set({
              currentStreak: 1,
              lastActivityDate: today,
              updatedAt: new Date(),
            })
            .where(eq(userStatistics.userId, userId));
        }
      }
    } catch (error) {
      console.error('Error updating streak:', error);
      throw new Error('Failed to update streak');
    }
  }

  // Get user statistics
  async getUserStatistics(userId: string) {
    try {
      await this.initializeUserStatistics(userId);
      
      const [stats] = await db
        .select()
        .from(userStatistics)
        .where(eq(userStatistics.userId, userId))
        .limit(1);

      return stats;
    } catch (error) {
      console.error('Error getting user statistics:', error);
      throw new Error('Failed to get user statistics');
    }
  }

  // Get leaderboard
  async getLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'alltime' = 'alltime', limit: number = 50) {
    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'alltime':
        default:
          startDate = new Date(0);
          break;
      }

      const leaderboard = await db
        .select({
          userId: users.userId,
          username: users.username,
          email: users.email,
          rankingPoints: userStatistics.rankingPoints,
          totalPracticeSessions: userStatistics.totalPracticeSessions,
          totalExamSessions: userStatistics.totalExamSessions,
          totalQuestionsAttempted: userStatistics.totalQuestionsAttempted,
          totalCorrectAnswers: userStatistics.totalCorrectAnswers,
          overallAccuracy: userStatistics.overallAccuracy,
          currentStreak: userStatistics.currentStreak,
          longestStreak: userStatistics.longestStreak,
        })
        .from(userStatistics)
        .innerJoin(users, eq(userStatistics.userId, users.userId))
        .where(sql`${userStatistics.updatedAt} >= ${startDate}`)
        .orderBy(desc(userStatistics.rankingPoints))
        .limit(limit);

      return leaderboard.map((user, index) => ({
        ...user,
        rank: index + 1,
      }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw new Error('Failed to get leaderboard');
    }
  }

  // Get category-specific leaderboard
  async getCategoryLeaderboard(
    category: 'overall' | 'practice' | 'exam' | 'streak' | 'accuracy',
    period: 'daily' | 'weekly' | 'monthly' | 'alltime' = 'alltime',
    limit: number = 50
  ) {
    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'alltime':
        default:
          startDate = new Date(0);
          break;
      }

      let orderByColumn;
      switch (category) {
        case 'practice':
          orderByColumn = userStatistics.totalPracticeSessions;
          break;
        case 'exam':
          orderByColumn = userStatistics.totalExamSessions;
          break;
        case 'streak':
          orderByColumn = userStatistics.currentStreak;
          break;
        case 'accuracy':
          orderByColumn = sql`CAST(${userStatistics.overallAccuracy} AS DECIMAL)`;
          break;
        case 'overall':
        default:
          orderByColumn = userStatistics.rankingPoints;
          break;
      }

      const leaderboard = await db
        .select({
          userId: users.userId,
          username: users.username,
          email: users.email,
          rankingPoints: userStatistics.rankingPoints,
          totalPracticeSessions: userStatistics.totalPracticeSessions,
          totalExamSessions: userStatistics.totalExamSessions,
          totalQuestionsAttempted: userStatistics.totalQuestionsAttempted,
          totalCorrectAnswers: userStatistics.totalCorrectAnswers,
          overallAccuracy: userStatistics.overallAccuracy,
          currentStreak: userStatistics.currentStreak,
          longestStreak: userStatistics.longestStreak,
        })
        .from(userStatistics)
        .innerJoin(users, eq(userStatistics.userId, users.userId))
        .where(sql`${userStatistics.updatedAt} >= ${startDate}`)
        .orderBy(desc(orderByColumn))
        .limit(limit);

      return leaderboard.map((user, index) => ({
        ...user,
        rank: index + 1,
      }));
    } catch (error) {
      console.error('Error getting category leaderboard:', error);
      throw new Error('Failed to get category leaderboard');
    }
  }

  // Get user's rank
  async getUserRank(userId: string, period: 'daily' | 'weekly' | 'monthly' | 'alltime' = 'alltime') {
    try {
      // For alltime period, get comprehensive leaderboard
      if (period === 'alltime') {
        const leaderboard = await db
          .select({
            userId: users.userId,
            rankingPoints: userStatistics.rankingPoints,
          })
          .from(userStatistics)
          .innerJoin(users, eq(userStatistics.userId, users.userId))
          .orderBy(desc(userStatistics.rankingPoints));
        
        const userRank = leaderboard.findIndex(user => user.userId === userId);
        return userRank >= 0 ? userRank + 1 : leaderboard.length; // Show as last if not found
      }
      
      // For other periods, use existing logic
      const leaderboard = await this.getLeaderboard(period, 1000); // Get more users to find rank
      const userRank = leaderboard.findIndex(user => user.userId === userId);
      
      return userRank >= 0 ? userRank + 1 : null;
    } catch (error) {
      console.error('Error getting user rank:', error);
      throw new Error('Failed to get user rank');
    }
  }

  // Update all rankings (to be called periodically)
  async updateAllRankings() {
    try {
      const periods: ('daily' | 'weekly' | 'monthly' | 'alltime')[] = ['daily', 'weekly', 'monthly', 'alltime'];
      
      for (const period of periods) {
        const leaderboard = await this.getLeaderboard(period, 1000);
        
        // Clear existing rankings for this period
        const now = new Date();
        let periodStart: Date;
        
        switch (period) {
          case 'daily':
            periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'weekly':
            periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'monthly':
            periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'alltime':
          default:
            periodStart = new Date(0);
            break;
        }

        // Insert new rankings
        for (const user of leaderboard) {
          await db.insert(userRankings).values({
            userId: user.userId,
            totalPoints: user.rankingPoints,
            practicePoints: user.totalPracticeSessions * 10,
            examPoints: user.totalExamSessions * 20,
            streakPoints: user.currentStreak * 5,
            accuracyPoints: Math.round(parseFloat(user.overallAccuracy || '0') * 2),
            overallRank: user.rank,
            practiceRank: user.rank, // Simplified for now
            examRank: user.rank,
            streakRank: user.rank,
            accuracyRank: user.rank,
            period,
            periodStart,
            periodEnd: now,
          }).onConflictDoNothing();
        }
      }
    } catch (error) {
      console.error('Error updating all rankings:', error);
      throw new Error('Failed to update all rankings');
    }
  }

  // Initialize subject statistics if not exists
  async initializeSubjectStatistics(userId: string, categoryId: string) {
    try {
      // Resolve categoryId - it might be a slug, so convert to UUID
      const resolvedCategoryId = await this.resolveCategoryId(categoryId);
      
      const existing = await db
        .select()
        .from(subjectStatistics)
        .where(and(
          eq(subjectStatistics.userId, userId),
          eq(subjectStatistics.categoryId, resolvedCategoryId)
        ))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(subjectStatistics).values({
          userId,
          categoryId: resolvedCategoryId,
          totalPracticeSessions: 0,
          totalQuestionsAttempted: 0,
          totalCorrectAnswers: 0,
          totalIncorrectAnswers: 0,
          totalSkippedQuestions: 0,
          totalExamSessions: 0,
          totalExamQuestionsAttempted: 0,
          totalExamCorrectAnswers: 0,
          totalExamIncorrectAnswers: 0,
          totalTimeSpentMinutes: 0,
          averageTimePerQuestion: '0',
          overallAccuracy: '0',
          practiceAccuracy: '0',
          examAccuracy: '0',
          rankingPoints: 0,
        });
      }
    } catch (error) {
      console.error('Error initializing subject statistics:', error);
      throw new Error('Failed to initialize subject statistics');
    }
  }

  // Update subject practice statistics
  async updateSubjectPracticeStatistics(userId: string, categoryId: string, sessionData: {
    questionsAttempted: number;
    correctAnswers: number;
    incorrectAnswers: number;
    skippedQuestions: number;
    timeSpentMinutes: number;
  }) {
    try {
      const resolvedCategoryId = await this.resolveCategoryId(categoryId);
      await this.initializeSubjectStatistics(userId, resolvedCategoryId);

      // Update statistics
      await db
        .update(subjectStatistics)
        .set({
          totalPracticeSessions: sql`${subjectStatistics.totalPracticeSessions} + 1`,
          totalQuestionsAttempted: sql`${subjectStatistics.totalQuestionsAttempted} + ${sessionData.questionsAttempted}`,
          totalCorrectAnswers: sql`${subjectStatistics.totalCorrectAnswers} + ${sessionData.correctAnswers}`,
          totalIncorrectAnswers: sql`${subjectStatistics.totalIncorrectAnswers} + ${sessionData.incorrectAnswers}`,
          totalSkippedQuestions: sql`${subjectStatistics.totalSkippedQuestions} + ${sessionData.skippedQuestions}`,
          totalTimeSpentMinutes: sql`${subjectStatistics.totalTimeSpentMinutes} + ${sessionData.timeSpentMinutes}`,
          updatedAt: new Date(),
        })
        .where(and(
          eq(subjectStatistics.userId, userId),
          eq(subjectStatistics.categoryId, resolvedCategoryId)
        ));

      // Update accuracy and ranking points
      await this.updateSubjectAccuracyAndRanking(userId, resolvedCategoryId);
    } catch (error) {
      console.error('Error updating subject practice statistics:', error);
      throw new Error('Failed to update subject practice statistics');
    }
  }

  // Update subject exam statistics
  async updateSubjectExamStatistics(userId: string, categoryId: string, sessionData: {
    questionsAttempted: number;
    correctAnswers: number;
    incorrectAnswers: number;
    timeSpentMinutes: number;
  }) {
    try {
      const resolvedCategoryId = await this.resolveCategoryId(categoryId);
      await this.initializeSubjectStatistics(userId, resolvedCategoryId);

      // Update statistics
      await db
        .update(subjectStatistics)
        .set({
          totalExamSessions: sql`${subjectStatistics.totalExamSessions} + 1`,
          totalExamQuestionsAttempted: sql`${subjectStatistics.totalExamQuestionsAttempted} + ${sessionData.questionsAttempted}`,
          totalExamCorrectAnswers: sql`${subjectStatistics.totalExamCorrectAnswers} + ${sessionData.correctAnswers}`,
          totalExamIncorrectAnswers: sql`${subjectStatistics.totalExamIncorrectAnswers} + ${sessionData.incorrectAnswers}`,
          totalTimeSpentMinutes: sql`${subjectStatistics.totalTimeSpentMinutes} + ${sessionData.timeSpentMinutes}`,
          updatedAt: new Date(),
        })
        .where(and(
          eq(subjectStatistics.userId, userId),
          eq(subjectStatistics.categoryId, resolvedCategoryId)
        ));

      // Update accuracy and ranking points
      await this.updateSubjectAccuracyAndRanking(userId, resolvedCategoryId);
    } catch (error) {
      console.error('Error updating subject exam statistics:', error);
      throw new Error('Failed to update subject exam statistics');
    }
  }

  // Update subject accuracy and ranking points
  async updateSubjectAccuracyAndRanking(userId: string, categoryId: string) {
    try {
      const resolvedCategoryId = await this.resolveCategoryId(categoryId);
      const [stats] = await db
        .select()
        .from(subjectStatistics)
        .where(and(
          eq(subjectStatistics.userId, userId),
          eq(subjectStatistics.categoryId, resolvedCategoryId)
        ))
        .limit(1);

      if (!stats) return;

      // Calculate accuracies
      const practiceAccuracy = stats.totalQuestionsAttempted > 0 
        ? (stats.totalCorrectAnswers / stats.totalQuestionsAttempted) * 100 
        : 0;

      const examAccuracy = stats.totalExamQuestionsAttempted > 0 
        ? (stats.totalExamCorrectAnswers / stats.totalExamQuestionsAttempted) * 100 
        : 0;

      const overallAccuracy = (stats.totalQuestionsAttempted + stats.totalExamQuestionsAttempted) > 0 
        ? ((stats.totalCorrectAnswers + stats.totalExamCorrectAnswers) / (stats.totalQuestionsAttempted + stats.totalExamQuestionsAttempted)) * 100 
        : 0;

      // Calculate average time per question
      const totalQuestions = stats.totalQuestionsAttempted + stats.totalExamQuestionsAttempted;
      const averageTimePerQuestion = totalQuestions > 0 
        ? stats.totalTimeSpentMinutes / totalQuestions 
        : 0;

      // Calculate ranking points using algorithm
      const rankingPoints = this.calculateSubjectRankingPoints(stats, practiceAccuracy, examAccuracy, overallAccuracy);

      await db
        .update(subjectStatistics)
        .set({
          practiceAccuracy: practiceAccuracy.toString(),
          examAccuracy: examAccuracy.toString(),
          overallAccuracy: overallAccuracy.toString(),
          averageTimePerQuestion: averageTimePerQuestion.toString(),
          rankingPoints,
          updatedAt: new Date(),
        })
        .where(and(
          eq(subjectStatistics.userId, userId),
          eq(subjectStatistics.categoryId, categoryId)
        ));
    } catch (error) {
      console.error('Error updating subject accuracy and ranking:', error);
      throw new Error('Failed to update subject accuracy and ranking');
    }
  }

  // Calculate subject ranking points using algorithm
  private calculateSubjectRankingPoints(stats: any, practiceAccuracy: number, examAccuracy: number, overallAccuracy: number): number {
    // Base points for activity
    const practicePoints = stats.totalPracticeSessions * 10;
    const examPoints = stats.totalExamSessions * 20;
    
    // Accuracy bonus points
    const accuracyPoints = Math.round(overallAccuracy * 2);
    
    // Question volume bonus
    const volumePoints = Math.floor((stats.totalQuestionsAttempted + stats.totalExamQuestionsAttempted) / 10) * 2;
    
    // Time efficiency bonus (lower average time = higher points)
    const avgTime = parseFloat(stats.averageTimePerQuestion || '0');
    const efficiencyPoints = avgTime > 0 ? Math.max(0, 50 - Math.floor(avgTime)) : 0;
    
    return practicePoints + examPoints + accuracyPoints + volumePoints + efficiencyPoints;
  }

  // Get subject-specific leaderboard
  async getSubjectLeaderboard(
    categoryId: string,
    category: 'overall' | 'practice' | 'exam' | 'accuracy' = 'overall',
    period: 'daily' | 'weekly' | 'monthly' | 'alltime' = 'alltime',
    limit: number = 50
  ) {
    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'alltime':
        default:
          startDate = new Date(0);
          break;
      }

      let orderByColumn;
      switch (category) {
        case 'practice':
          orderByColumn = subjectStatistics.totalPracticeSessions;
          break;
        case 'exam':
          orderByColumn = subjectStatistics.totalExamSessions;
          break;
        case 'accuracy':
          orderByColumn = sql`CAST(${subjectStatistics.overallAccuracy} AS DECIMAL)`;
          break;
        case 'overall':
        default:
          orderByColumn = subjectStatistics.rankingPoints;
          break;
      }

      const leaderboard = await db
        .select({
          userId: users.userId,
          username: users.username,
          email: users.email,
          categoryId: practiceCategories.categoryId,
          categoryName: practiceCategories.name,
          categorySlug: practiceCategories.slug,
          rankingPoints: subjectStatistics.rankingPoints,
          totalPracticeSessions: subjectStatistics.totalPracticeSessions,
          totalExamSessions: subjectStatistics.totalExamSessions,
          totalQuestionsAttempted: subjectStatistics.totalQuestionsAttempted,
          totalCorrectAnswers: subjectStatistics.totalCorrectAnswers,
          overallAccuracy: subjectStatistics.overallAccuracy,
        })
        .from(subjectStatistics)
        .innerJoin(users, eq(subjectStatistics.userId, users.userId))
        .innerJoin(practiceCategories, eq(subjectStatistics.categoryId, practiceCategories.categoryId))
        .where(and(
          eq(subjectStatistics.categoryId, categoryId),
          sql`${subjectStatistics.updatedAt} >= ${startDate}`
        ))
        .orderBy(desc(orderByColumn))
        .limit(limit);

      return leaderboard.map((user, index) => ({
        ...user,
        rank: index + 1,
      }));
    } catch (error) {
      console.error('Error getting subject leaderboard:', error);
      throw new Error('Failed to get subject leaderboard');
    }
  }

  // Get available subjects for leaderboard
  async getAvailableSubjects() {
    try {
      const subjects = await db
        .select({
          categoryId: practiceCategories.categoryId,
          name: practiceCategories.name,
          slug: practiceCategories.slug,
          description: practiceCategories.description,
          language: practiceCategories.language,
        })
        .from(practiceCategories)
        .where(eq(practiceCategories.status, 'active'))
        .orderBy(practiceCategories.name);

      return subjects;
    } catch (error) {
      console.error('Error getting available subjects:', error);
      throw new Error('Failed to get available subjects');
    }
  }
}