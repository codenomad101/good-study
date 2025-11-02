"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticateToken = void 0;
const auth_1 = require("../services/auth");
const authService = new auth_1.AuthService();
const JWT_SECRET = process.env.JWT_SECRET;
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required',
            });
        }
        // Verify token and get user
        const user = await authService.verifyToken(token);
        // Add user to request object
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token',
        });
    }
};
exports.authenticateToken = authenticateToken;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            try {
                const user = await authService.verifyToken(token);
                req.user = user;
            }
            catch (error) {
                // Token is invalid, but we continue without user
                req.user = null;
            }
        }
        else {
            req.user = null;
        }
        next();
    }
    catch (error) {
        console.error('Optional auth error:', error);
        req.user = null;
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map