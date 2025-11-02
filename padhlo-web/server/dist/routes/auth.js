"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../controllers/auth");
const auth_2 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.post('/register', auth_1.register);
router.post('/login', auth_1.login);
router.get('/verify', auth_1.verifyToken);
// Protected routes
router.put('/profile', auth_2.authenticateToken, auth_1.updateProfile);
router.put('/change-password', auth_2.authenticateToken, auth_1.changePassword);
exports.default = router;
//# sourceMappingURL=auth.js.map