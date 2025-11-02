"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Protected route example
router.get('/profile', auth_1.authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Profile data retrieved successfully',
        data: {
            user: req.user,
        },
    });
});
exports.default = router;
//# sourceMappingURL=user.js.map