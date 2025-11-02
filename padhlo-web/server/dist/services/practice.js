"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PracticeService = void 0;
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class PracticeService {
    // Get available practice categories
    async getPracticeCategories() {
        return [
            { id: 'economy', name: 'Economy', description: 'Economic concepts and current affairs' },
            { id: 'gk', name: 'General Knowledge', description: 'General knowledge and current affairs' },
            { id: 'history', name: 'History', description: 'Historical events and facts' },
            { id: 'geography', name: 'Geography', description: 'Geographical concepts and facts' },
            { id: 'english', name: 'English', description: 'English grammar and vocabulary' },
            { id: 'aptitude', name: 'Aptitude', description: 'Quantitative and logical reasoning' },
            { id: 'agriculture', name: 'Agriculture', description: 'Agricultural concepts and practices' },
            { id: 'marathi', name: 'Marathi', description: 'Marathi grammar and language' },
        ];
    }
    // Get random questions from JSON files
    async getRandomQuestions(category, count = 20) {
        try {
            const dataPath = path_1.default.join(__dirname, '../../Padhlo/data');
            let fileName = '';
            switch (category) {
                case 'economy':
                    fileName = 'English/economyEnglish.json';
                    break;
                case 'gk':
                    fileName = 'English/GKEnglish.json';
                    break;
                case 'history':
                    fileName = 'English/historyEnglish.json';
                    break;
                case 'geography':
                    fileName = 'English/geographyEnglish.json';
                    break;
                case 'english':
                    fileName = 'English/englishGrammer.json';
                    break;
                case 'aptitude':
                    fileName = 'English/AptitudeEnglish.json';
                    break;
                case 'agriculture':
                    fileName = 'English/agricultureEnglish.json';
                    break;
                case 'marathi':
                    fileName = 'Marathi/grammerMarathi.json';
                    break;
                default:
                    throw new Error('Invalid category');
            }
            const filePath = path_1.default.join(dataPath, fileName);
            if (!fs_1.default.existsSync(filePath)) {
                throw new Error(`Questions file not found for category: ${category}`);
            }
            const fileContent = fs_1.default.readFileSync(filePath, 'utf-8');
            const questions = JSON.parse(fileContent);
            if (!Array.isArray(questions)) {
                throw new Error('Invalid questions format');
            }
            // Shuffle and select random questions
            const shuffled = questions.sort(() => 0.5 - Math.random());
            const selectedQuestions = shuffled.slice(0, Math.min(count, questions.length));
            // Transform questions to match our format
            return selectedQuestions.map((q, index) => ({
                questionId: `q_${category}_${index}_${Date.now()}`,
                questionText: q.Question || q.questionText,
                options: q.Options || q.options || [],
                correctAnswer: q.CorrectAnswer || q.correctAnswer,
                explanation: q.Explanation || q.explanation,
                category: q.category || category,
                marks: 1,
                questionType: 'mcq'
            }));
        }
        catch (error) {
            console.error('Error loading questions:', error);
            throw new Error('Failed to load questions');
        }
    }
    // Create a new practice session
    async createPracticeSession(userId, category, timeLimitMinutes = 15) {
        try {
            const questions = await this.getRandomQuestions(category, 20);
            const newSession = {
                userId,
                category: category,
                totalQuestions: questions.length,
                timeLimitMinutes,
                status: 'in_progress',
                questionsData: questions.map(q => ({
                    questionId: q.questionId,
                    userAnswer: '',
                    isCorrect: false,
                    timeSpentSeconds: 0
                }))
            };
            const [session] = await db_1.db.insert(schema_1.practiceSessions).values(newSession).returning();
            return {
                session,
                questions
            };
        }
        catch (error) {
            console.error('Error creating practice session:', error);
            throw new Error('Failed to create practice session');
        }
    }
    // Get practice session by ID
    async getPracticeSession(sessionId, userId) {
        try {
            const [session] = await db_1.db
                .select()
                .from(schema_1.practiceSessions)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.practiceSessions.sessionId, sessionId), (0, drizzle_orm_1.eq)(schema_1.practiceSessions.userId, userId)))
                .limit(1);
            return session;
        }
        catch (error) {
            console.error('Error fetching practice session:', error);
            throw new Error('Failed to fetch practice session');
        }
    }
    // Update practice session with answer
    async updatePracticeSessionAnswer(sessionId, userId, questionId, userAnswer, timeSpentSeconds) {
        try {
            const session = await this.getPracticeSession(sessionId, userId);
            if (!session) {
                throw new Error('Practice session not found');
            }
            if (session.status !== 'in_progress') {
                throw new Error('Session is not active');
            }
            // Update questions data
            const questionsData = session.questionsData || [];
            const questionIndex = questionsData.findIndex((q) => q.questionId === questionId);
            if (questionIndex === -1) {
                throw new Error('Question not found in session');
            }
            // Get the correct answer from the questions data
            const questions = await this.getRandomQuestions(session.category, session.totalQuestions);
            const question = questions.find((q) => q.questionId === questionId);
            if (!question) {
                throw new Error('Question data not found');
            }
            const isCorrect = userAnswer === question.correctAnswer;
            questionsData[questionIndex] = {
                questionId,
                userAnswer,
                isCorrect,
                timeSpentSeconds
            };
            // Update session statistics
            const correctAnswers = questionsData.filter((q) => q.isCorrect).length;
            const questionsAttempted = questionsData.filter((q) => q.userAnswer !== '').length;
            const incorrectAnswers = questionsAttempted - correctAnswers;
            const skippedQuestions = (session.totalQuestions || 0) - questionsAttempted;
            const percentage = (session.totalQuestions || 0) > 0 ? (correctAnswers / (session.totalQuestions || 1)) * 100 : 0;
            await db_1.db
                .update(schema_1.practiceSessions)
                .set({
                questionsData,
                correctAnswers,
                incorrectAnswers,
                questionsAttempted,
                skippedQuestions,
                percentage: percentage.toString(),
                timeSpentSeconds: (session.timeSpentSeconds || 0) + timeSpentSeconds,
                updatedAt: new Date()
            })
                .where((0, drizzle_orm_1.eq)(schema_1.practiceSessions.sessionId, sessionId));
            return { isCorrect, correctAnswer: question.correctAnswer };
        }
        catch (error) {
            console.error('Error updating practice session:', error);
            throw new Error('Failed to update practice session');
        }
    }
    // Complete practice session
    async completePracticeSession(sessionId, userId) {
        try {
            const session = await this.getPracticeSession(sessionId, userId);
            if (!session) {
                throw new Error('Practice session not found');
            }
            await db_1.db
                .update(schema_1.practiceSessions)
                .set({
                status: 'completed',
                completedAt: new Date(),
                updatedAt: new Date()
            })
                .where((0, drizzle_orm_1.eq)(schema_1.practiceSessions.sessionId, sessionId));
            return session;
        }
        catch (error) {
            console.error('Error completing practice session:', error);
            throw new Error('Failed to complete practice session');
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
    // Get practice statistics for user
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
//# sourceMappingURL=practice.js.map