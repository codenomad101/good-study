"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const exam_1 = require("../services/exam");
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const examService = new exam_1.ExamService();
// Validation schemas
const CreateExamSchema = zod_1.z.object({
    examName: zod_1.z.string().min(1, 'Exam name is required'),
    examCode: zod_1.z.string().min(1, 'Exam code is required'),
    description: zod_1.z.string().optional(),
    examPattern: zod_1.z.string().optional(),
    totalMarks: zod_1.z.number().positive().optional(),
    durationMinutes: zod_1.z.number().positive().optional(),
    negativeMarking: zod_1.z.boolean().optional(),
    negativeMarksRatio: zod_1.z.number().min(0).max(1).optional(),
});
const CreateSubjectSchema = zod_1.z.object({
    examId: zod_1.z.string().uuid('Invalid exam ID'),
    subjectName: zod_1.z.string().min(1, 'Subject name is required'),
    subjectCode: zod_1.z.string().min(1, 'Subject code is required'),
    weightagePercentage: zod_1.z.number().min(0).max(100).optional(),
    totalQuestions: zod_1.z.number().positive().optional(),
    displayOrder: zod_1.z.number().optional(),
});
const CreateTopicSchema = zod_1.z.object({
    subjectId: zod_1.z.string().uuid('Invalid subject ID'),
    topicName: zod_1.z.string().min(1, 'Topic name is required'),
    difficultyLevel: zod_1.z.enum(['easy', 'medium', 'hard']).optional(),
    estimatedTimeMinutes: zod_1.z.number().positive().optional(),
    parentTopicId: zod_1.z.string().uuid().optional(),
    displayOrder: zod_1.z.number().optional(),
});
const CreateQuestionSchema = zod_1.z.object({
    topicId: zod_1.z.string().uuid('Invalid topic ID'),
    subjectId: zod_1.z.string().uuid('Invalid subject ID'),
    examId: zod_1.z.string().uuid('Invalid exam ID'),
    questionText: zod_1.z.string().min(1, 'Question text is required'),
    questionImageUrl: zod_1.z.string().url().optional(),
    questionType: zod_1.z.enum(['mcq', 'numerical', 'true_false', 'fill_blank']).optional(),
    difficultyLevel: zod_1.z.enum(['easy', 'medium', 'hard']).optional(),
    marks: zod_1.z.number().positive().optional(),
    negativeMarks: zod_1.z.number().min(0).optional(),
    optionA: zod_1.z.string().optional(),
    optionB: zod_1.z.string().optional(),
    optionC: zod_1.z.string().optional(),
    optionD: zod_1.z.string().optional(),
    optionE: zod_1.z.string().optional(),
    correctAnswer: zod_1.z.string().min(1, 'Correct answer is required'),
    detailedSolution: zod_1.z.string().optional(),
    solutionVideoUrl: zod_1.z.string().url().optional(),
    hint: zod_1.z.string().optional(),
    yearAppeared: zod_1.z.number().positive().optional(),
    source: zod_1.z.string().optional(),
    language: zod_1.z.string().optional(),
});
const UserExamPreferenceSchema = zod_1.z.object({
    examId: zod_1.z.string().uuid('Invalid exam ID'),
    targetExamDate: zod_1.z.string().optional(),
    dailyStudyGoalMinutes: zod_1.z.number().positive().optional(),
    isPrimaryExam: zod_1.z.boolean().optional(),
});
// Public routes
router.get('/exams', async (req, res) => {
    try {
        const exams = await examService.getAllExams();
        res.json({
            success: true,
            data: exams,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch exams',
        });
    }
});
router.get('/exams/:examId', async (req, res) => {
    try {
        const { examId } = req.params;
        const exam = await examService.getExamById(examId);
        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found',
            });
        }
        res.json({
            success: true,
            data: exam,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch exam',
        });
    }
});
router.get('/exams/:examId/structure', async (req, res) => {
    try {
        const { examId } = req.params;
        const examStructure = await examService.getExamWithStructure(examId);
        if (!examStructure) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found',
            });
        }
        res.json({
            success: true,
            data: examStructure,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch exam structure',
        });
    }
});
router.get('/exams/:examId/subjects', async (req, res) => {
    try {
        const { examId } = req.params;
        const subjects = await examService.getSubjectsByExam(examId);
        res.json({
            success: true,
            data: subjects,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch subjects',
        });
    }
});
router.get('/subjects/:subjectId/topics', async (req, res) => {
    try {
        const { subjectId } = req.params;
        const topics = await examService.getTopicsBySubject(subjectId);
        res.json({
            success: true,
            data: topics,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch topics',
        });
    }
});
router.get('/topics/:topicId/questions', async (req, res) => {
    try {
        const { topicId } = req.params;
        const { limit = '50', offset = '0' } = req.query;
        const questions = await examService.getQuestionsByTopic(topicId, parseInt(limit), parseInt(offset));
        res.json({
            success: true,
            data: questions,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch questions',
        });
    }
});
router.get('/subjects/:subjectId/questions', async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { limit = '50', offset = '0' } = req.query;
        const questions = await examService.getQuestionsBySubject(subjectId, parseInt(limit), parseInt(offset));
        res.json({
            success: true,
            data: questions,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch questions',
        });
    }
});
// Protected routes
router.post('/exams', auth_1.authenticateToken, async (req, res) => {
    try {
        const validatedData = CreateExamSchema.parse(req.body);
        const exam = await examService.createExam(validatedData);
        res.status(201).json({
            success: true,
            message: 'Exam created successfully',
            data: exam,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to create exam',
        });
    }
});
router.post('/subjects', auth_1.authenticateToken, async (req, res) => {
    try {
        const validatedData = CreateSubjectSchema.parse(req.body);
        const subject = await examService.createSubject(validatedData);
        res.status(201).json({
            success: true,
            message: 'Subject created successfully',
            data: subject,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to create subject',
        });
    }
});
router.post('/topics', auth_1.authenticateToken, async (req, res) => {
    try {
        const validatedData = CreateTopicSchema.parse(req.body);
        const topic = await examService.createTopic(validatedData);
        res.status(201).json({
            success: true,
            message: 'Topic created successfully',
            data: topic,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to create topic',
        });
    }
});
router.post('/questions', auth_1.authenticateToken, async (req, res) => {
    try {
        const validatedData = CreateQuestionSchema.parse(req.body);
        const question = await examService.createQuestion(validatedData);
        res.status(201).json({
            success: true,
            message: 'Question created successfully',
            data: question,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to create question',
        });
    }
});
// User exam preferences
router.get('/user/preferences', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const preferences = await examService.getUserExamPreferences(userId);
        res.json({
            success: true,
            data: preferences,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch user preferences',
        });
    }
});
router.post('/user/preferences', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const validatedData = UserExamPreferenceSchema.parse(req.body);
        const preference = await examService.setUserExamPreference({
            userId,
            ...validatedData,
        });
        res.status(201).json({
            success: true,
            message: 'Exam preference set successfully',
            data: preference,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to set exam preference',
        });
    }
});
exports.default = router;
//# sourceMappingURL=exam.js.map