"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const practice_1 = require("../controllers/practice");
const router = (0, express_1.Router)();
// Public routes
router.get('/categories', practice_1.getPracticeCategories);
// Protected routes
router.post('/sessions', auth_1.authenticateToken, practice_1.createPracticeSession);
router.get('/sessions/:sessionId', auth_1.authenticateToken, practice_1.getPracticeSession);
router.patch('/sessions/:sessionId/answer', auth_1.authenticateToken, practice_1.updatePracticeSessionAnswer);
router.patch('/sessions/:sessionId/complete', auth_1.authenticateToken, practice_1.completePracticeSession);
router.get('/history', auth_1.authenticateToken, practice_1.getUserPracticeHistory);
router.get('/stats', auth_1.authenticateToken, practice_1.getUserPracticeStats);
exports.default = router;
//# sourceMappingURL=practice.js.map