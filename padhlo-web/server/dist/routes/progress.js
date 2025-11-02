"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const progress_1 = require("../services/progress");
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const progressService = new progress_1.ProgressService();
// Validation schemas
const UpdateProgressSchema = zod_1.z.object({
    topicId: zod_1.z.string().uuid('Invalid topic ID'),
    subjectId: zod_1.z.string().uuid('Invalid subject ID'),
    totalQuestionsAttempted: zod_1.z.number().min(0).optional(),
    correctAnswers: zod_1.z.number().min(0).optional(),
    totalTimeSpentSeconds: zod_1.z.number().min(0).optional(),
    masteryLevel: zod_1.z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
    masteryPercentage: zod_1.z.number().min(0).max(100).optional(),
    averageAccuracy: zod_1.z.number().min(0).max(100).optional(),
    averageTimePerQuestionSeconds: zod_1.z.number().min(0).optional(),
    needsRevision: zod_1.z.boolean().optional(),
});
const CreatePracticeSessionSchema = zod_1.z.object({
    topicId: zod_1.z.string().uuid('Invalid topic ID'),
    subjectId: zod_1.z.string().uuid('Invalid subject ID'),
    sessionDate: zod_1.z.string(),
    sessionType: zod_1.z.enum(['daily', 'custom', 'revision']).optional(),
    totalQuestions: zod_1.z.number().min(0).optional(),
    questionsAttempted: zod_1.z.number().min(0).optional(),
    correctAnswers: zod_1.z.number().min(0).optional(),
    timeSpentSeconds: zod_1.z.number().min(0).optional(),
    accuracyPercentage: zod_1.z.number().min(0).max(100).optional(),
    pointsEarned: zod_1.z.number().min(0).optional(),
    isCompleted: zod_1.z.boolean().optional(),
});
const UpdatePracticeSessionSchema = zod_1.z.object({
    totalQuestions: zod_1.z.number().min(0).optional(),
    questionsAttempted: zod_1.z.number().min(0).optional(),
    correctAnswers: zod_1.z.number().min(0).optional(),
    timeSpentSeconds: zod_1.z.number().min(0).optional(),
    accuracyPercentage: zod_1.z.number().min(0).max(100).optional(),
    pointsEarned: zod_1.z.number().min(0).optional(),
    isCompleted: zod_1.z.boolean().optional(),
});
const AddQuestionHistorySchema = zod_1.z.object({
    questionId: zod_1.z.string().uuid('Invalid question ID'),
    userAnswer: zod_1.z.string().optional(),
    isCorrect: zod_1.z.boolean().optional(),
    timeTakenSeconds: zod_1.z.number().min(0).optional(),
    attemptNumber: zod_1.z.number().min(1).optional(),
    sourceType: zod_1.z.enum(['daily_practice', 'test', 'revision', 'custom_practice']).optional(),
    sourceId: zod_1.z.string().uuid().optional(),
});
// User Progress routes
router.get('/progress', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { subjectId } = req.query;
        const progress = await progressService.getUserProgress(userId, subjectId);
        res.json({
            success: true,
            data: progress,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch user progress',
        });
    }
});
router.get('/progress/topic/:topicId', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { topicId } = req.params;
        const progress = await progressService.getUserProgressByTopic(userId, topicId);
        res.json({
            success: true,
            data: progress,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch topic progress',
        });
    }
});
router.put('/progress', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const validatedData = UpdateProgressSchema.parse(req.body);
        const progress = await progressService.updateUserProgress(userId, validatedData.topicId, validatedData.subjectId, validatedData);
        res.json({
            success: true,
            message: 'Progress updated successfully',
            data: progress,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to update progress',
        });
    }
});
// Daily Practice Sessions routes
router.post('/practice-sessions', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const validatedData = CreatePracticeSessionSchema.parse(req.body);
        const session = await progressService.createDailyPracticeSession({
            userId,
            ...validatedData,
        });
        res.status(201).json({
            success: true,
            message: 'Practice session created successfully',
            data: session,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to create practice session',
        });
    }
});
router.get('/practice-sessions', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { startDate, endDate } = req.query;
        const sessions = await progressService.getUserDailyPracticeSessions(userId, startDate, endDate);
        res.json({
            success: true,
            data: sessions,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch practice sessions',
        });
    }
});
router.put('/practice-sessions/:sessionId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const validatedData = UpdatePracticeSessionSchema.parse(req.body);
        const session = await progressService.updateDailyPracticeSession(sessionId, validatedData);
        res.json({
            success: true,
            message: 'Practice session updated successfully',
            data: session,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to update practice session',
        });
    }
});
// Question History routes
router.post('/question-history', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const validatedData = AddQuestionHistorySchema.parse(req.body);
        const history = await progressService.addQuestionHistory({
            userId,
            ...validatedData,
        });
        res.status(201).json({
            success: true,
            message: 'Question history added successfully',
            data: history,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to add question history',
        });
    }
});
router.get('/question-history', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { questionId, limit = '50' } = req.query;
        const history = await progressService.getUserQuestionHistory(userId, questionId, parseInt(limit));
        res.json({
            success: true,
            data: history,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch question history',
        });
    }
});
// Analytics and Statistics routes
router.get('/stats', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { days = '30' } = req.query;
        const stats = await progressService.getUserStats(userId, parseInt(days));
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch user statistics',
        });
    }
});
router.get('/stats/subject-wise', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const subjectProgress = await progressService.getSubjectWiseProgress(userId);
        res.json({
            success: true,
            data: subjectProgress,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch subject-wise progress',
        });
    }
});
router.get('/stats/weak-topics', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { limit = '10' } = req.query;
        const weakTopics = await progressService.getWeakTopics(userId, parseInt(limit));
        res.json({
            success: true,
            data: weakTopics,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch weak topics',
        });
    }
});
exports.default = router;
//# sourceMappingURL=progress.js.map