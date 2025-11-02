"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const test_1 = require("../services/test");
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const testService = new test_1.TestService();
// Validation schemas
const CreateTestTemplateSchema = zod_1.z.object({
    examId: zod_1.z.string().uuid('Invalid exam ID'),
    templateName: zod_1.z.string().min(1, 'Template name is required'),
    testType: zod_1.z.enum(['full_length', 'sectional', 'topic_wise', 'previous_year', 'daily_practice']).optional(),
    totalQuestions: zod_1.z.number().positive('Total questions must be positive'),
    totalMarks: zod_1.z.number().positive('Total marks must be positive'),
    durationMinutes: zod_1.z.number().positive('Duration must be positive'),
    isFree: zod_1.z.boolean().optional(),
    price: zod_1.z.number().min(0).optional(),
    instructions: zod_1.z.string().optional(),
    syllabusCoverage: zod_1.z.string().optional(),
});
const CreateUserTestSchema = zod_1.z.object({
    templateId: zod_1.z.string().uuid('Invalid template ID'),
});
const CompleteTestSchema = zod_1.z.object({
    timeTakenSeconds: zod_1.z.number().min(0),
    totalQuestionsAttempted: zod_1.z.number().min(0),
    correctAnswers: zod_1.z.number().min(0),
    incorrectAnswers: zod_1.z.number().min(0),
    skippedQuestions: zod_1.z.number().min(0),
    marksObtained: zod_1.z.number().min(0),
    percentage: zod_1.z.number().min(0).max(100),
    rank: zod_1.z.number().positive().optional(),
    totalParticipants: zod_1.z.number().positive().optional(),
    percentile: zod_1.z.number().min(0).max(100).optional(),
});
const SubmitResponseSchema = zod_1.z.object({
    userTestId: zod_1.z.string().uuid('Invalid user test ID'),
    questionId: zod_1.z.string().uuid('Invalid question ID'),
    userAnswer: zod_1.z.string().optional(),
    isCorrect: zod_1.z.boolean().optional(),
    timeTakenSeconds: zod_1.z.number().min(0).optional(),
    isMarkedForReview: zod_1.z.boolean().optional(),
    responseOrder: zod_1.z.number().min(1).optional(),
    marksObtained: zod_1.z.number().min(0).optional(),
});
const UpdateResponseSchema = zod_1.z.object({
    userAnswer: zod_1.z.string().optional(),
    isCorrect: zod_1.z.boolean().optional(),
    timeTakenSeconds: zod_1.z.number().min(0).optional(),
    isMarkedForReview: zod_1.z.boolean().optional(),
    marksObtained: zod_1.z.number().min(0).optional(),
});
const GenerateTestSchema = zod_1.z.object({
    templateId: zod_1.z.string().uuid('Invalid template ID'),
    examId: zod_1.z.string().uuid('Invalid exam ID'),
    subjectIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
});
// Test Templates routes
router.get('/templates', async (req, res) => {
    try {
        const { examId } = req.query;
        const templates = await testService.getAllTestTemplates(examId);
        res.json({
            success: true,
            data: templates,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch test templates',
        });
    }
});
router.get('/templates/:templateId', async (req, res) => {
    try {
        const { templateId } = req.params;
        const template = await testService.getTestTemplateById(templateId);
        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Test template not found',
            });
        }
        res.json({
            success: true,
            data: template,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch test template',
        });
    }
});
router.post('/templates', auth_1.authenticateToken, async (req, res) => {
    try {
        const validatedData = CreateTestTemplateSchema.parse(req.body);
        const template = await testService.createTestTemplate(validatedData);
        res.status(201).json({
            success: true,
            message: 'Test template created successfully',
            data: template,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to create test template',
        });
    }
});
router.put('/templates/:templateId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { templateId } = req.params;
        const validatedData = CreateTestTemplateSchema.partial().parse(req.body);
        const template = await testService.updateTestTemplate(templateId, validatedData);
        res.json({
            success: true,
            message: 'Test template updated successfully',
            data: template,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to update test template',
        });
    }
});
router.delete('/templates/:templateId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { templateId } = req.params;
        await testService.deleteTestTemplate(templateId);
        res.json({
            success: true,
            message: 'Test template deleted successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete test template',
        });
    }
});
// User Tests routes
router.post('/user-tests', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const validatedData = CreateUserTestSchema.parse(req.body);
        const userTest = await testService.createUserTest(userId, validatedData.templateId);
        res.status(201).json({
            success: true,
            message: 'User test created successfully',
            data: userTest,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to create user test',
        });
    }
});
router.get('/user-tests', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { status } = req.query;
        const userTests = await testService.getUserTests(userId, status);
        res.json({
            success: true,
            data: userTests,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch user tests',
        });
    }
});
router.get('/user-tests/:userTestId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { userTestId } = req.params;
        const userTest = await testService.getUserTestById(userTestId);
        if (!userTest) {
            return res.status(404).json({
                success: false,
                message: 'User test not found',
            });
        }
        res.json({
            success: true,
            data: userTest,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch user test',
        });
    }
});
router.put('/user-tests/:userTestId/start', auth_1.authenticateToken, async (req, res) => {
    try {
        const { userTestId } = req.params;
        const userTest = await testService.startUserTest(userTestId);
        res.json({
            success: true,
            message: 'Test started successfully',
            data: userTest,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to start test',
        });
    }
});
router.put('/user-tests/:userTestId/complete', auth_1.authenticateToken, async (req, res) => {
    try {
        const { userTestId } = req.params;
        const validatedData = CompleteTestSchema.parse(req.body);
        const userTest = await testService.completeUserTest(userTestId, validatedData);
        res.json({
            success: true,
            message: 'Test completed successfully',
            data: userTest,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to complete test',
        });
    }
});
router.put('/user-tests/:userTestId/abandon', auth_1.authenticateToken, async (req, res) => {
    try {
        const { userTestId } = req.params;
        const userTest = await testService.abandonUserTest(userTestId);
        res.json({
            success: true,
            message: 'Test abandoned successfully',
            data: userTest,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to abandon test',
        });
    }
});
// Test Responses routes
router.post('/responses', auth_1.authenticateToken, async (req, res) => {
    try {
        const validatedData = SubmitResponseSchema.parse(req.body);
        const response = await testService.submitTestResponse(validatedData);
        res.status(201).json({
            success: true,
            message: 'Test response submitted successfully',
            data: response,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to submit test response',
        });
    }
});
router.get('/user-tests/:userTestId/responses', auth_1.authenticateToken, async (req, res) => {
    try {
        const { userTestId } = req.params;
        const responses = await testService.getUserTestResponses(userTestId);
        res.json({
            success: true,
            data: responses,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch test responses',
        });
    }
});
router.put('/responses/:responseId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { responseId } = req.params;
        const validatedData = UpdateResponseSchema.parse(req.body);
        const response = await testService.updateTestResponse(responseId, validatedData);
        res.json({
            success: true,
            message: 'Test response updated successfully',
            data: response,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to update test response',
        });
    }
});
// Test Generation routes
router.post('/generate-questions', auth_1.authenticateToken, async (req, res) => {
    try {
        const validatedData = GenerateTestSchema.parse(req.body);
        const questions = await testService.generateTestQuestions(validatedData.templateId, validatedData.examId, validatedData.subjectIds);
        res.json({
            success: true,
            data: questions,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to generate test questions',
        });
    }
});
// Analytics routes
router.get('/analytics', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { days = '30' } = req.query;
        const analytics = await testService.getUserTestAnalytics(userId, parseInt(days));
        res.json({
            success: true,
            data: analytics,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch test analytics',
        });
    }
});
router.get('/templates/:templateId/leaderboard', async (req, res) => {
    try {
        const { templateId } = req.params;
        const { limit = '100' } = req.query;
        const leaderboard = await testService.getTestLeaderboard(templateId, parseInt(limit));
        res.json({
            success: true,
            data: leaderboard,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch leaderboard',
        });
    }
});
router.get('/user-tests/:userTestId/rank', auth_1.authenticateToken, async (req, res) => {
    try {
        const { userTestId } = req.params;
        const rank = await testService.getUserRankInTest(userTestId);
        if (!rank) {
            return res.status(404).json({
                success: false,
                message: 'Test not found or not completed',
            });
        }
        res.json({
            success: true,
            data: rank,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch test rank',
        });
    }
});
exports.default = router;
//# sourceMappingURL=test.js.map