"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicExamService = void 0;
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
class DynamicExamService {
    // Create a new dynamic exam session
    async createExamSession(userId, examConfig) {
        try {
            const totalQuestions = examConfig.questionDistribution.reduce((sum, dist) => sum + dist.count, 0);
            const newSession = {
                userId,
                examName: examConfig.examName,
                totalMarks: examConfig.totalMarks,
                durationMinutes: examConfig.durationMinutes,
                totalQuestions,
                negativeMarking: examConfig.negativeMarking || false,
                negativeMarksRatio: examConfig.negativeMarksRatio?.toString() || '0.25',
                questionDistribution: examConfig.questionDistribution,
                status: 'not_started'
            };
            const [session] = await db_1.db.insert(schema_1.dynamicExamSessions).values(newSession).returning();
            return session;
        }
        catch (error) {
            console.error('Error creating exam session:', error);
            throw new Error('Failed to create exam session');
        }
    }
    // Start an exam session
    async startExamSession(sessionId, userId) {
        try {
            const [session] = await db_1.db
                .update(schema_1.dynamicExamSessions)
                .set({
                status: 'in_progress',
                startedAt: new Date(),
                updatedAt: new Date()
            })
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.dynamicExamSessions.sessionId, sessionId), (0, drizzle_orm_1.eq)(schema_1.dynamicExamSessions.userId, userId)))
                .returning();
            if (!session) {
                throw new Error('Exam session not found');
            }
            return session;
        }
        catch (error) {
            console.error('Error starting exam session:', error);
            throw new Error('Failed to start exam session');
        }
    }
    // Update exam session with questions data
    async updateExamSessionQuestions(sessionId, userId, questionsData) {
        try {
            const [session] = await db_1.db
                .update(schema_1.dynamicExamSessions)
                .set({
                questionsData,
                updatedAt: new Date()
            })
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.dynamicExamSessions.sessionId, sessionId), (0, drizzle_orm_1.eq)(schema_1.dynamicExamSessions.userId, userId)))
                .returning();
            return session;
        }
        catch (error) {
            console.error('Error updating exam session questions:', error);
            throw new Error('Failed to update exam session');
        }
    }
    // Complete an exam session
    async completeExamSession(sessionId, userId, completionData) {
        try {
            const [session] = await db_1.db
                .update(schema_1.dynamicExamSessions)
                .set({
                status: 'completed',
                completedAt: new Date(),
                timeSpentSeconds: completionData.timeSpentSeconds,
                questionsAttempted: completionData.questionsAttempted,
                correctAnswers: completionData.correctAnswers,
                incorrectAnswers: completionData.incorrectAnswers,
                skippedQuestions: completionData.skippedQuestions,
                marksObtained: completionData.marksObtained.toString(),
                percentage: completionData.percentage.toString(),
                updatedAt: new Date()
            })
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.dynamicExamSessions.sessionId, sessionId), (0, drizzle_orm_1.eq)(schema_1.dynamicExamSessions.userId, userId)))
                .returning();
            if (!session) {
                throw new Error('Exam session not found');
            }
            return session;
        }
        catch (error) {
            console.error('Error completing exam session:', error);
            throw new Error('Failed to complete exam session');
        }
    }
    // Get exam session by ID
    async getExamSession(sessionId, userId) {
        try {
            const [session] = await db_1.db
                .select()
                .from(schema_1.dynamicExamSessions)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.dynamicExamSessions.sessionId, sessionId), (0, drizzle_orm_1.eq)(schema_1.dynamicExamSessions.userId, userId)))
                .limit(1);
            return session;
        }
        catch (error) {
            console.error('Error fetching exam session:', error);
            throw new Error('Failed to fetch exam session');
        }
    }
    // Get user's exam history
    async getUserExamHistory(userId, limit = 50, offset = 0) {
        try {
            const sessions = await db_1.db
                .select()
                .from(schema_1.dynamicExamSessions)
                .where((0, drizzle_orm_1.eq)(schema_1.dynamicExamSessions.userId, userId))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.dynamicExamSessions.createdAt))
                .limit(limit)
                .offset(offset);
            return sessions;
        }
        catch (error) {
            console.error('Error fetching exam history:', error);
            throw new Error('Failed to fetch exam history');
        }
    }
    // Get user's exam statistics
    async getUserExamStats(userId) {
        try {
            const sessions = await db_1.db
                .select({
                totalSessions: schema_1.dynamicExamSessions.sessionId,
                totalMarks: schema_1.dynamicExamSessions.marksObtained,
                totalTime: schema_1.dynamicExamSessions.timeSpentSeconds,
                averagePercentage: schema_1.dynamicExamSessions.percentage,
                examName: schema_1.dynamicExamSessions.examName,
                completedAt: schema_1.dynamicExamSessions.completedAt
            })
                .from(schema_1.dynamicExamSessions)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.dynamicExamSessions.userId, userId), (0, drizzle_orm_1.eq)(schema_1.dynamicExamSessions.status, 'completed')));
            const totalSessions = sessions.length;
            const totalMarks = sessions.reduce((sum, s) => sum + parseFloat(s.totalMarks || '0'), 0);
            const totalTime = sessions.reduce((sum, s) => sum + (s.totalTime || 0), 0);
            const averagePercentage = sessions.length > 0
                ? sessions.reduce((sum, s) => sum + parseFloat(s.averagePercentage || '0'), 0) / sessions.length
                : 0;
            return {
                totalSessions,
                totalMarks,
                totalTimeMinutes: Math.round(totalTime / 60),
                averagePercentage: Math.round(averagePercentage * 100) / 100,
                recentExams: sessions.slice(0, 10).map(s => ({
                    examName: s.examName,
                    marksObtained: s.totalMarks,
                    percentage: s.averagePercentage,
                    completedAt: s.completedAt
                }))
            };
        }
        catch (error) {
            console.error('Error fetching exam stats:', error);
            throw new Error('Failed to fetch exam statistics');
        }
    }
    // Generate random questions from categories
    async generateQuestionsFromCategories(questionDistribution) {
        try {
            const allQuestions = [];
            for (const dist of questionDistribution) {
                let questionsData = [];
                // Load questions based on category
                switch (dist.category) {
                    case 'economy':
                        questionsData = require('../../data/English/economyEnglish.json');
                        break;
                    case 'gk':
                        questionsData = require('../../data/English/GKEnglish.json');
                        break;
                    case 'history':
                        questionsData = require('../../data/English/historyEnglish.json');
                        break;
                    case 'geography':
                        questionsData = require('../../data/English/geographyEnglish.json');
                        break;
                    case 'english':
                        questionsData = require('../../data/English/englishGrammer.json');
                        break;
                    case 'aptitude':
                        questionsData = require('../../data/English/AptitudeEnglish.json');
                        break;
                    case 'agriculture':
                        questionsData = require('../../data/English/agricultureEnglish.json');
                        break;
                    case 'marathi':
                        questionsData = require('../../data/Marathi/grammerMarathi.json');
                        break;
                    default:
                        continue;
                }
                if (!Array.isArray(questionsData)) {
                    continue;
                }
                // Shuffle and select required number of questions
                const shuffled = questionsData.sort(() => Math.random() - 0.5);
                const selectedQuestions = shuffled.slice(0, dist.count);
                // Transform to our format
                const formattedQuestions = selectedQuestions.map((q, index) => ({
                    questionId: `${dist.category}_${index + 1}`,
                    questionText: q.Question || q.question || '',
                    options: q.Options ? q.Options.map((opt, optIndex) => ({
                        id: optIndex + 1,
                        text: typeof opt === 'string' ? opt : opt.text || opt.id || ''
                    })) : [],
                    correctAnswer: q.CorrectAnswer || q.correctAnswer || '',
                    userAnswer: '',
                    isCorrect: false,
                    timeSpentSeconds: 0,
                    marksObtained: 0,
                    category: dist.category,
                    marksPerQuestion: dist.marksPerQuestion
                }));
                allQuestions.push(...formattedQuestions);
            }
            // Shuffle all questions together
            return allQuestions.sort(() => Math.random() - 0.5);
        }
        catch (error) {
            console.error('Error generating questions:', error);
            throw new Error('Failed to generate questions');
        }
    }
}
exports.DynamicExamService = DynamicExamService;
//# sourceMappingURL=dynamicExam.js.map