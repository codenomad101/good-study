"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPracticeStats = exports.getUserPracticeHistory = exports.completePracticeSession = exports.updatePracticeSessionAnswer = exports.getPracticeSession = exports.createPracticeSession = exports.getPracticeCategories = void 0;
const practice_1 = require("../services/practice");
const zod_1 = require("zod");
const practiceService = new practice_1.PracticeService();
// Validation schemas
const CreatePracticeSessionSchema = zod_1.z.object({
    category: zod_1.z.enum(['economy', 'gk', 'history', 'geography', 'english', 'aptitude', 'agriculture', 'marathi']),
    timeLimitMinutes: zod_1.z.number().min(5).max(60).optional().default(15),
});
const UpdateAnswerSchema = zod_1.z.object({
    questionId: zod_1.z.string().min(1),
    userAnswer: zod_1.z.string(),
    timeSpentSeconds: zod_1.z.number().min(0),
});
// Get available practice categories
const getPracticeCategories = async (req, res) => {
    try {
        const categories = await practiceService.getPracticeCategories();
        res.json({
            success: true,
            data: categories,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch practice categories',
        });
    }
};
exports.getPracticeCategories = getPracticeCategories;
// Create a new practice session
const createPracticeSession = async (req, res) => {
    try {
        const userId = req.user.userId;
        const validatedData = CreatePracticeSessionSchema.parse(req.body);
        const result = await practiceService.createPracticeSession(userId, validatedData.category, validatedData.timeLimitMinutes);
        res.status(201).json({
            success: true,
            message: 'Practice session created successfully',
            data: result,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to create practice session',
        });
    }
};
exports.createPracticeSession = createPracticeSession;
// Get practice session by ID
const getPracticeSession = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { sessionId } = req.params;
        const session = await practiceService.getPracticeSession(sessionId, userId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Practice session not found',
            });
        }
        res.json({
            success: true,
            data: session,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch practice session',
        });
    }
};
exports.getPracticeSession = getPracticeSession;
// Update practice session with answer
const updatePracticeSessionAnswer = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { sessionId } = req.params;
        const validatedData = UpdateAnswerSchema.parse(req.body);
        const result = await practiceService.updatePracticeSessionAnswer(sessionId, userId, validatedData.questionId, validatedData.userAnswer, validatedData.timeSpentSeconds);
        res.json({
            success: true,
            message: 'Answer updated successfully',
            data: result,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to update answer',
        });
    }
};
exports.updatePracticeSessionAnswer = updatePracticeSessionAnswer;
// Complete practice session
const completePracticeSession = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { sessionId } = req.params;
        const session = await practiceService.completePracticeSession(sessionId, userId);
        res.json({
            success: true,
            message: 'Practice session completed successfully',
            data: session,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to complete practice session',
        });
    }
};
exports.completePracticeSession = completePracticeSession;
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
//# sourceMappingURL=practice.js.map