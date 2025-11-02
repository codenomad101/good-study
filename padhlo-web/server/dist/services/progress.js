"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressService = void 0;
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
class ProgressService {
    // User Progress operations
    async getUserProgress(userId, subjectId) {
        let query = db_1.db.select().from(schema_1.userProgress).where((0, drizzle_orm_1.eq)(schema_1.userProgress.userId, userId));
        if (subjectId) {
            query = query.where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userProgress.userId, userId), (0, drizzle_orm_1.eq)(schema_1.userProgress.subjectId, subjectId)));
        }
        return await query.orderBy((0, drizzle_orm_1.desc)(schema_1.userProgress.updatedAt));
    }
    async getUserProgressByTopic(userId, topicId) {
        const [progress] = await db_1.db
            .select()
            .from(schema_1.userProgress)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userProgress.userId, userId), (0, drizzle_orm_1.eq)(schema_1.userProgress.topicId, topicId)))
            .limit(1);
        return progress;
    }
    async updateUserProgress(userId, topicId, subjectId, progressData) {
        // Check if progress exists
        const existingProgress = await this.getUserProgressByTopic(userId, topicId);
        if (existingProgress) {
            // Update existing progress
            const [updatedProgress] = await db_1.db
                .update(schema_1.userProgress)
                .set({
                ...progressData,
                practiceCount: existingProgress.practiceCount + 1,
                lastPracticedAt: new Date(),
                updatedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.userProgress.progressId, existingProgress.progressId))
                .returning();
            return updatedProgress;
        }
        else {
            // Create new progress
            const newProgress = {
                userId,
                topicId,
                subjectId,
                ...progressData,
                practiceCount: 1,
                lastPracticedAt: new Date(),
            };
            const [createdProgress] = await db_1.db.insert(schema_1.userProgress).values(newProgress).returning();
            return createdProgress;
        }
    }
    // Daily Practice Sessions
    async createDailyPracticeSession(sessionData) {
        const [createdSession] = await db_1.db.insert(schema_1.dailyPracticeSessions).values(sessionData).returning();
        return createdSession;
    }
    async getUserDailyPracticeSessions(userId, startDate, endDate) {
        let query = db_1.db.select().from(schema_1.dailyPracticeSessions).where((0, drizzle_orm_1.eq)(schema_1.dailyPracticeSessions.userId, userId));
        if (startDate && endDate) {
            query = query.where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.dailyPracticeSessions.userId, userId), (0, drizzle_orm_1.gte)(schema_1.dailyPracticeSessions.sessionDate, startDate), (0, drizzle_orm_1.lte)(schema_1.dailyPracticeSessions.sessionDate, endDate)));
        }
        return await query.orderBy((0, drizzle_orm_1.desc)(schema_1.dailyPracticeSessions.sessionDate));
    }
    async updateDailyPracticeSession(sessionId, updateData) {
        const [updatedSession] = await db_1.db
            .update(schema_1.dailyPracticeSessions)
            .set({
            ...updateData,
            completedAt: updateData.isCompleted ? new Date() : undefined,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.dailyPracticeSessions.sessionId, sessionId))
            .returning();
        return updatedSession;
    }
    // User Question History
    async addQuestionHistory(historyData) {
        const [createdHistory] = await db_1.db.insert(schema_1.userQuestionHistory).values(historyData).returning();
        return createdHistory;
    }
    async getUserQuestionHistory(userId, questionId, limit = 50) {
        let query = db_1.db.select().from(schema_1.userQuestionHistory).where((0, drizzle_orm_1.eq)(schema_1.userQuestionHistory.userId, userId));
        if (questionId) {
            query = query.where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userQuestionHistory.userId, userId), (0, drizzle_orm_1.eq)(schema_1.userQuestionHistory.questionId, questionId)));
        }
        return await query.limit(limit).orderBy((0, drizzle_orm_1.desc)(schema_1.userQuestionHistory.attemptedAt));
    }
    // Analytics and Statistics
    async getUserStats(userId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        // Get daily practice sessions for the period
        const sessions = await this.getUserDailyPracticeSessions(userId, startDate.toISOString().split('T')[0], new Date().toISOString().split('T')[0]);
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
            }
            else {
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
    async getSubjectWiseProgress(userId) {
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
        }, {});
        // Calculate accuracy for each subject
        Object.keys(subjectProgress).forEach(subjectId => {
            const subject = subjectProgress[subjectId];
            subject.accuracy = subject.totalQuestions > 0
                ? Math.round((subject.correctAnswers / subject.totalQuestions) * 100 * 100) / 100
                : 0;
        });
        return Object.values(subjectProgress);
    }
    async getWeakTopics(userId, limit = 10) {
        const progress = await this.getUserProgress(userId);
        return progress
            .filter(item => item.masteryLevel === 'beginner' ||
            (item.masteryPercentage && item.masteryPercentage < 50) ||
            item.needsRevision)
            .sort((a, b) => (a.masteryPercentage || 0) - (b.masteryPercentage || 0))
            .slice(0, limit);
    }
}
exports.ProgressService = ProgressService;
//# sourceMappingURL=progress.js.map