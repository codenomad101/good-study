import { Router } from 'express';
import { register, login, verifyToken, updateProfile, changePassword, getProfile, logout, requestPasswordReset, resetPassword } from '../controllers/auth';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/verify', verifyToken);
router.post('/logout', logout); // Logout doesn't require auth - user might have expired token
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);

export default router;