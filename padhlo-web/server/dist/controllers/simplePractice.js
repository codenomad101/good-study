"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPracticeStats = exports.getUserPracticeHistory = exports.createPracticeSession = void 0;
const simplePractice_1 = require("../services/simplePractice");
const zod_1 = require("zod");
const practiceService = new simplePractice_1.PracticeService();
// Validation schemas
const CreatePracticeSessionSchema = zod_1.z.object({
    category: zod_1.z.enum(['economy', 'gk', 'history', 'geography', 'english', 'aptitude', 'agriculture', 'marathi']),
    totalQuestions: zod_1.z.number().min(1).max(50).optional().default(20),
    timeLimitMinutes: zod_1.z.number().min(5).max(60).optional().default(15),
    questionsData: zod_1.z.array(zod_1.z.object({
        questionId: zod_1.z.string(),
        userAnswer: zod_1.z.string(),
        isCorrect: zod_1.z.boolean(),
        timeSpentSeconds: zod_1.z.number().min(0)
    })).optional().default([]),
    timeSpentSeconds: zod_1.z.number().min(0).optional().default(0),
    correctAnswers: zod_1.z.number().min(0).optional().default(0),
    incorrectAnswers: zod_1.z.number().min(0).optional().default(0),
    questionsAttempted: zod_1.z.number().min(0).optional().default(0),
    skippedQuestions: zod_1.z.number().min(0).optional().default(0),
    percentage: zod_1.z.number().min(0).max(100).optional().default(0),
    status: zod_1.z.enum(['completed']).optional().default('completed')
});
// Create a practice session (for tracking completed sessions)
const createPracticeSession = async (req, res) => {
    try {
        const userId = req.user.userId;
        const validatedData = CreatePracticeSessionSchema.parse(req.body);
        const session = await practiceService.createPracticeSession(userId, validatedData.category, validatedData);
        res.status(201).json({
            success: true,
            message: 'Practice session saved successfully',
            data: session,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to save practice session',
        });
    }
};
exports.createPracticeSession = createPracticeSession;
// Get user's practice history
const getUserPracticeHistory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { limit = '50', offset = '0' } = req.query;
        const sessions = await practiceService.getUserPracticeHistory(userId, parseInt(limit), parseInt(offset));
        res.json({
            success: true,
            data: sessions,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch practice history',
        });
    }
};
exports.getUserPracticeHistory = getUserPracticeHistory;
// Get user's practice statistics
const getUserPracticeStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const stats = await practiceService.getUserPracticeStats(userId);
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch practice statistics',
        });
    }
};
exports.getUserPracticeStats = getUserPracticeStats;
//# sourceMappingURL=simplePractice.js.map