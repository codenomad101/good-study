"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const simplePractice_1 = require("../controllers/simplePractice");
const router = (0, express_1.Router)();
// Protected routes (only for session tracking)
router.post('/sessions', auth_1.authenticateToken, simplePractice_1.createPracticeSession);
router.get('/history', auth_1.authenticateToken, simplePractice_1.getUserPracticeHistory);
router.get('/stats', auth_1.authenticateToken, simplePractice_1.getUserPracticeStats);
exports.default = router;
//# sourceMappingURL=simplePractice.js.map