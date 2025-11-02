"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedPracticeService = void 0;
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
class EnhancedPracticeService {
    // Create a practice session with detailed tracking
    async createPracticeSession(userId, category, sessionData) {
        try {
            // Validate UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(userId)) {
                throw new Error('Invalid user ID format');
            }
            const newSession = {
                userId,
                category: category,
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
            const [session] = await db_1.db.insert(schema_1.practiceSessions).values(newSession).returning();
            // Update user profile statistics
            await this.updateUserPracticeStats(userId, sessionData);
            return session;
        }
        catch (error) {
            console.error('Error creating practice session:', error);
            throw new Error('Failed to create practice session');
        }
    }
    // Update user practice statistics in profile
    async updateUserPracticeStats(userId, sessionData) {
        try {
            const currentDate = new Date();
            const weekStart = new Date(currentDate);
            weekStart.setDate(currentDate.getDate() - currentDate.getDay());
            weekStart.setHours(0, 0, 0, 0);
            const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            // Get current user stats
            const [user] = await db_1.db
                .select()
                .from(schema_1.users)
                .where((0, drizzle_orm_1.eq)(schema_1.users.userId, userId))
                .limit(1);
            if (!user) {
                throw new Error('User not found');
            }
            // Calculate new totals
            const newTotalSessions = (user.totalPracticeSessions || 0) + 1;
            const newTotalScore = (user.totalPracticeScore || 0) + (sessionData.correctAnswers || 0);
            // Calculate weekly stats
            const weeklySessions = await db_1.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.practiceSessions)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.practiceSessions.userId, userId), (0, drizzle_orm_1.sql) `${schema_1.practiceSessions.createdAt} >= ${weekStart}`));
            const weeklyScores = await db_1.db
                .select({ total: (0, drizzle_orm_1.sql) `COALESCE(SUM(${schema_1.practiceSessions.correctAnswers}), 0)` })
                .from(schema_1.practiceSessions)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.practiceSessions.userId, userId), (0, drizzle_orm_1.sql) `${schema_1.practiceSessions.createdAt} >= ${weekStart}`));
            // Calculate monthly stats
            const monthlySessions = await db_1.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.practiceSessions)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.practiceSessions.userId, userId), (0, drizzle_orm_1.sql) `${schema_1.practiceSessions.createdAt} >= ${monthStart}`));
            const monthlyScores = await db_1.db
                .select({ total: (0, drizzle_orm_1.sql) `COALESCE(SUM(${schema_1.practiceSessions.correctAnswers}), 0)` })
                .from(schema_1.practiceSessions)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.practiceSessions.userId, userId), (0, drizzle_orm_1.sql) `${schema_1.practiceSessions.createdAt} >= ${monthStart}`));
            // Update user profile
            await db_1.db
                .update(schema_1.users)
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
                .where((0, drizzle_orm_1.eq)(schema_1.users.userId, userId));
        }
        catch (error) {
            console.error('Error updating user practice stats:', error);
            throw new Error('Failed to update user statistics');
        }
    }
    // Get user's practice history with detailed question data
    async getUserPracticeHistory(userId, limit = 50, offset = 0) {
        try {
            // Validate UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(userId)) {
                throw new Error('Invalid user ID format');
            }
            const sessions = await db_1.db
                .select()
                .from(schema_1.practiceSessions)
                .where((0, drizzle_orm_1.eq)(schema_1.practiceSessions.userId, userId))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.practiceSessions.createdAt))
                .limit(limit)
                .offset(offset);
            return sessions;
        }
        catch (error) {
            console.error('Error fetching practice history:', error);
            throw new Error('Failed to fetch practice history');
        }
    }
    // Get user's comprehensive practice statistics
    async getUserPracticeStats(userId) {
        try {
            // Validate UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(userId)) {
                throw new Error('Invalid user ID format');
            }
            // Get user profile stats
            const [user] = await db_1.db
                .select({
                totalPracticeSessions: schema_1.users.totalPracticeSessions,
                totalPracticeScore: schema_1.users.totalPracticeScore,
                weeklyPracticeScore: schema_1.users.weeklyPracticeScore,
                monthlyPracticeScore: schema_1.users.monthlyPracticeScore,
                weeklyPracticeCount: schema_1.users.weeklyPracticeCount,
                monthlyPracticeCount: schema_1.users.monthlyPracticeCount,
                lastPracticeDate: schema_1.users.lastPracticeDate,
                currentStreak: schema_1.users.currentStreak,
                longestStreak: schema_1.users.longestStreak
            })
                .from(schema_1.users)
                .where((0, drizzle_orm_1.eq)(schema_1.users.userId, userId))
                .limit(1);
            if (!user) {
                throw new Error('User not found');
            }
            // Get detailed session stats
            const sessions = await db_1.db
                .select({
                correctAnswers: schema_1.practiceSessions.correctAnswers,
                totalQuestions: schema_1.practiceSessions.totalQuestions,
                timeSpentSeconds: schema_1.practiceSessions.timeSpentSeconds,
                percentage: schema_1.practiceSessions.percentage,
                category: schema_1.practiceSessions.category,
                createdAt: schema_1.practiceSessions.createdAt
            })
                .from(schema_1.practiceSessions)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.practiceSessions.userId, userId), (0, drizzle_orm_1.eq)(schema_1.practiceSessions.status, 'completed')))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.practiceSessions.createdAt))
                .limit(100); // Last 100 sessions for detailed analysis
            const totalCorrect = sessions.reduce((sum, s) => sum + (s.correctAnswers || 0), 0);
            const totalQuestions = sessions.reduce((sum, s) => sum + (s.totalQuestions || 0), 0);
            const totalTimeSpent = sessions.reduce((sum, s) => sum + (s.timeSpentSeconds || 0), 0);
            // Calculate category-wise performance
            const categoryStats = sessions.reduce((acc, session) => {
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
        }
        catch (error) {
            console.error('Error fetching practice stats:', error);
            throw new Error('Failed to fetch practice statistics');
        }
    }
    // Get detailed session with explanations
    async getSessionWithExplanations(sessionId, userId) {
        try {
            // Validate UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(userId)) {
                throw new Error('Invalid user ID format');
            }
            const [session] = await db_1.db
                .select()
                .from(schema_1.practiceSessions)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.practiceSessions.sessionId, sessionId), (0, drizzle_orm_1.eq)(schema_1.practiceSessions.userId, userId)))
                .limit(1);
            return session;
        }
        catch (error) {
            console.error('Error fetching session details:', error);
            throw new Error('Failed to fetch session details');
        }
    }
}
exports.EnhancedPracticeService = EnhancedPracticeService;
//# sourceMappingURL=enhancedPractice.js.map