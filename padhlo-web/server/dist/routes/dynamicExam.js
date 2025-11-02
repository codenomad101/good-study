"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const dynamicExam_1 = require("../controllers/dynamicExam");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
// Create a new dynamic exam session
router.post('/create', dynamicExam_1.createExamSession);
// Start an exam session
router.post('/:sessionId/start', dynamicExam_1.startExamSession);
// Generate questions for exam session
router.get('/:sessionId/questions', dynamicExam_1.generateExamQuestions);
// Submit exam answers
router.post('/:sessionId/answers', dynamicExam_1.submitExamAnswers);
// Complete exam session
router.post('/:sessionId/complete', dynamicExam_1.completeExamSession);
// Get exam session details
router.get('/:sessionId', dynamicExam_1.getExamSession);
// Get user's exam history
router.get('/history', dynamicExam_1.getUserExamHistory);
// Get user's exam statistics
router.get('/stats', dynamicExam_1.getUserExamStats);
exports.default = router;
//# sourceMappingURL=dynamicExam.js.map