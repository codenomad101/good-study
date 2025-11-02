"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PracticeService = void 0;
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
class PracticeService {
    // Create a practice session (for tracking purposes)
    async createPracticeSession(userId, category, sessionData) {
        try {
            const newSession = {
                userId,
                category: category,
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
            const [session] = await db_1.db.insert(schema_1.practiceSessions).values(newSession).returning();
            return session;
        }
        catch (error) {
            console.error('Error creating practice session:', error);
            throw new Error('Failed to create practice session');
        }
    }
    // Get user's practice history
    async getUserPracticeHistory(userId, limit = 50, offset = 0) {
        try {
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
    // Get user's practice statistics
    async getUserPracticeStats(userId) {
        try {
            const [totalSessions] = await db_1.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.practiceSessions)
                .where((0, drizzle_orm_1.eq)(schema_1.practiceSessions.userId, userId));
            const [completedSessions] = await db_1.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.practiceSessions)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.practiceSessions.userId, userId), (0, drizzle_orm_1.eq)(schema_1.practiceSessions.status, 'completed')));
            const sessions = await db_1.db
                .select({
                correctAnswers: schema_1.practiceSessions.correctAnswers,
                totalQuestions: schema_1.practiceSessions.totalQuestions,
                timeSpentSeconds: schema_1.practiceSessions.timeSpentSeconds
            })
                .from(schema_1.practiceSessions)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.practiceSessions.userId, userId), (0, drizzle_orm_1.eq)(schema_1.practiceSessions.status, 'completed')));
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
        }
        catch (error) {
            console.error('Error fetching practice stats:', error);
            throw new Error('Failed to fetch practice statistics');
        }
    }
}
exports.PracticeService = PracticeService;
//# sourceMappingURL=simplePractice.js.map