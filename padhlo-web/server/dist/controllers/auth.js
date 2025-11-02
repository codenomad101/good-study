"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.updateProfile = exports.verifyToken = exports.login = exports.register = void 0;
const auth_1 = require("../services/auth");
const auth_2 = require("../schemas/auth");
const authService = new auth_1.AuthService();
const register = async (req, res) => {
    try {
        const validatedData = auth_2.RegisterInput.parse(req.body);
        const result = await authService.register(validatedData);
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: result,
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        if (error.message === 'User with this email already exists') {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists',
            });
        }
        res.status(400).json({
            success: false,
            message: error.message || 'Registration failed',
        });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const validatedData = auth_2.LoginInput.parse(req.body);
        const result = await authService.login(validatedData);
        res.json({
            success: true,
            message: 'Login successful',
            data: result,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        if (error.message === 'Invalid email or password' || error.message === 'Account is deactivated') {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }
        res.status(400).json({
            success: false,
            message: error.message || 'Login failed',
        });
    }
};
exports.login = login;
const verifyToken = async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided',
            });
        }
        const user = await authService.verifyToken(token);
        res.json({
            success: true,
            message: 'Token verified successfully',
            data: { user },
        });
    }
    catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid token',
        });
    }
};
exports.verifyToken = verifyToken;
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const validatedData = auth_2.UpdateProfileInput.parse(req.body);
        const updatedUser = await authService.updateUserProfile(userId, validatedData);
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: { user: updatedUser },
        });
    }
    catch (error) {
        console.error('Profile update error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Profile update failed',
        });
    }
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res) => {
    try {
        const userId = req.user.userId;
        const validatedData = auth_2.ChangePasswordInput.parse(req.body);
        await authService.changePassword(userId, validatedData.currentPassword, validatedData.newPassword);
        res.json({
            success: true,
            message: 'Password changed successfully',
        });
    }
    catch (error) {
        console.error('Password change error:', error);
        if (error.message === 'Current password is incorrect') {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect',
            });
        }
        res.status(400).json({
            success: false,
            message: error.message || 'Password change failed',
        });
    }
};
exports.changePassword = changePassword;
//# sourceMappingURL=auth.js.map