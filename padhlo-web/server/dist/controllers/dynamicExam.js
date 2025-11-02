"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserExamStats = exports.getUserExamHistory = exports.getExamSession = exports.completeExamSession = exports.submitExamAnswers = exports.generateExamQuestions = exports.startExamSession = exports.createExamSession = void 0;
const dynamicExam_1 = require("../services/dynamicExam");
const zod_1 = require("zod");
const dynamicExamService = new dynamicExam_1.DynamicExamService();
// Validation schemas
const CreateExamSessionSchema = zod_1.z.object({
    examName: zod_1.z.string().min(1, 'Exam name is required'),
    totalMarks: zod_1.z.number().positive('Total marks must be positive'),
    durationMinutes: zod_1.z.number().positive('Duration must be positive'),
    questionDistribution: zod_1.z.array(zod_1.z.object({
        category: zod_1.z.string().min(1, 'Category is required'),
        count: zod_1.z.number().positive('Count must be positive'),
        marksPerQuestion: zod_1.z.number().positive('Marks per question must be positive')
    })).min(1, 'At least one category is required'),
    negativeMarking: zod_1.z.boolean().optional(),
    negativeMarksRatio: zod_1.z.number().min(0).max(1).optional()
});
const CompleteExamSessionSchema = zod_1.z.object({
    timeSpentSeconds: zod_1.z.number().min(0),
    questionsAttempted: zod_1.z.number().min(0),
    correctAnswers: zod_1.z.number().min(0),
    incorrectAnswers: zod_1.z.number().min(0),
    skippedQuestions: zod_1.z.number().min(0),
    marksObtained: zod_1.z.number(),
    percentage: zod_1.z.number().min(0).max(100)
});
// Create a new dynamic exam session
const createExamSession = async (req, res) => {
    try {
        const userId = req.user.userId;
        const validatedData = CreateExamSessionSchema.parse(req.body);
        const session = await dynamicExamService.createExamSession(userId, validatedData);
        res.status(201).json({
            success: true,
            message: 'Exam session created successfully',
            data: session
        });
    }
    catch (error) {
        console.error('Error creating exam session:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to create exam session'
        });
    }
};
exports.createExamSession = createExamSession;
// Start an exam session
const startExamSession = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { sessionId } = req.params;
        const session = await dynamicExamService.startExamSession(sessionId, userId);
        res.json({
            success: true,
            message: 'Exam session started successfully',
            data: session
        });
    }
    catch (error) {
        console.error('Error starting exam session:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to start exam session'
        });
    }
};
exports.startExamSession = startExamSession;
// Generate questions for exam session
const generateExamQuestions = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.userId;
        // Get the exam session
        const session = await dynamicExamService.getExamSession(sessionId, userId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Exam session not found'
            });
        }
        // Generate questions based on distribution
        const questions = await dynamicExamService.generateQuestionsFromCategories(session.questionDistribution);
        res.json({
            success: true,
            message: 'Questions generated successfully',
            data: {
                sessionId: session.sessionId,
                examName: session.examName,
                totalMarks: session.totalMarks,
                durationMinutes: session.durationMinutes,
                totalQuestions: session.totalQuestions,
                negativeMarking: session.negativeMarking,
                negativeMarksRatio: session.negativeMarksRatio,
                questions
            }
        });
    }
    catch (error) {
        console.error('Error generating questions:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate questions'
        });
    }
};
exports.generateExamQuestions = generateExamQuestions;
// Submit exam answers
const submitExamAnswers = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { sessionId } = req.params;
        const { answers } = req.body;
        if (!Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                message: 'Answers must be an array'
            });
        }
        // Get the exam session
        const session = await dynamicExamService.getExamSession(sessionId, userId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Exam session not found'
            });
        }
        // Update session with answers
        await dynamicExamService.updateExamSessionQuestions(sessionId, userId, answers);
        res.json({
            success: true,
            message: 'Answers submitted successfully'
        });
    }
    catch (error) {
        console.error('Error submitting answers:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to submit answers'
        });
    }
};
exports.submitExamAnswers = submitExamAnswers;
// Complete exam session
const completeExamSession = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { sessionId } = req.params;
        const validatedData = CompleteExamSessionSchema.parse(req.body);
        const session = await dynamicExamService.completeExamSession(sessionId, userId, validatedData);
        res.json({
            success: true,
            message: 'Exam completed successfully',
            data: session
        });
    }
    catch (error) {
        console.error('Error completing exam session:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to complete exam session'
        });
    }
};
exports.completeExamSession = completeExamSession;
// Get exam session details
const getExamSession = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { sessionId } = req.params;
        const session = await dynamicExamService.getExamSession(sessionId, userId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Exam session not found'
            });
        }
        res.json({
            success: true,
            data: session
        });
    }
    catch (error) {
        console.error('Error fetching exam session:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch exam session'
        });
    }
};
exports.getExamSession = getExamSession;
// Get user's exam history
const getUserExamHistory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { limit = '50', offset = '0' } = req.query;
        const history = await dynamicExamService.getUserExamHistory(userId, parseInt(limit), parseInt(offset));
        res.json({
            success: true,
            data: history
        });
    }
    catch (error) {
        console.error('Error fetching exam history:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch exam history'
        });
    }
};
exports.getUserExamHistory = getUserExamHistory;
// Get user's exam statistics
const getUserExamStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const stats = await dynamicExamService.getUserExamStats(userId);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Error fetching exam stats:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch exam statistics'
        });
    }
};
exports.getUserExamStats = getUserExamStats;
//# sourceMappingURL=dynamicExam.js.map