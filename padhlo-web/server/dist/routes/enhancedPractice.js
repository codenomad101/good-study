"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const enhancedPractice_1 = require("../controllers/enhancedPractice");
const router = (0, express_1.Router)();
const practiceController = new enhancedPractice_1.EnhancedPracticeController();
// Complete a practice session with detailed scoring
router.post('/complete/:userId', practiceController.completePracticeSession.bind(practiceController));
// Get user's practice history
router.get('/history/:userId', practiceController.getUserPracticeHistory.bind(practiceController));
// Get comprehensive practice statistics
router.get('/stats/:userId', practiceController.getUserPracticeStats.bind(practiceController));
// Get detailed session with explanations
router.get('/session/:sessionId/:userId', practiceController.getSessionDetails.bind(practiceController));
exports.default = router;
//# sourceMappingURL=enhancedPractice.js.map